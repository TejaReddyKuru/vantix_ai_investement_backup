import pytest
import pytest_asyncio
from decimal import Decimal
from uuid import uuid4
from datetime import datetime
from unittest.mock import AsyncMock, patch

from sqlalchemy import select
from fastapi import status

from database.session import AsyncSessionLocal
from app.models.user import User
from app.models.asset import Asset
from app.models.paper_trading import PaperAccount, PaperOrder, PaperPosition, PaperTrade, PaperTransaction
from app.services.paper_trading_service import (
    PaperTradingService,
    AccountNotFoundError,
    AccountInactiveError,
    AssetNotFoundError,
    AssetInactiveError,
    InsufficientBalanceError,
    InsufficientPositionError,
    InvalidOrderInputError,
    PriceRetrievalError,
)
from app.schemas.paper_trading import PaperOrderCreate
from app.core.exceptions import BinanceServiceError


@pytest_asyncio.fixture
async def db_session():
    async with AsyncSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def test_user(db_session):
    user = User(email="paper_test@example.com", password_hash="hashed_password", is_active=True)
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def test_asset(db_session):
    asset = Asset(
        symbol="BTCUSDT",
        base_asset="BTC",
        quote_asset="USDT",
        name="Bitcoin",
        exchange="BINANCE",
        status="active",
    )
    db_session.add(asset)
    await db_session.commit()
    await db_session.refresh(asset)
    return asset


@pytest_asyncio.fixture
async def test_account(db_session, test_user):
    account = PaperAccount(
        user_id=test_user.id,
        name="Test Account",
        initial_balance=Decimal("10000.00"),
        current_cash=Decimal("10000.00"),
        currency="USDT",
        status="active",
    )
    db_session.add(account)
    await db_session.commit()
    await db_session.refresh(account)
    return account


@pytest_asyncio.fixture
def mock_binance():
    with patch("app.services.paper_trading_service.BinanceService.get_current_price", new_callable=AsyncMock) as mock:
        yield mock


@pytest.mark.asyncio
async def test_buy_market_order_success(db_session, test_user, test_asset, test_account, mock_binance):
    # Setup Binance mock price
    mock_binance.return_value = 50000.0

    service = PaperTradingService(db_session)
    payload = PaperOrderCreate(
        asset_id=str(test_asset.id),
        side="BUY",
        order_type="MARKET",
        quantity=Decimal("0.1"),
        requested_price=Decimal("50000.0"),
    )

    order = await service.create_order(test_user.id, payload)

    # Verification
    assert order.status == "filled"
    assert order.executed_price == Decimal("50025.0")  # 50000 * 1.0005

    # Check cash deduction
    await db_session.refresh(test_account)
    # notional = 0.1 * 50025 = 5002.5
    # fee = 5002.5 * 0.001 = 5.0025
    # total_cost = 5007.5025
    # cash = 10000 - 5007.5025 = 4992.4975
    assert test_account.current_cash == Decimal("4992.49750000")

    # Check position
    pos_stmt = select(PaperPosition).where(
        PaperPosition.paper_account_id == test_account.id,
        PaperPosition.asset_id == test_asset.id
    )
    pos_res = await db_session.execute(pos_stmt)
    position = pos_res.scalar_one_or_none()
    assert position is not None
    assert position.quantity == Decimal("0.1")
    assert position.average_entry_price == Decimal("50025.0")

    # Check trade
    trade_stmt = select(PaperTrade).where(PaperTrade.order_id == order.id)
    trade_res = await db_session.execute(trade_stmt)
    trade = trade_res.scalar_one()
    assert trade.side == "BUY"
    assert trade.execution_price == Decimal("50025.0")
    assert trade.fee == Decimal("5.00250000")
    assert trade.slippage == Decimal("25.00000000")  # 50000 * 0.0005

    # Check transaction ledger
    tx_stmt = select(PaperTransaction).where(PaperTransaction.reference_id == trade.id)
    tx_res = await db_session.execute(tx_stmt)
    tx = tx_res.scalar_one()
    assert tx.transaction_type == "TRADE_BUY"
    assert tx.amount == Decimal("-5007.50250000")
    assert tx.reference_type == "trade"


