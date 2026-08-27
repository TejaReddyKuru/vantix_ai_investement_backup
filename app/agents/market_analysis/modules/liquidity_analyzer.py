from typing import Any

from app.agents.market_analysis.schema import MarketData


class LiquidityAnalyzer:
    def analyze(self, market_data: MarketData) -> dict[str, Any]:
        bids = market_data.order_book.get("bids", [])
        asks = market_data.order_book.get("asks", [])
        wall_size = len(bids) + len(asks)
        whale_detected = wall_size > 10
        liquidity_zones = [round(market_data.price * 0.98, 2), round(market_data.price * 1.02, 2)]
        return {
            "wall_size": wall_size,
            "whale_detected": whale_detected,
            "liquidity_zones": liquidity_zones,
        }
