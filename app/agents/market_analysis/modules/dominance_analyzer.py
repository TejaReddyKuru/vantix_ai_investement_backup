from typing import Any

from app.agents.market_analysis.schema import MarketData


class DominanceAnalyzer:
    def analyze(self, market_data: MarketData) -> dict[str, Any]:
        return {"btc_dominance": 55.0, "altcoin_season": False}
