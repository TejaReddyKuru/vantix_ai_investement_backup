import numpy as np

from app.schemas.ahna import MarketAgentOut, RiskAgentOut
from app.core.logger import get_logger

logger = get_logger(__name__)

class RiskAgent:
    def _calculate_atr(self, candles: list) -> float:
        if not candles or len(candles) < 14:
            return 0.0
            
        tr_list = []
        for i in range(1, len(candles)):
            high = float(candles[i][2])
            low = float(candles[i][3])
            prev_close = float(candles[i-1][4])
            
            tr = max(
                high - low,
                abs(high - prev_close),
                abs(low - prev_close)
            )
            tr_list.append(tr)
            
        return sum(tr_list[-14:]) / 14 if len(tr_list) >= 14 else 0.0

    def _calculate_max_drawdown(self, candles: list) -> float:
        if not candles:
            return 0.0
            
        closes = np.array([float(c[4]) for c in candles])
        roll_max = np.maximum.accumulate(closes)
        drawdowns = (closes - roll_max) / roll_max
        return float(drawdowns.min() * 100) if len(drawdowns) > 0 else 0.0

    def analyze(self, market: MarketAgentOut) -> RiskAgentOut:
        try:
            candles = market.candles.get("1h", [])
            
            atr = self._calculate_atr(candles)
            max_drawdown = self._calculate_max_drawdown(candles)
            
            # Volatility approximation (annualized standard deviation of returns)
            volatility = 0.0
            if candles and len(candles) > 1:
                closes = np.array([float(c[4]) for c in candles])
                returns = np.diff(closes) / closes[:-1]
                volatility = float(np.std(returns) * np.sqrt(24 * 365))  # annualized assuming hourly

            # Risk score (0-100)
            score = 0.0
            if volatility > 0.8:
                score += 40
            elif volatility > 0.5:
                score += 20
                
            if max_drawdown < -20:
                score += 40
            elif max_drawdown < -10:
                score += 20
                
            if score < 30:
                level = "LOW"
            elif score < 60:
                level = "MEDIUM"
            else:
                level = "HIGH"

            regime = "CHOPPY"
            if market.indicators.get("macd", 0) > 0 and market.price > market.indicators.get("ema50", 0):
                regime = "BULLISH"
            elif market.indicators.get("macd", 0) < 0 and market.price < market.indicators.get("ema50", 0):
                regime = "BEARISH"

            # simplistic theoretical r/r
            risk_reward = 2.0 if level == "LOW" else 1.5 if level == "MEDIUM" else 0.8

            return RiskAgentOut(
                risk_score=min(100.0, score),
                risk_level=level,
                volatility=round(volatility, 3),
                max_drawdown=round(max_drawdown, 2),
                atr=round(atr, 2),
                risk_reward=risk_reward,
                market_regime=regime
            )
        except Exception as e:
            logger.error(f"RiskAgent failed: {e}")
            raise RuntimeError(f"RiskAgent failed: {e}")
