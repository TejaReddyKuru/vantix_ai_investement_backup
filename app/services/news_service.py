import hashlib
from abc import ABC, abstractmethod
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional
from uuid import uuid4, UUID

from app.schemas.news import NewsArticleOut


class NewsProvider(ABC):
    @abstractmethod
    async def fetch_news(self, symbol: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Fetch news articles for the given symbol.
        Returns a list of raw dictionaries containing article details.
        """
        pass


class MockNewsProvider(NewsProvider):
    """
    A deterministic news provider returning realistic structured mock news objects.
    Produces symbol-specific articles with relative timezone-aware timestamps.
    """

    async def fetch_news(self, symbol: str, limit: int = 10) -> List[Dict[str, Any]]:
        symbol_upper = symbol.upper()
        now = datetime.now(timezone.utc)

        # Base templates for popular symbols
        btc_templates = [
            {
                "title": "Bitcoin Hits New All-Time High Amid Institutional Buying",
                "description": "Bitcoin continues its bullish run as institutional demand drives prices higher. Analysts expect the rally to test $100k.",
                "source": "CoinDesk",
                "author": "Alice Smith",
                "published_offset_hours": 1,
            },
            {
                "title": "Regulatory Concerns Loom over Cryptocurrency Markets",
                "description": "Regulators warn of stricter guidelines for digital assets, causing temporary market pullbacks.",
                "source": "Bloomberg",
                "author": "Bob Jones",
                "published_offset_hours": 6,
            },
            {
                "title": "Bitcoin Hashrate Reaches Record Levels as Miners Upgrade",
                "description": "Network security hits all-time high as miners install more efficient hardware globally.",
                "source": "Bitcoin Magazine",
                "author": "Charlie Brown",
                "published_offset_hours": 12,
            },
            {
                "title": "Minor Selloff Observed in Bitcoin Short-term Holders",
                "description": "Profit taking near key resistance levels triggers temporary pullback, but support remains strong.",
                "source": "Decrypt",
                "author": "Diana Prince",
                "published_offset_hours": 24,
            },
        ]

        eth_templates = [
            {
                "title": "Ethereum Gas Fees Plummet to Multi-Year Lows",
                "description": "Layer 2 adoption reduces mainnet congestion, making Ethereum transaction costs more accessible than ever.",
                "source": "Decrypt",
                "author": "Evan Wright",
                "published_offset_hours": 2,
            },
            {
                "title": "Security Vulnerability Patched in Popular Ethereum Smart Contract",
                "description": "Developers successfully patched a critical bug before hackers could exploit it, preserving millions in user funds.",
                "source": "The Defiant",
                "author": "Fiona Gallagher",
                "published_offset_hours": 8,
            },
            {
                "title": "Ethereum Staking Reaches 30 Million ETH Milestone",
                "description": "Staking yield remains highly attractive as long-term investors lock up capital to secure the network.",
                "source": "CoinTelegraph",
                "author": "Greg House",
                "published_offset_hours": 18,
            },
        ]

        generic_templates = [
            {
                "title": f"New Integration Boosts utility of {symbol_upper} Assets",
                "description": f"Market updates indicate growing developer interest in {symbol_upper} platforms this quarter.",
                "source": "CryptoNews",
                "author": "Hannah Abbott",
                "published_offset_hours": 4,
            },
            {
                "title": f"Volatility Warnings Issued for {symbol_upper} Traders",
                "description": f"Leverage washouts trigger rapid price movements in {symbol_upper} pairs.",
                "source": "MarketWatch",
                "author": "Ian Malcolm",
                "published_offset_hours": 10,
            },
        ]

        if "BTC" in symbol_upper:
            templates = btc_templates
        elif "ETH" in symbol_upper:
            templates = eth_templates
        else:
            templates = generic_templates

        articles = []
        for i, t in enumerate(templates[:limit]):
            pub_time = now - timedelta(hours=t["published_offset_hours"])
            articles.append(
                {
                    "title": t["title"],
                    "description": t["description"],
                    "source": t["source"],
                    "author": t["author"],
                    "url": f"https://mocknews.example.com/{symbol_upper.lower()}/{i}",
                    "image_url": f"https://mocknews.example.com/images/{symbol_upper.lower()}_{i}.png",
                    "published_at": pub_time.isoformat(),
                    "symbol": symbol_upper,
                    "language": "en",
                }
            )

        return articles


class NewsService:
    def __init__(self, provider: Optional[NewsProvider] = None):
        self.provider = provider or MockNewsProvider()

    def _calculate_relevance(self, symbol: str, title: str, description: str) -> Decimal:
        """
        Calculate deterministic relevance score from 0.0 to 1.0.
        """
        symbol_clean = symbol.upper().replace("USDT", "")
        title_upper = title.upper()
        desc_upper = description.upper()

        # Check for symbol or common synonyms
        synonyms = [symbol_clean]
        if symbol_clean == "BTC":
            synonyms.append("BITCOIN")
        elif symbol_clean == "ETH":
            synonyms.append("ETHEREUM")

        for syn in synonyms:
            if syn in title_upper:
                return Decimal("1.00")
            elif syn in desc_upper:
                return Decimal("0.80")
        return Decimal("0.50")


    async def fetch_and_normalize_news(self, symbol: str, limit: int = 10) -> List[NewsArticleOut]:
        """
        Fetch news from the provider, validate, deduplicate in O(n), compute relevance,
        and return sorted normalized articles.
        """
        symbol_upper = symbol.upper()
        try:
            raw_articles = await self.provider.fetch_news(symbol_upper, limit)
        except Exception as exc:
            # Re-raise standard provider exception
            raise RuntimeError(f"News provider failed to fetch data: {exc}")

        if not raw_articles:
            return []

        normalized = []
        seen_hashes = set()

        for raw in raw_articles:
            title = raw.get("title")
            description = raw.get("description")
            source = raw.get("source")
            url = raw.get("url")
            pub_at_str = raw.get("published_at")

            # Basic Validation
            if not title or not description or not source or not url or not pub_at_str:
                continue

            pub_at_str_clean = pub_at_str
            if pub_at_str_clean.endswith("Z"):
                pub_at_str_clean = pub_at_str_clean[:-1] + "+00:00"
            try:
                published_at = datetime.fromisoformat(pub_at_str_clean)
                if published_at.tzinfo is None:
                    published_at = published_at.replace(tzinfo=timezone.utc)
            except ValueError:
                continue


            # O(n) Deduplication using hash of title & description
            content_str = f"{title.strip()}:{description.strip()}"
            content_hash = hashlib.sha256(content_str.encode("utf-8")).hexdigest()

            if content_hash in seen_hashes:
                continue
            seen_hashes.add(content_hash)

            relevance = self._calculate_relevance(symbol_upper, title, description)

            article = NewsArticleOut(
                id=uuid4(),
                source=source,
                title=title,
                description=description,
                url=url,
                image_url=raw.get("image_url"),
                published_at=published_at,
                symbol=symbol_upper,
                author=raw.get("author"),
                language=raw.get("language", "en"),
                relevance_score=relevance,
            )
            normalized.append(article)

        # Sort by published_at descending
        normalized.sort(key=lambda x: x.published_at, reverse=True)
        return normalized
