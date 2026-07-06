from typing import Any

from app.agents.market_analysis.schema import MarketData


class BreakoutDetector:
    def detect(self, market_data: MarketData) -> dict[str, Any]:
        change = abs(market_data.change_24h)
        pattern = "range" if change < 2 else "channel"
        probability = min(100, int(change * 6))
        return {"pattern": pattern, "probability": probability}