@pytest.mark.asyncio
async def test_sell_market_order_success(db_session, test_user, test_asset, test_account, mock_binance):
    # Setup Binance mock price
    mock_binance.return_value = 50000.0

    # Seed existing position
    existing_position = PaperPosition(
        paper_account_id=test_account.id,
        asset_id=test_asset.id,
        quantity=Decimal("0.2"),
        average_entry_price=Decimal("45000.0"),
        realized_pnl=Decimal("0"),
        unrealized_pnl=Decimal("0"),
    )
    db_session.add(existing_position)
    await db_session.commit()

    service = PaperTradingService(db_session)
    payload = PaperOrderCreate(
        asset_id=str(test_asset.id),
        side="SELL",
        order_type="MARKET",
        quantity=Decimal("0.1"),
        requested_price=Decimal("50000.0"),
    )

    order = await service.create_order(test_user.id, payload)

    # Verification
    assert order.status == "filled"
    assert order.executed_price == Decimal("49975.0")  # 50000 * 0.9995

    # Check cash increase
    await db_session.refresh(test_account)
    # notional = 0.1 * 49975 = 4997.5
    # fee = 4997.5 * 0.001 = 4.9975
    # net_proceeds = 4997.5 - 4.9975 = 4992.5025
    # cash = 10000 + 4992.5025 = 14992.5025
    assert test_account.current_cash == Decimal("14992.50250000")

    # Check position reduction
    await db_session.refresh(existing_position)
    assert existing_position.quantity == Decimal("0.1")
    # realized pnl = (49975 - 45000) * 0.1 - 4.9975 = 497.5 - 4.9975 = 492.5025
    assert existing_position.realized_pnl == Decimal("492.50250000")

    # Check trade
    trade_stmt = select(PaperTrade).where(PaperTrade.order_id == order.id)
    trade_res = await db_session.execute(trade_stmt)
    trade = trade_res.scalar_one()
    assert trade.side == "SELL"
    assert trade.execution_price == Decimal("49975.0")
    assert trade.fee == Decimal("4.99750000")
    assert trade.realized_pnl == Decimal("492.50250000")

    # Check transaction
    tx_stmt = select(PaperTransaction).where(PaperTransaction.reference_id == trade.id)
    tx_res = await db_session.execute(tx_stmt)
    tx = tx_res.scalar_one()
    assert tx.transaction_type == "TRADE_SELL"
    assert tx.amount == Decimal("4992.50250000")


@pytest.mark.asyncio
async def test_limit_buy_triggers(db_session, test_user, test_asset, test_account, mock_binance):
    # market price 48000 <= 50000 requested -> triggers
    mock_binance.return_value = 48000.0

    service = PaperTradingService(db_session)
    payload = PaperOrderCreate(
        asset_id=str(test_asset.id),
        side="BUY",
        order_type="LIMIT",
        quantity=Decimal("0.1"),
        requested_price=Decimal("50000.0"),
    )

    order = await service.create_order(test_user.id, payload)
    assert order.status == "filled"
    assert order.executed_price == Decimal("48000.0")  # executes at market price with 0 slippage


@pytest.mark.asyncio
async def test_limit_buy_does_not_trigger(db_session, test_user, test_asset, test_account, mock_binance):
    # market price 52000 > 50000 requested -> does not trigger
    mock_binance.return_value = 52000.0

    service = PaperTradingService(db_session)
    payload = PaperOrderCreate(
        asset_id=str(test_asset.id),
        side="BUY",
        order_type="LIMIT",
        quantity=Decimal("0.1"),
        requested_price=Decimal("50000.0"),
    )

    order = await service.create_order(test_user.id, payload)
    assert order.status == "open"
    assert order.executed_price is None

    # Verify no trade, position or transaction was created, and cash is untouched
    await db_session.refresh(test_account)
    assert test_account.current_cash == Decimal("10000.0")

    trades_res = await db_session.execute(select(PaperTrade).where(PaperTrade.order_id == order.id))
    assert trades_res.scalar_one_or_none() is None


