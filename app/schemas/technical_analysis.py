from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class TechnicalIndicatorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sma_20: Optional[Decimal] = None
    sma_50: Optional[Decimal] = None
    sma_200: Optional[Decimal] = None
    ema_9: Optional[Decimal] = None
    ema_21: Optional[Decimal] = None
    ema_50: Optional[Decimal] = None
    rsi_14: Optional[Decimal] = None
    macd_line: Optional[Decimal] = None
    macd_signal: Optional[Decimal] = None
    macd_hist: Optional[Decimal] = None
    bb_upper: Optional[Decimal] = None
    bb_middle: Optional[Decimal] = None
    bb_lower: Optional[Decimal] = None
    atr_14: Optional[Decimal] = None
    adx_14: Optional[Decimal] = None
    plus_di: Optional[Decimal] = None
    minus_di: Optional[Decimal] = None


class TrendAnalysisOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    direction: str = Field(..., description="bullish, bearish, or neutral")
    strength: Decimal = Field(..., description="0.0 to 1.0")


class MomentumAnalysisOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    price_change_pct: Decimal
    short_term_momentum: Optional[Decimal] = None
    medium_term_momentum: Optional[Decimal] = None


class VolatilityAnalysisOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    classification: str = Field(..., description="low, medium, or high")
    atr: Optional[Decimal] = None
    atr_pct: Optional[Decimal] = None
    std_dev: Optional[Decimal] = None


class SupportResistanceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    support: Optional[Decimal] = None
    resistance: Optional[Decimal] = None
    support_distance_pct: Optional[Decimal] = None
    resistance_distance_pct: Optional[Decimal] = None


class TechnicalSignalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    signal: str = Field(..., description="BUY, SELL, or HOLD")
    confidence: Decimal = Field(..., description="0.0 to 1.0")
    reasons: List[str]


class TechnicalAnalysisOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    symbol: str
    interval: str
    timestamp: int
    current_price: Decimal
    indicators: TechnicalIndicatorOut
    trend: TrendAnalysisOut
    momentum: MomentumAnalysisOut
    volatility: VolatilityAnalysisOut
    support_resistance: SupportResistanceOut
    signal: TechnicalSignalOut
