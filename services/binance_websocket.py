from typing import Any


class BinanceWebsocket:
    """Legacy placeholder in the repository root.

    Websocket support is intentionally not implemented yet.
    """

    async def connect(self) -> None:
        raise NotImplementedError()

    async def subscribe(self, symbol: str) -> None:
        raise NotImplementedError()
