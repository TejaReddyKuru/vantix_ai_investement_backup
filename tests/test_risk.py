import pytest
import pytest_asyncio
import asyncio
from decimal import Decimal
from uuid import uuid4
from datetime import datetime
from unittest.mock import AsyncMock, patch

from sqlalchemy import select
from fastapi import status
from fastapi.testclient import TestClient

from database.session import AsyncSessionLocal
from app.main import app
from app.models.user import User
from app.models.asset import Asset
from app.models.paper_trading import PaperAccount, PaperPosition, PaperOrder
from app.models.portfolio import PortfolioSnapshot
from app.services.risk_management_service import RiskManagementService
from app.services.paper_trading_service import PaperTradingService, RiskValidationFailedError
from app.schemas.paper_trading import PaperOrderCreate
from app.core.config import settings
from app.core.exceptions import BinanceServiceError


@pytest_asyncio.fixture
async def db_session():
    async with AsyncSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def test_user(db_session):
    user = User(email="risk_test@example.com", password_hash="hashed_password", is_active=True)
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


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


@pytest.fixture
def mock_binance():
    with patch("app.services.binance_service.BinanceService.get_current_price", new_callable=AsyncMock) as mock:
        yield mock


@pytest.mark.asyncio
async def test_approved_low_risk_buy(db_session, test_user, test_account, test_asset, mock_binance):
    # Setup fresh snapshot
    snapshot = PortfolioSnapshot(
        user_id=test_user.id,
        paper_account_id=test_account.id,
        total_equity=Decimal("10000.00"),
        cash=Decimal("10000.00"),
        invested_value=Decimal("0.0"),
        realized_pnl=Decimal("0.0"),
        unrealized_pnl=Decimal("0.0"),
        drawdown=Decimal("0.0"),
    )
    db_session.add(snapshot)
    await db_session.commit()

    service = RiskManagementService(db_session)
    mock_binance.return_value = 50000.0

    # Low risk trade: BUY 0.02 BTC (value 1000) at 50,000, stop loss 49,000
    # risk = 0.02 * 1000 = 20 (0.2% of equity, limit 2%)
    # exposure = 1000 (10% of equity, limit 20%)
    # cash remaining = 9000 (reserve is 500)
    assessment = await service.assess_trade(
        user_id=test_user.id,
        asset_id=test_asset.id,
        side="BUY",
        quantity=Decimal("0.02"),
        entry_price=Decimal("50000.0"),
        stop_loss=Decimal("49000.0"),
    )

    assert assessment.approved is True
    assert assessment.risk_amount == Decimal("20.0")
    assert assessment.risk_percentage == Decimal("0.2")
    assert assessment.position_value == Decimal("1000.0")
    assert assessment.exposure_percentage == Decimal("10.0")
    assert assessment.rejection_reason is None


@pytest.mark.asyncio
async def test_excessive_position_exposure_rejection(db_session, test_user, test_account, test_asset, mock_binance):
    snapshot = PortfolioSnapshot(
        user_id=test_user.id,
        paper_account_id=test_account.id,
        total_equity=Decimal("10000.00"),
        cash=Decimal("10000.00"),
        invested_value=Decimal("0.0"),
        realized_pnl=Decimal("0.0"),
        unrealized_pnl=Decimal("0.0"),
        drawdown=Decimal("0.0"),
    )
    db_session.add(snapshot)
    await db_session.commit()

    service = RiskManagementService(db_session)
    mock_binance.return_value = 50000.0

    # Large position: BUY 0.05 BTC (value 2500, 25% of equity, exceeds 20% limit)
    assessment = await service.assess_trade(
        user_id=test_user.id,
        asset_id=test_asset.id,
        side="BUY",
        quantity=Decimal("0.05"),
        entry_price=Decimal("50000.0"),
        stop_loss=Decimal("49000.0"),
    )

    assert assessment.approved is False
    assert "Excessive position exposure" in assessment.rejection_reason


