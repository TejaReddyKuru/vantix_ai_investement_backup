import pytest
import pytest_asyncio
from decimal import Decimal
from uuid import uuid4
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch

from sqlalchemy import select
from fastapi import status

from database.session import AsyncSessionLocal
from app.models.user import User
from app.models.asset import Asset
from app.models.paper_trading import PaperAccount, PaperPosition
from app.models.portfolio import PortfolioSnapshot
from app.services.portfolio_service import (
    PortfolioService,
    AccountNotFoundError,
    AssetNotFoundError,
    AssetInactiveError,
    UnsupportedExchangeError,
    PriceRetrievalError,
)
from app.core.exceptions import BinanceServiceError



@pytest_asyncio.fixture
async def db_session():
    async with AsyncSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def test_user(db_session):
    user = User(email="portfolio_test@example.com", password_hash="hashed_password", is_active=True)
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
def mock_binance():
    with patch("app.services.portfolio_service.BinanceService.get_current_price", new_callable=AsyncMock) as mock:
        yield mock


@pytest.mark.asyncio
async def test_single_position_valuation(db_session, test_user, test_account, mock_binance):
    # Setup BTC asset
    btc_asset = Asset(
        symbol="BTCUSDT",
        base_asset="BTC",
        quote_asset="USDT",
        name="Bitcoin",
        exchange="BINANCE",
        status="active",
    )
    db_session.add(btc_asset)
    await db_session.commit()
    await db_session.refresh(btc_asset)

    # Setup position (0.1 BTC at average 45000, realized_pnl = 50)
    position = PaperPosition(
        paper_account_id=test_account.id,
        asset_id=btc_asset.id,
        quantity=Decimal("0.1"),
        average_entry_price=Decimal("45000.0"),
        realized_pnl=Decimal("50.0"),
        unrealized_pnl=Decimal("0"),
    )
    db_session.add(position)
    await db_session.commit()

    # Mock Binance price to 50,000
    mock_binance.return_value = 50000.0

    service = PortfolioService(db_session)
    snapshot = await service.calculate_and_save_snapshot(test_user.id)

    # Verification:
    # cash = 10000
    # invested_value = 0.1 * 50000 = 5000
    # total_equity = 10000 + 5000 = 15000
    # unrealized_pnl = 0.1 * (50000 - 45000) = 500
    # realized_pnl = 50
    assert snapshot.cash == Decimal("10000.00")
    assert snapshot.invested_value == Decimal("5000.00")
    assert snapshot.total_equity == Decimal("15000.00")
    assert snapshot.unrealized_pnl == Decimal("500.00")
    assert snapshot.realized_pnl == Decimal("50.00")
    assert snapshot.drawdown == Decimal("0.00")  # First snapshot peak equity


@pytest.mark.asyncio
async def test_multiple_positions_valuation(db_session, test_user, test_account, mock_binance):
    # Setup BTC and ETH assets
    btc = Asset(symbol="BTCUSDT", base_asset="BTC", quote_asset="USDT", name="Bitcoin", exchange="BINANCE", status="active")
    eth = Asset(symbol="ETHUSDT", base_asset="ETH", quote_asset="USDT", name="Ethereum", exchange="BINANCE", status="active")
    db_session.add_all([btc, eth])
    await db_session.commit()
    await db_session.refresh(btc)
    await db_session.refresh(eth)

    # Setup positions
    pos_btc = PaperPosition(
        paper_account_id=test_account.id,
        asset_id=btc.id,
        quantity=Decimal("0.1"),
        average_entry_price=Decimal("45000.0"),
        realized_pnl=Decimal("50.0"),
    )
    pos_eth = PaperPosition(
        paper_account_id=test_account.id,
        asset_id=eth.id,
        quantity=Decimal("1.0"),
        average_entry_price=Decimal("3000.0"),
        realized_pnl=Decimal("100.0"),
    )
    db_session.add_all([pos_btc, pos_eth])
    await db_session.commit()

    # Mock Binance prices
    prices = {"BTCUSDT": 50000.0, "ETHUSDT": 25000.0}  # Wait, ETH went way up!
    mock_binance.side_effect = lambda sym: prices[sym]

    service = PortfolioService(db_session)
    snapshot = await service.calculate_and_save_snapshot(test_user.id)

    # Verification:
    # cash = 10000
    # btc invested = 0.1 * 50000 = 5000. ETH invested = 1.0 * 25000 = 25000
    # invested_value = 5000 + 25000 = 30000
    # total_equity = 10000 + 30000 = 40000
    # btc unrealized = 0.1 * 5000 = 500. ETH unrealized = 1.0 * 22000 = 22000
    # unrealized_pnl = 500 + 22000 = 22500
    # realized_pnl = 50 + 100 = 150
    assert snapshot.cash == Decimal("10000.00")
    assert snapshot.invested_value == Decimal("30000.00")
    assert snapshot.total_equity == Decimal("40000.00")
    assert snapshot.unrealized_pnl == Decimal("22500.00")
    assert snapshot.realized_pnl == Decimal("150.00")
    assert snapshot.drawdown == Decimal("0.00")


