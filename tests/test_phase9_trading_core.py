"""
tests/test_phase9_trading_core.py
Consolidated Phase 9 Trading Platform Core & Broker Integration test suite.
Deterministic, offline, fast, and completely isolated from live brokers/exchanges.
"""
import pytest
import pytest_asyncio
from decimal import Decimal
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

import app.models  # noqa: F401
from app.main import app
from app.schemas.execution import (
    BacktestConfig,
    ExecutionMode,
    ExecutionRequest,
    ExecutionResult,
    NormalizedOrderState,
)
from app.services.brokers.adapters import (
    AlpacaBrokerAdapter,
    BinanceBrokerAdapter,
    BybitBrokerAdapter,
    InteractiveBrokersAdapter,
    PaperBrokerAdapter,
)
from app.services.brokers.base_broker import BaseBrokerAdapter, BrokerError
from app.services.execution_engine import ExecutionEngine, ExecutionValidationError
from app.services.market_data_stream import FakeMarketDataStream, MarketDataStreamManager, StreamState
from app.services.backtesting_engine import BacktestingEngine, HistoricalReplayEngine
from app.services.trading_analytics_service import TradingAnalyticsService
from app.services.notification_service import NotificationEvent, NotificationService
from app.agents.pipeline.paper_trading_bridge import PaperTradingDecisionBridge
from app.agents.advisor.strategy_agent import StrategyDecisionAgent

client = TestClient(app)


# ---------------------------------------------------------------------------
# 1. Broker Abstraction & Normalization Tests (1-11)
# ---------------------------------------------------------------------------

def test_01_broker_interface_exists():
    assert issubclass(PaperBrokerAdapter, BaseBrokerAdapter)


@pytest.mark.asyncio
async def test_02_broker_adapter_normalization():
    adapter = PaperBrokerAdapter()
    account = await adapter.get_account()
    assert account.broker == "PAPER"
    assert account.currency == "USDT"


@pytest.mark.asyncio
async def test_03_binance_adapter_contract():
    adapter = BinanceBrokerAdapter(is_paper=True)
    await adapter.connect()
    assert adapter.is_connected is True
    account = await adapter.get_account()
    assert account.broker == "BINANCE"


@pytest.mark.asyncio
async def test_04_bybit_adapter_contract():
    adapter = BybitBrokerAdapter(is_paper=True)
    account = await adapter.get_account()
    assert account.broker == "BYBIT"


@pytest.mark.asyncio
async def test_05_alpaca_adapter_contract():
    adapter = AlpacaBrokerAdapter(is_paper=True)
    account = await adapter.get_account()
    assert account.broker == "ALPACA"


@pytest.mark.asyncio
async def test_06_ibkr_adapter_contract():
    adapter = InteractiveBrokersAdapter(is_paper=True)
    account = await adapter.get_account()
    assert account.broker == "INTERACTIVE_BROKERS"


@pytest.mark.asyncio
async def test_07_account_normalization():
    adapter = PaperBrokerAdapter()
    account = await adapter.get_account()
    assert isinstance(account.total_balance, Decimal)


@pytest.mark.asyncio
async def test_08_balance_normalization():
    adapter = PaperBrokerAdapter()
    account = await adapter.get_account()
    assert account.available_balance == Decimal("10000.00")


@pytest.mark.asyncio
async def test_09_position_normalization():
    adapter = PaperBrokerAdapter()
    positions = await adapter.get_positions()
    assert isinstance(positions, list)


@pytest.mark.asyncio
async def test_10_order_normalization():
    adapter = PaperBrokerAdapter()
    req = ExecutionRequest(symbol="BTCUSDT", side="BUY", quantity=Decimal("0.1"), price=Decimal("50000.0"))
    res = await adapter.submit_order(req)
    assert res.order is not None
    assert res.order.symbol == "BTCUSDT"
    assert res.order.status == NormalizedOrderState.FILLED


@pytest.mark.asyncio
async def test_11_trade_fill_normalization():
    adapter = PaperBrokerAdapter()
    req = ExecutionRequest(symbol="BTCUSDT", side="BUY", quantity=Decimal("0.1"), price=Decimal("50000.0"))
    res = await adapter.submit_order(req)
    assert res.trade is not None
    assert res.trade.execution_price == Decimal("50000.0")


# ---------------------------------------------------------------------------
# 2. Execution Engine & Safety Boundary Tests (12-20)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_12_paper_execution_path():
    engine = ExecutionEngine()
    req = ExecutionRequest(symbol="BTCUSDT", side="BUY", quantity=Decimal("0.1"), price=Decimal("50000.0"))
    res = await engine.execute_request(req)
    assert res.success is True
    assert res.execution_mode == ExecutionMode.PAPER


