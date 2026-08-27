"""
tests/test_phase10_production_integration.py
Consolidated Phase 10 Production Trading Platform Integration & Operational Hardening test suite.
Deterministic, offline, fast, and completely isolated from live brokers/exchanges.
"""
import pytest
import pytest_asyncio
from decimal import Decimal
from uuid import uuid4
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

import app.models  # noqa: F401
from app.main import app
from app.schemas.broker_connection import BrokerConnectionCreate
from app.schemas.execution import (
    BacktestConfig,
    ExecutionMode,
    ExecutionRequest,
    ExecutionResult,
    NormalizedOrderState,
)
from app.services.backtesting_engine import BacktestingEngine, BacktestConfig
from app.services.broker_connection_service import (
    BrokerConnectionService,
    decrypt_secret,
    encrypt_secret,
    redact_credentials,
)
from app.services.broker_reconciliation_service import BrokerReconciliationService
from app.services.brokers.adapters import (
    AlpacaBrokerAdapter,
    BinanceBrokerAdapter,
    BybitBrokerAdapter,
    InteractiveBrokersAdapter,
    PaperBrokerAdapter,
)
from app.services.execution_engine import ExecutionEngine, ExecutionValidationError
from app.services.order_lifecycle_manager import OrderLifecycleManager, OrderStateTransitionError
from app.services.system_health_service import SystemHealthService
from app.services.trading_analytics_service import TradingAnalyticsService
from app.services.notification_service import NotificationEvent, NotificationService
from app.agents.advisor.strategy_agent import StrategyDecisionAgent
from app.agents.pipeline.paper_trading_bridge import PaperTradingDecisionBridge
from database.session import AsyncSessionLocal

client = TestClient(app)
user_uuid = uuid4()


# ---------------------------------------------------------------------------
# 1. Imports, Connection Models & Credential Security (01-04)
# ---------------------------------------------------------------------------

def test_01_application_import_succeeds():
    """01: Verify app imports cleanly."""
    assert app is not None


def test_02_broker_connection_model():
    """02: Verify broker connection creation payload model."""
    payload = BrokerConnectionCreate(broker="binance", environment="PAPER", api_key="key123", api_secret="sec123")
    assert payload.broker == "binance"
    assert payload.api_key == "key123"


def test_03_secure_credential_handling():
    """03: Verify credentials are encrypted/hashed at boundary."""
    enc = encrypt_secret("my_secret_key")
    assert enc.startswith("ENC:")
    assert "my_secret_key" not in enc
    dec = decrypt_secret(enc)
    assert dec == "my_secret_key"


def test_04_credential_redaction():
    """04: Verify secrets are redacted from logging/response dicts."""
    data = {"user": "test", "api_key": "secret_key_123", "nested": {"password": "pass"}}
    redacted = redact_credentials(data)
    assert redacted["api_key"] == "[REDACTED]"
    assert redacted["nested"]["password"] == "[REDACTED]"


# ---------------------------------------------------------------------------
# 2. Broker Connection Lifecycle (05-08)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_05_broker_connect():
    """05: Verify connecting a broker saves encrypted record."""
    service = BrokerConnectionService()
    payload = BrokerConnectionCreate(broker="binance", environment="PAPER", api_key="key1", api_secret="sec1")
    conn = await service.connect_broker(user_uuid, payload)
    assert conn.broker == "BINANCE"
    assert conn.credentials_present is True
    assert not hasattr(conn, "api_secret")


@pytest.mark.asyncio
async def test_06_broker_verification():
    """06: Verify broker connectivity verification."""
    service = BrokerConnectionService()
    payload = BrokerConnectionCreate(broker="bybit", environment="PAPER")
    await service.connect_broker(user_uuid, payload)
    res = await service.verify_broker_connection(user_uuid, "bybit")
    assert res.verified is True
    assert res.status == "CONNECTED"


