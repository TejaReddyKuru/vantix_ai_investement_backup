"""
tests/test_intelligence_api.py
Deterministic, offline tests for GET /api/v1/intelligence/{symbol}
"""
import pytest
import pytest_asyncio
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import select

import app.models  # noqa: F401
from app.main import app
from app.models.asset import Asset
from database.session import AsyncSessionLocal

client = TestClient(app)


# ---------------------------------------------------------------------------
# Helpers
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


def _register_and_login(email="intel_user@example.com", password="Password1!"):
    payload = {"email": email, "password": password, "display_name": "Intel User"}
    client.post("/api/v1/auth/register", json=payload)
    res = client.post("/api/v1/auth/login", json=payload)
    token = res.json()["tokens"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _mock_pipeline_result(symbol="BTCUSDT"):
    """Return a minimal dict matching UnifiedIntelligenceOut structure."""
    from datetime import datetime, timezone
    return MagicMock(
        symbol=symbol,
        timestamp=datetime.now(timezone.utc).isoformat(),
        technical_analysis={"symbol": symbol, "signal": {"signal": "BUY", "confidence": 0.8}},
        news=[],
        sentiment={"symbol": symbol, "score": 0.5},
        market_intelligence={"symbol": symbol, "signal": "BUY", "confidence": 75.0, "final_score": 3.2},
        portfolio_snapshot={"total_value_usd": "10000.00"},
        risk_assessment={"status": "APPROVED", "allowed_trade": True},
        strategy_decision={"action": "BUY", "symbol": symbol, "analytical_only": True, "risk_approved": True,
                           "confidence": 75.0, "risk_status": "APPROVED", "reasons": []},
        execution_summary={"total_agents": 7, "executed": 7, "failed": 0, "skipped": 0,
                           "success_rate": 100.0, "duration_ms": 50.0},
        model_dump=lambda: {},
    )


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_01_unauthenticated_request_returns_401():
    res = client.get("/api/v1/intelligence/BTCUSDT")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_02_authenticated_valid_request_succeeds(db_session):
    await _seed_asset(db_session, "BTCUSDT")
    headers = _register_and_login("intel_t02@example.com")

    with patch("app.api.v1.intelligence.UnifiedIntelligencePipeline") as MockPipeline:
        instance = MockPipeline.return_value
        instance.run.return_value = _mock_pipeline_result("BTCUSDT")
        res = client.get("/api/v1/intelligence/BTCUSDT", headers=headers)

    assert res.status_code == 200


@pytest.mark.asyncio
async def test_03_valid_symbol_normalised_to_uppercase(db_session):
    await _seed_asset(db_session, "BTCUSDT")
    headers = _register_and_login("intel_t03@example.com")

    with patch("app.api.v1.intelligence.UnifiedIntelligencePipeline") as MockPipeline:
        instance = MockPipeline.return_value
        instance.run.return_value = _mock_pipeline_result("BTCUSDT")
        # Lowercase symbol supplied
        res = client.get("/api/v1/intelligence/btcusdt", headers=headers)

    assert res.status_code == 200


@pytest.mark.asyncio
async def test_04_invalid_symbol_returns_404(db_session):
    headers = _register_and_login("intel_t04@example.com")
    res = client.get("/api/v1/intelligence/XXXXUSDT", headers=headers)
    assert res.status_code == 404
    assert "not found" in res.text.lower()


@pytest.mark.asyncio
async def test_05_inactive_symbol_returns_400(db_session):
    await _seed_asset(db_session, "DOGEUSDT", status="inactive")
    headers = _register_and_login("intel_t05@example.com")
    res = client.get("/api/v1/intelligence/DOGEUSDT", headers=headers)
    assert res.status_code == 400
    assert "inactive" in res.text.lower()


@pytest.mark.asyncio
async def test_06_default_interval_is_1h(db_session):
    await _seed_asset(db_session, "BTCUSDT")
    headers = _register_and_login("intel_t06@example.com")

    with patch("app.api.v1.intelligence.UnifiedIntelligencePipeline") as MockPipeline:
        instance = MockPipeline.return_value
        instance.run.return_value = _mock_pipeline_result("BTCUSDT")
        # No interval param => default 1h
        res = client.get("/api/v1/intelligence/BTCUSDT", headers=headers)
        call_kwargs = instance.run.call_args

    assert res.status_code == 200
    # Verify interval arg defaulted to "1h"
    assert call_kwargs.kwargs.get("interval") == "1h" or "1h" in call_kwargs.args


@pytest.mark.asyncio
async def test_07_valid_interval_4h_accepted(db_session):
    await _seed_asset(db_session, "BTCUSDT")
    headers = _register_and_login("intel_t07@example.com")

    with patch("app.api.v1.intelligence.UnifiedIntelligencePipeline") as MockPipeline:
        instance = MockPipeline.return_value
        instance.run.return_value = _mock_pipeline_result("BTCUSDT")
        res = client.get("/api/v1/intelligence/BTCUSDT?interval=4h", headers=headers)

    assert res.status_code == 200


@pytest.mark.asyncio
async def test_08_invalid_interval_returns_400(db_session):
    await _seed_asset(db_session, "BTCUSDT")
    headers = _register_and_login("intel_t08@example.com")
    res = client.get("/api/v1/intelligence/BTCUSDT?interval=2h", headers=headers)
    assert res.status_code == 400
    assert "Unsupported interval" in res.text


@pytest.mark.asyncio
async def test_09_pipeline_is_invoked_with_correct_symbol(db_session):
    await _seed_asset(db_session, "ETHUSDT")
    headers = _register_and_login("intel_t09@example.com")

    with patch("app.api.v1.intelligence.UnifiedIntelligencePipeline") as MockPipeline:
        instance = MockPipeline.return_value
        instance.run.return_value = _mock_pipeline_result("ETHUSDT")
        client.get("/api/v1/intelligence/ETHUSDT", headers=headers)
        args = instance.run.call_args

    assert "ETHUSDT" in (args.args + tuple(args.kwargs.values()))


@pytest.mark.asyncio
async def test_10_successful_response_schema_keys(db_session):
    await _seed_asset(db_session, "BTCUSDT")
    headers = _register_and_login("intel_t10@example.com")

    with patch("app.api.v1.intelligence.UnifiedIntelligencePipeline") as MockPipeline:
        from datetime import datetime, timezone
        from app.schemas.intelligence_pipeline import UnifiedIntelligenceOut
        real_out = UnifiedIntelligenceOut(
            symbol="BTCUSDT",
            timestamp=datetime.now(timezone.utc).isoformat(),
            technical_analysis={"symbol": "BTCUSDT", "signal": {}},
            news=[],
            sentiment={"symbol": "BTCUSDT"},
            market_intelligence={"symbol": "BTCUSDT", "signal": "HOLD"},
            portfolio_snapshot={"total_value_usd": "10000.00"},
            risk_assessment={"status": "APPROVED"},
            strategy_decision={"action": "HOLD", "symbol": "BTCUSDT", "analytical_only": True,
                               "risk_approved": True, "confidence": 50.0, "risk_status": "APPROVED", "reasons": []},
            execution_summary={"total_agents": 7, "executed": 7, "failed": 0, "skipped": 0,
                               "success_rate": 100.0, "duration_ms": 50.0},
        )
        instance = MockPipeline.return_value
        instance.run.return_value = real_out
        res = client.get("/api/v1/intelligence/BTCUSDT", headers=headers)

    assert res.status_code == 200
    body = res.json()
    for key in ["symbol", "timestamp", "technical_analysis", "news", "sentiment",
                "market_intelligence", "portfolio_snapshot", "risk_assessment",
                "strategy_decision", "execution_summary"]:
        assert key in body, f"Missing key: {key}"


@pytest.mark.asyncio
async def test_11_pipeline_exception_returns_500(db_session):
    await _seed_asset(db_session, "BTCUSDT")
    headers = _register_and_login("intel_t11@example.com")

    with patch("app.api.v1.intelligence.UnifiedIntelligencePipeline") as MockPipeline:
        instance = MockPipeline.return_value
        instance.run.side_effect = RuntimeError("Unexpected internal failure")
        res = client.get("/api/v1/intelligence/BTCUSDT", headers=headers)

    assert res.status_code == 500


@pytest.mark.asyncio
async def test_12_no_order_execution_in_response(db_session):
    await _seed_asset(db_session, "BTCUSDT")
    headers = _register_and_login("intel_t12@example.com")

    with patch("app.api.v1.intelligence.UnifiedIntelligencePipeline") as MockPipeline:
        from datetime import datetime, timezone
        from app.schemas.intelligence_pipeline import UnifiedIntelligenceOut
        real_out = UnifiedIntelligenceOut(
            symbol="BTCUSDT",
            timestamp=datetime.now(timezone.utc).isoformat(),
            strategy_decision={"action": "BUY", "symbol": "BTCUSDT", "analytical_only": True,
                               "risk_approved": True, "confidence": 80.0, "risk_status": "APPROVED", "reasons": []},
            execution_summary={"total_agents": 7, "executed": 7, "failed": 0, "skipped": 0,
                               "success_rate": 100.0, "duration_ms": 50.0},
        )
        instance = MockPipeline.return_value
        instance.run.return_value = real_out
        res = client.get("/api/v1/intelligence/BTCUSDT", headers=headers)

    assert res.status_code == 200
    body = res.json()
    # Verify no execution artifacts in response
    assert "order_id" not in body
    assert "trade_executed" not in body
    strat = body.get("strategy_decision", {})
    assert strat.get("analytical_only") is True


@pytest.mark.asyncio
async def test_13_no_db_mutation_on_pipeline_run(db_session):
    """Pipeline endpoint must not mutate database state."""
    await _seed_asset(db_session, "BTCUSDT")
    headers = _register_and_login("intel_t13@example.com")

    # Count assets before
    before_res = await db_session.execute(select(Asset))
    before_count = len(before_res.scalars().all())

    with patch("app.api.v1.intelligence.UnifiedIntelligencePipeline") as MockPipeline:
        instance = MockPipeline.return_value
        instance.run.return_value = _mock_pipeline_result("BTCUSDT")
        client.get("/api/v1/intelligence/BTCUSDT", headers=headers)

    # Count assets after – should be unchanged
    after_res = await db_session.execute(select(Asset))
    after_count = len(after_res.scalars().all())

    assert before_count == after_count


@pytest.mark.asyncio
async def test_14_all_valid_intervals_accepted(db_session):
    await _seed_asset(db_session, "BTCUSDT")
    headers = _register_and_login("intel_t14@example.com")

    for interval in ("1m", "5m", "15m", "1h", "4h", "1d"):
        with patch("app.api.v1.intelligence.UnifiedIntelligencePipeline") as MockPipeline:
            instance = MockPipeline.return_value
            instance.run.return_value = _mock_pipeline_result("BTCUSDT")
            res = client.get(f"/api/v1/intelligence/BTCUSDT?interval={interval}", headers=headers)
        assert res.status_code == 200, f"Expected 200 for interval '{interval}', got {res.status_code}"


@pytest.mark.asyncio
async def test_15_execution_summary_in_response(db_session):
    await _seed_asset(db_session, "BTCUSDT")
    headers = _register_and_login("intel_t15@example.com")

    with patch("app.api.v1.intelligence.UnifiedIntelligencePipeline") as MockPipeline:
        from datetime import datetime, timezone
        from app.schemas.intelligence_pipeline import UnifiedIntelligenceOut
        real_out = UnifiedIntelligenceOut(
            symbol="BTCUSDT",
            timestamp=datetime.now(timezone.utc).isoformat(),
            execution_summary={"total_agents": 7, "executed": 7, "failed": 0, "skipped": 0,
                               "success_rate": 100.0, "duration_ms": 42.0},
        )
        instance = MockPipeline.return_value
        instance.run.return_value = real_out
        res = client.get("/api/v1/intelligence/BTCUSDT", headers=headers)

    assert res.status_code == 200
    summary = res.json()["execution_summary"]
    assert summary["total_agents"] == 7
    assert summary["executed"] == 7
    assert summary["failed"] == 0
    assert summary["success_rate"] == 100.0
