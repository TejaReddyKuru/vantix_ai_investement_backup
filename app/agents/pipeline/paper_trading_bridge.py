from typing import Any, Dict, Optional, Union
from app.schemas.intelligence_pipeline import UnifiedIntelligenceOut
from app.schemas.paper_trading_decision import PaperTradingDecisionOut


class PaperTradingDecisionBridge:
    """
    Paper Trading Decision Bridge:
    Adapts UnifiedIntelligenceOut analytical outputs into structured paper-trading candidates.
    Establishes an explicit safety boundary — NEVER executes paper trades automatically
    and ALWAYS forces execution_allowed = False.
    """

    def evaluate_candidate(
        self, intelligence: Union[UnifiedIntelligenceOut, Dict[str, Any]]
    ) -> PaperTradingDecisionOut:
        """
        Evaluate a UnifiedIntelligenceOut output and transform its analytical strategy
        decision into a safe, structured PaperTradingDecisionOut candidate.
        """
        if isinstance(intelligence, dict):
            symbol = intelligence.get("symbol")
            timestamp = intelligence.get("timestamp")
            strat = intelligence.get("strategy_decision")
            risk = intelligence.get("risk_assessment")
            tech = intelligence.get("technical_analysis")
            market_intel = intelligence.get("market_intelligence")
        elif isinstance(intelligence, UnifiedIntelligenceOut):
            symbol = intelligence.symbol
            timestamp = intelligence.timestamp
            strat = intelligence.strategy_decision
            risk = intelligence.risk_assessment
            tech = intelligence.technical_analysis
            market_intel = intelligence.market_intelligence
        else:
            raise ValueError("Input must be a UnifiedIntelligenceOut instance or dictionary.")

        if not symbol:
            raise ValueError("Intelligence output must specify a valid symbol.")

        if not strat or not isinstance(strat, dict):
            return PaperTradingDecisionOut(
                symbol=symbol,
                timestamp=timestamp or "",
                direction="HOLD",
                confidence=0.0,
                risk_assessment=risk,
                reasoning=["Strategy decision payload missing or incomplete."],
                execution_allowed=False,
                status="INVALID",
                source="UnifiedIntelligencePipeline",
            )

        direction = str(strat.get("action", "HOLD")).upper()
        confidence = float(strat.get("confidence", 0.0))
        risk_approved = strat.get("risk_approved", True)
        risk_status = str(strat.get("risk_status", "APPROVED")).upper()

        reasons = list(strat.get("reasons", []))

        # Extract entry, stop-loss, and take-profit suggestions if available
        suggested_entry: Optional[float] = None
        suggested_stop_loss: Optional[float] = None
        suggested_take_profit: Optional[float] = None

        if isinstance(tech, dict):
            signal_data = tech.get("signal", {})
            if isinstance(signal_data, dict):
                suggested_entry = signal_data.get("price") or signal_data.get("entry_price")
                suggested_stop_loss = signal_data.get("stop_loss")
                suggested_take_profit = signal_data.get("take_profit")

        if suggested_entry is None and isinstance(market_intel, dict):
            suggested_entry = market_intel.get("price") or market_intel.get("current_price")

        if risk and isinstance(risk, dict):
            if suggested_stop_loss is None:
                suggested_stop_loss = risk.get("stop_loss")
            if suggested_take_profit is None:
                suggested_take_profit = risk.get("take_profit")

        # Risk safety check
        if not risk_approved or risk_status != "APPROVED":
            status = "REJECTED"
            if not any("Risk" in r for r in reasons):
                reasons.append(f"Risk assessment rejected candidate with status: {risk_status}.")
        elif direction == "HOLD":
            status = "CANDIDATE_ONLY"
        else:
            status = "CANDIDATE_ONLY"

        # Explicit Safety Boundary: execution_allowed is hardcoded to False
        return PaperTradingDecisionOut(
            symbol=symbol,
            timestamp=timestamp or "",
            direction=direction,
            confidence=confidence,
            risk_assessment=risk,
            suggested_entry=float(suggested_entry) if suggested_entry is not None else None,
            suggested_stop_loss=float(suggested_stop_loss) if suggested_stop_loss is not None else None,
            suggested_take_profit=float(suggested_take_profit) if suggested_take_profit is not None else None,
            reasoning=reasons,
            execution_allowed=False,
            status=status,
            source="UnifiedIntelligencePipeline",
        )
