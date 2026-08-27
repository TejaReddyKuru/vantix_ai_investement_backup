from typing import Any

from app.agents.market_analysis.schema import MarketData


class TrendDetector:
    def detect(self, market_data: MarketData) -> dict[str, Any]:
        change = market_data.change_24h
        if change > 4:
            direction = "uptrend"
            strength = 85
        elif change < -4:
            direction = "downtrend"
            strength = 85
        elif change > 1.5:
            direction = "uptrend"
            strength = 70
        elif change < -1.5:
            direction = "downtrend"
            strength = 65
        else:
            direction = "sideways"
            strength = 50 + min(20, int(abs(change) * 8))
        return {"direction": direction, "strength": strength}
