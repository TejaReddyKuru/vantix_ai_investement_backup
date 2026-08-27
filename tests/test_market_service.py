import asyncio

from app.services.market_service import MarketProvider, MarketService


class DummyProvider(MarketProvider):
    async def get_market_snapshot(self, symbol: str) -> dict[str, object]:
        return {"symbol": symbol, "price": 123.0, "candles": {}, "order_book": {}, "volume_24h": 0.0, "change_24h": 0.0}


def test_market_service_uses_provider() -> None:
    provider = DummyProvider()
    service = MarketService(provider=provider)
    result = asyncio.run(service.get_market_snapshot("TESTSYM"))

    assert result["symbol"] == "TESTSYM"
    assert provider is service.provider
