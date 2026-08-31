from typing import Any, Dict

from app.schemas.ahna import (
    FeatureBuilderOut,
    MarketAgentOut,
    NewsAgentOut,
    SentimentAgentOut
)
from app.core.logger import get_logger

logger = get_logger(__name__)

class FeatureBuilder:
    def build(self, market: MarketAgentOut, news: NewsAgentOut, sentiment: SentimentAgentOut) -> FeatureBuilderOut:
        try:
            # Determine basic trend from EMA
            ema20 = market.indicators.get("ema20", 0)
            ema50 = market.indicators.get("ema50", 0)
            
            if market.price > ema20 and ema20 > ema50:
                trend = "BULLISH"
            elif market.price < ema20 and ema20 < ema50:
                trend = "BEARISH"
            else:
                trend = "NEUTRAL"

            # Determine MACD state
            macd = market.indicators.get("macd", 0)
            macd_state = "POSITIVE" if macd > 0 else "NEGATIVE"

            # Determine RSI state
            rsi = market.indicators.get("rsi", 50)
            if rsi > 70:
                momentum = "OVERBOUGHT"
            elif rsi < 30:
                momentum = "OVERSOLD"
            elif rsi > 55:
                momentum = "STRONG"
            elif rsi < 45:
                momentum = "WEAK"
            else:
                momentum = "NEUTRAL"

            technical = {
                "rsi": rsi,
                "macd": macd_state,
                "ema_trend": trend,
                "momentum": momentum
            }

            news_features = {
                "count": news.total,
                "sentiment": sentiment.label
            }

            sentiment_features = {
                "score": sentiment.score,
                "label": sentiment.label
            }

            return FeatureBuilderOut(
                symbol=market.symbol,
                price=market.price,
                trend=trend,
                technical=technical,
                news=news_features,
                sentiment=sentiment_features
            )
        except Exception as e:
            logger.error(f"FeatureBuilder failed: {e}")
            raise RuntimeError(f"FeatureBuilder failed to construct features: {e}")