@pytest.mark.asyncio
async def test_drawdown_logic_and_peaks(db_session, test_user, test_account, mock_binance):
    # Setup BTC asset
    btc = Asset(symbol="BTCUSDT", base_asset="BTC", quote_asset="USDT", name="Bitcoin", exchange="BINANCE", status="active")
    db_session.add(btc)
    await db_session.commit()
    await db_session.refresh(btc)

    pos = PaperPosition(
        paper_account_id=test_account.id,
        asset_id=btc.id,
        quantity=Decimal("1.0"),
        average_entry_price=Decimal("45000.0"),
    )
    db_session.add(pos)
    await db_session.commit()

    service = PortfolioService(db_session)

    # 1. First snapshot: BTC at 50,000. equity = 10k cash + 50k = 60,000
    mock_binance.return_value = 50000.0
    s1 = await service.calculate_and_save_snapshot(test_user.id)
    assert s1.total_equity == Decimal("60000.00")
    assert s1.drawdown == Decimal("0.00")

    # Shift time back so we save a new snapshot next time
    s1.recorded_at = datetime.utcnow() - timedelta(minutes=10)
    await db_session.commit()

    # 2. Equity decline: BTC at 40,000. equity = 10k cash + 40k = 50,000
    # Drawdown = ((60000 - 50000) / 60000) * 100 = 16.6667%
    mock_binance.return_value = 40000.0
    s2 = await service.calculate_and_save_snapshot(test_user.id)
    assert s2.total_equity == Decimal("50000.00")
    assert round(s2.drawdown, 4) == Decimal("16.6667")

    # Shift time back
    s2.recorded_at = datetime.utcnow() - timedelta(minutes=10)
    await db_session.commit()

    # 3. Recovery partway: BTC at 45,000. equity = 10k cash + 45k = 55,000
    # Peak is still 60,000. Drawdown = ((60000 - 55000) / 60000) * 100 = 8.3333%
    mock_binance.return_value = 45000.0
    s3 = await service.calculate_and_save_snapshot(test_user.id)
    assert s3.total_equity == Decimal("55000.00")
    assert round(s3.drawdown, 4) == Decimal("8.3333")

    # Shift time back
    s3.recorded_at = datetime.utcnow() - timedelta(minutes=10)
    await db_session.commit()

    # 4. New Peak: BTC at 70,000. equity = 10k cash + 70k = 80,000
    # Drawdown should return to 0
    mock_binance.return_value = 70000.0
    s4 = await service.calculate_and_save_snapshot(test_user.id)
    assert s4.total_equity == Decimal("80000.00")
    assert s4.drawdown == Decimal("0.00")


@pytest.mark.asyncio
async def test_missing_paper_account(db_session):
    # Create user with no paper account
    user = User(email="no_acct@example.com", password_hash="hashed")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    service = PortfolioService(db_session)
    with pytest.raises(AccountNotFoundError):
        await service.calculate_and_save_snapshot(user.id)