@pytest.mark.asyncio
async def test_excessive_risk_per_trade_rejection(db_session, test_user, test_account, test_asset, mock_binance):
    snapshot = PortfolioSnapshot(
        user_id=test_user.id,
        paper_account_id=test_account.id,
        total_equity=Decimal("10000.00"),
        cash=Decimal("10000.00"),
        invested_value=Decimal("0.0"),
        realized_pnl=Decimal("0.0"),
        unrealized_pnl=Decimal("0.0"),
        drawdown=Decimal("0.0"),
    )
    db_session.add(snapshot)
    await db_session.commit()

    service = RiskManagementService(db_session)
    mock_binance.return_value = 50000.0

    # Risk: BUY 0.02 BTC (value 1000) at 50,000, stop loss 35,000
    # risk = 0.02 * (50000 - 35000) = 300 (3% of equity, exceeds 2% limit)
    assessment = await service.assess_trade(
        user_id=test_user.id,
        asset_id=test_asset.id,
        side="BUY",
        quantity=Decimal("0.02"),
        entry_price=Decimal("50000.0"),
        stop_loss=Decimal("35000.0"),
    )

    assert assessment.approved is False
    assert "Excessive risk per trade" in assessment.rejection_reason


@pytest.mark.asyncio
async def test_insufficient_cash_reserve_rejection(db_session, test_user, test_account, test_asset, mock_binance):
    # Set cash to only 1,000, equity is 10,000 (due to some other assets/invested value)
    test_account.current_cash = Decimal("1000.00")
    db_session.add(test_account)

    dummy_asset = Asset(
        symbol="ETHUSDT",
        base_asset="ETH",
        quote_asset="USDT",
        name="Ethereum",
        exchange="BINANCE",
        status="active",
    )
    db_session.add(dummy_asset)
    await db_session.commit()

    position = PaperPosition(
        paper_account_id=test_account.id,
        asset_id=dummy_asset.id,
        quantity=Decimal("3.0"),
        average_entry_price=Decimal("3000.0"),
    )
    db_session.add(position)

    snapshot = PortfolioSnapshot(
        user_id=test_user.id,
        paper_account_id=test_account.id,
        total_equity=Decimal("10000.00"),
        cash=Decimal("1000.00"),
        invested_value=Decimal("9000.0"),
        realized_pnl=Decimal("0.0"),
        unrealized_pnl=Decimal("0.0"),
        drawdown=Decimal("0.0"),
    )
    db_session.add(snapshot)
    await db_session.commit()

    service = RiskManagementService(db_session)
    
    # Mock Binance prices
    prices = {"BTCUSDT": 50000.0, "ETHUSDT": 3000.0}
    mock_binance.side_effect = lambda sym: prices[sym]

    # Proposed trade value is 600. Remaining cash would be 400.
    # Reserve limit is 5% of total equity = 500.
    # 400 < 500, so it should be rejected.
    assessment = await service.assess_trade(
        user_id=test_user.id,
        asset_id=test_asset.id,
        side="BUY",
        quantity=Decimal("0.012"),
        entry_price=Decimal("50000.0"),
        stop_loss=Decimal("49000.0"),
    )

    assert assessment.approved is False
    assert "Insufficient cash balance considering minimum cash reserve limit" in assessment.rejection_reason


@pytest.mark.asyncio
async def test_drawdown_limit_rejection(db_session, test_user, test_account, test_asset, mock_binance):
    # Set cash to 8,400. Equity will be calculated as 8,400.
    test_account.current_cash = Decimal("8400.00")
    db_session.add(test_account)

    # Historical peak snapshot total_equity is 10,000
    # Drawdown = ((10000 - 8400)/10000)*100 = 16.0% (limit is 15.0%)
    snapshot = PortfolioSnapshot(
        user_id=test_user.id,
        paper_account_id=test_account.id,
        total_equity=Decimal("10000.00"),
        cash=Decimal("10000.00"),
        invested_value=Decimal("0.0"),
        realized_pnl=Decimal("0.0"),
        unrealized_pnl=Decimal("0.0"),
        drawdown=Decimal("0.0"),
    )
    db_session.add(snapshot)
    await db_session.commit()

    service = RiskManagementService(db_session)
    mock_binance.return_value = 50000.0

    # Drawdown limit reached: BUY should be blocked
    assessment = await service.assess_trade(
        user_id=test_user.id,
        asset_id=test_asset.id,
        side="BUY",
        quantity=Decimal("0.01"),
        entry_price=Decimal("50000.0"),
        stop_loss=Decimal("49000.0"),
    )

    assert assessment.approved is False
    assert "Maximum portfolio drawdown limit reached" in assessment.rejection_reason


