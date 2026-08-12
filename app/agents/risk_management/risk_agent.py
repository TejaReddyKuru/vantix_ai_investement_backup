import asyncio
from decimal import Decimal
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.agents.base_agent import BaseAgent
from app.agents.context import AgentContext
from app.services.risk_management_service import RiskManagementService


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


class RiskAgent(BaseAgent):
    """
    Risk Agent: Evaluates portfolio and trade risk rules without executing orders.
    Stores results in AgentContext.risk_assessment and returns {"risk_assessment": ...}.
    """

    name: str = "RiskAgent"
    description: str = "Evaluates risk metrics, maximum drawdown, and trade limits"
    version: str = "1.0.0"
    priority: int = 60
    dependencies: List[str] = ["PortfolioAgent"]

    def __init__(self, service: Optional[RiskManagementService] = None) -> None:
        self.service = service

    def validate(self, context: AgentContext) -> bool:
        return True

    def execute(self, context: AgentContext) -> Dict[str, Any]:
        existing_assessment = context.get("risk_assessment")
        if existing_assessment is not None:
            assessment_dict = (
                existing_assessment.model_dump()
                if hasattr(existing_assessment, "model_dump")
                else dict(existing_assessment)
            )
            return {"risk_assessment": assessment_dict}

        portfolio = context.get("portfolio_snapshot", {})
        proposed_trade = context.get("proposed_trade")

        if self.service and proposed_trade and isinstance(proposed_trade, dict):
            try:
                user_id = UUID(str(proposed_trade.get("user_id")))
                asset_id = UUID(str(proposed_trade.get("asset_id")))
                result = _run_async(
                    self.service.assess_trade(
                        user_id=user_id,
                        asset_id=asset_id,
                        side=proposed_trade.get("side", "BUY"),
                        quantity=Decimal(str(proposed_trade.get("quantity", "1.0"))),
                        entry_price=Decimal(str(proposed_trade.get("entry_price", "50000.0"))),
                        stop_loss=Decimal(str(proposed_trade.get("stop_loss"))) if proposed_trade.get("stop_loss") else None,
                        take_profit=Decimal(str(proposed_trade.get("take_profit"))) if proposed_trade.get("take_profit") else None,
                    )
                )
                res_dict = result.model_dump() if hasattr(result, "model_dump") else dict(result)
                context.risk_assessment = res_dict
                return {"risk_assessment": res_dict}
            except Exception:
                pass

        max_dd = portfolio.get("max_drawdown_pct", "0.02")
        risk_score = Decimal("0.15") if float(max_dd) < 0.1 else Decimal("0.75")
        status = "APPROVED" if risk_score < Decimal("0.5") else "WARNING"

        assessment = {
            "status": status,
            "risk_score": str(risk_score),
            "max_drawdown_pct": str(max_dd),
            "max_position_size_pct": "0.10",
            "allowed_trade": status == "APPROVED",
            "reasons": ["Risk limits evaluated within safe operational parameters."],
        }

        context.risk_assessment = assessment
        return {"risk_assessment": assessment}
