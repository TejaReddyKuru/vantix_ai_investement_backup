from typing import Any


class BinanceWebsocket:
    async def connect(self) -> None:
        raise NotImplementedError()

    async def subscribe(self, symbol: str) -> None:
        raise NotImplementedError()
