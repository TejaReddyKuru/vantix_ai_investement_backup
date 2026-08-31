from datetime import datetime, timezone
import numpy as np

from app.schemas.ahna import MarketAgentOut
from app.services.market_data_provider import MarketDataRouter
from app.core.logger import get_logger

logger = get_logger(__name__)

class MarketAgent:
    def __init__(self):
        self.router = MarketDataRouter()

    def _calculate_indicators(self, candles: list) -> dict:
        """
        Calculate basic technical indicators from 1h candles.
        Expected candle format: [timestamp, open, high, low, close, volume]
        """
        if not candles or len(candles) < 20:
            return {"rsi": 50.0, "ema20": 0.0, "ema50": 0.0, "macd": 0.0}

        closes = np.array([float(c[4]) for c in candles])
        
        # Simple EMA calculation
        def calc_ema(data, period):
            if len(data) < period:
                return data[-1]
            k = 2.0 / (period + 1)
            ema = data[0]
            for price in data[1:]:
                ema = price * k + ema * (1 - k)
            return ema

        ema20 = calc_ema(closes, 20)
        ema50 = calc_ema(closes, 50)
        
        # MACD (12, 26, 9)
        ema12 = calc_ema(closes, 12)
        ema26 = calc_ema(closes, 26)
        macd = ema12 - ema26

        # RSI (14)
        diff = np.diff(closes)
        up = diff[diff > 0].sum() if len(diff[diff > 0]) > 0 else 0
        down = -diff[diff < 0].sum() if len(diff[diff < 0]) > 0 else 0
        
        if down == 0:
            rsi = 100.0 if up > 0 else 50.0
        else:
            rs = up / down
            rsi = 100.0 - (100.0 / (1.0 + rs))

        return {
            "rsi": round(rsi, 2),
            "ema20": round(ema20, 2),
            "ema50": round(ema50, 2),
            "macd": round(macd, 2)
        }

    async def analyze(self, symbol: str) -> MarketAgentOut:
        data = await self.router.get_market_data(symbol)

        candles = data.get("candles", {}).get("1h", [])
        
        # Calculate 24h high/low from candles if not explicitly provided
        high_24h = data.get("high_24h", data.get("price", 0.0))
        low_24h = data.get("low_24h", data.get("price", 0.0))
        if candles and high_24h == 0.0:
            last_24 = candles[-24:] if len(candles) >= 24 else candles
            high_24h = max([float(c[2]) for c in last_24])
            low_24h = min([float(c[3]) for c in last_24])

        indicators = self._calculate_indicators(candles)

        return MarketAgentOut(
            symbol=symbol,
            price=data.get("price", 0.0),
            change_24h=data.get("change_24h", 0.0),
            volume_24h=data.get("volume_24h", 0.0),
            high_24h=high_24h,
            low_24h=low_24h,
            candles=data.get("candles", {"1h": []}),
            indicators=indicators,
            order_book=data.get("order_book", {"bids": [], "asks": []}),
            timestamp=datetime.now(timezone.utc),
            source=data.get("provider", "unknown"),
            provider=data.get("provider", "unknown"),
            asset_type=data.get("asset_type", "unknown"),
            data_quality=data.get("data_quality", "UNKNOWN")
        )