@pytest.mark.asyncio
async def test_existing_position_concentration_rejection(db_session, test_user, test_account, test_asset, mock_binance):
    # Set cash to 8,500
    test_account.current_cash = Decimal("8500.00")
    db_session.add(test_account)

    # Existing position is 0.03 BTC (value 1500, 15% of equity)
    position = PaperPosition(
        paper_account_id=test_account.id,
        asset_id=test_asset.id,
        quantity=Decimal("0.03"),
        average_entry_price=Decimal("50000.0"),
    )
    db_session.add(position)

    snapshot = PortfolioSnapshot(
        user_id=test_user.id,
        paper_account_id=test_account.id,
        total_equity=Decimal("10000.00"),
        cash=Decimal("8500.00"),
        invested_value=Decimal("1500.0"),
        realized_pnl=Decimal("0.0"),
        unrealized_pnl=Decimal("0.0"),
        drawdown=Decimal("0.0"),
    )
    db_session.add(snapshot)
    await db_session.commit()

    service = RiskManagementService(db_session)
    mock_binance.return_value = 50000.0

    # Proposed trade: BUY 0.015 BTC (value 750). New exposure = 1500 + 750 = 2250 (22.5% of equity, exceeds 20%)
    assessment = await service.assess_trade(
        user_id=test_user.id,
        asset_id=test_asset.id,
        side="BUY",
        quantity=Decimal("0.015"),
        entry_price=Decimal("50000.0"),
        stop_loss=Decimal("49000.0"),
    )

    assert assessment.approved is False
    assert "Excessive position exposure" in assessment.rejection_reason


@pytest.mark.asyncio
async def test_stop_loss_validation(db_session, test_user, test_account, test_asset, mock_binance):
    snapshot = PortfolioSnapshot(
        user_id=test_user.id,
        paper_account_id=test_account.id,
        total_equity=Decimal("10000.00"),
        cash=Decimal("10000.00"),
        invested_value=Decimal("0.0"),
        drawdown=Decimal("0.0"),
    )
    db_session.add(snapshot)
    await db_session.commit()

    service = RiskManagementService(db_session)
    mock_binance.return_value = 50000.0

    # 1. Invalid stop loss >= entry price
    assessment_1 = await service.assess_trade(
        user_id=test_user.id,
        asset_id=test_asset.id,
        side="BUY",
        quantity=Decimal("0.01"),
        entry_price=Decimal("50000.0"),
        stop_loss=Decimal("51000.0"),
    )
    assert assessment_1.approved is False
    assert "Invalid stop-loss price" in assessment_1.rejection_reason

    # 2. Invalid stop loss <= 0
    assessment_2 = await service.assess_trade(
        user_id=test_user.id,
        asset_id=test_asset.id,
        side="BUY",
        quantity=Decimal("0.01"),
        entry_price=Decimal("50000.0"),
        stop_loss=Decimal("0.0"),
    )
    assert assessment_2.approved is False
    assert "Invalid stop-loss price" in assessment_2.rejection_reason


