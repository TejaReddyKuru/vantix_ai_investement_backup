from typing import Any

from app.core.config import settings


class MarketHealthAnalyzer:
    def score(self, module_outputs: dict[str, Any]) -> dict[str, Any]:
        trend = module_outputs["trend"]["strength"] if isinstance(module_outputs["trend"], dict) else 50
        volume = module_outputs["volume"]["relative_volume"] if isinstance(module_outputs["volume"], dict) else 50
        structure = 70 if "bullish" in str(module_outputs["structure"].get("signal", "")) else 50
        liquidity = 75 if module_outputs["liquidity"].get("whale_detected") else 60
        volatility = 70 if module_outputs["volatility"].get("stability") == "stable" else 40
        dominance = 60 if not module_outputs["dominance"].get("altcoin_season") else 70
        market_score = int(
            (trend * settings.trend_weight)
            + (volume * settings.volume_weight)
            + (structure * settings.structure_weight)
            + (liquidity * settings.liquidity_weight)
            + (volatility * settings.volatility_weight)
            + (dominance * settings.dominance_weight)
        )
        market_score = max(0, min(100, market_score))
        if market_score >= 70:
            state = "bullish"
        elif market_score <= 40:
            state = "bearish"
        else:
            state = "neutral"
        confidence = max(40, min(95, int(market_score * 0.9)))
        return {"market_score": market_score, "confidence": confidence, "market_state": state}
