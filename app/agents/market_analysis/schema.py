from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field


class MarketData(BaseModel):
    symbol: str
    price: float
    candles: dict[str, Any] = Field(default_factory=dict)
    order_book: dict[str, Any] = Field(default_factory=dict)
    volume_24h: float
    change_24h: float


class MarketAnalysisResponse(BaseModel):
    symbol: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    trend: str
    trend_strength: int
    volume: dict[str, Any] = Field(default_factory=dict)
    volatility: str
    support: list[float] = Field(default_factory=list)
    resistance: list[float] = Field(default_factory=list)
    market_structure: str
    liquidity: dict[str, Any] = Field(default_factory=dict)
    market_score: int
    confidence: int
    market_state: str
    summary: str
