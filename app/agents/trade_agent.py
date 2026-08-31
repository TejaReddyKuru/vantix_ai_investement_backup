from app.schemas.ahna import FeatureBuilderOut, RiskAgentOut, TradeAgentOut, TradeAgentEntry
from app.core.logger import get_logger

logger = get_logger(__name__)

class TradeAgent:
    def analyze(self, features: FeatureBuilderOut, risk: RiskAgentOut) -> TradeAgentOut:
        try:
            # Very basic deterministic logic for demonstration
            price = features.price
            atr = risk.atr if risk.atr > 0 else (price * 0.01) # fallback 1% ATR
            
            signal = "WAIT"
            confidence = 50.0
            
            is_bullish = features.trend == "BULLISH" and features.technical["macd"] == "POSITIVE"
            is_bearish = features.trend == "BEARISH" and features.technical["macd"] == "NEGATIVE"
            
            if is_bullish and risk.risk_level in ["LOW", "MEDIUM"]:
                signal = "LONG"
                confidence = 75.0 if features.sentiment["label"] == "BULLISH" else 60.0
            elif is_bearish and risk.risk_level in ["LOW", "MEDIUM"]:
                signal = "SHORT"
                confidence = 75.0 if features.sentiment["label"] == "BEARISH" else 60.0
            elif risk.risk_level == "HIGH":
                signal = "HOLD"
                confidence = 80.0
                
            entry_min = price * 0.99
            entry_max = price * 1.01
            
            stop_loss = None
            take_profit = None
            
            if signal == "LONG":
                stop_loss = price - (2 * atr)
                take_profit = [price + (2 * atr), price + (4 * atr)]
            elif signal == "SHORT":
                stop_loss = price + (2 * atr)
                take_profit = [price - (2 * atr), price - (4 * atr)]

            return TradeAgentOut(
                symbol=features.symbol,
                signal=signal,
                confidence=confidence,
                entry=TradeAgentEntry(min=round(entry_min, 2), max=round(entry_max, 2)),
                stop_loss=round(stop_loss, 2) if stop_loss else None,
                take_profit=[round(tp, 2) for tp in take_profit] if take_profit else None,
                risk_reward=risk.risk_reward,
                strategy="trend_momentum"
            )
        except Exception as e:
            logger.error(f"TradeAgent failed: {e}")
            raise RuntimeError(f"TradeAgent failed: {e}")
