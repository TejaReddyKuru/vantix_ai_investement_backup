from decimal import Decimal
from typing import Any, List, Optional, Tuple
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.asset import Asset
from app.models.paper_trading import PaperAccount, PaperPosition
from app.schemas.market_intelligence import MarketIntelligenceOut
from app.schemas.news import NewsArticleOut
from app.schemas.sentiment import SentimentAggregationOut
from app.schemas.technical_analysis import TechnicalAnalysisOut, TrendAnalysisOut
from app.services.binance_service import BinanceService
from app.services.news_service import NewsService
from app.services.portfolio_service import AccountNotFoundError, PortfolioService
from app.services.sentiment_service import SentimentAggregationService
from app.services.technical_analysis_service import TechnicalAnalysisService


class MarketIntelligenceService:
    def __init__(
        self,
        db: Optional[AsyncSession] = None,
        binance_service: Optional[BinanceService] = None,
        technical_service: Optional[TechnicalAnalysisService] = None,
        news_service: Optional[NewsService] = None,
        sentiment_service: Optional[SentimentAggregationService] = None,
    ) -> None:
        self.db = db
        self.binance_service = binance_service or BinanceService()
        self.technical_service = technical_service or TechnicalAnalysisService()
        self.news_service = news_service or NewsService()
        self.sentiment_service = sentiment_service or SentimentAggregationService()

    def calculate_technical_score(self, technical: TechnicalAnalysisOut) -> Decimal:
        """
        Calculate technical score based on Technical Analysis output.
        +5 * confidence for BUY, -5 * confidence for SELL, 0 for HOLD.
        Bounded in [-5.0, +5.0].
        """
        signal_upper = technical.signal.signal.upper()
        confidence = technical.signal.confidence

        if signal_upper == "BUY":
            score = Decimal("5.0") * confidence
        elif signal_upper == "SELL":
            score = Decimal("-5.0") * confidence
        else:
            score = Decimal("0.0")

        if score > Decimal("5.0"):
            score = Decimal("5.0")
        elif score < Decimal("-5.0"):
            score = Decimal("-5.0")

        return round(score, 4)

    def calculate_sentiment_score(self, sentiment: SentimentAggregationOut) -> Decimal:
        """
        Map aggregated sentiment score [-1, 1] into [-2, 2] scaled by confidence.
        Bounded in [-2.0, +2.0].
        """
        weighted_sentiment = sentiment.weighted_sentiment
        avg_confidence = sentiment.average_confidence

        score = weighted_sentiment * Decimal("2.0") * avg_confidence

        if score > Decimal("2.0"):
            score = Decimal("2.0")
        elif score < Decimal("-2.0"):
            score = Decimal("-2.0")

        return round(score, 4)

    def calculate_trend_score(self, trend: TrendAnalysisOut) -> Decimal:
        """
        Calculate trend score based on trend direction and strength.
        +1 * strength for bullish, -1 * strength for bearish, 0 for neutral.
        Bounded in [-1.0, +1.0].
        """
        direction = trend.direction.lower()
        strength = trend.strength

        # Ensure strength is bounded [0.0, 1.0]
        if strength > Decimal("1.0"):
            strength = Decimal("1.0")
        elif strength < Decimal("0.0"):
            strength = Decimal("0.0")

        if direction == "bullish":
            score = Decimal("1.0") * strength
        elif direction == "bearish":
            score = Decimal("-1.0") * strength
        else:
            score = Decimal("0.0")

        if score > Decimal("1.0"):
            score = Decimal("1.0")
        elif score < Decimal("-1.0"):
            score = Decimal("-1.0")

        return round(score, 4)

    def calculate_risk_penalty(
        self,
        drawdown: Decimal,
        exposure: Decimal,
        cash_ratio: Decimal,
    ) -> Decimal:
        """
        Calculate risk penalty based on portfolio state and configured risk limits.
        Penalty increases as portfolio metrics approach or exceed limits.
        Maximum penalty: -1.0.
        Bounded in [-1.0, 0.0].
        """
        max_drawdown = Decimal(str(settings.max_portfolio_drawdown)) * Decimal("100.0")
        max_position_exposure = Decimal(str(settings.max_position_exposure)) * Decimal("100.0")
        min_cash_reserve = Decimal(str(settings.min_cash_reserve))

        dd_penalty = Decimal("0.0")
        if max_drawdown > 0:
            if drawdown >= max_drawdown:
                dd_penalty = Decimal("0.5")
            elif drawdown >= max_drawdown * Decimal("0.5"):
                dd_penalty = ((drawdown - max_drawdown * Decimal("0.5")) / (max_drawdown * Decimal("0.5"))) * Decimal("0.5")

        exp_penalty = Decimal("0.0")
        if max_position_exposure > 0:
            if exposure >= max_position_exposure:
                exp_penalty = Decimal("0.3")
            elif exposure >= max_position_exposure * Decimal("0.5"):
                exp_penalty = ((exposure - max_position_exposure * Decimal("0.5")) / (max_position_exposure * Decimal("0.5"))) * Decimal("0.3")

        cash_penalty = Decimal("0.0")
        if min_cash_reserve > 0:
            if cash_ratio <= min_cash_reserve:
                cash_penalty = Decimal("0.2")
            elif cash_ratio <= min_cash_reserve * Decimal("2.0"):
                cash_penalty = ((min_cash_reserve * Decimal("2.0") - cash_ratio) / min_cash_reserve) * Decimal("0.2")

        total_penalty = dd_penalty + exp_penalty + cash_penalty
        risk_penalty = -min(Decimal("1.0"), max(Decimal("0.0"), total_penalty))

        return round(risk_penalty, 4)

    def resolve_signal(
        self,
        final_score: Decimal,
        technical_signal: str,
        technical_confidence: Decimal,
        sentiment_direction: str,
        sentiment_confidence: Decimal,
    ) -> Tuple[str, bool, Optional[str]]:
        """
        Resolve final signal based on score threshold and divergence rules.
        BUY: final_score >= +2.0
        SELL: final_score <= -2.0
        HOLD: Otherwise.
        Returns: (signal, divergence_detected, override_applied)
        """
        if final_score >= Decimal("2.0"):
            preliminary_signal = "BUY"
        elif final_score <= Decimal("-2.0"):
            preliminary_signal = "SELL"
        else:
            preliminary_signal = "HOLD"

        tech_upper = technical_signal.upper()
        sent_lower = sentiment_direction.lower()

        divergence_detected = False
        if (tech_upper == "BUY" and sent_lower == "bearish") or (tech_upper == "SELL" and sent_lower == "bullish"):
            divergence_detected = True

        override_applied = None
        final_sig = preliminary_signal

        if divergence_detected:
            # Overriding rules
            if technical_confidence > Decimal("0.85") and sentiment_confidence < Decimal("0.35"):
                override_applied = "technical_override"
                final_sig = preliminary_signal
            elif sentiment_confidence > Decimal("0.85") and technical_confidence < Decimal("0.35"):
                override_applied = "sentiment_override"
                final_sig = preliminary_signal
            else:
                final_sig = "HOLD"

        return final_sig, divergence_detected, override_applied

    def calculate_confidence(
        self,
        final_score: Decimal,
        technical_confidence: Decimal,
        sentiment_confidence: Decimal,
        trend_strength: Decimal,
        divergence_detected: bool,
        override_applied: Optional[str],
    ) -> Decimal:
        """
        Calculate final confidence rating between 0.0 and 1.0.
        Adjusted downward if strong divergence exists without overriding confidence.
        """
        baseline = abs(final_score) / Decimal("10.0")
        if baseline > Decimal("1.0"):
            baseline = Decimal("1.0")

        comp_conf = (technical_confidence + sentiment_confidence + trend_strength) / Decimal("3.0")
        combined_conf = baseline * Decimal("0.6") + comp_conf * Decimal("0.4")

        if divergence_detected and not override_applied:
            combined_conf = combined_conf * Decimal("0.5")

        if combined_conf > Decimal("1.0"):
            combined_conf = Decimal("1.0")
        elif combined_conf < Decimal("0.0"):
            combined_conf = Decimal("0.0")

        return round(combined_conf, 2)

    def build_reasons(
        self,
        technical_signal: str,
        technical_score: Decimal,
        sentiment_direction: str,
        sentiment_score: Decimal,
        trend_direction: str,
        trend_strength: Decimal,
        drawdown: Decimal,
        exposure: Decimal,
        cash_ratio: Decimal,
        risk_penalty: Decimal,
        divergence_detected: bool,
        override_applied: Optional[str],
        final_score: Decimal,
        signal: str,
    ) -> List[str]:
        """
        Build human-readable deterministic explanation reasons.
        """
        reasons = []
        reasons.append(f"Technical signal is {technical_signal} (component score: {technical_score:+.2f}).")
        reasons.append(f"Market news sentiment is {sentiment_direction} (component score: {sentiment_score:+.2f}).")
        reasons.append(f"Trend strength ({trend_strength:.2f}) supports {trend_direction} direction.")

        if risk_penalty < Decimal("0.0"):
            if drawdown >= Decimal(str(settings.max_portfolio_drawdown)) * Decimal("50.0"):
                reasons.append(f"Portfolio drawdown ({drawdown:.2f}%) contributes to risk penalty.")
            if exposure >= Decimal(str(settings.max_position_exposure)) * Decimal("50.0"):
                reasons.append(f"Position exposure ({exposure:.2f}%) contributes to risk penalty.")
            if cash_ratio <= Decimal(str(settings.min_cash_reserve)) * Decimal("2.0"):
                reasons.append(f"Low cash ratio ({cash_ratio:.2f}) contributes to risk penalty.")
            reasons.append(f"Applied risk penalty of {risk_penalty:.2f} to final score.")
        else:
            reasons.append("Portfolio risk metrics are within healthy limits.")

        if divergence_detected:
            if override_applied == "technical_override":
                reasons.append("Divergence detected: High technical confidence overrides opposing sentiment.")
            elif override_applied == "sentiment_override":
                reasons.append("Divergence detected: High sentiment confidence overrides opposing technical signal.")
            else:
                reasons.append("Technical and sentiment signals are divergent. Signal forced to HOLD.")

        reasons.append(f"Final intelligence score of {final_score:+.2f} yields a {signal} signal.")
        return reasons

    async def get_portfolio_metrics(self, user_id: Optional[UUID], symbol: str) -> Tuple[Decimal, Decimal, Decimal]:
        """
        Fetch portfolio drawdown, position exposure for symbol, and cash ratio for the user.
        If user_id is None, no DB session, or account not found, returns safe defaults.
        """
        default_dd = Decimal("0.0")
        default_exp = Decimal("0.0")
        default_cash_ratio = Decimal("1.0")

        if not user_id or not self.db:
            return default_dd, default_exp, default_cash_ratio

        portfolio_service = PortfolioService(self.db, self.binance_service)
        try:
            metrics = await portfolio_service.calculate_live_metrics(user_id)
            total_equity = metrics["total_equity"]
            cash = metrics["cash"]
            drawdown = metrics["drawdown"]
            account_id = metrics["account_id"]

            cash_ratio = cash / total_equity if total_equity > 0 else Decimal("1.0")

            # Calculate symbol position exposure
            exposure = Decimal("0.0")
            asset_stmt = select(Asset).where(Asset.symbol == symbol.upper())
            asset_res = await self.db.execute(asset_stmt)
            asset = asset_res.scalar_one_or_none()

            if asset:
                pos_stmt = select(PaperPosition).where(
                    PaperPosition.paper_account_id == account_id,
                    PaperPosition.asset_id == asset.id,
                )
                pos_res = await self.db.execute(pos_stmt)
                position = pos_res.scalar_one_or_none()

                if position and total_equity > 0:
                    current_price_val = await self.binance_service.get_current_price(symbol.upper())
                    current_price = Decimal(str(current_price_val))
                    pos_val = position.quantity * current_price
                    exposure = (pos_val / total_equity) * Decimal("100.0")

            return drawdown, exposure, cash_ratio

        except AccountNotFoundError:
            return default_dd, default_exp, default_cash_ratio
        except Exception:
            return default_dd, default_exp, default_cash_ratio

    async def analyze(
        self,
        symbol: str,
        interval: str = "1h",
        user_id: Optional[UUID] = None,
        klines: Optional[List[List[Any]]] = None,
        articles: Optional[List[NewsArticleOut]] = None,
    ) -> MarketIntelligenceOut:
        """
        Orchestrate Market Intelligence decision process across technical, sentiment,
        trend, and portfolio risk components.
        """
        symbol_upper = symbol.upper()

        # 1. Technical Analysis
        if klines is None:
            klines = await self.binance_service.get_ohlcv(symbol_upper, interval)

        technical = await self.technical_service.analyze(symbol_upper, interval, klines)

        # 2. News & Sentiment Analysis
        if articles is None:
            articles = await self.news_service.fetch_and_normalize_news(symbol_upper, 20)

        sentiment = self.sentiment_service.aggregate_sentiment(symbol_upper, articles)

        # 3. Portfolio Risk Metrics
        drawdown, exposure, cash_ratio = await self.get_portfolio_metrics(user_id, symbol_upper)

        # 4. Calculate Scores
        tech_score = self.calculate_technical_score(technical)
        sent_score = self.calculate_sentiment_score(sentiment)
        trend_score = self.calculate_trend_score(technical.trend)
        risk_penalty = self.calculate_risk_penalty(drawdown, exposure, cash_ratio)

        # 5. Calculate Final Score
        raw_final_score = tech_score + sent_score + trend_score + risk_penalty

        # Bounding [-10.0, +10.0]
        if raw_final_score > Decimal("10.0"):
            final_score = Decimal("10.0")
        elif raw_final_score < Decimal("-10.0"):
            final_score = Decimal("-10.0")
        else:
            final_score = raw_final_score

        final_score = round(final_score, 4)

        # 6. Resolve Signal & Divergence
        final_signal, divergence_detected, override_applied = self.resolve_signal(
            final_score=final_score,
            technical_signal=technical.signal.signal,
            technical_confidence=technical.signal.confidence,
            sentiment_direction=sentiment.sentiment_direction,
            sentiment_confidence=sentiment.average_confidence,
        )

        # 7. Confidence Rating
        confidence = self.calculate_confidence(
            final_score=final_score,
            technical_confidence=technical.signal.confidence,
            sentiment_confidence=sentiment.average_confidence,
            trend_strength=technical.trend.strength,
            divergence_detected=divergence_detected,
            override_applied=override_applied,
        )

        # 8. Reasons
        reasons = self.build_reasons(
            technical_signal=technical.signal.signal,
            technical_score=tech_score,
            sentiment_direction=sentiment.sentiment_direction,
            sentiment_score=sent_score,
            trend_direction=technical.trend.direction,
            trend_strength=technical.trend.strength,
            drawdown=drawdown,
            exposure=exposure,
            cash_ratio=cash_ratio,
            risk_penalty=risk_penalty,
            divergence_detected=divergence_detected,
            override_applied=override_applied,
            final_score=final_score,
            signal=final_signal,
        )

        return MarketIntelligenceOut(
            symbol=symbol_upper,
            timestamp=technical.timestamp,
            technical_signal=technical.signal.signal,
            technical_confidence=technical.signal.confidence,
            technical_score=tech_score,
            sentiment_direction=sentiment.sentiment_direction,
            sentiment_score=sent_score,
            sentiment_confidence=sentiment.average_confidence,
            trend_direction=technical.trend.direction,
            trend_strength=technical.trend.strength,
            risk_penalty=risk_penalty,
            portfolio_drawdown=drawdown,
            portfolio_exposure=exposure,
            cash_ratio=cash_ratio,
            final_score=final_score,
            signal=final_signal,
            confidence=confidence,
            divergence_detected=divergence_detected,
            reasons=reasons,
        )
