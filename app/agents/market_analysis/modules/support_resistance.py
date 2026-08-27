from typing import Any

from app.agents.market_analysis.schema import MarketData


class SupportResistanceAnalyzer:
    def analyze(self, market_data: MarketData) -> dict[str, Any]:
        price = market_data.price
        support = [round(price * 0.96, 2), round(price * 0.98, 2)]
        resistance = [round(price * 1.02, 2), round(price * 1.04, 2)]
        return {"support": support, "resistance": resistance}
