from pydantic import BaseModel
from typing import Any, Dict, List


class MarketDataSchema(BaseModel):
    symbol: str
    price: float
    candles: Dict[str, Any]
    order_book: Dict[str, Any]
    volume_24h: float
    change_24h: float


class MarketAnalysisResponseSchema(BaseModel):
    symbol: str
    market_score: int
    confidence: int
    market_state: str
    summary: str
