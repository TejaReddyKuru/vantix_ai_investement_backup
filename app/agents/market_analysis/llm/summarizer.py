from typing import Any

from app.agents.market_analysis.llm.prompt_builder import PromptBuilder


class LlmSummarizer:
    def __init__(self) -> None:
        self.prompt_builder = PromptBuilder()

    async def summarize(self, analysis: dict[str, Any]) -> str:
        prompt = self.prompt_builder.build(analysis)
        return (
            f"Market condition: {analysis.get('market_state', 'uncertain')}. "
            f"Reasoning: {prompt}. Key levels: support {analysis.get('support')} and resistance {analysis.get('resistance')}. "
            "Risk notes: monitor for volatility expansion and breakout confirmation."
        )
