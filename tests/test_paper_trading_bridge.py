"""
tests/test_paper_trading_bridge.py
Deterministic, offline tests for PaperTradingDecisionBridge.
Verifies safety boundary between AI intelligence pipeline and paper trading execution.
"""
import pytest
import pytest_asyncio
from unittest.mock import patch, MagicMock
from sqlalchemy import select

import app.models  # noqa: F401
from app.agents.pipeline.paper_trading_bridge import PaperTradingDecisionBridge
from app.schemas.intelligence_pipeline import UnifiedIntelligenceOut
from app.schemas.paper_trading_decision import PaperTradingDecisionOut
from app.models.paper_trading import PaperOrder, PaperAccount
from database.session import AsyncSessionLocal


@pytest_asyncio.fixture
async def db_session():
    async with AsyncSessionLocal() as session:
        yield session


def _create_sample_intelligence(
    symbol="BTCUSDT",
    action="BUY",
    confidence=85.0,
    risk_approved=True,
    risk_status="APPROVED",
    entry_price=50000.0,
    stop_loss=48000.0,
    take_profit=55000.0,
):
    from datetime import datetime, timezone
    return UnifiedIntelligenceOut(
        symbol=symbol,
        timestamp=datetime.now(timezone.utc).isoformat(),
        technical_analysis={
            "symbol": symbol,
            "signal": {
                "signal": action,
                "confidence": confidence / 100.0,
                "price": entry_price,
                "stop_loss": stop_loss,
                "take_profit": take_profit,
            },
        },
        news=[],
        sentiment={"symbol": symbol, "score": 0.8},
        market_intelligence={"symbol": symbol, "signal": action, "confidence": confidence},
        portfolio_snapshot={"total_value_usd": "10000.00"},
        risk_assessment={
            "status": risk_status,
            "allowed_trade": risk_approved,
            "stop_loss": stop_loss,
            "take_profit": take_profit,
        },
        strategy_decision={
            "action": action,
            "symbol": symbol,
            "confidence": confidence,
            "risk_approved": risk_approved,
            "risk_status": risk_status,
            "analytical_only": True,
            "reasons": ["Technical trend is bullish", "Risk checks passed"],
        },
        execution_summary={"total_agents": 7, "executed": 7, "failed": 0, "duration_ms": 35.0},
    )


def test_01_bridge_initializes_correctly():
    """Verify PaperTradingDecisionBridge initializes cleanly."""
    bridge = PaperTradingDecisionBridge()
    assert bridge is not None


def test_02_valid_intelligence_result_produces_candidate():
    """Verify evaluating valid intelligence returns a PaperTradingDecisionOut instance."""
    bridge = PaperTradingDecisionBridge()
    intel = _create_sample_intelligence()
    candidate = bridge.evaluate_candidate(intel)
    assert isinstance(candidate, PaperTradingDecisionOut)


def test_03_symbol_is_preserved():
    """Verify symbol is accurately preserved in decision candidate."""
    bridge = PaperTradingDecisionBridge()
    intel = _create_sample_intelligence(symbol="ETHUSDT")
    candidate = bridge.evaluate_candidate(intel)
    assert candidate.symbol == "ETHUSDT"


def test_04_strategy_direction_is_preserved():
    """Verify strategy action direction (BUY/SELL/HOLD) is preserved."""
    bridge = PaperTradingDecisionBridge()
    intel_buy = _create_sample_intelligence(action="BUY")
    candidate_buy = bridge.evaluate_candidate(intel_buy)
    assert candidate_buy.direction == "BUY"

    intel_sell = _create_sample_intelligence(action="SELL")
    candidate_sell = bridge.evaluate_candidate(intel_sell)
    assert candidate_sell.direction == "SELL"


def test_05_confidence_is_preserved():
    """Verify strategy decision confidence score is preserved."""
    bridge = PaperTradingDecisionBridge()
    intel = _create_sample_intelligence(confidence=92.5)
    candidate = bridge.evaluate_candidate(intel)
    assert candidate.confidence == 92.5


def test_06_risk_assessment_is_preserved():
    """Verify risk assessment metadata is present in candidate."""
    bridge = PaperTradingDecisionBridge()
    intel = _create_sample_intelligence(risk_status="APPROVED")
    candidate = bridge.evaluate_candidate(intel)
    assert candidate.risk_assessment is not None
    assert candidate.risk_assessment["status"] == "APPROVED"


