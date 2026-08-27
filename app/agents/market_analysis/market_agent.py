import asyncio
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.agents.base_agent import BaseAgent
from app.agents.context import AgentContext
from app.schemas.news import NewsArticleOut
from app.services.market_intelligence_service import MarketIntelligenceService


def _run_async(coro):
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as pool:
            return pool.submit(asyncio.run, coro).result()
    else:
        return asyncio.run(coro)


class MarketAgent(BaseAgent):
    """
    Market Agent: Synthesizes market intelligence score, signal (BUY/SELL/HOLD), confidence,
    and divergence detection using deterministic MarketIntelligenceService.
    Stores results in AgentContext.market_intelligence and returns {"market_intelligence": ...}.
    """

    name: str = "MarketAgent"
    description: str = "Synthesizes market intelligence from technical, sentiment, and risk analysis"
    version: str = "1.0.0"
    priority: int = 50
    dependencies: List[str] = ["TechnicalAgent", "SentimentAgent", "RiskAgent"]

    def __init__(self, service: Optional[MarketIntelligenceService] = None) -> None:
        self.service = service or MarketIntelligenceService()

    def validate(self, context: AgentContext) -> bool:
        symbol = context.get("symbol")
        return bool(symbol and isinstance(symbol, str))

    def execute(self, context: AgentContext) -> Dict[str, Any]:
        symbol = context.get("symbol", "BTCUSDT")
        interval = context.get("interval", "1h")
        user_id_raw = context.get("user_id") or context.get("user")

        user_id: Optional[UUID] = None
        if user_id_raw:
            try:
                user_id = UUID(str(user_id_raw))
            except (ValueError, AttributeError):
                user_id = None

        klines = context.get("klines")
        raw_news = context.get("news", [])

        articles: Optional[List[NewsArticleOut]] = None
        if raw_news:
            articles = []
            for item in raw_news:
                if isinstance(item, NewsArticleOut):
                    articles.append(item)
                elif isinstance(item, dict):
                    try:
                        articles.append(NewsArticleOut(**item))
                    except Exception:
                        pass

        intel_out = _run_async(
            self.service.analyze(
                symbol=symbol,
                interval=interval,
                user_id=user_id,
                klines=klines,
                articles=articles,
            )
        )

        res_dict = (
            intel_out.model_dump()
            if hasattr(intel_out, "model_dump")
            else dict(intel_out)
        )

        context.market_intelligence = res_dict
        return {"market_intelligence": res_dict}
