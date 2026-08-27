"""
tests/test_intelligence_api_contract.py
Deterministic, read-only AI Intelligence API contract hardening and trading safety verification.
"""
import pytest
import pytest_asyncio
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import select

import app.models  # noqa: F401
from app.main import app
from app.models.asset import Asset
from app.models.paper_trading import PaperOrder
from database.session import AsyncSessionLocal

client = TestClient(app)


# ---------------------------------------------------------------------------
# Helpers & Fixtures
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def db_session():
    async with AsyncSessionLocal() as session:
        yield session


async def _seed_asset(session, symbol="BTCUSDT", status="active"):
    stmt = select(Asset).where(Asset.symbol == symbol)
    res = await session.execute(stmt)
    asset = res.scalar_one_or_none()
    if not asset:
        asset = Asset(
            symbol=symbol,
            base_asset=symbol.replace("USDT", ""),
            quote_asset="USDT",
            name=symbol,
            exchange="BINANCE",
            status=status,
        )
        session.add(asset)
        await session.commit()
    return asset


def _register_and_login(email="contract_user@example.com", password="Password1!"):
    payload = {"email": email, "password": password, "display_name": "Contract User"}
    client.post("/api/v1/auth/register", json=payload)
    res = client.post("/api/v1/auth/login", json=payload)
    token = res.json()["tokens"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _mock_pipeline_result(symbol="BTCUSDT"):
    from datetime import datetime, timezone
    return MagicMock(
        symbol=symbol,
        timestamp=datetime.now(timezone.utc).isoformat(),
        technical_analysis={"symbol": symbol, "signal": {"signal": "BUY", "confidence": 0.85}},
        news=[{"title": "Bitcoin surges", "source": "CryptoNews"}],
        sentiment={"symbol": symbol, "score": 0.75},
        market_intelligence={"symbol": symbol, "signal": "BUY", "confidence": 80.0, "final_score": 4.0},
        portfolio_snapshot={"total_value_usd": "15000.00"},
        risk_assessment={"status": "APPROVED", "allowed_trade": True},
        strategy_decision={
            "action": "BUY",
            "symbol": symbol,
            "analytical_only": True,
            "risk_approved": True,
            "confidence": 80.0,
            "risk_status": "APPROVED",
            "reasons": ["Bullish trend confirmed"],
        },
        execution_summary={
            "total_agents": 7,
            "executed": 7,
            "failed": 0,
            "skipped": 0,
            "success_rate": 100.0,
            "duration_ms": 45.0,
        },
    )


# ---------------------------------------------------------------------------
# Contract & Integration Verification Tests
# ---------------------------------------------------------------------------

def test_01_endpoint_exists_and_unauthenticated_returns_401():
    """Verify endpoint exists and enforces authentication."""
    res = client.get("/api/v1/intelligence/BTCUSDT")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_02_authenticated_valid_request_succeeds(db_session):
    """Verify authenticated request returning HTTP 200."""
    await _seed_asset(db_session, "BTCUSDT")
    headers = _register_and_login("contract_t02@example.com")

    with patch("app.api.v1.intelligence.UnifiedIntelligencePipeline") as MockPipeline:
        instance = MockPipeline.return_value
        instance.run.return_value = _mock_pipeline_result("BTCUSDT")
        res = client.get("/api/v1/intelligence/BTCUSDT", headers=headers)

    assert res.status_code == 200


@pytest.mark.asyncio
async def test_03_default_interval_is_1h(db_session):
    """Verify default interval is '1h' when query param is omitted."""
    await _seed_asset(db_session, "BTCUSDT")
    headers = _register_and_login("contract_t03@example.com")

    with patch("app.api.v1.intelligence.UnifiedIntelligencePipeline") as MockPipeline:
        instance = MockPipeline.return_value
        instance.run.return_value = _mock_pipeline_result("BTCUSDT")
        res = client.get("/api/v1/intelligence/BTCUSDT", headers=headers)
        call_kwargs = instance.run.call_args

    assert res.status_code == 200
    assert call_kwargs.kwargs.get("interval") == "1h" or "1h" in call_kwargs.args


@pytest.mark.asyncio
async def test_04_supported_intervals_accepted(db_session):
    """Verify supported intervals (1m, 5m, 15m, 1h, 4h, 1d) are accepted."""
    await _seed_asset(db_session, "BTCUSDT")
    headers = _register_and_login("contract_t04@example.com")

    for interval in ("1m", "5m", "15m", "1h", "4h", "1d"):
        with patch("app.api.v1.intelligence.UnifiedIntelligencePipeline") as MockPipeline:
            instance = MockPipeline.return_value
            instance.run.return_value = _mock_pipeline_result("BTCUSDT")
            res = client.get(f"/api/v1/intelligence/BTCUSDT?interval={interval}", headers=headers)
        assert res.status_code == 200, f"Failed for interval {interval}"


@pytest.mark.asyncio
async def test_05_invalid_interval_rejected_with_400(db_session):
    """Verify unsupported intervals are rejected before pipeline execution."""
    await _seed_asset(db_session, "BTCUSDT")
    headers = _register_and_login("contract_t05@example.com")

    with patch("app.api.v1.intelligence.UnifiedIntelligencePipeline") as MockPipeline:
        res = client.get("/api/v1/intelligence/BTCUSDT?interval=10m", headers=headers)
        # Pipeline must not be constructed or invoked
        MockPipeline.assert_not_called()

    assert res.status_code == 400
    assert "Unsupported interval" in res.text


@pytest.mark.asyncio
async def test_06_invalid_symbol_returns_404(db_session):
    """Verify unknown symbol follows existing 404 behavior."""
    headers = _register_and_login("contract_t06@example.com")
    res = client.get("/api/v1/intelligence/UNKNOWN321", headers=headers)
    assert res.status_code == 404
    assert "not found" in res.text.lower()


@pytest.mark.asyncio
async def test_07_symbol_normalization_to_uppercase(db_session):
    """Verify symbol is normalized to uppercase."""
    await _seed_asset(db_session, "BTCUSDT")
    headers = _register_and_login("contract_t07@example.com")

    with patch("app.api.v1.intelligence.UnifiedIntelligencePipeline") as MockPipeline:
        instance = MockPipeline.return_value
        instance.run.return_value = _mock_pipeline_result("BTCUSDT")
        res = client.get("/api/v1/intelligence/btcusdt", headers=headers)

    assert res.status_code == 200


@pytest.mark.asyncio
async def test_08_unified_intelligence_pipeline_is_invoked(db_session):
    """Verify UnifiedIntelligencePipeline is directly invoked with expected arguments."""
    await _seed_asset(db_session, "ETHUSDT")
    headers = _register_and_login("contract_t08@example.com")

    with patch("app.api.v1.intelligence.UnifiedIntelligencePipeline") as MockPipeline:
        instance = MockPipeline.return_value
        instance.run.return_value = _mock_pipeline_result("ETHUSDT")
        res = client.get("/api/v1/intelligence/ETHUSDT?interval=15m", headers=headers)
        call_kwargs = instance.run.call_args.kwargs

    assert res.status_code == 200
    assert call_kwargs["symbol"] == "ETHUSDT"
    assert call_kwargs["interval"] == "15m"


@pytest.mark.asyncio
async def test_09_unified_intelligence_out_schema_preserved(db_session):
    """Verify response structure preserves all UnifiedIntelligenceOut contract fields."""
    await _seed_asset(db_session, "BTCUSDT")
    headers = _register_and_login("contract_t09@example.com")

    with patch("app.api.v1.intelligence.UnifiedIntelligencePipeline") as MockPipeline:
        from datetime import datetime, timezone
        from app.schemas.intelligence_pipeline import UnifiedIntelligenceOut
        real_out = UnifiedIntelligenceOut(
            symbol="BTCUSDT",
            timestamp=datetime.now(timezone.utc).isoformat(),
            technical_analysis={"symbol": "BTCUSDT"},
            news=[],
            sentiment={"score": 0.8},
            market_intelligence={"signal": "BUY"},
            portfolio_snapshot={"total_value_usd": "10000.00"},
            risk_assessment={"status": "APPROVED"},
            strategy_decision={"action": "BUY"},
            execution_summary={"total_agents": 7, "executed": 7, "failed": 0, "skipped": 0, "success_rate": 100.0, "duration_ms": 10.0},
        )
        instance = MockPipeline.return_value
        instance.run.return_value = real_out
        res = client.get("/api/v1/intelligence/BTCUSDT", headers=headers)

    assert res.status_code == 200
    body = res.json()
    expected_fields = [
        "symbol", "timestamp", "technical_analysis", "news", "sentiment",
        "market_intelligence", "portfolio_snapshot", "risk_assessment",
        "strategy_decision", "execution_summary"
    ]
    for field in expected_fields:
        assert field in body, f"Missing field in response schema: {field}"


@pytest.mark.asyncio
async def test_10_pipeline_failure_returns_500(db_session):
    """Verify pipeline failures raise 500 and are not silently converted to success."""
    await _seed_asset(db_session, "BTCUSDT")
    headers = _register_and_login("contract_t10@example.com")

    with patch("app.api.v1.intelligence.UnifiedIntelligencePipeline") as MockPipeline:
        instance = MockPipeline.return_value
        instance.run.side_effect = RuntimeError("Pipeline execution failure")
        res = client.get("/api/v1/intelligence/BTCUSDT", headers=headers)

    assert res.status_code == 500
    assert "Unified intelligence pipeline failed" in res.text


@pytest.mark.asyncio
async def test_11_trading_safety_no_orders_created(db_session):
    """Verify request to intelligence API creates zero order records in DB."""
    await _seed_asset(db_session, "BTCUSDT")
    headers = _register_and_login("contract_t11@example.com")

    orders_before = (await db_session.execute(select(PaperOrder))).scalars().all()

    with patch("app.api.v1.intelligence.UnifiedIntelligencePipeline") as MockPipeline:
        instance = MockPipeline.return_value
        instance.run.return_value = _mock_pipeline_result("BTCUSDT")
        res = client.get("/api/v1/intelligence/BTCUSDT", headers=headers)

    orders_after = (await db_session.execute(select(PaperOrder))).scalars().all()

    assert res.status_code == 200
    assert len(orders_before) == len(orders_after)


@pytest.mark.asyncio
async def test_12_trading_safety_analytical_only_flag_and_no_execution_service_called(db_session):
    """Verify response signals analytical-only mode and paper trading / execution services are never called."""
    await _seed_asset(db_session, "BTCUSDT")
    headers = _register_and_login("contract_t12@example.com")

    with patch("app.api.v1.intelligence.UnifiedIntelligencePipeline") as MockPipeline, \
         patch("app.services.paper_trading_service.PaperTradingService", autospec=True) as MockPaperService:
        instance = MockPipeline.return_value
        instance.run.return_value = _mock_pipeline_result("BTCUSDT")

        res = client.get("/api/v1/intelligence/BTCUSDT", headers=headers)

        MockPaperService.assert_not_called()

    assert res.status_code == 200
    body = res.json()
    assert body["strategy_decision"]["analytical_only"] is True
