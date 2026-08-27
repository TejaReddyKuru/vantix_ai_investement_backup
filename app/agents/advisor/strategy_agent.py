from typing import Any, Dict, List

from app.agents.base_agent import BaseAgent
from app.agents.context import AgentContext


class StrategyDecisionAgent(BaseAgent):
    """
    Strategy Decision Agent: Synthesizes existing analytical context outputs (market intelligence,
    technicals, sentiment, portfolio snapshot, and risk assessment) into a final structured
    recommendation dictionary.
    Purely analytical — performs zero order execution or DB mutations.
    """

    name: str = "StrategyDecisionAgent"
    description: str = "Synthesizes multi-agent context into a structured trading recommendation"
    version: str = "1.0.0"
    priority: int = 10
    dependencies: List[str] = [
        "MarketAgent",
        "PortfolioAgent",
        "RiskAgent",
        "SentimentAgent",
        "TechnicalAgent",
    ]

    def validate(self, context: AgentContext) -> bool:
        symbol = context.get("symbol")
        return bool(symbol and isinstance(symbol, str))

    def execute(self, context: AgentContext) -> Dict[str, Any]:
        symbol = context.get("symbol", "BTCUSDT")
        tech = context.get("technical_analysis", {})
        sentiment = context.get("sentiment", {})
        market_intel = context.get("market_intelligence", {})
        portfolio = context.get("portfolio_snapshot", {})
        risk = context.get("risk_assessment", {})

        # Extract signal and confidence from market intelligence or technicals
        primary_signal = market_intel.get("signal") or tech.get("signal", {}).get("signal") or "HOLD"
        primary_confidence = market_intel.get("confidence") or tech.get("signal", {}).get("confidence") or 50.0

        risk_status = risk.get("status", "APPROVED")
        risk_approved = risk.get("allowed_trade", True) if "allowed_trade" in risk else (risk_status == "APPROVED")

        # Override signal to HOLD if risk checks raise warning/rejection
        final_action = primary_signal if risk_approved else "HOLD"

        reasons: List[str] = []
        if market_intel.get("reasons"):
            reasons.extend(market_intel["reasons"])
        if risk.get("reasons"):
            reasons.extend(risk["reasons"])
        if not reasons:
            reasons.append(f"Strategy synthesized signal '{final_action}' with confidence {primary_confidence}%.")

        recommendation = {
            "symbol": symbol,
            "action": final_action,
            "confidence": float(primary_confidence),
            "risk_approved": risk_approved,
            "risk_status": risk_status,
            "technical_signal": tech.get("signal", {}).get("signal") if isinstance(tech, dict) else None,
            "sentiment_score": sentiment.get("score") or sentiment.get("normalized_score") if isinstance(sentiment, dict) else None,
            "market_score": market_intel.get("final_score") if isinstance(market_intel, dict) else None,
            "portfolio_value": portfolio.get("total_value_usd") if isinstance(portfolio, dict) else None,
            "reasons": reasons,
            "analytical_only": True,
        }

        context.strategy_decision = recommendation
        return {"strategy_decision": recommendation}
