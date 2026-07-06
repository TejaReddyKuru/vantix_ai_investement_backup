from typing import Any


class MarketService:
    def __init__(self, rest=None, websocket=None) -> None:
        self.rest = rest
        self.websocket = websocket

    async def get_market_snapshot(self, symbol: str) -> dict[str, Any]:
        # unify REST and WS data
        return {}