@pytest.mark.asyncio
async def test_sell_reducing_position_successfully(db_session, test_user, test_account, test_asset, mock_binance):
    # Setup account cash to 7,500
    test_account.current_cash = Decimal("7500.00")
    db_session.add(test_account)

    # Existing position is 0.05 BTC (value 2500)
    position = PaperPosition(
        paper_account_id=test_account.id,
        asset_id=test_asset.id,
        quantity=Decimal("0.05"),
        average_entry_price=Decimal("50000.0"),
    )
    db_session.add(position)

    # Set drawdown to 16% in peak history (by adding a peak snapshot of 10,000, and current equity is 10,000, drawdown is 0%)
    # Let's make current equity 8,400 to reflect a 16% drawdown:
    # Set cash to 5,900. Invested = 2,500. Equity = 8,400. Peak = 10,000. Drawdown = 16.0%
    test_account.current_cash = Decimal("5900.00")
    db_session.add(test_account)

    snapshot = PortfolioSnapshot(
        user_id=test_user.id,
        paper_account_id=test_account.id,
        total_equity=Decimal("10000.00"),
        cash=Decimal("10000.00"),
        invested_value=Decimal("0.0"),
        drawdown=Decimal("0.0"),
    )
    db_session.add(snapshot)
    await db_session.commit()

    service = RiskManagementService(db_session)
    mock_binance.return_value = 50000.0

    # Proposed trade: SELL 0.02 BTC.
    # approved is True because it reduces exposure, and drawdown limit does not block SELLs.
    assessment = await service.assess_trade(
        user_id=test_user.id,
        asset_id=test_asset.id,
        side="SELL",
        quantity=Decimal("0.02"),
        entry_price=Decimal("50000.0"),
        stop_loss=None,
    )

    assert assessment.approved is True
    # New qty = 0.03. Value = 1500. Current calculated equity = 5900 + 2500 = 8400.
    # exposure_percentage = 1500 / 8400 * 100 = 17.8571%
    assert round(assessment.exposure_percentage, 4) == Decimal("17.8571")
    assert assessment.risk_amount == Decimal("0.0")


@pytest.mark.asyncio
async def test_sell_cannot_exceed_existing_position(db_session, test_user, test_account, test_asset, mock_binance):
    position = PaperPosition(
        paper_account_id=test_account.id,
        asset_id=test_asset.id,
        quantity=Decimal("0.01"),
        average_entry_price=Decimal("50000.0"),
    )
    db_session.add(position)

    snapshot = PortfolioSnapshot(
        user_id=test_user.id,
        paper_account_id=test_account.id,
        total_equity=Decimal("10000.00"),
        cash=Decimal("9500.00"),
        invested_value=Decimal("500.0"),
    )
    db_session.add(snapshot)
    await db_session.commit()

    service = RiskManagementService(db_session)
    mock_binance.return_value = 50000.0

    # Try to SELL 0.02 BTC (only have 0.01)
    assessment = await service.assess_trade(
        user_id=test_user.id,
        asset_id=test_asset.id,
        side="SELL",
        quantity=Decimal("0.02"),
        entry_price=Decimal("50000.0"),
        stop_loss=None,
    )

    assert assessment.approved is False
    assert "Cannot sell more than existing position quantity" in assessment.rejection_reason


@pytest.mark.asyncio
async def test_warnings_generation_at_80_percent(db_session, test_user, test_account, test_asset, mock_binance):
    # Set current cash to 8,800. Equity = 8,800. Peak = 10,000.
    # Drawdown = 12% (80% of 15% limit is 12%)
    test_account.current_cash = Decimal("8800.00")
    db_session.add(test_account)

    snapshot = PortfolioSnapshot(
        user_id=test_user.id,
        paper_account_id=test_account.id,
        total_equity=Decimal("10000.00"),
        cash=Decimal("10000.00"),
        invested_value=Decimal("0.0"),
        drawdown=Decimal("0.0"),
    )
    db_session.add(snapshot)
    await db_session.commit()

    service = RiskManagementService(db_session)
    mock_binance.return_value = 50000.0

    # Proposed trade: BUY 0.029 BTC (value 1450, 16.47% of equity, approaches 20% limit)
    # approaches limit since 16.47% >= 16.0% (80% of 20% limit)
    assessment = await service.assess_trade(
        user_id=test_user.id,
        asset_id=test_asset.id,
        side="BUY",
        quantity=Decimal("0.029"),
        entry_price=Decimal("50000.0"),
        stop_loss=Decimal("49000.0"),
    )

    assert assessment.approved is True
    assert "Position exposure is approaching the configured maximum." in assessment.warnings
    assert "Portfolio drawdown is approaching the configured maximum." in assessment.warnings


