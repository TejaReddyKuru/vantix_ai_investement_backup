from typing import Any, Dict, Optional

from app.agents.context import AgentContext
from app.agents.orchestrator import AgentOrchestrator
from app.agents.registry import AgentRegistry
from app.schemas.intelligence_pipeline import UnifiedIntelligenceOut


class UnifiedIntelligencePipeline:
    """
    Unified Intelligence Pipeline:
    Coordinates execution of all Phase 8 domain agents through the AgentOrchestrator,
    resolving topological DAG dependencies and returning a single structured
    analytical output (UnifiedIntelligenceOut).
    Purely analytical — zero trading execution or database state mutation.
    """

    def __init__(
        self,
        registry: Optional[AgentRegistry] = None,
        orchestrator: Optional[AgentOrchestrator] = None,
    ) -> None:
        from app.agents import register_domain_agents

        self.registry = registry or AgentRegistry()
        register_domain_agents(self.registry)
        self.orchestrator = orchestrator or AgentOrchestrator(registry=self.registry)

    def run(
        self,
        symbol: str = "BTCUSDT",
        interval: str = "1h",
        context: Optional[AgentContext] = None,
        **kwargs: Any,
    ) -> UnifiedIntelligenceOut:
        """
        Execute full multi-agent intelligence suite for the requested symbol.
        Returns UnifiedIntelligenceOut pydantic model.
        """
        if context is None:
            ctx = AgentContext(symbol=symbol, interval=interval, **kwargs)
        else:
            ctx = context
            if not ctx.symbol:
                ctx.symbol = symbol
            if not ctx.interval:
                ctx.interval = interval
            for k, v in kwargs.items():
                ctx[k] = v

        results, summary = self.orchestrator.run(ctx)

        # Convert execution summary to clean dictionary
        summary_dict: Dict[str, Any] = {
            "total_agents": summary.total_agents,
            "executed": summary.executed,
            "skipped": summary.skipped,
            "failed": summary.failed,
            "duration_ms": summary.duration_ms,
            "success_rate": summary.success_rate,
            "started_at": summary.started_at,
            "finished_at": summary.finished_at,
            "event_count": len(summary.events),
        }

        return UnifiedIntelligenceOut(
            symbol=ctx.symbol,
            technical_analysis=ctx.get("technical_analysis"),
            news=ctx.get("news"),
            sentiment=ctx.get("sentiment"),
            market_intelligence=ctx.get("market_intelligence"),
            portfolio_snapshot=ctx.get("portfolio_snapshot"),
            risk_assessment=ctx.get("risk_assessment"),
            strategy_decision=ctx.get("strategy_decision"),
            execution_summary=summary_dict,
        )
