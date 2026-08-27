import math
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional, Tuple

from app.schemas.news import NewsArticleOut
from app.schemas.sentiment import SentimentAggregationOut, CombinedAnalysisOut
from app.schemas.technical_analysis import TechnicalAnalysisOut


class SentimentService:
    # Deterministic sentiment dictionary
    POSITIVE_TERMS = [
        "bullish",
        "growth",
        "profit",
        "profits",
        "beat expectations",
        "strong earnings",
        "revenue growth",
        "adoption",
        "partnership",
        "approval",
        "surge",
        "rally",
        "recovery",
        "record high",
        "outperform",
        "upgrade",
        "gain",
        "gains",
        "bull",
        "breakout",
    ]

    NEGATIVE_TERMS = [
        "bearish",
        "loss",
        "losses",
        "decline",
        "lawsuit",
        "hack",
        "breach",
        "rejection",
        "liquidation",
        "investigation",
        "fraud",
        "downgrade",
        "crash",
        "selloff",
        "bankruptcy",
        "risk",
        "warning",
        "bear",
        "fear",
        "dump",
    ]

    NEGATIONS = [
        "not",
        "no",
        "never",
        "without",
        "hardly",
        "isn't",
        "is not",
        "wasn't",
        "was not",
        "cannot",
        "won't",
        "doesn't",
        "don't",
        "didn't",
    ]

    INTENSITIES = {
        "extremely": Decimal("2.0"),
        "strongly": Decimal("1.8"),
        "significantly": Decimal("1.5"),
        "very": Decimal("1.5"),
        "highly": Decimal("1.5"),
        "slightly": Decimal("0.5"),
        "moderately": Decimal("0.7"),
        "weakly": Decimal("0.5"),
    }

    def analyze_text(self, text: str) -> Dict[str, Any]:
        """
        Analyze sentiment score, label, confidence, matched terms, and reasons for a given text.
        """
        text_lower = text.lower()
        score_sum = Decimal("0")
        total_matches = 0
        matched_terms = []
        reasons = []

        # Find all occurrences of positive terms
        for term in self.POSITIVE_TERMS:
            start = 0
            while True:
                idx = text_lower.find(term, start)
                if idx == -1:
                    break

                total_matches += 1
                matched_terms.append(term)
                term_score = Decimal("0.5")


                # Analyze context preceding this term (up to 3 words)
                preceding = text_lower[:idx].strip()
                preceding_words = preceding.split()[-3:] if preceding else []

                # Check negation
                negated = False
                for neg in self.NEGATIONS:
                    # Match exact negation word or a combined neg string like "is not"
                    if neg in preceding_words or (len(preceding_words) >= 2 and neg == f"{preceding_words[-2]} {preceding_words[-1]}"):
                        negated = True
                        break

                if negated:
                    term_score *= Decimal("-1.0")
                    reasons.append(f"Bullish indicator '{term}' negated.")
                else:
                    reasons.append(f"Bullish indicator '{term}' found.")

                # Check intensity
                for word in preceding_words:
                    if word in self.INTENSITIES:
                        term_score *= self.INTENSITIES[word]
                        reasons.append(f"Intensity modifier '{word}' applied to '{term}'.")
                        break

                score_sum += term_score
                start = idx + len(term)

        # Find all occurrences of negative terms
        for term in self.NEGATIVE_TERMS:
            start = 0
            while True:
                idx = text_lower.find(term, start)
                if idx == -1:
                    break

                total_matches += 1
                matched_terms.append(term)
                term_score = Decimal("-0.5")


                # Analyze context preceding this term
                preceding = text_lower[:idx].strip()
                preceding_words = preceding.split()[-3:] if preceding else []

                # Check negation
                negated = False
                for neg in self.NEGATIONS:
                    if neg in preceding_words or (len(preceding_words) >= 2 and neg == f"{preceding_words[-2]} {preceding_words[-1]}"):
                        negated = True
                        break

                if negated:
                    # Negating a negative results in a positive/neutral contribution
                    term_score *= Decimal("-1.0")
                    reasons.append(f"Bearish indicator '{term}' negated.")
                else:
                    reasons.append(f"Bearish indicator '{term}' found.")

                # Check intensity
                for word in preceding_words:
                    if word in self.INTENSITIES:
                        term_score *= self.INTENSITIES[word]
                        reasons.append(f"Intensity modifier '{word}' applied to '{term}'.")
                        break

                score_sum += term_score
                start = idx + len(term)

        # Calculate final sentiment score
        if total_matches > 0:
            final_score = score_sum / Decimal(str(total_matches))
        else:
            final_score = Decimal("0.0")

        # Bound score to [-1, 1]
        if final_score > Decimal("1.0"):
            final_score = Decimal("1.0")
        elif final_score < Decimal("-1.0"):
            final_score = Decimal("-1.0")

        # Confidence is higher with more matched indicators
        if total_matches == 0:
            confidence = Decimal("0.0")
            reasons.append("No sentiment indicators found in text.")
        else:
            confidence = Decimal("0.5") + Decimal("0.1") * Decimal(str(min(total_matches, 5)))
            if confidence > Decimal("1.0"):
                confidence = Decimal("1.0")

        # Classification label
        if final_score >= Decimal("0.20"):
            label = "positive"
        elif final_score <= Decimal("-0.20"):
            label = "negative"
        else:
            label = "neutral"

        return {
            "score": round(final_score, 4),
            "confidence": round(confidence, 2),
            "label": label,
            "matched_terms": matched_terms,
            "reasons": reasons,
        }