@pytest.mark.asyncio
async def test_invalid_and_inactive_assets(db_session, test_user, test_account):
    service = PortfolioService(db_session)
    account_id = test_account.id
    user_id = test_user.id

    # 1. Non-existent asset ID referenced in position
    position = PaperPosition(
        paper_account_id=account_id,
        asset_id=uuid4(),  # Random ID
        quantity=Decimal("1"),
        average_entry_price=Decimal("100"),
    )
    db_session.add(position)
    await db_session.commit()

    with pytest.raises(AssetNotFoundError):
        await service.calculate_and_save_snapshot(user_id)

    # Delete bad position
    await db_session.delete(position)
    await db_session.commit()

    # 2. Inactive asset
    inactive_asset = Asset(
        symbol="DOGEUSDT",
        base_asset="DOGE",
        quote_asset="USDT",
        name="Dogecoin",
        exchange="BINANCE",
        status="inactive",  # Inactive
    )
    db_session.add(inactive_asset)
    await db_session.commit()
    await db_session.refresh(inactive_asset)

    inactive_asset_id = inactive_asset.id

    pos_inactive = PaperPosition(
        paper_account_id=account_id,
        asset_id=inactive_asset_id,
        quantity=Decimal("10"),
        average_entry_price=Decimal("0.10"),
    )
    db_session.add(pos_inactive)
    await db_session.commit()

    with pytest.raises(AssetInactiveError):
        await service.calculate_and_save_snapshot(user_id)

    # Cleanup
    await db_session.delete(pos_inactive)
    await db_session.delete(inactive_asset)
    await db_session.commit()


@pytest.mark.asyncio
async def test_binance_price_failure_rolls_back(db_session, test_user, test_account, mock_binance):
    btc = Asset(symbol="BTCUSDT", base_asset="BTC", quote_asset="USDT", name="Bitcoin", exchange="BINANCE", status="active")
    db_session.add(btc)
    await db_session.commit()
    await db_session.refresh(btc)

    pos = PaperPosition(
        paper_account_id=test_account.id,
        asset_id=btc.id,
        quantity=Decimal("1.0"),
        average_entry_price=Decimal("45000.0"),
    )
    db_session.add(pos)
    await db_session.commit()

    # Mock Binance error
    mock_binance.side_effect = BinanceServiceError("Network connection error")

    service = PortfolioService(db_session)
    with pytest.raises(PriceRetrievalError):
        await service.calculate_and_save_snapshot(test_user.id)

    # Verify atomic rollback: no snapshot was persisted in database
    db_session.expire_all()
    snapshots = await db_session.execute(select(PortfolioSnapshot))
    assert len(snapshots.scalars().all()) == 0


@pytest.mark.asyncio
async def test_api_summary_and_snapshots(db_session, mock_binance):
    mock_binance.return_value = 50000.0

    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)
    user_payload = {"email": "api_port_user@example.com", "password": "Password1!", "display_name": "API Portfolio User"}
    client.post('/api/v1/auth/register', json=user_payload)
    login_res = client.post('/api/v1/auth/login', json=user_payload)
    token = login_res.json()['tokens']['access_token']
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncSessionLocal() as db:
        user_stmt = select(User).where(User.email == "api_port_user@example.com")
        user_res = await db.execute(user_stmt)
        db_user = user_res.scalar_one()

        btc = Asset(symbol="BTCUSDT", base_asset="BTC", quote_asset="USDT", name="Bitcoin", exchange="BINANCE", status="active")
        db.add(btc)
        await db.commit()
        await db.refresh(btc)

        # Get existing paper account (created in registration)
        acct_stmt = select(PaperAccount).where(PaperAccount.user_id == db_user.id)
        acct_res = await db.execute(acct_stmt)
        acct = acct_res.scalar_one()

        # Add position
        pos = PaperPosition(
            paper_account_id=acct.id,
            asset_id=btc.id,
            quantity=Decimal("0.1"),
            average_entry_price=Decimal("45000.0"),
            realized_pnl=Decimal("50.0"),
        )
        db.add(pos)
        await db.commit()

    # 1. Call GET /api/v1/portfolio/summary
    # cash = 100,000 (default initialized by registration flow)
    # btc market value = 0.1 * 50000 = 5000
    # total equity = 105,000
    # unrealized pnl = 0.1 * 5000 = 500
    # realized pnl = 50
    # drawdown = 0
    response = client.get("/api/v1/portfolio/summary", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert float(data["total_equity"]) == 105000.0
    assert float(data["cash"]) == 100000.0
    assert float(data["invested_value"]) == 5000.0
    assert float(data["unrealized_pnl"]) == 500.0
    assert float(data["realized_pnl"]) == 50.0
    assert float(data["drawdown"]) == 0.0

    # 2. Call GET /api/v1/portfolio (list snapshots)
    list_response = client.get("/api/v1/portfolio", headers=headers)
    assert list_response.status_code == 200
    list_data = list_response.json()
    assert list_data["total"] == 1
    assert len(list_data["items"]) == 1
    assert float(list_data["items"][0]["total_equity"]) == 105000.0