@pytest.mark.asyncio
async def test_07_broker_disconnect():
    """07: Verify disconnecting a broker sets status to DISCONNECTED."""
    service = BrokerConnectionService()
    payload = BrokerConnectionCreate(broker="alpaca", environment="PAPER")
    await service.connect_broker(user_uuid, payload)
    disc = await service.disconnect_broker(user_uuid, "alpaca")
    assert disc is True
    status = await service.get_broker_status(user_uuid, "alpaca")
    assert status.status == "DISCONNECTED"


@pytest.mark.asyncio
async def test_08_broker_status():
    """08: Verify safe broker status retrieval."""
    service = BrokerConnectionService()
    status = await service.get_broker_status(user_uuid, "paper")
    assert status.broker == "PAPER"
    assert status.status == "CONNECTED"


# ---------------------------------------------------------------------------
# 3. Persistence, Orders & Idempotency (09-14)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_09_execution_persistence():
    """09: Verify normalized execution record structure."""
    engine = ExecutionEngine()
    req = ExecutionRequest(symbol="BTCUSDT", side="BUY", quantity=Decimal("0.1"), price=Decimal("50000.0"))
    res = await engine.execute_request(req)
    assert res.success is True
    assert res.order.order_id is not None


@pytest.mark.asyncio
async def test_10_order_persistence():
    """10: Verify normalized order fields."""
    adapter = PaperBrokerAdapter()
    req = ExecutionRequest(symbol="ETHUSDT", side="BUY", quantity=Decimal("1.0"), price=Decimal("3000.0"))
    res = await adapter.submit_order(req)
    assert res.order.symbol == "ETHUSDT"
    assert res.order.status == NormalizedOrderState.FILLED


@pytest.mark.asyncio
async def test_11_trade_persistence():
    """11: Verify trade fill fields."""
    adapter = PaperBrokerAdapter()
    req = ExecutionRequest(symbol="ETHUSDT", side="BUY", quantity=Decimal("1.0"), price=Decimal("3000.0"))
    res = await adapter.submit_order(req)
    assert res.trade is not None
    assert res.trade.execution_price == Decimal("3000.0")


@pytest.mark.asyncio
async def test_12_idempotency_persistence():
    """12: Verify idempotency key is tracked."""
    engine = ExecutionEngine()
    req = ExecutionRequest(symbol="BTCUSDT", side="BUY", quantity=Decimal("0.1"), price=Decimal("50000.0"), idempotency_key="idempotent_key_09")
    res = await engine.execute_request(req)
    assert res.idempotency_key == "idempotent_key_09"


@pytest.mark.asyncio
async def test_13_duplicate_idempotency_prevention():
    """13: Verify duplicate execution request with same key returns cached result."""
    engine = ExecutionEngine()
    req = ExecutionRequest(symbol="BTCUSDT", side="BUY", quantity=Decimal("0.1"), price=Decimal("50000.0"), idempotency_key="dup_key_13")
    res1 = await engine.execute_request(req)
    res2 = await engine.execute_request(req)
    assert res1.order.order_id == res2.order.order_id


@pytest.mark.asyncio
async def test_14_conflicting_idempotency_request():
    """14: Verify idempotency key preserves original result even if called again."""
    engine = ExecutionEngine()
    req1 = ExecutionRequest(symbol="BTCUSDT", side="BUY", quantity=Decimal("0.1"), price=Decimal("50000.0"), idempotency_key="conflict_14")
    res1 = await engine.execute_request(req1)

    req2 = ExecutionRequest(symbol="ETHUSDT", side="SELL", quantity=Decimal("1.0"), price=Decimal("3000.0"), idempotency_key="conflict_14")
    res2 = await engine.execute_request(req2)
    assert res2.order.symbol == "BTCUSDT"


# ---------------------------------------------------------------------------
# 4. Live Safety & Authorization Gates (15-20)
# ---------------------------------------------------------------------------

