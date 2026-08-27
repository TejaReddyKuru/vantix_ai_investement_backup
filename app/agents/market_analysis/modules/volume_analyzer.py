from typing import Any

from app.agents.market_analysis.schema import MarketData


class VolumeAnalyzer:
    def analyze(self, market_data: MarketData) -> dict[str, Any]:
        volume = float(market_data.volume_24h)
        change = float(market_data.change_24h)
        pressure = "buy" if change >= 0 else "sell"

        recent_candles = market_data.candles.get("1h", [])
        typical_volume = 0.0
        if recent_candles:
            recent_volumes = [float(candle[5]) for candle in recent_candles if len(candle) > 5]
            if recent_volumes:
                typical_volume = sum(recent_volumes) / len(recent_volumes)

        if typical_volume > 0:
            relative_volume = min(100, int((volume / typical_volume) * 100 / 20))
        else:
            relative_volume = min(100, int(volume / 1_000_000))

        spike = volume > max(1_000_000.0, typical_volume * 1.5)
        return {
            "pressure": pressure,
            "volume_spike": spike,
            "relative_volume": relative_volume,
            "volume_24h": volume,
        }
