import time
from typing import Any
import pytest

from app.agents.base_agent import BaseAgent
from app.agents.context import AgentContext
from app.agents.events import (
    AgentFailed,
    AgentFinished,
    AgentSkipped,
    AgentStarted,
    ExecutionSummary,
)
from app.agents.exceptions import (
    AgentError,
    AgentExecutionError,
    DependencyError,
    RegistrationError,
    ValidationError,
)
from app.agents.memory import AgentMemory
from app.agents.orchestrator import AgentOrchestrator
from app.agents.registry import AgentRegistry


# Helper dummy agent implementations for testing
class MockMarketAgent(BaseAgent):
    name = "Market"
    description = "Mock Market Agent"
    priority = 10
    dependencies = []

    def execute(self, context: AgentContext) -> Any:
        return {"market_status": "bullish"}


class MockNewsAgent(BaseAgent):
    name = "News"
    description = "Mock News Agent"
    priority = 5
    dependencies = ["Market"]

    def execute(self, context: AgentContext) -> Any:
        return {"news_sentiment": "positive"}


class MockRiskAgent(BaseAgent):
    name = "Risk"
    description = "Mock Risk Agent"
    priority = 5
    dependencies = ["News"]

    def execute(self, context: AgentContext) -> Any:
        return {"risk_score": 0.2}


class MockStrategyAgent(BaseAgent):
    name = "Strategy"
    description = "Mock Strategy Agent"
    priority = 1
    dependencies = ["Risk"]

    def execute(self, context: AgentContext) -> Any:
        return {"action": "BUY"}


class MockFailingAgent(BaseAgent):
    name = "Failing"
    description = "Fails during execution"
    priority = 5
    dependencies = []

    def execute(self, context: AgentContext) -> Any:
        raise RuntimeError("Simulated runtime failure")


class MockInvalidatingAgent(BaseAgent):
    name = "Invalidating"
    description = "Fails validation"
    priority = 5
    dependencies = []

    def validate(self, context: AgentContext) -> bool:
        return False

    def execute(self, context: AgentContext) -> Any:
        return {"should_not_run": True}


# ==========================================
# 1. Exception Hierarchy Tests
# ==========================================

def test_01_exception_hierarchy():
    err = AgentExecutionError("Execution failed")
    dep = DependencyError("Dependency missing")
    val = ValidationError("Validation failed")
    reg = RegistrationError("Already registered")

    assert isinstance(err, AgentError)
    assert isinstance(dep, AgentError)
    assert isinstance(val, AgentError)
    assert isinstance(reg, AgentError)
    assert str(err) == "Execution failed"


# ==========================================
# 2. Context Tests
# ==========================================

def test_02_context_creation_and_attributes():
    ctx = AgentContext(symbol="BTCUSDT", interval="1h", user="test_user")
    assert ctx.symbol == "BTCUSDT"
    assert ctx.interval == "1h"
    assert ctx.user == "test_user"
    assert ctx.portfolio_snapshot is None


def test_03_context_dictionary_access():
    ctx = AgentContext(symbol="BTCUSDT")
    assert ctx["symbol"] == "BTCUSDT"
    ctx["interval"] = "5m"
    assert ctx.interval == "5m"
    assert "symbol" in ctx
    assert "nonexistent" not in ctx

    with pytest.raises(KeyError):
        _ = ctx["nonexistent"]


def test_04_context_clone_and_copy():
    ctx = AgentContext(symbol="BTCUSDT", metadata={"custom_key": 42})
    cloned = ctx.clone()
    copied = ctx.copy()

    assert cloned.symbol == "BTCUSDT"
    assert copied.metadata["custom_key"] == 42

    # Mutate original, ensure clone is independent
    ctx.symbol = "ETHUSDT"
    ctx.metadata["custom_key"] = 99
    assert cloned.symbol == "BTCUSDT"
    assert cloned.metadata["custom_key"] == 42
    assert copied.symbol == "BTCUSDT"


