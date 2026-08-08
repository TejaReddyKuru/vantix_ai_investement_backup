from abc import ABC, abstractmethod
from typing import Any, Optional

from app.services.binance_service import BinanceService


class MarketProvider(ABC):
    @abstractmethod
    async def get_market_snapshot(self, symbol: str) -> dict[str, Any]:
        raise NotImplementedError()


class BinanceProvider(MarketProvider):
    def __init__(self, binance_service: Optional[BinanceService] = None) -> None:
        self._service = binance_service or BinanceService()

    async def get_market_snapshot(self, symbol: str) -> dict[str, Any]:
        return await self._service.get_market_data(symbol)


class MarketService:
    def __init__(self, provider: Optional[MarketProvider] = None) -> None:
        self.provider = provider or BinanceProvider()

    async def get_market_snapshot(self, symbol: str) -> dict[str, Any]:
        return await self.provider.get_market_snapshot(symbol)
