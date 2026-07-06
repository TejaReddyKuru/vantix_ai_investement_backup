from typing import Any

from app.agents.market_analysis.schema import MarketData


class VolatilityAnalyzer:
    def analyze(self, market_data: MarketData) -> dict[str, Any]:
        change = abs(market_data.change_24h)
        atr = change * 0.75
        stability = max(0, min(100, 100 - int(change * 2)))
        return {"atr": atr, "stability": f"stable" if stability > 60 else "volatile"}