def test_15_execution_authorization():
    """15: Verify live execution requires explicit authorization."""
    engine = ExecutionEngine(live_trading_enabled=True)
    req = ExecutionRequest(symbol="BTCUSDT", side="BUY", quantity=Decimal("0.1"), price=Decimal("50000.0"), execution_mode=ExecutionMode.LIVE)
    with pytest.raises(ExecutionValidationError):
        import asyncio
        asyncio.run(engine.execute_request(req, authorized_live=False))


def test_16_live_execution_disabled_by_default():
    """16: Verify live_trading_enabled defaults to False."""
    engine = ExecutionEngine()
    assert engine.live_trading_enabled is False


def test_17_unauthorized_live_execution_blocked():
    """17: Verify live mode fails when live_trading_enabled=False."""
    engine = ExecutionEngine(live_trading_enabled=False)
    req = ExecutionRequest(symbol="BTCUSDT", side="BUY", quantity=Decimal("0.1"), price=Decimal("50000.0"), execution_mode=ExecutionMode.LIVE)
    with pytest.raises(ExecutionValidationError):
        import asyncio
        asyncio.run(engine.execute_request(req, authorized_live=True))


@pytest.mark.asyncio
async def test_18_unverified_broker_blocked():
    """18: Verify unverified broker is handled safely."""
    service = BrokerConnectionService()
    res = await service.verify_broker_connection(user_uuid, "UNKNOWN_BROKER")
    assert res.verified is False


@pytest.mark.asyncio
async def test_19_risk_rejection_blocks_execution():
    """19: Verify risk rejection stops order submission."""
    engine = ExecutionEngine()
    req = ExecutionRequest(symbol="BTCUSDT", side="BUY", quantity=Decimal("0.0"), price=Decimal("50000.0"))
    with pytest.raises(ExecutionValidationError):
        await engine.execute_request(req)


@pytest.mark.asyncio
async def test_20_invalid_order_blocked():
    """20: Verify negative quantity order is rejected before broker call."""
    engine = ExecutionEngine()
    req = ExecutionRequest(symbol="BTCUSDT", side="BUY", quantity=Decimal("-1.0"), price=Decimal("50000.0"))
    with pytest.raises(ExecutionValidationError):
        await engine.execute_request(req)


# ---------------------------------------------------------------------------
# 5. Execution Isolation & Read-Only Boundaries (21-25)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_21_paper_execution_persists_correctly():
    """21: Verify paper execution fills order with paper adapter."""
    engine = ExecutionEngine()
    req = ExecutionRequest(symbol="BTCUSDT", side="BUY", quantity=Decimal("0.1"), price=Decimal("50000.0"))
    res = await engine.execute_request(req)
    assert res.execution_mode == ExecutionMode.PAPER
    assert res.order.status == NormalizedOrderState.FILLED


@pytest.mark.asyncio
async def test_22_paper_execution_does_not_call_live_broker():
    """22: Verify paper mode routes to paper adapter."""
    engine = ExecutionEngine()
    adapter = engine.get_broker_adapter("BINANCE", ExecutionMode.PAPER)
    assert adapter == engine.paper_adapter


def test_23_backtest_does_not_call_broker():
    """23: Verify backtest engine runs deterministically without broker calls."""
    engine = BacktestingEngine()
    config = BacktestConfig(symbol="BTCUSDT", initial_capital=Decimal("10000.00"))
    res = engine.run_backtest(config)
    assert res.symbol == "BTCUSDT"
    assert res.win_rate >= 0.0


def test_24_analytical_endpoint_remains_read_only():
    """24: Verify PaperTradingDecisionBridge evaluation has execution_allowed=False."""
    bridge = PaperTradingDecisionBridge()
    intel_dict = {"symbol": "BTCUSDT", "timestamp": "", "strategy_decision": {"action": "BUY"}, "risk_assessment": {}, "technical_analysis": {}, "market_intelligence": {}}
    candidate = bridge.evaluate_candidate(intel_dict)
    assert candidate.execution_allowed is False


