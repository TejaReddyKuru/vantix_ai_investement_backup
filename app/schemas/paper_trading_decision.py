from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class PaperTradingDecisionOut(BaseModel):
    """
    Structured response schema representing an AI intelligence paper-trading
    candidate output produced by PaperTradingDecisionBridge.
    Strictly analytical candidate — execution_allowed is ALWAYS false.
    """

    symbol: str = Field(..., description="Target ticker or asset symbol")
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO timestamp of decision candidate evaluation",
    )
    direction: str = Field(..., description="Strategy direction (BUY, SELL, HOLD)")
    confidence: float = Field(..., description="Confidence score percentage (0-100)")
    risk_assessment: Optional[Dict[str, Any]] = Field(
        None, description="Risk management metrics and approval status"
    )
    suggested_entry: Optional[float] = Field(
        None, description="Suggested entry price"
    )
    suggested_stop_loss: Optional[float] = Field(
        None, description="Suggested stop loss price"
    )
    suggested_take_profit: Optional[float] = Field(
        None, description="Suggested take profit price"
    )
    reasoning: List[str] = Field(
        default_factory=list, description="Analytical justification and reasons array"
    )
    execution_allowed: bool = Field(
        False, description="Explicit safety flag — always False for analytical candidates"
    )
    status: str = Field(
        "CANDIDATE_ONLY", description="Bridge evaluation status (CANDIDATE_ONLY, REJECTED, INVALID)"
    )
    source: str = Field(
        "UnifiedIntelligencePipeline", description="Originating intelligence pipeline"
    )
