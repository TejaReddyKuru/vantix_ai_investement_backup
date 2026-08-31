from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

class MarketAgentOut(BaseModel):
    symbol: str
    price: float
    change_24h: float
    volume_24h: float
    high_24h: float
    low_24h: float
    candles: Dict[str, List[List[Any]]]
    indicators: Dict[str, float]
    order_book: Dict[str, Any]
    timestamp: datetime
    source: str = "binance"
    provider: str
    asset_type: str
    data_quality: str

class NewsArticle(BaseModel):
    title: str
    source: str
    published_at: datetime
    url: str
    importance: str = "normal"

class NewsAgentOut(BaseModel):
    symbol: str
    articles: List[NewsArticle]
    total: int

class SentimentAgentOut(BaseModel):
    symbol: str
    score: float
    label: str
    confidence: float
    bullish_count: int
    bearish_count: int
    neutral_count: int

class FeatureBuilderOut(BaseModel):
    symbol: str
    price: float
    trend: str
    technical: Dict[str, Any]
    news: Dict[str, Any]
    sentiment: Dict[str, Any]

class RiskAgentOut(BaseModel):
    risk_score: float
    risk_level: str
    volatility: float
    max_drawdown: float
    atr: float
    risk_reward: float
    market_regime: str

class TradeAgentEntry(BaseModel):
    min: float
    max: float

class TradeAgentOut(BaseModel):
    symbol: str
    signal: str
    confidence: float
    entry: Optional[TradeAgentEntry] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[List[float]] = None
    risk_reward: Optional[float] = None
    strategy: str

class AgentStatus(BaseModel):
    market: str
    news: str
    sentiment: str
    risk: str
    trade: str

class AHNAAnalysisRequest(BaseModel):
    symbol: str
    question: Optional[str] = None

from enum import Enum

class AHNADecision(str, Enum):
    WAIT = "WAIT"
    BUY = "BUY"
    SELL = "SELL"
    HOLD = "HOLD"

class AHNAMarketState(BaseModel):
    price: float
    price_change_24h: Optional[float] = None
    volume_24h: Optional[float] = None
    rsi: Optional[float] = None
    macd: Optional[float] = None
    ema20: Optional[float] = None
    ema50: Optional[float] = None
    market_regime: str
    volatility: str
    liquidity: str

class AHNAInstruction(BaseModel):
    title: str
    message: str
    action: str
    watch_conditions: List[str]

class AHNATradePlan(BaseModel):
    entry_min: Optional[float] = None
    entry_max: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    risk_reward: Optional[float] = None

class AHNAUIEffect(BaseModel):
    mode: str
    highlight: str
    animate_chart: bool
    show_entry_zone: bool

class AHNAResponseOut(BaseModel):
    symbol: str
    decision: str
    confidence: float
    market_view: str
    risk_level: str
    summary: str
    reasoning: List[str]
    entry: Optional[TradeAgentEntry] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[List[float]] = None
    warnings: List[str]
    agent_status: AgentStatus
    created_at: datetime
    
    # New Hologram fields
    market_regime: Optional[str] = None
    market_state: Optional[AHNAMarketState] = None
    instruction: Optional[AHNAInstruction] = None
    watch_conditions: Optional[List[str]] = None
    trade_plan: Optional[AHNATradePlan] = None
    ui_effect: Optional[AHNAUIEffect] = None

