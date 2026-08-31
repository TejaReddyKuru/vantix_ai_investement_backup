from app.schemas.ahna import NewsAgentOut, SentimentAgentOut
from app.core.logger import get_logger

logger = get_logger(__name__)

class SentimentAgent:
    def __init__(self):
        # Very basic keyword based sentiment
        self.bullish_keywords = ["surge", "bull", "high", "rally", "gain", "up", "adopt", "launch", "breakout", "buy"]
        self.bearish_keywords = ["drop", "bear", "low", "crash", "loss", "down", "ban", "hack", "selloff", "sell"]

    def _analyze_text(self, text: str) -> float:
        if not text:
            return 0.0
        text_lower = text.lower()
        bull_score = sum(1 for word in self.bullish_keywords if word in text_lower)
        bear_score = sum(1 for word in self.bearish_keywords if word in text_lower)
        
        if bull_score == 0 and bear_score == 0:
            return 0.0
        
        total = bull_score + bear_score
        return (bull_score - bear_score) / total

    def analyze(self, news_data: NewsAgentOut) -> SentimentAgentOut:
        try:
            if not news_data or not news_data.articles:
                return SentimentAgentOut(
                    symbol=news_data.symbol if news_data else "UNKNOWN",
                    score=0.0,
                    label="NEUTRAL",
                    confidence=0.0,
                    bullish_count=0,
                    bearish_count=0,
                    neutral_count=0
                )

            total_score = 0.0
            bullish_count = 0
            bearish_count = 0
            neutral_count = 0

            for article in news_data.articles:
                score = self._analyze_text(article.title)
                total_score += score
                
                if score > 0.2:
                    bullish_count += 1
                elif score < -0.2:
                    bearish_count += 1
                else:
                    neutral_count += 1

            avg_score = total_score / len(news_data.articles)
            
            if avg_score > 0.2:
                label = "BULLISH"
            elif avg_score < -0.2:
                label = "BEARISH"
            else:
                label = "NEUTRAL"
                
            # Confidence based on agreement
            total = len(news_data.articles)
            max_count = max(bullish_count, bearish_count, neutral_count)
            confidence = (max_count / total) if total > 0 else 0.0

            return SentimentAgentOut(
                symbol=news_data.symbol,
                score=round(avg_score, 2),
                label=label,
                confidence=round(confidence, 2),
                bullish_count=bullish_count,
                bearish_count=bearish_count,
                neutral_count=neutral_count
            )
        except Exception as e:
            logger.error(f"SentimentAgent failed to analyze: {e}")
            return SentimentAgentOut(
                symbol="UNKNOWN", score=0.0, label="NEUTRAL", confidence=0.0,
                bullish_count=0, bearish_count=0, neutral_count=0
            )