def test_07_suggested_entry_data_preserved_when_available():
    """Verify suggested entry price is extracted and preserved."""
    bridge = PaperTradingDecisionBridge()
    intel = _create_sample_intelligence(entry_price=51250.0)
    candidate = bridge.evaluate_candidate(intel)
    assert candidate.suggested_entry == 51250.0


def test_08_stop_loss_and_take_profit_preserved_when_available():
    """Verify stop loss and take profit values are preserved."""
    bridge = PaperTradingDecisionBridge()
    intel = _create_sample_intelligence(stop_loss=47500.0, take_profit=56000.0)
    candidate = bridge.evaluate_candidate(intel)
    assert candidate.suggested_stop_loss == 47500.0
    assert candidate.suggested_take_profit == 56000.0


def test_09_reasoning_is_preserved():
    """Verify analytical reasons list is preserved in candidate."""
    bridge = PaperTradingDecisionBridge()
    intel = _create_sample_intelligence()
    candidate = bridge.evaluate_candidate(intel)
    assert len(candidate.reasoning) >= 2
    assert "Technical trend is bullish" in candidate.reasoning


def test_10_execution_allowed_is_always_false():
    """Verify safety boundary flag execution_allowed is hardcoded to False."""
    bridge = PaperTradingDecisionBridge()
    intel = _create_sample_intelligence(action="BUY", confidence=100.0, risk_approved=True)
    candidate = bridge.evaluate_candidate(intel)
    assert candidate.execution_allowed is False


def test_11_unsafe_rejected_strategy_cannot_become_executable():
    """Verify strategy rejected by risk checks produces status REJECTED and execution_allowed False."""
    bridge = PaperTradingDecisionBridge()
    intel = _create_sample_intelligence(action="BUY", risk_approved=False, risk_status="REJECTED")
    candidate = bridge.evaluate_candidate(intel)
    assert candidate.status == "REJECTED"
    assert candidate.execution_allowed is False


def test_12_missing_strategy_decision_is_handled_cleanly():
    """Verify intelligence output missing strategy decision returns INVALID status candidate."""
    bridge = PaperTradingDecisionBridge()
    from datetime import datetime, timezone
    intel = UnifiedIntelligenceOut(
        symbol="BTCUSDT",
        timestamp=datetime.now(timezone.utc).isoformat(),
        strategy_decision=None,
        execution_summary={"total_agents": 7, "executed": 7, "failed": 0, "duration_ms": 10.0},
    )
    candidate = bridge.evaluate_candidate(intel)
    assert candidate.status == "INVALID"
    assert candidate.direction == "HOLD"
    assert candidate.execution_allowed is False


def test_13_paper_trading_service_not_automatically_invoked():
    """Verify PaperTradingService is NEVER invoked when evaluating bridge candidate."""
    bridge = PaperTradingDecisionBridge()
    intel = _create_sample_intelligence()

    with patch("app.services.paper_trading_service.PaperTradingService") as MockService:
        candidate = bridge.evaluate_candidate(intel)
        MockService.assert_not_called()

    assert candidate.execution_allowed is False


@pytest.mark.asyncio
async def test_14_no_order_created_in_database(db_session):
    """Verify no PaperOrder records are created in database by bridge evaluation."""
    bridge = PaperTradingDecisionBridge()
    intel = _create_sample_intelligence()

    orders_before = (await db_session.execute(select(PaperOrder))).scalars().all()
    candidate = bridge.evaluate_candidate(intel)
    orders_after = (await db_session.execute(select(PaperOrder))).scalars().all()

    assert candidate is not None
    assert len(orders_before) == len(orders_after)


@pytest.mark.asyncio
async def test_15_no_database_mutation_occurs(db_session):
    """Verify bridge evaluation is pure/read-only with zero DB mutations."""
    bridge = PaperTradingDecisionBridge()
    intel = _create_sample_intelligence()

    accounts_before = (await db_session.execute(select(PaperAccount))).scalars().all()
    candidate = bridge.evaluate_candidate(intel)
    accounts_after = (await db_session.execute(select(PaperAccount))).scalars().all()

    assert candidate is not None
    assert len(accounts_before) == len(accounts_after)
