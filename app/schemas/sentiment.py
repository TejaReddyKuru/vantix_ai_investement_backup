from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class SentimentAggregationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    symbol: str = Field(..., description="Asset symbol")
    article_count: int = Field(..., description="Total articles analyzed")
    positive_count: int = Field(..., description="Number of positive articles")
    negative_count: int = Field(..., description="Number of negative articles")
    neutral_count: int = Field(..., description="Number of neutral articles")
    average_sentiment: Decimal = Field(..., description="Unweighted average sentiment score [-1, 1]")
    weighted_sentiment: Decimal = Field(..., description="Time-decay weighted sentiment score [-1, 1]")
    average_confidence: Decimal = Field(..., description="Average sentiment confidence [0, 1]")
    sentiment_direction: str = Field(..., description="Sentiment direction (bullish, bearish, neutral)")
    sentiment_strength: Decimal = Field(..., description="Magnitude of weighted sentiment")
    latest_news_timestamp: Optional[datetime] = Field(None, description="Publish time of the newest article analyzed")


class CombinedAnalysisOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    symbol: str = Field(..., description="Asset symbol")
    technical_signal: str = Field(..., description="Underlying technical analysis signal (BUY, SELL, HOLD)")
    technical_confidence: Decimal = Field(..., description="Confidence of technical analysis [0, 1]")
    sentiment_direction: str = Field(..., description="Market news sentiment direction (bullish, bearish, neutral)")
    sentiment_score: Decimal = Field(..., description="Aggregated market sentiment score [-1, 1]")
    sentiment_confidence: Decimal = Field(..., description="Confidence of sentiment analysis [0, 1]")
    combined_bias: str = Field(..., description="Synthesized bias (STRONG_BUY, BUY, HOLD, SELL, STRONG_SELL, CAUTIOUS)")
    combined_confidence: Decimal = Field(..., description="Confidence of the combined signal [0, 1]")
    reasons: List[str] = Field(..., description="List of reasons supporting the combined analysis")
