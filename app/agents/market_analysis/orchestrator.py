from app.agents.market_analysis.pipeline import MarketAnalysisPipeline


class MarketAnalysisOrchestrator:
    def __init__(self, pipeline: MarketAnalysisPipeline | None = None) -> None:
        self.pipeline = pipeline or MarketAnalysisPipeline()

    async def analyze(self, symbol: str) -> dict[str, object]:
        analysis = await self.pipeline.analyze_symbol(symbol)
        return analysis.model_dump()