class SentimentAggregationService:
    def __init__(self, decay_lambda: float = 0.05):
        self.decay_lambda = decay_lambda
        self.sentiment_service = SentimentService()

    def aggregate_sentiment(self, symbol: str, articles: List[NewsArticleOut]) -> SentimentAggregationOut:
        """
        Aggregate sentiment score of multiple articles for a symbol using exponential time-decay weighting.
        """
        if not articles:
            return SentimentAggregationOut(
                symbol=symbol,
                article_count=0,
                positive_count=0,
                negative_count=0,
                neutral_count=0,
                average_sentiment=Decimal("0.00"),
                weighted_sentiment=Decimal("0.00"),
                average_confidence=Decimal("0.00"),
                sentiment_direction="neutral",
                sentiment_strength=Decimal("0.00"),
                latest_news_timestamp=None,
            )

        now = datetime.now(timezone.utc)
        latest_news_timestamp = max(a.published_at for a in articles)

        total_sentiment = Decimal("0")
        total_confidence = Decimal("0")
        weighted_sentiment_sum = Decimal("0")
        weight_sum = Decimal("0")

        pos_count = 0
        neg_count = 0
        neut_count = 0

        for a in articles:
            # Analyze each article (combine title and description)
            full_text = f"{a.title}. {a.description}"
            analysis = self.sentiment_service.analyze_text(full_text)

            score = Decimal(str(analysis["score"]))
            conf = Decimal(str(analysis["confidence"]))

            if analysis["label"] == "positive":
                pos_count += 1
            elif analysis["label"] == "negative":
                neg_count += 1
            else:
                neut_count += 1

            total_sentiment += score
            total_confidence += conf

            # Exponential decay weight calculation: w = exp(-lambda * age_hours)
            age_seconds = (now - a.published_at).total_seconds()
            age_hours = max(0.0, age_seconds / 3600.0)
            weight = math.exp(-self.decay_lambda * age_hours)
            dec_weight = Decimal(str(weight))

            weighted_sentiment_sum += score * dec_weight
            weight_sum += dec_weight

        # Computations
        avg_sentiment = total_sentiment / Decimal(str(len(articles)))
        avg_confidence = total_confidence / Decimal(str(len(articles)))

        if weight_sum > 0:
            weighted_sentiment = weighted_sentiment_sum / weight_sum
        else:
            weighted_sentiment = Decimal("0.00")

        # Bounding
        if weighted_sentiment > Decimal("1.0"):
            weighted_sentiment = Decimal("1.0")
        elif weighted_sentiment < Decimal("-1.0"):
            weighted_sentiment = Decimal("-1.0")

        # Classification thresholds
        if weighted_sentiment >= Decimal("0.20"):
            direction = "bullish"
        elif weighted_sentiment <= Decimal("-0.20"):
            direction = "bearish"
        else:
            direction = "neutral"

        strength = abs(weighted_sentiment)

        return SentimentAggregationOut(
            symbol=symbol,
            article_count=len(articles),
            positive_count=pos_count,
            negative_count=neg_count,
            neutral_count=neut_count,
            average_sentiment=round(avg_sentiment, 4),
            weighted_sentiment=round(weighted_sentiment, 4),
            average_confidence=round(avg_confidence, 2),
            sentiment_direction=direction,
            sentiment_strength=round(strength, 4),
            latest_news_timestamp=latest_news_timestamp,
        )