def test_05_context_update_and_to_dict():
    ctx = AgentContext(symbol="BTCUSDT")
    ctx.update({"interval": "15m", "custom_val": 100})
    assert ctx.interval == "15m"
    assert ctx["custom_val"] == 100

    dict_repr = ctx.to_dict()
    assert dict_repr["symbol"] == "BTCUSDT"
    assert dict_repr["interval"] == "15m"
    assert "metadata" in dict_repr


# ==========================================
# 3. BaseAgent & Metadata Tests
# ==========================================

def test_06_base_agent_defaults_and_metadata():
    agent = MockMarketAgent()
    assert agent.name == "Market"
    assert agent.priority == 10
    assert agent.dependencies == []
    assert agent.health_check() is True

    meta = agent.metadata()
    assert meta["name"] == "Market"
    assert meta["healthy"] is True
    assert meta["priority"] == 10


# ==========================================
# 4. AgentMemory Tests
# ==========================================

def test_07_memory_write_and_read():
    mem = AgentMemory()
    mem.write("key1", "val1")
    assert mem.read("key1") == "val1"
    assert mem.read("missing", default="def") == "def"


def test_08_memory_ttl_expiration():
    mem = AgentMemory()
    # Write key with negative TTL so it immediately expires
    mem.write("expiring_key", "temp_value", ttl=-1.0)
    assert mem.read("expiring_key") is None
    assert mem.exists("expiring_key") is False


def test_09_memory_delete_and_exists():
    mem = AgentMemory()
    mem.write("key_to_delete", 123)
    assert mem.exists("key_to_delete") is True

    deleted = mem.delete("key_to_delete")
    assert deleted is True
    assert mem.exists("key_to_delete") is False
    assert mem.delete("nonexistent") is False


def test_10_memory_clear():
    mem = AgentMemory()
    mem.write("k1", "v1")
    mem.write("k2", "v2")
    mem.clear()
    assert mem.read("k1") is None
    assert mem.read("k2") is None


# ==========================================
# 5. AgentRegistry Tests
# ==========================================

def test_11_registry_register_and_get():
    reg = AgentRegistry()
    market = MockMarketAgent()
    reg.register(market)

    assert reg.get("Market") is market
    assert "Market" in reg.discover()
    assert len(reg.list()) == 1


def test_12_registry_duplicate_prevention():
    reg = AgentRegistry()
    market1 = MockMarketAgent()
    market2 = MockMarketAgent()
    reg.register(market1)

    with pytest.raises(RegistrationError):
        reg.register(market2)


def test_13_registry_unregister():
    reg = AgentRegistry()
    market = MockMarketAgent()
    reg.register(market)
    reg.unregister("Market")

    assert "Market" not in reg.discover()
    with pytest.raises(RegistrationError):
        reg.get("Market")

    with pytest.raises(RegistrationError):
        reg.unregister("Market")


# ==========================================
# 6. Orchestrator & Dependency Tests
# ==========================================

def test_14_dependency_sorting_linear():
    orch = AgentOrchestrator()
    market = MockMarketAgent()
    news = MockNewsAgent()
    risk = MockRiskAgent()
    strategy = MockStrategyAgent()

    # Pass in arbitrary unsorted order
    sorted_agents = orch.resolve_dependencies([strategy, news, market, risk])
    names = [a.name for a in sorted_agents]
    assert names == ["Market", "News", "Risk", "Strategy"]


def test_15_priority_ordering():
    orch = AgentOrchestrator()

    class AgentLow(BaseAgent):
        name = "LowPriority"
        priority = 1

        def execute(self, ctx):
            return 1

    class AgentHigh(BaseAgent):
        name = "HighPriority"
        priority = 100

        def execute(self, ctx):
            return 100

    sorted_agents = orch.resolve_dependencies([AgentLow(), AgentHigh()])
    assert [a.name for a in sorted_agents] == ["HighPriority", "LowPriority"]