@pytest.mark.asyncio
async def test_binance_pricing_failure(db_session, test_user, test_account, test_asset, mock_binance):
    # Existing positions to force price lookup
    position = PaperPosition(
        paper_account_id=test_account.id,
        asset_id=test_asset.id,
        quantity=Decimal("0.01"),
        average_entry_price=Decimal("50000.0"),
    )
    db_session.add(position)

    snapshot = PortfolioSnapshot(
        user_id=test_user.id,
        paper_account_id=test_account.id,
        total_equity=Decimal("10000.00"),
        cash=Decimal("9500.00"),
        invested_value=Decimal("500.0"),
    )
    db_session.add(snapshot)
    await db_session.commit()

    # Mock price lookup failure
    mock_binance.side_effect = BinanceServiceError("Exchange timeout")

    service = RiskManagementService(db_session)
    with pytest.raises(Exception):
        await service.assess_trade(
            user_id=test_user.id,
            asset_id=test_asset.id,
            side="BUY",
            quantity=Decimal("0.01"),
            entry_price=Decimal("50000.0"),
            stop_loss=Decimal("49000.0"),
        )


@pytest.mark.asyncio
async def test_risk_rejection_leaves_database_unchanged(db_session, test_user, test_account, test_asset, mock_binance):
    # Pre-resolve IDs to prevent MissingGreenlet errors
    account_id = test_account.id
    user_id = test_user.id
    asset_id = test_asset.id

    snapshot = PortfolioSnapshot(
        user_id=user_id,
        paper_account_id=account_id,
        total_equity=Decimal("10000.00"),
        cash=Decimal("10000.00"),
        invested_value=Decimal("0.0"),
    )
    db_session.add(snapshot)
    await db_session.commit()

    # Proposal: excessive exposure BUY 0.05 BTC (exceeds 20%)
    mock_binance.return_value = 50000.0

    service = PaperTradingService(db_session)
    payload = PaperOrderCreate(
        asset_id=str(asset_id),
        side="BUY",
        order_type="MARKET",
        quantity=Decimal("0.05"),
        requested_price=Decimal("50000.0"),
        stop_loss=Decimal("49000.0"),
    )

    # Executing order should raise RiskValidationFailedError
    with pytest.raises(RiskValidationFailedError):
        await service.create_order(user_id, payload)

    # Verify atomic transaction rollback: no PaperOrder, PaperTrade, or Cash change occurred
    db_session.expire_all()
    orders = await db_session.execute(select(PaperOrder))
    assert len(orders.scalars().all()) == 0

    account_stmt = select(PaperAccount).where(PaperAccount.id == account_id)
    account_res = await db_session.execute(account_stmt)
    assert account_res.scalar_one().current_cash == Decimal("10000.00")


@pytest.mark.asyncio
async def test_paper_trading_success_when_risk_passes(db_session, test_user, test_account, test_asset, mock_binance):
    # Ensure current cash in paper account matches the snapshot equity!
    test_account.current_cash = Decimal("100000.00")
    db_session.add(test_account)

    snapshot = PortfolioSnapshot(
        user_id=test_user.id,
        paper_account_id=test_account.id,
        total_equity=Decimal("100000.00"),
        cash=Decimal("100000.00"),
        invested_value=Decimal("0.0"),
    )
    db_session.add(snapshot)
    await db_session.commit()

    # Small order (0.01 BTC = 500 value, extremely low risk)
    mock_binance.return_value = 50000.0

    service = PaperTradingService(db_session)
    payload = PaperOrderCreate(
        asset_id=str(test_asset.id),
        side="BUY",
        order_type="MARKET",
        quantity=Decimal("0.01"),
        requested_price=Decimal("50000.0"),
        stop_loss=Decimal("49000.0"),
    )

    order = await service.create_order(test_user.id, payload)
    assert order.status == "filled"

    # Check database changes successfully committed
    db_session.expire_all()
    orders = await db_session.execute(select(PaperOrder))
    # Note: 1 order from this test
    assert len(orders.scalars().all()) == 1


