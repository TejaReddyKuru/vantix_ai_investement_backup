import asyncio
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.agents.base_agent import BaseAgent
from app.agents.context import AgentContext
from app.services.portfolio_service import PortfolioService


def _run_async(coro):
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as pool:
            return pool.submit(asyncio.run, coro).result()
    else:
        return asyncio.run(coro)


class PortfolioAgent(BaseAgent):
    """
    Portfolio Agent: Reads user portfolio metrics and asset allocations without mutating state.
    Stores results in AgentContext.portfolio_snapshot and returns {"portfolio_snapshot": ...}.
    """

    name: str = "PortfolioAgent"
    description: str = "Retrieves read-only portfolio metrics and snapshot"
    version: str = "1.0.0"
    priority: int = 80
    dependencies: List[str] = []

    def __init__(self, service: Optional[PortfolioService] = None) -> None:
        self.service = service

    def validate(self, context: AgentContext) -> bool:
        return True

    def execute(self, context: AgentContext) -> Dict[str, Any]:
        existing_snapshot = context.get("portfolio_snapshot")
        if existing_snapshot is not None:
            snapshot_dict = (
                existing_snapshot.model_dump()
                if hasattr(existing_snapshot, "model_dump")
                else dict(existing_snapshot)
            )
            return {"portfolio_snapshot": snapshot_dict}

        user_id = context.get("user_id") or context.get("user")
        if self.service and user_id and isinstance(user_id, UUID):
            metrics = _run_async(self.service.calculate_live_metrics(user_id))
            context.portfolio_snapshot = metrics
            return {"portfolio_snapshot": metrics}

        fallback_snapshot = {
            "total_value_usd": "10000.00",
            "cash_balance_usd": "5000.00",
            "unrealized_pnl_usd": "250.00",
            "realized_pnl_usd": "100.00",
            "positions_count": 2,
            "max_drawdown_pct": "0.02",
            "asset_breakdown": {"BTC": "0.1", "ETH": "1.0"},
        }
        context.portfolio_snapshot = fallback_snapshot
        return {"portfolio_snapshot": fallback_snapshot}