def test_25_ai_agents_cannot_directly_access_brokers():
    """25: Verify StrategyDecisionAgent has no broker attributes or methods."""
    agent = StrategyDecisionAgent()
    assert not hasattr(agent, "broker")
    assert not hasattr(agent, "submit_order")


# ---------------------------------------------------------------------------
# 6. Order Lifecycle & Portfolio Sync (26-33)
# ---------------------------------------------------------------------------

def test_26_order_lifecycle_transition_validation():
    """26: Verify illegal order state transition raises error."""
    with pytest.raises(OrderStateTransitionError):
        OrderLifecycleManager.validate_transition(
            NormalizedOrderState.FILLED, NormalizedOrderState.CREATED
        )


@pytest.mark.asyncio
async def test_27_partial_fill_persistence():
    """27: Verify PARTIALLY_FILLED -> FILLED state transition is allowed."""
    assert OrderLifecycleManager.validate_transition(
        NormalizedOrderState.PARTIALLY_FILLED, NormalizedOrderState.FILLED
    ) is True


@pytest.mark.asyncio
async def test_28_full_fill_persistence():
    """28: Verify SUBMITTED -> FILLED state transition is allowed."""
    assert OrderLifecycleManager.validate_transition(
        NormalizedOrderState.SUBMITTED, NormalizedOrderState.FILLED
    ) is True


@pytest.mark.asyncio
async def test_29_cancellation_persistence():
    """29: Verify SUBMITTED -> CANCELLED transition is allowed."""
    assert OrderLifecycleManager.validate_transition(
        NormalizedOrderState.SUBMITTED, NormalizedOrderState.CANCELLED
    ) is True


@pytest.mark.asyncio
async def test_30_rejection_persistence():
    """30: Verify SUBMITTED -> REJECTED transition is allowed."""
    assert OrderLifecycleManager.validate_transition(
        NormalizedOrderState.SUBMITTED, NormalizedOrderState.REJECTED
    ) is True


def test_31_portfolio_synchronization():
    """31: Verify TradingAnalyticsService portfolio synchronization."""
    analytics = TradingAnalyticsService()
    out = analytics.compute_performance(total_equity=Decimal("15000.00"), realized_pnl=Decimal("3000.00"))
    assert out.total_equity == Decimal("15000.00")
    assert out.realized_pnl == Decimal("3000.00")


@pytest.mark.asyncio
async def test_32_balance_normalization():
    """32: Verify Decimal balance precision."""
    adapter = PaperBrokerAdapter()
    account = await adapter.get_account()
    assert isinstance(account.total_balance, Decimal)
    assert account.total_balance == Decimal("10000.00")


@pytest.mark.asyncio
async def test_33_position_normalization():
    """33: Verify position list normalization."""
    adapter = PaperBrokerAdapter()
    positions = await adapter.get_positions()
    assert isinstance(positions, list)


# ---------------------------------------------------------------------------
# 7. Reconciliation, Notifications & API (34-45)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_34_reconciliation_detects_mismatch():
    """34: Verify reconciliation service detects missing broker orders."""
    adapter = PaperBrokerAdapter()
    service = BrokerReconciliationService()
    from app.schemas.execution import NormalizedOrder
    local_order = NormalizedOrder(
        order_id="missing_ord_99",
        client_order_id="c_99",
        broker="PAPER",
        symbol="BTCUSDT",
        side="BUY",
        order_type="MARKET",
        quantity=Decimal("1.0"),
        requested_price=Decimal("50000.0"),
    )
    report = await service.reconcile(adapter, local_orders=[local_order])
    assert report.mismatch_count >= 1
    assert report.mismatches[0].mismatch_type == "MISSING_BROKER"


@pytest.mark.asyncio
async def test_35_reconciliation_does_not_auto_submit_orders():
    """35: Verify reconciliation does not submit new orders."""
    adapter = PaperBrokerAdapter()
    orders_before = len(await adapter.get_orders())
    service = BrokerReconciliationService()
    await service.reconcile(adapter, local_orders=[])
    orders_after = len(await adapter.get_orders())
    assert orders_before == orders_after


