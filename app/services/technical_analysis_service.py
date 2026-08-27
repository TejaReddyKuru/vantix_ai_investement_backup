from decimal import Decimal
from typing import Any, List, Optional, Tuple
from pydantic import BaseModel

from app.schemas.technical_analysis import (
    TechnicalIndicatorOut,
    TrendAnalysisOut,
    MomentumAnalysisOut,
    VolatilityAnalysisOut,
    SupportResistanceOut,
    TechnicalSignalOut,
    TechnicalAnalysisOut,
)


class Candle(BaseModel):
    timestamp: int
    open: Decimal
    high: Decimal
    low: Decimal
    close: Decimal
    volume: Decimal


class TechnicalAnalysisService:
    @classmethod
    def parse_klines(cls, klines: List[List[Any]]) -> List[Candle]:
        """
        Parse raw Binance klines (list of lists) into a validated list of Candle objects.
        """
        parsed = []
        for k in klines:
            if len(k) < 6:
                continue
            parsed.append(
                Candle(
                    timestamp=int(k[0]),
                    open=Decimal(str(k[1])),
                    high=Decimal(str(k[2])),
                    low=Decimal(str(k[3])),
                    close=Decimal(str(k[4])),
                    volume=Decimal(str(k[5])),
                )
            )
        return parsed

    def calculate_sma_series(self, prices: List[Decimal], period: int) -> List[Optional[Decimal]]:
        """
        Calculate Simple Moving Average (SMA) series.
        """
        sma = [None] * len(prices)
        if len(prices) < period:
            return sma

        current_sum = sum(prices[:period])
        sma[period - 1] = current_sum / Decimal(str(period))

        for i in range(period, len(prices)):
            current_sum = current_sum - prices[i - period] + prices[i]
            sma[i] = current_sum / Decimal(str(period))
        return sma

    def calculate_ema_series(self, prices: List[Decimal], period: int) -> List[Optional[Decimal]]:
        """
        Calculate Exponential Moving Average (EMA) series.
        """
        ema = [None] * len(prices)
        if len(prices) < period:
            return ema

        # Initial SMA is the first EMA value
        initial_sma = sum(prices[:period]) / Decimal(str(period))
        ema[period - 1] = initial_sma

        multiplier = Decimal("2") / (Decimal(str(period)) + Decimal("1"))

        for i in range(period, len(prices)):
            ema[i] = (prices[i] - ema[i - 1]) * multiplier + ema[i - 1]
        return ema

    def calculate_rsi_series(self, prices: List[Decimal], period: int = 14) -> List[Optional[Decimal]]:
        """
        Calculate Relative Strength Index (RSI) series using Wilder's smoothing.
        """
        rsi = [None] * len(prices)
        if len(prices) <= period:
            return rsi

        gains = [Decimal("0")] * len(prices)
        losses = [Decimal("0")] * len(prices)

        for i in range(1, len(prices)):
            change = prices[i] - prices[i - 1]
            if change > 0:
                gains[i] = change
            else:
                losses[i] = -change

        # Initial averages are simple averages (SMA)
        avg_gain = sum(gains[1 : period + 1]) / Decimal(str(period))
        avg_loss = sum(losses[1 : period + 1]) / Decimal(str(period))

        if avg_loss == 0:
            rsi[period] = Decimal("100") if avg_gain > 0 else Decimal("50")
        else:
            rs = avg_gain / avg_loss
            rsi[period] = Decimal("100") - (Decimal("100") / (Decimal("1") + rs))

        for i in range(period + 1, len(prices)):
            avg_gain = (avg_gain * Decimal(str(period - 1)) + gains[i]) / Decimal(str(period))
            avg_loss = (avg_loss * Decimal(str(period - 1)) + losses[i]) / Decimal(str(period))

            if avg_loss == 0:
                rsi[i] = Decimal("100") if avg_gain > 0 else Decimal("50")
            else:
                rs = avg_gain / avg_loss
                rsi[i] = Decimal("100") - (Decimal("100") / (Decimal("1") + rs))

        return rsi

    def calculate_macd_series(
        self, prices: List[Decimal]
    ) -> Tuple[List[Optional[Decimal]], List[Optional[Decimal]], List[Optional[Decimal]]]:
        """
        Calculate MACD (12, 26, 9) series.
        Returns (macd_line, signal_line, histogram)
        """
        ema12 = self.calculate_ema_series(prices, 12)
        ema26 = self.calculate_ema_series(prices, 26)

        macd_line = [None] * len(prices)
        for i in range(len(prices)):
            if ema12[i] is not None and ema26[i] is not None:
                macd_line[i] = ema12[i] - ema26[i]

        signal_line = [None] * len(prices)
        start_idx = -1
        for i in range(len(prices)):
            if macd_line[i] is not None:
                start_idx = i
                break

        if start_idx != -1 and len(prices) - start_idx >= 9:
            macd_valid = [macd_line[i] for i in range(start_idx, len(prices))]
            signal_valid = self.calculate_ema_series(macd_valid, 9)
            for i in range(len(signal_valid)):
                signal_line[start_idx + i] = signal_valid[i]

        histogram = [None] * len(prices)
        for i in range(len(prices)):
            if macd_line[i] is not None and signal_line[i] is not None:
                histogram[i] = macd_line[i] - signal_line[i]

        return macd_line, signal_line, histogram

    def calculate_bollinger_bands_series(
        self, prices: List[Decimal], period: int = 20, num_std: int = 2
    ) -> Tuple[List[Optional[Decimal]], List[Optional[Decimal]], List[Optional[Decimal]]]:
        """
        Calculate Bollinger Bands (20, 2) series.
        Returns (upper_band, middle_band, lower_band)
        """
        middle = self.calculate_sma_series(prices, period)
        upper = [None] * len(prices)
        lower = [None] * len(prices)

        for i in range(len(prices)):
            if middle[i] is not None:
                sub_prices = prices[i - period + 1 : i + 1]
                mean = middle[i]
                variance = sum((p - mean) ** 2 for p in sub_prices) / Decimal(str(period))
                std_dev = variance.sqrt()
                upper[i] = middle[i] + Decimal(str(num_std)) * std_dev
                lower[i] = middle[i] - Decimal(str(num_std)) * std_dev

        return upper, middle, lower

    def calculate_atr_series(self, candles: List[Candle], period: int = 14) -> List[Optional[Decimal]]:
        """
        Calculate Average True Range (ATR) series.
        """
        atr = [None] * len(candles)
        if len(candles) <= period:
            return atr

        tr = [Decimal("0")] * len(candles)
        for i in range(len(candles)):
            if i == 0:
                tr[i] = candles[i].high - candles[i].low
            else:
                val1 = candles[i].high - candles[i].low
                val2 = abs(candles[i].high - candles[i - 1].close)
                val3 = abs(candles[i].low - candles[i - 1].close)
                tr[i] = max(val1, val2, val3)

        # Initial ATR is SMA of TR
        atr[period] = sum(tr[1 : period + 1]) / Decimal(str(period))

        for i in range(period + 1, len(candles)):
            atr[i] = (atr[i - 1] * Decimal(str(period - 1)) + tr[i]) / Decimal(str(period))

        return atr

    def calculate_adx_series(
        self, candles: List[Candle], period: int = 14
    ) -> Tuple[List[Optional[Decimal]], List[Optional[Decimal]], List[Optional[Decimal]]]:
        """
        Calculate Wilder's Average Directional Index (ADX) 14 series.
        Returns (adx, plus_di, minus_di)
        """
        n = len(candles)
        adx = [None] * n
        plus_di = [None] * n
        minus_di = [None] * n

        if n < 2 * period:
            return adx, plus_di, minus_di

        tr = [Decimal("0")] * n
        plus_dm = [Decimal("0")] * n
        minus_dm = [Decimal("0")] * n

        for i in range(1, n):
            tr[i] = max(
                candles[i].high - candles[i].low,
                abs(candles[i].high - candles[i - 1].close),
                abs(candles[i].low - candles[i - 1].close),
            )
            up_move = candles[i].high - candles[i - 1].high
            down_move = candles[i - 1].low - candles[i].low

            if up_move > down_move and up_move > 0:
                plus_dm[i] = up_move
            else:
                plus_dm[i] = Decimal("0")

            if down_move > up_move and down_move > 0:
                minus_dm[i] = down_move
            else:
                minus_dm[i] = Decimal("0")

        # Initial sums
        tr_smooth = sum(tr[1 : period + 1])
        plus_dm_smooth = sum(plus_dm[1 : period + 1])
        minus_dm_smooth = sum(minus_dm[1 : period + 1])

        if tr_smooth > 0:
            plus_di[period] = (plus_dm_smooth / tr_smooth) * Decimal("100")
            minus_di[period] = (minus_dm_smooth / tr_smooth) * Decimal("100")
        else:
            plus_di[period] = Decimal("0")
            minus_di[period] = Decimal("0")

        dx = [None] * n
        if plus_di[period] + minus_di[period] > 0:
            dx[period] = abs(plus_di[period] - minus_di[period]) / (plus_di[period] + minus_di[period]) * Decimal("100")
        else:
            dx[period] = Decimal("0")

        for i in range(period + 1, n):
            tr_smooth = tr_smooth - (tr_smooth / Decimal(str(period))) + tr[i]
            plus_dm_smooth = plus_dm_smooth - (plus_dm_smooth / Decimal(str(period))) + plus_dm[i]
            minus_dm_smooth = minus_dm_smooth - (minus_dm_smooth / Decimal(str(period))) + minus_dm[i]

            if tr_smooth > 0:
                plus_di[i] = (plus_dm_smooth / tr_smooth) * Decimal("100")
                minus_di[i] = (minus_dm_smooth / tr_smooth) * Decimal("100")
            else:
                plus_di[i] = Decimal("0")
                minus_di[i] = Decimal("0")

            if plus_di[i] + minus_di[i] > 0:
                dx[i] = abs(plus_di[i] - minus_di[i]) / (plus_di[i] + minus_di[i]) * Decimal("100")
            else:
                dx[i] = Decimal("0")

        # Compute initial ADX (SMA of first 14 DX points)
        dx_subset = [dx[k] for k in range(period, 2 * period) if dx[k] is not None]
        if len(dx_subset) < period:
            return adx, plus_di, minus_di

        current_adx = sum(dx_subset) / Decimal(str(period))
        adx[2 * period - 1] = current_adx

        for i in range(2 * period, n):
            if dx[i] is not None:
                current_adx = ((current_adx * Decimal(str(period - 1))) + dx[i]) / Decimal(str(period))
                adx[i] = current_adx

        return adx, plus_di, minus_di

    def calculate_support_resistance(self, candles: List[Candle]) -> Tuple[Optional[Decimal], Optional[Decimal]]:
        """
        Calculate nearest technical support and resistance levels.
        """
        if len(candles) < 15:
            return None, None

        current_price = candles[-1].close
        supports = []
        resistances = []

        # Find local peaks/troughs in a window of 5 on each side
        for i in range(5, len(candles) - 5):
            window_highs = [candles[j].high for j in range(i - 5, i + 6)]
            window_lows = [candles[j].low for j in range(i - 5, i + 6)]

            if candles[i].high == max(window_highs):
                resistances.append(candles[i].high)
            if candles[i].low == min(window_lows):
                supports.append(candles[i].low)

        # Fallback to smaller window of 3 if nothing found
        if not supports or not resistances:
            for i in range(3, len(candles) - 3):
                window_highs = [candles[j].high for j in range(i - 3, i + 4)]
                window_lows = [candles[j].low for j in range(i - 3, i + 4)]

                if candles[i].high == max(window_highs):
                    resistances.append(candles[i].high)
                if candles[i].low == min(window_lows):
                    supports.append(candles[i].low)

        nearest_support = None
        nearest_resistance = None

        below = [s for s in supports if s < current_price]
        above = [r for r in resistances if r > current_price]

        if below:
            nearest_support = max(below)
        if above:
            nearest_resistance = min(above)

        return nearest_support, nearest_resistance

    def calculate_volatility(self, candles: List[Candle], atr_value: Optional[Decimal]) -> VolatilityAnalysisOut:
        """
        Classify asset volatility based on ATR percent and closing price standard deviation.
        """
        current_price = candles[-1].close
        closes = [c.close for c in candles[-20:]]
        period = len(closes)

        if period > 0:
            mean = sum(closes) / Decimal(str(period))
            variance = sum((c - mean) ** 2 for c in closes) / Decimal(str(period))
            std_dev = variance.sqrt()
        else:
            std_dev = Decimal("0")

        atr_pct = None
        if atr_value is not None and current_price > 0:
            atr_pct = (atr_value / current_price) * Decimal("100")

        vol_pct = atr_pct if atr_pct is not None else (std_dev / current_price * Decimal("100") if current_price > 0 else Decimal("0"))

        if vol_pct > Decimal("3.0"):
            classification = "high"
        elif vol_pct < Decimal("1.2"):
            classification = "low"
        else:
            classification = "medium"

        return VolatilityAnalysisOut(
            classification=classification,
            atr=atr_value,
            atr_pct=atr_pct,
            std_dev=std_dev,
        )

    def calculate_trend(
        self,
        current_price: Decimal,
        sma_50: Optional[Decimal],
        ema_9: Optional[Decimal],
        ema_21: Optional[Decimal],
        adx_value: Optional[Decimal],
    ) -> TrendAnalysisOut:
        """
        Classify trend direction and strength.
        """
        direction = "neutral"
        if ema_9 is not None and ema_21 is not None:
            if ema_9 > ema_21:
                if sma_50 is None or current_price > sma_50:
                    direction = "bullish"
            elif ema_9 < ema_21:
                if sma_50 is None or current_price < sma_50:
                    direction = "bearish"

        strength = Decimal("0.5")
        if adx_value is not None:
            strength = adx_value / Decimal("50.0")
            if strength > Decimal("1.0"):
                strength = Decimal("1.0")
            if strength < Decimal("0.0"):
                strength = Decimal("0.0")

        return TrendAnalysisOut(
            direction=direction,
            strength=strength,
        )

    def generate_signal(self, current_price: Decimal, indicators: TechnicalIndicatorOut) -> TechnicalSignalOut:
        """
        Generate a deterministic technical signal (BUY, SELL, HOLD) using a scored consensus approach.
        """
        score = 0
        total_weight = 0
        reasons = []

        # 1. EMA Crossover
        if indicators.ema_9 is not None and indicators.ema_21 is not None:
            total_weight += 1
            if indicators.ema_9 > indicators.ema_21:
                score += 1
                reasons.append("Short-term EMA crossover is bullish (EMA 9 > EMA 21).")
            elif indicators.ema_9 < indicators.ema_21:
                score -= 1
                reasons.append("Short-term EMA crossover is bearish (EMA 9 < EMA 21).")
            else:
                reasons.append("EMA 9 and EMA 21 are equal (neutral crossover).")

        # 2. SMA 50 Trend
        if indicators.sma_50 is not None:
            total_weight += 1
            if current_price > indicators.sma_50:
                score += 1
                reasons.append("Price is above SMA 50 (bullish trend).")
            elif current_price < indicators.sma_50:
                score -= 1
                reasons.append("Price is below SMA 50 (bearish trend).")
            else:
                reasons.append("Price is equal to SMA 50 (neutral trend).")


        # 3. MACD
        if indicators.macd_line is not None and indicators.macd_signal is not None and indicators.macd_hist is not None:
            total_weight += 1
            if indicators.macd_line > indicators.macd_signal and indicators.macd_hist > 0:
                score += 1
                reasons.append("MACD is bullish (line above signal and positive histogram).")
            elif indicators.macd_line < indicators.macd_signal and indicators.macd_hist < 0:
                score -= 1
                reasons.append("MACD is bearish (line below signal and negative histogram).")

        # 4. RSI
        if indicators.rsi_14 is not None:
            total_weight += 1
            if indicators.rsi_14 < 30:
                score += 1
                reasons.append("RSI is oversold (< 30), suggesting a potential upward reversal.")
            elif indicators.rsi_14 > 70:
                score -= 1
                reasons.append("RSI is overbought (> 70), suggesting a potential downward pullback.")
            else:
                reasons.append("RSI is neutral (30-70).")

        # 5. Bollinger Bands
        if indicators.bb_lower is not None and indicators.bb_upper is not None:
            total_weight += 1
            if current_price <= indicators.bb_lower:
                score += 1
                reasons.append("Price is below lower Bollinger Band (oversold).")
            elif current_price >= indicators.bb_upper:
                score -= 1
                reasons.append("Price is above upper Bollinger Band (overbought).")

        # 6. ADX / DI Trend
        if indicators.adx_14 is not None and indicators.plus_di is not None and indicators.minus_di is not None:
            if indicators.adx_14 > 25:
                total_weight += 1
                if indicators.plus_di > indicators.minus_di:
                    score += 1
                    reasons.append("ADX shows a strong bullish trend (+DI > -DI).")
                elif indicators.plus_di < indicators.minus_di:
                    score -= 1
                    reasons.append("ADX shows a strong bearish trend (-DI > +DI).")
                else:
                    reasons.append("ADX shows a strong trend but DIs are equal (neutral).")


        # Resolve signal based on consensus
        if total_weight > 0:
            avg_score = Decimal(str(score)) / Decimal(str(total_weight))
            # If average score is at least 0.33 (~ +2 out of 6 components) -> BUY
            if avg_score >= Decimal("0.33"):
                signal = "BUY"
                confidence = avg_score
            # If average score is at most -0.33 (~ -2 out of 6 components) -> SELL
            elif avg_score <= Decimal("-0.33"):
                signal = "SELL"
                confidence = abs(avg_score)
            else:
                signal = "HOLD"
                confidence = Decimal("1.0") - abs(avg_score)
        else:
            signal = "HOLD"
            confidence = Decimal("0.5")
            reasons.append("Insufficient indicator data to generate technical signal.")

        if confidence > Decimal("1.0"):
            confidence = Decimal("1.0")
        if confidence < Decimal("0.0"):
            confidence = Decimal("0.0")

        confidence = round(confidence, 2)

        return TechnicalSignalOut(
            signal=signal,
            confidence=confidence,
            reasons=reasons,
        )

    async def analyze(self, symbol: str, interval: str, klines: List[List[Any]]) -> TechnicalAnalysisOut:
        """
        Run the complete technical analysis suite dynamically on the provided candles.
        """
        candles = self.parse_klines(klines)
        if not candles:
            raise ValueError("No valid candle data parsed.")

        current_price = candles[-1].close
        timestamp = candles[-1].timestamp
        closes = [c.close for c in candles]

        # Calculate Indicators
        sma_20_series = self.calculate_sma_series(closes, 20)
        sma_50_series = self.calculate_sma_series(closes, 50)
        sma_200_series = self.calculate_sma_series(closes, 200)

        ema_9_series = self.calculate_ema_series(closes, 9)
        ema_21_series = self.calculate_ema_series(closes, 21)
        ema_50_series = self.calculate_ema_series(closes, 50)

        rsi_series = self.calculate_rsi_series(closes, 14)
        macd_line_series, macd_signal_series, macd_hist_series = self.calculate_macd_series(closes)
        bb_upper_series, bb_middle_series, bb_lower_series = self.calculate_bollinger_bands_series(closes, 20, 2)

        atr_series = self.calculate_atr_series(candles, 14)
        adx_series, plus_di_series, minus_di_series = self.calculate_adx_series(candles, 14)

        # Get latest values for indicator outputs
        indicators = TechnicalIndicatorOut(
            sma_20=sma_20_series[-1] if sma_20_series else None,
            sma_50=sma_50_series[-1] if sma_50_series else None,
            sma_200=sma_200_series[-1] if sma_200_series else None,
            ema_9=ema_9_series[-1] if ema_9_series else None,
            ema_21=ema_21_series[-1] if ema_21_series else None,
            ema_50=ema_50_series[-1] if ema_50_series else None,
            rsi_14=rsi_series[-1] if rsi_series else None,
            macd_line=macd_line_series[-1] if macd_line_series else None,
            macd_signal=macd_signal_series[-1] if macd_signal_series else None,
            macd_hist=macd_hist_series[-1] if macd_hist_series else None,
            bb_upper=bb_upper_series[-1] if bb_upper_series else None,
            bb_middle=bb_middle_series[-1] if bb_middle_series else None,
            bb_lower=bb_lower_series[-1] if bb_lower_series else None,
            atr_14=atr_series[-1] if atr_series else None,
            adx_14=adx_series[-1] if adx_series else None,
            plus_di=plus_di_series[-1] if plus_di_series else None,
            minus_di=minus_di_series[-1] if minus_di_series else None,
        )

        # Sub-analysis components
        trend = self.calculate_trend(
            current_price=current_price,
            sma_50=indicators.sma_50,
            ema_9=indicators.ema_9,
            ema_21=indicators.ema_21,
            adx_value=indicators.adx_14,
        )

        # Momentum Analysis
        price_change_pct = Decimal("0")
        if len(candles) >= 2:
            price_change_pct = (candles[-1].close - candles[-2].close) / candles[-2].close * Decimal("100")

        short_term_momentum = None
        if len(candles) >= 6:
            short_term_momentum = (candles[-1].close - candles[-6].close) / candles[-6].close * Decimal("100")

        medium_term_momentum = None
        if len(candles) >= 21:
            medium_term_momentum = (candles[-1].close - candles[-21].close) / candles[-21].close * Decimal("100")

        momentum = MomentumAnalysisOut(
            price_change_pct=price_change_pct,
            short_term_momentum=short_term_momentum,
            medium_term_momentum=medium_term_momentum,
        )

        volatility = self.calculate_volatility(candles, indicators.atr_14)

        # Support & Resistance
        sup, res = self.calculate_support_resistance(candles)
        sup_dist = None
        res_dist = None
        if sup is not None:
            sup_dist = (current_price - sup) / current_price * Decimal("100")
        if res is not None:
            res_dist = (res - current_price) / current_price * Decimal("100")

        support_resistance = SupportResistanceOut(
            support=sup,
            resistance=res,
            support_distance_pct=sup_dist,
            resistance_distance_pct=res_dist,
        )

        # Final signal
        signal = self.generate_signal(current_price, indicators)

        return TechnicalAnalysisOut(
            symbol=symbol,
            interval=interval,
            timestamp=timestamp,
            current_price=current_price,
            indicators=indicators,
            trend=trend,
            momentum=momentum,
            volatility=volatility,
            support_resistance=support_resistance,
            signal=signal,
        )
