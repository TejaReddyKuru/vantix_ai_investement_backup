from typing import Any, Dict, List, Optional

from app.agents.base_agent import BaseAgent
from app.agents.context import AgentContext
from app.schemas.news import NewsArticleOut
from app.services.sentiment_service import SentimentAggregationService


class SentimentAgent(BaseAgent):
    """
    Sentiment Agent: Aggregates sentiment scores across articles provided in context by NewsAgent.
    Stores results in AgentContext.sentiment and returns {"sentiment": ...}.
    """

    name: str = "SentimentAgent"
    description: str = "Calculates aggregated sentiment score from news articles"
    version: str = "1.0.0"
    priority: int = 75
    dependencies: List[str] = ["NewsAgent"]

    def __init__(self, service: Optional[SentimentAggregationService] = None) -> None:
        self.service = service or SentimentAggregationService()

    def validate(self, context: AgentContext) -> bool:
        symbol = context.get("symbol")
        return bool(symbol and isinstance(symbol, str))

    def execute(self, context: AgentContext) -> Dict[str, Any]:
        symbol = context.get("symbol", "BTCUSDT")
        raw_articles = context.get("news", [])

        articles: List[NewsArticleOut] = []
        for a in raw_articles:
            if isinstance(a, NewsArticleOut):
                articles.append(a)
            elif isinstance(a, dict):
                try:
                    articles.append(NewsArticleOut(**a))
                except Exception:
                    pass

        sentiment_res = self.service.aggregate_sentiment(symbol, articles)
        res_dict = (
            sentiment_res.model_dump()
            if hasattr(sentiment_res, "model_dump")
            else dict(sentiment_res)
        )

        context.sentiment = res_dict
        return {"sentiment": res_dict}