@pytest.mark.asyncio
async def test_limit_sell_triggers(db_session, test_user, test_asset, test_account, mock_binance):
    # Seed position
    pos = PaperPosition(
        paper_account_id=test_account.id,
        asset_id=test_asset.id,
        quantity=Decimal("0.1"),
        average_entry_price=Decimal("45000.0"),
    )
    db_session.add(pos)
    await db_session.commit()

    # market price 52000 >= 50000 requested -> triggers
    mock_binance.return_value = 52000.0

    service = PaperTradingService(db_session)
    payload = PaperOrderCreate(
        asset_id=str(test_asset.id),
        side="SELL",
        order_type="LIMIT",
        quantity=Decimal("0.1"),
        requested_price=Decimal("50000.0"),
    )

    order = await service.create_order(test_user.id, payload)
    assert order.status == "filled"
    assert order.executed_price == Decimal("52000.0")


@pytest.mark.asyncio
async def test_limit_sell_does_not_trigger(db_session, test_user, test_asset, test_account, mock_binance):
    # Seed position
    pos = PaperPosition(
        paper_account_id=test_account.id,
        asset_id=test_asset.id,
        quantity=Decimal("0.1"),
        average_entry_price=Decimal("45000.0"),
    )
    db_session.add(pos)
    await db_session.commit()

    # market price 48000 < 50000 requested -> does not trigger
    mock_binance.return_value = 48000.0

    service = PaperTradingService(db_session)
    payload = PaperOrderCreate(
        asset_id=str(test_asset.id),
        side="SELL",
        order_type="LIMIT",
        quantity=Decimal("0.1"),
        requested_price=Decimal("50000.0"),
    )

    order = await service.create_order(test_user.id, payload)
    assert order.status == "open"
    assert order.executed_price is None

    # Verify no state changes
    await db_session.refresh(pos)
    assert pos.quantity == Decimal("0.1")


@pytest.mark.asyncio
async def test_insufficient_cash(db_session, test_user, test_asset, test_account, mock_binance):
    # Set cash to 100 USDT
    test_account.current_cash = Decimal("100.00")
    await db_session.commit()

    mock_binance.return_value = 50000.0

    service = PaperTradingService(db_session)
    payload = PaperOrderCreate(
        asset_id=str(test_asset.id),
        side="BUY",
        order_type="MARKET",
        quantity=Decimal("0.1"),  # Cost is ~5007 USDT
        requested_price=Decimal("50000.0"),
    )

    with pytest.raises(InsufficientBalanceError):
        await service.create_order(test_user.id, payload)

    # Verify atomic rollback
    db_session.expire_all()
    await db_session.refresh(test_account)
    assert test_account.current_cash == Decimal("100.00")

    orders = await db_session.execute(select(PaperOrder))
    assert len(orders.scalars().all()) == 0


@pytest.mark.asyncio
async def test_insufficient_position(db_session, test_user, test_asset, test_account, mock_binance):
    # No position exists
    mock_binance.return_value = 50000.0

    service = PaperTradingService(db_session)
    payload = PaperOrderCreate(
        asset_id=str(test_asset.id),
        side="SELL",
        order_type="MARKET",
        quantity=Decimal("0.1"),
        requested_price=Decimal("50000.0"),
    )

    with pytest.raises(InsufficientPositionError):
        await service.create_order(test_user.id, payload)