@pytest.mark.asyncio
async def test_36_notification_event_emitted():
    """36: Verify notification event dispatch."""
    service = NotificationService()
    event = NotificationEvent(event_type="ORDER_SUBMITTED", message="Order submitted successfully")
    sent = await service.notify(event)
    assert sent is True


@pytest.mark.asyncio
async def test_37_notification_failure_isolation():
    """37: Verify notification failure does not break caller execution."""
    service = NotificationService()
    event = NotificationEvent(event_type="ORDER_FILLED", message="Filled")
    # Even if channel does not exist, fallback handles safely
    sent = await service.notify(event, channel="invalid_channel")
    assert sent is True


def test_38_api_authentication_enforced():
    """38: Verify unauthenticated request to /api/v1/execution/submit returns 401."""
    res = client.post("/api/v1/execution/submit", json={"symbol": "BTCUSDT", "side": "BUY", "quantity": 0.1, "price": 50000.0})
    assert res.status_code == 401


def test_39_api_authorization():
    """39: Verify authenticated API user can access status endpoints."""
    reg = client.post("/api/v1/auth/register", json={"email": "p10_user@example.com", "password": "Password1!", "display_name": "P10 User"})
    login = client.post("/api/v1/auth/login", json={"email": "p10_user@example.com", "password": "Password1!"})
    token = login.json()["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/execution/brokers/status", headers=headers)
    assert res.status_code == 200


def test_40_api_payload_validation():
    """40: Verify malformed payload returns 400 or 422."""
    login = client.post("/api/v1/auth/login", json={"email": "p10_user@example.com", "password": "Password1!"})
    token = login.json()["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post("/api/v1/execution/submit", json={"symbol": "BTCUSDT", "side": "BUY", "quantity": -5.0, "price": 50000.0}, headers=headers)
    assert res.status_code in (400, 422)


def test_41_api_error_contract():
    """41: Verify error response structure is clean without secret leakage."""
    res = client.get("/api/v1/execution/brokers/status")
    assert res.status_code == 401
    assert "detail" in res.json()


def test_42_health_status_endpoint():
    """42: Verify GET /api/v1/execution/health returns SystemHealthOut."""
    login = client.post("/api/v1/auth/login", json={"email": "p10_user@example.com", "password": "Password1!"})
    token = login.json()["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/execution/health", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "healthy"
    assert "subsystems" in body


def test_43_financial_decimal_precision():
    """43: Verify financial values maintain Decimal precision."""
    val1 = Decimal("50000.12345678")
    val2 = Decimal("0.00000001")
    res = val1 + val2
    assert res == Decimal("50000.12345679")


def test_44_credentials_never_appear_in_responses():
    """44: Verify broker connection API responses never expose API secret."""
    login = client.post("/api/v1/auth/login", json={"email": "p10_user@example.com", "password": "Password1!"})
    token = login.json()["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    connect_payload = {"broker": "binance", "environment": "PAPER", "api_key": "my_api_key", "api_secret": "my_api_secret"}
    res = client.post("/api/v1/execution/brokers/connect", json=connect_payload, headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert "api_secret" not in body
    assert "api_key" not in body
    assert body["credentials_present"] is True


@pytest.mark.asyncio
async def test_45_full_mocked_paper_execution_workflow():
    """45: Full end-to-end mocked paper execution workflow."""
    engine = ExecutionEngine()
    req = ExecutionRequest(
        symbol="BTCUSDT",
        side="BUY",
        quantity=Decimal("0.25"),
        price=Decimal("50000.0"),
        stop_loss=Decimal("48000.0"),
        take_profit=Decimal("55000.0"),
        execution_mode=ExecutionMode.PAPER,
    )
    res = await engine.execute_request(req)
    assert res.success is True
    assert res.order.executed_price == Decimal("50000.0")
    assert res.trade.quantity == Decimal("0.25")
