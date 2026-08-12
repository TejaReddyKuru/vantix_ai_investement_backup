import pytest
from unittest.mock import MagicMock

from app.agents.base_agent import BaseAgent
from app.agents.context import AgentContext
from app.agents.orchestrator import AgentOrchestrator
from app.agents.pipeline import UnifiedIntelligencePipeline
from app.agents.registry import AgentRegistry
from app.schemas.intelligence_pipeline import UnifiedIntelligenceOut


def test_01_pipeline_initialization():
    pipeline = UnifiedIntelligencePipeline()
    assert isinstance(pipeline.registry, AgentRegistry)
    assert isinstance(pipeline.orchestrator, AgentOrchestrator)


def test_02_registry_integration_auto_registration():
    pipeline = UnifiedIntelligencePipeline()
    discovered = pipeline.registry.discover()

    assert "TechnicalAgent" in discovered
    assert "NewsAgent" in discovered
    assert "SentimentAgent" in discovered
    assert "PortfolioAgent" in discovered
    assert "RiskAgent" in discovered
    assert "MarketAgent" in discovered
    assert "StrategyDecisionAgent" in discovered


def test_03_all_seven_agents_available():
    pipeline = UnifiedIntelligencePipeline()
    agents = pipeline.registry.list()
    assert len(agents) == 7


def test_04_pipeline_run_returns_schema():
    pipeline = UnifiedIntelligencePipeline()
    output = pipeline.run(symbol="BTCUSDT", interval="1h")

    assert isinstance(output, UnifiedIntelligenceOut)
    assert output.symbol == "BTCUSDT"
    assert output.timestamp is not None


def test_05_technical_result_propagated():
    pipeline = UnifiedIntelligencePipeline()
    output = pipeline.run(symbol="BTCUSDT")

    assert output.technical_analysis is not None
    assert output.technical_analysis["symbol"] == "BTCUSDT"
    assert "signal" in output.technical_analysis


def test_06_news_result_propagated():
    pipeline = UnifiedIntelligencePipeline()
    output = pipeline.run(symbol="ETHUSDT")

    assert output.news is not None
    assert isinstance(output.news, list)


def test_07_sentiment_result_propagated():
    pipeline = UnifiedIntelligencePipeline()
    output = pipeline.run(symbol="SOLUSDT")

    assert output.sentiment is not None
    assert output.sentiment["symbol"] == "SOLUSDT"


def test_08_market_intelligence_propagated():
    pipeline = UnifiedIntelligencePipeline()
    output = pipeline.run(symbol="BTCUSDT")

    assert output.market_intelligence is not None
    assert output.market_intelligence["symbol"] == "BTCUSDT"
    assert "signal" in output.market_intelligence


def test_09_portfolio_snapshot_propagated():
    pipeline = UnifiedIntelligencePipeline()
    output = pipeline.run(symbol="BTCUSDT")

    assert output.portfolio_snapshot is not None
    assert "total_value_usd" in output.portfolio_snapshot


def test_10_risk_assessment_propagated():
    pipeline = UnifiedIntelligencePipeline()
    output = pipeline.run(symbol="BTCUSDT")

    assert output.risk_assessment is not None
    assert output.risk_assessment["status"] == "APPROVED"


def test_11_strategy_decision_propagated():
    pipeline = UnifiedIntelligencePipeline()
    output = pipeline.run(symbol="BNBUSDT")

    assert output.strategy_decision is not None
    assert output.strategy_decision["symbol"] == "BNBUSDT"
    assert output.strategy_decision["action"] in ["BUY", "SELL", "HOLD"]
    assert output.strategy_decision["analytical_only"] is True


def test_12_unified_output_structure_dict():
    pipeline = UnifiedIntelligencePipeline()
    output = pipeline.run(symbol="BTCUSDT")
    dump = output.model_dump()

    required_keys = [
        "symbol",
        "timestamp",
        "technical_analysis",
        "news",
        "sentiment",
        "market_intelligence",
        "portfolio_snapshot",
        "risk_assessment",
        "strategy_decision",
        "execution_summary",
    ]
    for key in required_keys:
        assert key in dump


def test_13_successful_execution_summary():
    pipeline = UnifiedIntelligencePipeline()
    output = pipeline.run(symbol="BTCUSDT")
    summary = output.execution_summary

    assert summary["total_agents"] == 7
    assert summary["executed"] == 7
    assert summary["failed"] == 0
    assert summary["skipped"] == 0
    assert summary["success_rate"] == 100.0
    assert summary["duration_ms"] >= 0.0


def test_14_agent_failure_isolation():
    pipeline = UnifiedIntelligencePipeline()

    class FailingCustomAgent(BaseAgent):
        name = "FailingCustomAgent"
        dependencies = []

        def execute(self, ctx: AgentContext):
            raise ValueError("Forced error")

    pipeline.registry.register(FailingCustomAgent())
    output = pipeline.run(symbol="BTCUSDT")

    summary = output.execution_summary
    assert summary["total_agents"] == 8
    assert summary["executed"] == 7
    assert summary["failed"] == 1
    # Core outputs should still be present despite the isolated failure
    assert output.strategy_decision is not None


def test_15_no_trading_order_execution():
    pipeline = UnifiedIntelligencePipeline()
    output = pipeline.run(symbol="BTCUSDT")
    dump = output.model_dump()

    # Verify no execution actions or transactions were issued
    assert "order_id" not in dump
    assert "trade_executed" not in dump
    assert output.strategy_decision.get("analytical_only") is True


def test_16_custom_context_passing_and_kwargs():
    pipeline = UnifiedIntelligencePipeline()
    custom_ctx = AgentContext(symbol="XRPUSDT", interval="4h", custom_param="test")

    output = pipeline.run(context=custom_ctx)
    assert output.symbol == "XRPUSDT"
    assert output.technical_analysis["interval"] == "4h"
