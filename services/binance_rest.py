from typing import Any


class BinanceREST:
    """Legacy placeholder in the repository root.

    The main application uses `app/services/binance_service.py` and the
    `app/services/market_service.py` abstraction.
    """

    async def get_historical_candles(self, symbol: str, timeframe: str = "1h") -> list[dict[str, Any]]:
        raise NotImplementedError()

    async def get_ticker(self, symbol: str) -> dict[str, Any]:
        raise NotImplementedError()

    async def get_order_book(self, symbol: str) -> dict[str, Any]:
        raise NotImplementedError()
