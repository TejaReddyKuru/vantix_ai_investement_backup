import asyncio
from typing import Any, Dict, List, Optional

from app.agents.base_agent import BaseAgent
from app.agents.context import AgentContext
from app.services.news_service import NewsService


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


class NewsAgent(BaseAgent):
    """
    News Agent: Retrieves normalized news articles for a target symbol.
    Stores results in AgentContext.news and returns {"news": [...]}.
    """

    name: str = "NewsAgent"
    description: str = "Fetches and normalizes news articles for a given symbol"
    version: str = "1.0.0"
    priority: int = 85
    dependencies: List[str] = []

    def __init__(self, service: Optional[NewsService] = None) -> None:
        self.service = service or NewsService()

    def validate(self, context: AgentContext) -> bool:
        symbol = context.get("symbol")
        return bool(symbol and isinstance(symbol, str))

    def execute(self, context: AgentContext) -> Dict[str, Any]:
        symbol = context.get("symbol", "BTCUSDT")
        limit = context.get("news_limit", 10)

        articles = _run_async(self.service.fetch_and_normalize_news(symbol, limit))
        articles_serialized = [
            a.model_dump() if hasattr(a, "model_dump") else dict(a)
            for a in articles
        ]

        context["news"] = articles_serialized
        return {"news": articles_serialized}
