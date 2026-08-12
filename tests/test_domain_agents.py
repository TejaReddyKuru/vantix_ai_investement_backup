import pytest
from typing import Any, Dict
from unittest.mock import MagicMock

from app.agents.base_agent import BaseAgent
from app.agents.context import AgentContext
from app.agents.orchestrator import AgentOrchestrator
from app.agents.registry import AgentRegistry

from app.agents.technical_analysis.technical_agent import TechnicalAgent
from app.agents.news_analysis.news_agent import NewsAgent
from app.agents.sentiment_analysis.sentiment_agent import SentimentAgent
from app.agents.market_analysis.market_agent import MarketAgent
from app.agents.portfolio.portfolio_agent import PortfolioAgent
from app.agents.risk_management.risk_agent import RiskAgent
from app.agents.advisor.strategy_agent import StrategyDecisionAgent
from app.agents import register_domain_agents


# ==========================================
# 1. BaseAgent Subclass & Identity Tests
# ==========================================

def test_01_all_agents_subclass_base_agent():
    agents = [
        TechnicalAgent(),
        NewsAgent(),
        SentimentAgent(),
        PortfolioAgent(),
        RiskAgent(),
        MarketAgent(),
        StrategyDecisionAgent(),
    ]
    for agent in agents:
        assert isinstance(agent, BaseAgent)


def test_02_agent_names():
    assert TechnicalAgent().name == "TechnicalAgent"
    assert NewsAgent().name == "NewsAgent"
    assert SentimentAgent().name == "SentimentAgent"
    assert PortfolioAgent().name == "PortfolioAgent"
    assert RiskAgent().name == "RiskAgent"
    assert MarketAgent().name == "MarketAgent"
    assert StrategyDecisionAgent().name == "StrategyDecisionAgent"


def test_03_agent_metadata():
    for agent in [TechnicalAgent(), NewsAgent(), SentimentAgent(), PortfolioAgent(), RiskAgent(), MarketAgent(), StrategyDecisionAgent()]:
        meta = agent.metadata()
        assert "name" in meta
        assert "description" in meta
        assert "version" in meta
        assert "priority" in meta
        assert "dependencies" in meta
        assert meta["healthy"] is True


def test_04_agent_dependencies():
    assert TechnicalAgent().dependencies == []
    assert NewsAgent().dependencies == []
    assert PortfolioAgent().dependencies == []
    assert SentimentAgent().dependencies == ["NewsAgent"]
    assert RiskAgent().dependencies == ["PortfolioAgent"]
    assert "TechnicalAgent" in MarketAgent().dependencies
    assert "SentimentAgent" in MarketAgent().dependencies
    assert "RiskAgent" in MarketAgent().dependencies
    assert "MarketAgent" in StrategyDecisionAgent().dependencies


# ==========================================
# 2. Individual Agent Execution Tests
# ==========================================

def test_05_technical_agent_execution():
    agent = TechnicalAgent()
    ctx = AgentContext(symbol="BTCUSDT", interval="1h")
    res = agent.execute(ctx)

    assert "technical_analysis" in res
    assert "technical_analysis" in ctx
    assert ctx.technical_analysis["symbol"] == "BTCUSDT"
    assert "signal" in ctx.technical_analysis


def test_06_news_agent_execution():
    agent = NewsAgent()
    ctx = AgentContext(symbol="BTCUSDT")
    res = agent.execute(ctx)

    assert "news" in res
    assert "news" in ctx
    assert isinstance(ctx["news"], list)


def test_07_sentiment_agent_execution():
    agent = SentimentAgent()
    ctx = AgentContext(symbol="BTCUSDT")
    ctx["news"] = [
        {"title": "Bitcoin reaches new high", "description": "Bullish rally continues", "source": "Mock", "url": "http://mock"}
    ]
    res = agent.execute(ctx)

    assert "sentiment" in res
    assert "sentiment" in ctx
    assert ctx.sentiment["symbol"] == "BTCUSDT"


def test_08_portfolio_agent_execution():
    agent = PortfolioAgent()
    ctx = AgentContext(symbol="BTCUSDT")
    res = agent.execute(ctx)

    assert "portfolio_snapshot" in res
    assert "portfolio_snapshot" in ctx
    assert "total_value_usd" in ctx.portfolio_snapshot


def test_09_risk_agent_execution():
    agent = RiskAgent()
    ctx = AgentContext(symbol="BTCUSDT")
    ctx.portfolio_snapshot = {"max_drawdown_pct": "0.02"}
    res = agent.execute(ctx)

    assert "risk_assessment" in res
    assert "risk_assessment" in ctx
    assert ctx.risk_assessment["status"] == "APPROVED"


def test_10_market_agent_execution():
    agent = MarketAgent()
    ctx = AgentContext(symbol="BTCUSDT", interval="1h")
    res = agent.execute(ctx)

    assert "market_intelligence" in res
    assert "market_intelligence" in ctx
    assert ctx.market_intelligence["symbol"] == "BTCUSDT"
    assert "signal" in ctx.market_intelligence


