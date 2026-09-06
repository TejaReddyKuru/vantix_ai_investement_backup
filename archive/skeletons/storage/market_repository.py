from typing import Any


class MarketRepository:
    """Simple storage adapter placeholder. Replace with DB-backed repo later."""

    def __init__(self) -> None:
        self._cache: dict[str, Any] = {}

    async def upsert_market(self, symbol: str, payload: dict[str, Any]) -> None:
        self._cache[symbol] = payload

    async def get_market(self, symbol: str) -> dict[str, Any] | None:
        return self._cache.get(symbol)