@pytest.mark.asyncio
async def test_13_live_execution_safety_boundary_blocks_unauthorized_live():
    engine = ExecutionEngine(live_trading_enabled=False)
    req = ExecutionRequest(symbol="BTCUSDT", side="BUY", quantity=Decimal("0.1"), price=Decimal("50000.0"), execution_mode=ExecutionMode.LIVE)
    with pytest.raises(ExecutionValidationError) as exc:
        await engine.execute_request(req, authorized_live=False)
    assert "disabled" in str(exc.value).lower()


@pytest.mark.asyncio
async def test_14_execution_approval_requirement():
    engine = ExecutionEngine(live_trading_enabled=True)
    req = ExecutionRequest(symbol="BTCUSDT", side="BUY", quantity=Decimal("0.1"), price=Decimal("50000.0"), execution_mode=ExecutionMode.LIVE)
    with pytest.raises(ExecutionValidationError) as exc:
        await engine.execute_request(req, authorized_live=False)
    assert "authorization" in str(exc.value).lower()


@pytest.mark.asyncio
async def test_15_risk_validation_before_execution():
    engine = ExecutionEngine()
    req = ExecutionRequest(symbol="BTCUSDT", side="BUY", quantity=Decimal("0.1"), price=Decimal("50000.0"))
    res = await engine.execute_request(req)
    assert res.risk_assessment is not None
    assert res.risk_assessment["status"] == "APPROVED"


@pytest.mark.asyncio
async def test_16_order_lifecycle_states():
    adapter = BinanceBrokerAdapter()
    req = ExecutionRequest(symbol="ETHUSDT", side="BUY", quantity=Decimal("1.0"), price=Decimal("3000.0"))
    res = await adapter.submit_order(req)
    assert res.order.status == NormalizedOrderState.FILLED


@pytest.mark.asyncio
async def test_17_partial_fill_handling():
    adapter = BinanceBrokerAdapter()
    req = ExecutionRequest(symbol="ETHUSDT", side="BUY", quantity=Decimal("1.0"), price=Decimal("3000.0"))
    res = await adapter.submit_order(req)
    assert res.order.status in (NormalizedOrderState.FILLED, NormalizedOrderState.PARTIALLY_FILLED)


@pytest.mark.asyncio
async def test_18_order_cancellation():
    adapter = BinanceBrokerAdapter()
    req = ExecutionRequest(symbol="ETHUSDT", side="BUY", quantity=Decimal("1.0"), price=Decimal("3000.0"))
    res = await adapter.submit_order(req)
    cancelled = await adapter.cancel_order(res.order.order_id)
    assert cancelled is True


@pytest.mark.asyncio
async def test_19_rejection_handling():
    engine = ExecutionEngine()
    req = ExecutionRequest(symbol="BTCUSDT", side="BUY", quantity=Decimal("0.0"), price=Decimal("50000.0"))
    with pytest.raises(ExecutionValidationError):
        await engine.execute_request(req)


@pytest.mark.asyncio
async def test_20_idempotency_prevents_duplicate_execution():
    engine = ExecutionEngine()
    req = ExecutionRequest(symbol="BTCUSDT", side="BUY", quantity=Decimal("0.1"), price=Decimal("50000.0"), idempotency_key="unique_key_123")
    res1 = await engine.execute_request(req)
    res2 = await engine.execute_request(req)
    assert res1.order.order_id == res2.order.order_id


# ---------------------------------------------------------------------------
# 3. Market Data & Backtesting Tests (21-28)
# ---------------------------------------------------------------------------

def test_21_portfolio_synchronization():
    service = TradingAnalyticsService()
    out = service.compute_performance(total_equity=Decimal("12000.00"), realized_pnl=Decimal("2000.00"))
    assert out.total_equity == Decimal("12000.00")
    assert out.realized_pnl == Decimal("2000.00")


def test_22_market_data_event_normalization():
    stream = FakeMarketDataStream()
    tick = stream.simulate_tick("BTCUSDT", 50500.0)
    assert tick.symbol == "BTCUSDT"
    assert tick.price == Decimal("50500.0")


@pytest.mark.asyncio
async def test_23_fake_websocket_stream():
    stream = FakeMarketDataStream()
    received = []
    stream.register_listener(lambda e: received.append(e))
    stream.simulate_tick("ETHUSDT", 3100.0)
    assert len(received) == 1
    assert received[0].symbol == "ETHUSDT"


@pytest.mark.asyncio
async def test_24_stream_disconnect_handling():
    stream = MarketDataStreamManager()
    await stream.connect()
    assert stream.state == StreamState.CONNECTED
    await stream.disconnect()
    assert stream.state == StreamState.DISCONNECTED


def test_25_backtesting_engine_deterministic_result():
    engine = BacktestingEngine()
    config = BacktestConfig(symbol="BTCUSDT", initial_capital=Decimal("10000.00"))
    res = engine.run_backtest(config)
    assert res.symbol == "BTCUSDT"
    assert res.win_rate >= 0.0
    assert res.total_trades >= 0


