from typing import Any

from app.agents.market_analysis.schema import MarketData


class PriceAnalyzer:
    def analyze(self, market_data: MarketData) -> dict[str, Any]:
        price = market_data.price
        change = market_data.change_24h
        direction = "bullish" if change >= 0 else "bearish"
        momentum = min(100, int(abs(change) * 10))
        acceleration = max(-100, min(100, int(change * 8)))
        return {
            "price": price,
            "direction": direction,
            "momentum_strength": momentum,
            "acceleration": acceleration,
        }
