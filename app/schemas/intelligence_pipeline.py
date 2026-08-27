from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class UnifiedIntelligenceOut(BaseModel):
    """
    Structured response schema representing unified multi-agent market intelligence,
    synthesis, and strategy recommendation for a target symbol.
    """

    symbol: str = Field(..., description="Target ticker or currency pair symbol")
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO timestamp of intelligence synthesis",
    )
    technical_analysis: Optional[Dict[str, Any]] = Field(
        None, description="Technical analysis indicators and signal outputs"
    )
    news: Optional[List[Dict[str, Any]]] = Field(
        None, description="Normalized news articles array"
    )
    sentiment: Optional[Dict[str, Any]] = Field(
        None, description="Aggregated news sentiment metrics"
    )
    market_intelligence: Optional[Dict[str, Any]] = Field(
        None, description="Synthesized market intelligence scores and divergence flags"
    )
    portfolio_snapshot: Optional[Dict[str, Any]] = Field(
        None, description="Read-only portfolio metrics and asset allocations"
    )
    risk_assessment: Optional[Dict[str, Any]] = Field(
        None, description="Portfolio drawdown and trade risk limits"
    )
    strategy_decision: Optional[Dict[str, Any]] = Field(
        None, description="Final analytical strategy recommendation"
    )
    execution_summary: Dict[str, Any] = Field(
        ..., description="Agent framework timing, event logs, and status metrics"
    )
