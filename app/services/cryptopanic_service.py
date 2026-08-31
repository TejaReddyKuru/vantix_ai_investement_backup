import os
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx
from pydantic import ValidationError

from app.core.config import settings
from app.core.logger import get_logger
from app.schemas.ahna import NewsArticle

logger = get_logger(__name__)

class CryptoPanicService:
    def __init__(self, base_url: str = "https://cryptopanic.com/api/v1", timeout: float = 10.0) -> None:
        self.base_url = base_url
        self.timeout = timeout
        self.api_key = os.getenv("CRYPTOPANIC_API_KEY", "")

    async def get_news(self, symbol: str, limit: int = 10) -> List[NewsArticle]:
        if not self.api_key:
            logger.warning("CRYPTOPANIC_API_KEY not set, using mock news or returning empty.")
            # We could fallback to mock news, but for AHNA we will return empty and let the orchestrator handle it.
            return []

        clean_symbol = symbol.upper().replace("USDT", "").replace("USD", "")
        
        url = f"{self.base_url}/posts/"
        params = {
            "auth_token": self.api_key,
            "currencies": clean_symbol,
            "kind": "news",
            "filter": "important"  # try to get high-signal news
        }
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(url, params=params)
                
                # If filter=important returns nothing, fallback to all news
                if response.status_code == 200 and len(response.json().get("results", [])) == 0:
                    del params["filter"]
                    response = await client.get(url, params=params)
                
                response.raise_for_status()
                data = response.json()
                
                results = data.get("results", [])
                articles = []
                for idx, post in enumerate(results[:limit]):
                    
                    # pub_at = post.get("published_at")
                    
                    try:
                        article = NewsArticle(
                            title=post.get("title", "Unknown Title"),
                            source=post.get("domain", "Unknown Source"),
                            published_at=post.get("published_at"),
                            url=post.get("url", ""),
                            importance="high" if idx < 3 else "normal" # Simplistic logic
                        )
                        articles.append(article)
                    except ValidationError as ve:
                        logger.warning(f"Error validating CryptoPanic post: {ve}")
                        continue
                        
                return articles
                
            except httpx.HTTPError as exc:
                logger.error(f"CryptoPanic API error: {exc}")
                return []
            except Exception as exc:
                logger.error(f"Error parsing CryptoPanic response: {exc}")
                return []