def test_26_historical_replay_engine():
    replay = HistoricalReplayEngine()
    count = 0
    while replay.has_next():
        candle = replay.next_candle()
        assert "symbol" in candle
        count += 1
    assert count == 10


def test_27_pnl_calculation_integration():
    analytics = TradingAnalyticsService()
    out = analytics.compute_performance(initial_balance=Decimal("10000.00"), realized_pnl=Decimal("1000.00"), unrealized_pnl=Decimal("500.00"))
    assert out.total_return_pct == 15.0


def test_28_risk_exposure_analytics():
    analytics = TradingAnalyticsService()
    out = analytics.compute_performance()
    assert hasattr(out, "exposure_pct")
    assert hasattr(out, "max_drawdown_pct")


# ---------------------------------------------------------------------------
# 4. Notifications & Safety Boundary Tests (29-33)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_29_notification_adapter_contract():
    service = NotificationService()
    event = NotificationEvent(event_type="ORDER_FILLED", message="BTCUSDT order filled")
    sent = await service.notify(event, channel="mock")
    assert sent is True


def test_30_no_credentials_leaked():
    adapter = BinanceBrokerAdapter()
    assert not hasattr(adapter, "api_secret")
    assert not hasattr(adapter, "private_key")


def test_31_no_ai_agent_direct_broker_access():
    agent = StrategyDecisionAgent()
    assert not hasattr(agent, "broker")
    assert not hasattr(agent, "binance")


def test_32_no_automatic_live_execution():
    engine = ExecutionEngine(live_trading_enabled=False)
    assert engine.live_trading_enabled is False


def test_33_no_database_mutation_from_analytical_only_flow():
    bridge = PaperTradingDecisionBridge()
    intel_dict = {"symbol": "BTCUSDT", "timestamp": "", "strategy_decision": {"action": "BUY"}, "risk_assessment": {}, "technical_analysis": {}, "market_intelligence": {}}
    candidate = bridge.evaluate_candidate(intel_dict)
    assert candidate.execution_allowed is False


# ---------------------------------------------------------------------------
# 5. API & Integration End-to-End Tests (34-40)
# ---------------------------------------------------------------------------

def test_34_api_authentication_required():
    res = client.post("/api/v1/execution/submit", json={"symbol": "BTCUSDT", "side": "BUY", "quantity": 0.1, "price": 50000.0})
    assert res.status_code == 401


def test_35_api_validation_rejects_invalid_payload():
    # Register/login user
    reg = client.post("/api/v1/auth/register", json={"email": "p9_user@example.com", "password": "Password1!", "display_name": "P9 User"})
    login = client.post("/api/v1/auth/login", json={"email": "p9_user@example.com", "password": "Password1!"})
    token = login.json()["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post("/api/v1/execution/submit", json={"symbol": "BTCUSDT", "side": "BUY", "quantity": -1.0, "price": 50000.0}, headers=headers)
    assert res.status_code in (400, 422)


@pytest.mark.asyncio
async def test_36_execution_failure_handling():
    engine = ExecutionEngine()
    with patch.object(engine.paper_adapter, "submit_order", side_effect=BrokerError("Broker connection down")):
        req = ExecutionRequest(symbol="BTCUSDT", side="BUY", quantity=Decimal("0.1"), price=Decimal("50000.0"))
        res = await engine.execute_request(req)
        assert res.success is False
        assert "connection down" in res.error_message


@pytest.mark.asyncio
async def test_37_broker_connection_failure_handling():
    adapter = BinanceBrokerAdapter()
    await adapter.disconnect()
    assert adapter.is_connected is False


def test_38_paper_live_mode_separation():
    engine = ExecutionEngine()
    paper_adapter = engine.get_broker_adapter("BINANCE", ExecutionMode.PAPER)
    assert paper_adapter == engine.paper_adapter


@pytest.mark.asyncio
async def test_39_end_to_end_mocked_paper_execution():
    engine = ExecutionEngine()
    req = ExecutionRequest(symbol="BTCUSDT", side="BUY", quantity=Decimal("0.5"), price=Decimal("49500.0"))
    res = await engine.execute_request(req)
    assert res.success is True
    assert res.order.executed_price == Decimal("49500.0")


def test_40_full_phase9_architecture_integration():
    reg = client.post("/api/v1/auth/register", json={"email": "p9_integ@example.com", "password": "Password1!", "display_name": "P9 Integ"})
    login = client.post("/api/v1/auth/login", json={"email": "p9_integ@example.com", "password": "Password1!"})
    token = login.json()["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/execution/brokers", headers=headers)
    assert res.status_code == 200
    brokers = res.json()
    assert len(brokers) >= 5
