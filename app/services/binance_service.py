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
        url = f"{self.base_url}{path}"
        last_error: Exception | None = None
        for attempt in range(3):
            try:
                client = self.get_client(self.timeout)
                response = await client.get(url, params=params)
                response.raise_for_status()
                await asyncio.sleep(self.rate_limit_delay)
                return response.json()
            except httpx.HTTPError as exc:
                last_error = exc
                logger.warning("Binance request failed (attempt {attempt}/{total}): {error}", attempt=attempt + 1, total=3, error=exc)
                await asyncio.sleep(0.5 * (attempt + 1))
        raise BinanceServiceError(f"Binance request failed: {last_error}") from last_error

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