class IntelligenceIntegrationService:
    @classmethod
    def combine_signals(
        self, symbol: str, technical: TechnicalAnalysisOut, sentiment: SentimentAggregationOut
    ) -> CombinedAnalysisOut:
        """
        Integrates technical analysis signals and aggregated sentiment into a synthesized bias.
        """
        tech_sig = technical.signal.signal.upper()
        tech_conf = Decimal(str(technical.signal.confidence))
        sent_dir = sentiment.sentiment_direction.lower()
        sent_score = Decimal(str(sentiment.weighted_sentiment))
        sent_conf = Decimal(str(sentiment.average_confidence))

        reasons = []
        reasons.append(f"Technical signal is {tech_sig} with {tech_conf * 100:.0f}% confidence.")
        reasons.append(f"Market sentiment is {sent_dir.upper()} with score {sent_score:.2f}.")

        # Combined signal rules
        if tech_sig == "BUY" and sent_dir == "bullish":
            combined_bias = "STRONG_BUY"
            combined_conf = tech_conf * Decimal("0.7") + sent_conf * Decimal("0.3")
            reasons.append("Both technical indicators and news sentiment support a strong bullish outlook.")
        elif tech_sig == "BUY" and sent_dir == "bearish":
            combined_bias = "CAUTIOUS"
            combined_conf = abs(tech_conf - sent_conf)
            reasons.append("Technical signal suggests BUY, but market news sentiment is bearish. Divergence implies high caution.")
        elif tech_sig == "SELL" and sent_dir == "bearish":
            combined_bias = "STRONG_SELL"
            combined_conf = tech_conf * Decimal("0.7") + sent_conf * Decimal("0.3")
            reasons.append("Both technical indicators and news sentiment support a strong bearish outlook.")
        elif tech_sig == "SELL" and sent_dir == "bullish":
            combined_bias = "CAUTIOUS"
            combined_conf = abs(tech_conf - sent_conf)
            reasons.append("Technical signal suggests SELL, but market news sentiment is bullish. Divergence implies high caution.")
        elif tech_sig == "HOLD":
            combined_bias = "HOLD"
            combined_conf = tech_conf * Decimal("0.8") + sent_conf * Decimal("0.2")
            if sent_dir == "bullish":
                reasons.append("Technical indicators suggest HOLD, while news sentiment is slightly bullish.")
            elif sent_dir == "bearish":
                reasons.append("Technical indicators suggest HOLD, while news sentiment is slightly bearish.")
            else:
                reasons.append("Both technical indicators and news sentiment are neutral.")
        else:
            # Fallback alignment
            combined_bias = "HOLD"
            combined_conf = Decimal("0.5")
            reasons.append("Sentiment and technical indicators are mixed.")

        # Ensure confidence remains bounded
        if combined_conf > Decimal("1.0"):
            combined_conf = Decimal("1.0")
        elif combined_conf < Decimal("0.0"):
            combined_conf = Decimal("0.0")

        return CombinedAnalysisOut(
            symbol=symbol,
            technical_signal=technical.signal.signal,
            technical_confidence=tech_conf,
            sentiment_direction=sentiment.sentiment_direction,
            sentiment_score=sent_score,
            sentiment_confidence=sent_conf,
            combined_bias=combined_bias,
            combined_confidence=round(combined_conf, 2),
            reasons=reasons,
        )