@pytest.mark.asyncio
async def test_invalid_order_inputs(db_session, test_user, test_asset, test_account):
    service = PaperTradingService(db_session)
    from pydantic import ValidationError
    
    asset_id_str = str(test_asset.id)
    
    # Invalid side (caught by Pydantic pattern validation)
    with pytest.raises(ValidationError):
        PaperOrderCreate(
            asset_id=asset_id_str, side="HOLD", order_type="MARKET", quantity=Decimal("1"), requested_price=Decimal("1")
        )

    # Invalid order type (passes Pydantic, caught by service)
    with pytest.raises(InvalidOrderInputError):
        await service.create_order(test_user.id, PaperOrderCreate(
            asset_id=asset_id_str, side="BUY", order_type="STOP_LIMIT", quantity=Decimal("1"), requested_price=Decimal("1")
        ))

    # Negative quantity (caught by Pydantic gt=0 check)
    with pytest.raises(ValidationError):
        PaperOrderCreate(
            asset_id=asset_id_str, side="BUY", order_type="MARKET", quantity=Decimal("-1"), requested_price=Decimal("1")
        )

    # Zero requested price (caught by Pydantic gt=0 check)
    with pytest.raises(ValidationError):
        PaperOrderCreate(
            asset_id=asset_id_str, side="BUY", order_type="MARKET", quantity=Decimal("1"), requested_price=Decimal("0")
        )




@pytest.mark.asyncio
async def test_binance_pricing_failure_rolls_back(db_session, test_user, test_asset, test_account, mock_binance):
    # Mock Binance failure
    mock_binance.side_effect = BinanceServiceError("Exchange connection timed out")

    service = PaperTradingService(db_session)
    payload = PaperOrderCreate(
        asset_id=str(test_asset.id),
        side="BUY",
        order_type="MARKET",
        quantity=Decimal("0.1"),
        requested_price=Decimal("50000.0"),
    )

    with pytest.raises(PriceRetrievalError):
        await service.create_order(test_user.id, payload)

    # Verify no side-effects or partial database state
    db_session.expire_all()
    await db_session.refresh(test_account)
    assert test_account.current_cash == Decimal("10000.00")

    orders = await db_session.execute(select(PaperOrder))
    assert len(orders.scalars().all()) == 0

    trades = await db_session.execute(select(PaperTrade))
    assert len(trades.scalars().all()) == 0


@pytest.mark.asyncio
async def test_api_route_integration_success(test_user, test_asset, test_account, mock_binance):
    mock_binance.return_value = 50000.0

    from fastapi.testclient import TestClient
    from app.main import app
    
    # We bypass authentication by mocking get_current_user or registering/logging in.
    # Let's register/login to obtain a valid access token.
    client = TestClient(app)
    user_payload = {"email": "api_test_user@example.com", "password": "Password1!", "display_name": "API Test User"}
    client.post('/api/v1/auth/register', json=user_payload)
    login_res = client.post('/api/v1/auth/login', json=user_payload)
    token = login_res.json()['tokens']['access_token']
    headers = {"Authorization": f"Bearer {token}"}

    # Setup paper account for this newly registered user in the DB
    # We fetch the user from database
    async with AsyncSessionLocal() as db:
        user_stmt = select(User).where(User.email == "api_test_user@example.com")
        user_res = await db.execute(user_stmt)
        db_user = user_res.scalar_one()
        
        # Get the automatically created paper account and update its cash
        stmt = select(PaperAccount).where(PaperAccount.user_id == db_user.id)
        acct_res = await db.execute(stmt)
        acct = acct_res.scalar_one()
        acct.current_cash = Decimal("10000.00")
        acct.initial_balance = Decimal("10000.00")
        await db.commit()

    # Call POST /api/v1/paper-trading/orders
    order_payload = {
        "asset_id": str(test_asset.id),
        "side": "BUY",
        "order_type": "MARKET",
        "quantity": 0.1,
        "requested_price": 50000.0,
    }
    
    response = client.post("/api/v1/paper-trading/orders", json=order_payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "filled"
    assert float(data["executed_price"]) == 50025.0
