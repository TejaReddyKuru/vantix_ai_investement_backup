import asyncio
from typing import Any

import httpx

from app.core.config import settings
from app.core.exceptions import BinanceServiceError
from app.core.logger import get_logger

logger = get_logger(__name__)


class BinanceService:
    _shared_client: httpx.AsyncClient | None = None
    _client_loop_id: int | None = None

    FALLBACK_URLS = [
        "https://data-api.binance.vision",
        "https://api.binance.com",
        "https://api1.binance.com",
        "https://api.binance.us",
    ]

    def __init__(self, base_url: str | None = None, timeout: float | None = None) -> None:
        self.base_url = base_url or settings.binance_api_base_url
        self.timeout = timeout or settings.binance_timeout
        self.rate_limit_delay = settings.binance_rate_limit_delay

    @classmethod
    def get_client(cls, timeout: float) -> httpx.AsyncClient:
        try:
            loop_id = id(asyncio.get_running_loop())
        except RuntimeError:
            loop_id = None
            
        if cls._shared_client is None or cls._shared_client.is_closed or cls._client_loop_id != loop_id:
            cls._shared_client = httpx.AsyncClient(timeout=timeout)
            cls._client_loop_id = loop_id
        return cls._shared_client

    async def _request(self, path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        candidate_urls = [self.base_url]
        for fb in self.FALLBACK_URLS:
            if fb not in candidate_urls:
                candidate_urls.append(fb)

        last_error: Exception | None = None

        for base in candidate_urls:
            url = f"{base}{path}"
            for attempt in range(2):
                try:
                    client = self.get_client(self.timeout)
                    response = await client.get(url, params=params)
                    if response.status_code == 451:
                        logger.warning(f"Binance endpoint {base} returned 451 (geoblocked/restricted), falling back to alternative...")
                        break
                    response.raise_for_status()
                    await asyncio.sleep(self.rate_limit_delay)
                    if self.base_url != base:
                        logger.info(f"Switched active Binance endpoint to {base}")
                        self.base_url = base
                    return response.json()
                except httpx.HTTPStatusError as exc:
                    last_error = exc
                    if exc.response.status_code in (451, 403):
                        logger.warning(f"Binance endpoint {base} failed with HTTP {exc.response.status_code}, switching to next candidate.")
                        break
                    logger.warning("Binance request failed on {base} (attempt {attempt}/{total}): {error}", base=base, attempt=attempt + 1, total=2, error=exc)
                    await asyncio.sleep(0.3 * (attempt + 1))
                except httpx.HTTPError as exc:
                    last_error = exc
                    logger.warning("Binance request failed on {base} (attempt {attempt}/{total}): {error}", base=base, attempt=attempt + 1, total=2, error=exc)
                    await asyncio.sleep(0.3 * (attempt + 1))
                except Exception as exc:
                    last_error = exc
                    break

        raise BinanceServiceError(f"Binance request failed across all endpoints: {last_error}") from last_error

    async def get_current_price(self, symbol: str) -> float:
        data = await self._request("/api/v3/ticker/price", {"symbol": symbol})
        return float(data["price"])

    async def get_24h_stats(self, symbol: str) -> dict[str, Any]:
        return await self._request("/api/v3/ticker/24hr", {"symbol": symbol})

    async def get_ohlcv(self, symbol: str, interval: str = "1h") -> list[list[float]]:
        return await self._request("/api/v3/klines", {"symbol": symbol, "interval": interval, "limit": 200})

    async def get_order_book(self, symbol: str, limit: int = 20) -> dict[str, Any]:
        return await self._request("/api/v3/depth", {"symbol": symbol, "limit": limit})

    async def get_market_data(self, symbol: str) -> dict[str, Any]:
        price_task = self.get_current_price(symbol)
        stats_task = self.get_24h_stats(symbol)
        order_book_task = self.get_order_book(symbol)
        candles_task = self.get_ohlcv(symbol, "1h")
        price, stats, order_book, candles = await asyncio.gather(
            price_task, stats_task, order_book_task, candles_task
        )
        return {
            "symbol": symbol,
            "price": price,
            "candles": {"1h": candles},
            "order_book": order_book,
            "volume_24h": float(stats.get("volume", 0)),
            "change_24h": float(stats.get("priceChangePercent", 0)),
        }