def test_11_strategy_decision_agent_execution():
    agent = StrategyDecisionAgent()
    ctx = AgentContext(symbol="BTCUSDT")
    ctx.market_intelligence = {"signal": "BUY", "confidence": 85.0, "reasons": ["Bullish trend"]}
    ctx.risk_assessment = {"status": "APPROVED", "allowed_trade": True}
    res = agent.execute(ctx)

    assert "strategy_decision" in res
    assert "strategy_decision" in ctx
    rec = ctx.strategy_decision
    assert rec["symbol"] == "BTCUSDT"
    assert rec["action"] == "BUY"
    assert rec["risk_approved"] is True
    assert rec["analytical_only"] is True


# ==========================================
# 3. Context Keys & Validation Tests
# ==========================================

def test_12_context_output_keys():
    reg = register_domain_agents()
    orch = AgentOrchestrator(registry=reg)
    ctx = AgentContext(symbol="ETHUSDT")

    results, summary = orch.run(ctx)

    assert summary.executed == 7
    expected_keys = [
        "technical_analysis",
        "news",
        "sentiment",
        "portfolio_snapshot",
        "risk_assessment",
        "market_intelligence",
        "strategy_decision",
    ]
    for key in expected_keys:
        assert key in ctx


def test_13_dependency_ordering():
    reg = register_domain_agents()
    orch = AgentOrchestrator(registry=reg)
    agents = reg.list()

    ordered = orch.resolve_dependencies(agents)
    ordered_names = [a.name for a in ordered]

    # Verify prerequisites come before dependents
    assert ordered_names.index("NewsAgent") < ordered_names.index("SentimentAgent")
    assert ordered_names.index("PortfolioAgent") < ordered_names.index("RiskAgent")
    assert ordered_names.index("TechnicalAgent") < ordered_names.index("MarketAgent")
    assert ordered_names.index("MarketAgent") < ordered_names.index("StrategyDecisionAgent")


def test_14_full_domain_agent_orchestration():
    reg = register_domain_agents()
    orch = AgentOrchestrator(registry=reg)
    ctx = AgentContext(symbol="SOLUSDT")

    results, summary = orch.run(ctx)

    assert summary.total_agents == 7
    assert summary.executed == 7
    assert summary.failed == 0
    assert summary.skipped == 0
    assert summary.success_rate == 100.0


def test_15_validation_failure_handling():
    agent = TechnicalAgent()
    invalid_ctx = AgentContext()  # missing symbol
    assert agent.validate(invalid_ctx) is False

    reg = AgentRegistry()
    reg.register(agent)
    orch = AgentOrchestrator(registry=reg)

    results, summary = orch.run(invalid_ctx)
    assert summary.skipped == 1
    assert summary.executed == 0


def test_16_agent_failure_isolation():
    class BrokenAgent(BaseAgent):
        name = "BrokenAgent"
        dependencies = []

        def execute(self, context: AgentContext) -> Any:
            raise RuntimeError("Simulated breakage")

    reg = register_domain_agents()
    reg.register(BrokenAgent())
    orch = AgentOrchestrator(registry=reg)
    ctx = AgentContext(symbol="BTCUSDT")

    results, summary = orch.run(ctx)
    assert summary.failed == 1
    # Other domain agents should still execute properly
    assert summary.executed == 7


def test_17_missing_context_graceful_handling():
    # Execute StrategyDecisionAgent with minimal/empty context
    agent = StrategyDecisionAgent()
    ctx = AgentContext(symbol="BTCUSDT")
    res = agent.execute(ctx)

    assert res["strategy_decision"]["action"] in ["BUY", "SELL", "HOLD"]
    assert res["strategy_decision"]["analytical_only"] is True


def test_18_no_order_execution_verification():
    # Verify domain agents do not call order execution APIs or mutate orders
    reg = register_domain_agents()
    orch = AgentOrchestrator(registry=reg)
    ctx = AgentContext(symbol="BTCUSDT")

    results, summary = orch.run(ctx)
    for result in results.values():
        assert "order_id" not in result
        assert "transaction_id" not in result


def test_19_no_database_mutation_verification():
    # Mock db session to ensure execute does not call db.commit()
    mock_db = MagicMock()
    ctx = AgentContext(symbol="BTCUSDT", db=mock_db)

    reg = register_domain_agents()
    orch = AgentOrchestrator(registry=reg)
    results, summary = orch.run(ctx)

    mock_db.commit.assert_not_called()


def test_20_final_strategy_decision_structure():
    reg = register_domain_agents()
    orch = AgentOrchestrator(registry=reg)
    ctx = AgentContext(symbol="ADAUSDT")

    results, summary = orch.run(ctx)
    strat = ctx.strategy_decision

    assert "symbol" in strat
    assert "action" in strat
    assert "confidence" in strat
    assert "risk_approved" in strat
    assert "risk_status" in strat
    assert "reasons" in strat
    assert strat["analytical_only"] is True