def test_16_circular_dependency_detection():
    orch = AgentOrchestrator()

    class AgentA(BaseAgent):
        name = "A"
        dependencies = ["B"]

        def execute(self, ctx):
            pass

    class AgentB(BaseAgent):
        name = "B"
        dependencies = ["A"]

        def execute(self, ctx):
            pass

    with pytest.raises(DependencyError, match="Circular dependency"):
        orch.resolve_dependencies([AgentA(), AgentB()])


def test_17_missing_dependency_detection():
    orch = AgentOrchestrator()

    class AgentA(BaseAgent):
        name = "A"
        dependencies = ["NonExistentAgent"]

        def execute(self, ctx):
            pass

    with pytest.raises(DependencyError, match="depends on missing"):
        orch.resolve_dependencies([AgentA()])


# ==========================================
# 7. Orchestrator Execution Flow Tests
# ==========================================

def test_18_validation_skip():
    reg = AgentRegistry()
    invalid_agent = MockInvalidatingAgent()
    reg.register(invalid_agent)

    orch = AgentOrchestrator(registry=reg)
    ctx = AgentContext(symbol="BTCUSDT")

    results, summary = orch.run(ctx)
    assert summary.executed == 0
    assert summary.skipped == 1
    assert summary.failed == 0
    assert isinstance(summary.events[1], AgentSkipped)


def test_19_successful_execution():
    reg = AgentRegistry()
    reg.register(MockMarketAgent())
    reg.register(MockNewsAgent())
    reg.register(MockRiskAgent())
    reg.register(MockStrategyAgent())

    orch = AgentOrchestrator(registry=reg)
    ctx = AgentContext(symbol="BTCUSDT")

    results, summary = orch.run(ctx)

    assert summary.total_agents == 4
    assert summary.executed == 4
    assert summary.failed == 0
    assert summary.skipped == 0
    assert summary.success_rate == 100.0
    assert results["Market"] == {"market_status": "bullish"}
    assert results["Strategy"] == {"action": "BUY"}


def test_20_execution_failure_isolation():
    reg = AgentRegistry()
    reg.register(MockMarketAgent())
    reg.register(MockFailingAgent())

    orch = AgentOrchestrator(registry=reg)
    ctx = AgentContext(symbol="BTCUSDT")

    results, summary = orch.run(ctx)

    # Market should succeed, Failing agent should record failure without crashing Orchestrator
    assert summary.executed == 1
    assert summary.failed == 1
    assert "Market" in results
    assert "Failing" not in results
    assert any(isinstance(e, AgentFailed) for e in summary.events)


def test_21_event_generation_and_order():
    reg = AgentRegistry()
    reg.register(MockMarketAgent())

    orch = AgentOrchestrator(registry=reg)
    ctx = AgentContext(symbol="BTCUSDT")

    _, summary = orch.run(ctx)
    events = summary.events

    assert len(events) == 2
    assert isinstance(events[0], AgentStarted)
    assert isinstance(events[1], AgentFinished)
    assert events[0].agent_name == "Market"


def test_22_execution_summary_metrics():
    reg = AgentRegistry()
    reg.register(MockMarketAgent())
    reg.register(MockNewsAgent())

    orch = AgentOrchestrator(registry=reg)
    ctx = AgentContext(symbol="BTCUSDT")

    _, summary = orch.run(ctx)

    assert isinstance(summary, ExecutionSummary)
    assert summary.total_agents == 2
    assert summary.executed == 2
    assert summary.duration_ms >= 0.0
    assert summary.started_at <= summary.finished_at


def test_23_timing_metrics():
    reg = AgentRegistry()

    class SlowAgent(BaseAgent):
        name = "Slow"

        def execute(self, ctx):
            time.sleep(0.01)
            return True

    reg.register(SlowAgent())
    orch = AgentOrchestrator(registry=reg)
    ctx = AgentContext(symbol="BTCUSDT")

    _, summary = orch.run(ctx)
    finish_event = summary.events[1]

    assert isinstance(finish_event, AgentFinished)
    assert finish_event.execution_time_ms >= 10.0


def test_24_agent_health_check():
    agent = MockMarketAgent()
    assert agent.health_check() is True
    meta = agent.metadata()
    assert meta["healthy"] is True
