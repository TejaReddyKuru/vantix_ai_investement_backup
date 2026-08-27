from decimal import Decimal
from typing import List

from pydantic import BaseModel, ConfigDict, Field, field_serializer


class MarketIntelligenceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    symbol: str = Field(..., description="Asset symbol (e.g. BTCUSDT)")
    timestamp: int = Field(..., description="Timestamp of the analysis candle in milliseconds")
    technical_signal: str = Field(..., description="Technical analysis signal (BUY, SELL, HOLD)")
    technical_confidence: Decimal = Field(..., description="Technical analysis confidence [0.0, 1.0]")
    technical_score: Decimal = Field(..., description="Technical component score [-5.0, +5.0]")
    sentiment_direction: str = Field(..., description="News sentiment direction (bullish, bearish, neutral)")
    sentiment_score: Decimal = Field(..., description="Sentiment component score [-2.0, +2.0]")
    sentiment_confidence: Decimal = Field(..., description="News sentiment confidence [0.0, 1.0]")
    trend_direction: str = Field(..., description="Trend direction (bullish, bearish, neutral)")
    trend_strength: Decimal = Field(..., description="Trend strength [0.0, 1.0]")
    risk_penalty: Decimal = Field(..., description="Risk penalty applied to analytical score [-1.0, 0.0]")
    portfolio_drawdown: Decimal = Field(..., description="Current portfolio drawdown percentage")
    portfolio_exposure: Decimal = Field(..., description="Current position exposure percentage for symbol")
    cash_ratio: Decimal = Field(..., description="Ratio of available cash to total portfolio equity")
    final_score: Decimal = Field(..., description="Final combined intelligence score [-10.0, +10.0]")
    signal: str = Field(..., description="Final resolved intelligence signal (BUY, SELL, HOLD)")
    confidence: Decimal = Field(..., description="Final signal confidence rating [0.0, 1.0]")
    divergence_detected: bool = Field(..., description="True if technical and sentiment signals diverge")
    reasons: List[str] = Field(..., description="Deterministic human-readable reasons supporting the signal")

    @field_serializer(
        "technical_confidence",
        "technical_score",
        "sentiment_score",
        "sentiment_confidence",
        "trend_strength",
        "risk_penalty",
        "portfolio_drawdown",
        "portfolio_exposure",
        "cash_ratio",
        "final_score",
        "confidence",
    )
    def serialize_decimal_as_float(self, value: Decimal) -> float:
        """Serialize Decimal fields as JSON numbers (float) instead of strings."""
        return float(value)
