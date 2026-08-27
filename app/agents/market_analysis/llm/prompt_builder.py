from typing import Any


class PromptBuilder:
    def build(self, analysis: dict[str, Any]) -> str:
        return (
            "You are a market analyst. Explain this market snapshot in concise business language. "
            f"Symbol: {analysis.get('symbol')}; Trend: {analysis.get('trend')}; "
            f"Market score: {analysis.get('market_score')}; Confidence: {analysis.get('confidence')}; "
            f"Support: {analysis.get('support')}; Resistance: {analysis.get('resistance')}."
        )