@pytest.mark.asyncio
async def test_paper_trading_sell_remains_available_during_drawdown(db_session, test_user, test_account, test_asset, mock_binance):
    # Setup cash = 7,500
    test_account.current_cash = Decimal("7500.00")
    db_session.add(test_account)

    # Existing position: 0.05 BTC (value 2500)
    position = PaperPosition(
        paper_account_id=test_account.id,
        asset_id=test_asset.id,
        quantity=Decimal("0.05"),
        average_entry_price=Decimal("50000.0"),
    )
    db_session.add(position)

    # Set drawdown to 16% dynamically (cash = 5900, invested = 2500, total = 8400, peak = 10000)
    test_account.current_cash = Decimal("5900.00")
    db_session.add(test_account)

    snapshot = PortfolioSnapshot(
        user_id=test_user.id,
        paper_account_id=test_account.id,
        total_equity=Decimal("10000.00"),
        cash=Decimal("10000.00"),
        invested_value=Decimal("0.0"),
        drawdown=Decimal("0.0"),
    )
    db_session.add(snapshot)
    await db_session.commit()

    mock_binance.return_value = 50000.0

    service = PaperTradingService(db_session)
    payload = PaperOrderCreate(
        asset_id=str(test_asset.id),
        side="SELL",
        order_type="MARKET",
        quantity=Decimal("0.02"),
        requested_price=Decimal("50000.0"),
    )

    # SELL order goes through successfully even during high drawdown
    order = await service.create_order(test_user.id, payload)
    assert order.status == "filled"


def test_api_risk_assessment_success_and_auth(mock_binance):
    mock_binance.return_value = 50000.0

    from app.schemas.paper_trading import PaperOrderCreate
    from app.services.paper_trading_service import PaperTradingService

    client = TestClient(app)

    # 1. Non-authenticated request returns 401
    bad_res = client.post("/api/v1/risk/assess", json={})
    assert bad_res.status_code == 401

    # 2. Register & Login
    user_payload = {"email": "risk_api_user@example.com", "password": "Password1!", "display_name": "Risk Api User"}
    client.post('/api/v1/auth/register', json=user_payload)
    login_res = client.post('/api/v1/auth/login', json=user_payload)
    token = login_res.json()['tokens']['access_token']
    headers = {"Authorization": f"Bearer {token}"}

    # Setup assets
    import asyncio
    async def setup_db():
        async with AsyncSessionLocal() as db:
            # Query user
            user_stmt = select(User).where(User.email == "risk_api_user@example.com")
            user_res = await db.execute(user_stmt)
            db_user = user_res.scalar_one()

            # Find default paper account
            acct_stmt = select(PaperAccount).where(PaperAccount.user_id == db_user.id)
            acct_res = await db.execute(acct_stmt)
            acct = acct_res.scalar_one()

            # Create asset
            btc = Asset(symbol="BTCUSDT", base_asset="BTC", quote_asset="USDT", name="Bitcoin", exchange="BINANCE", status="active")
            db.add(btc)
            await db.commit()
            await db.refresh(btc)

            # Add a snapshot (total_equity = 100,000 USDT)
            snapshot = PortfolioSnapshot(
                user_id=db_user.id,
                paper_account_id=acct.id,
                total_equity=Decimal("100000.00"),
                cash=Decimal("100000.00"),
                invested_value=Decimal("0.0"),
            )
            db.add(snapshot)
            await db.commit()
            return str(btc.id)

    btc_id = asyncio.run(setup_db())

    # 3. Valid proposed trade request
    trade_payload = {
        "asset_id": btc_id,
        "side": "BUY",
        "quantity": 0.05,
        "entry_price": 50000.0,
        "stop_loss": 49000.0
    }
    response = client.post("/api/v1/risk/assess", json=trade_payload, headers=headers)
    print("RESPONSE BODY:", response.text)
    assert response.status_code == 200

    data = response.json()
    assert data["approved"] is True
    assert float(data["risk_amount"]) == 50.0  # 0.05 * 1000 = 50
    assert float(data["risk_percentage"]) == 0.05  # 50 / 100000 * 100
    assert float(data["exposure_percentage"]) == 2.5  # 2500 / 100000 * 100
