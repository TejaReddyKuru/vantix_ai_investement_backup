from typing import Any


class MarketService:
    """Legacy placeholder in the repository root.

    The production implementation now lives in `app/services/market_service.py`.
    """

    def __init__(self, rest=None, websocket=None) -> None:
        self.rest = rest
        self.websocket = websocket

    async def get_market_snapshot(self, symbol: str) -> dict[str, Any]:
        # Legacy placeholder; do not use for live market analysis.
        return {}
