from typing import Any


class BinanceREST:
    async def get_historical_candles(self, symbol: str, timeframe: str = "1h") -> list[dict[str, Any]]:
        raise NotImplementedError()

    async def get_ticker(self, symbol: str) -> dict[str, Any]:
        raise NotImplementedError()

    async def get_order_book(self, symbol: str) -> dict[str, Any]:
        raise NotImplementedError()
