from typing import Any

from app.agents.market_analysis.schema import MarketData


class MarketStructureAnalyzer:
    def analyze(self, market_data: MarketData) -> dict[str, Any]:
        change = market_data.change_24h
        if change > 2:
            signal = "bullish structure"
        elif change < -2:
            signal = "bearish structure"
        else:
            signal = "range-bound"
        return {"signal": signal}
