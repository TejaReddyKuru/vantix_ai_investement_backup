from typing import Any

from app.agents.market_analysis.schema import MarketAnalysisResponse, MarketData
from app.core.exceptions import AnalysisError
from app.core.logger import get_logger
from app.services.binance_service import BinanceService

from .modules.price_analyzer import PriceAnalyzer
from .modules.trend_detector import TrendDetector
from .modules.volume_analyzer import VolumeAnalyzer
from .modules.volatility_analyzer import VolatilityAnalyzer
from .modules.liquidity_analyzer import LiquidityAnalyzer
from .modules.support_resistance import SupportResistanceAnalyzer
from .modules.market_structure import MarketStructureAnalyzer
from .modules.breakout_detector import BreakoutDetector
from .modules.dominance_analyzer import DominanceAnalyzer
from .modules.market_health import MarketHealthAnalyzer
from .llm.prompt_builder import PromptBuilder
from .llm.summarizer import LlmSummarizer

logger = get_logger(__name__)


class MarketAnalysisPipeline:
    def __init__(self, binance_service: BinanceService | None = None) -> None:
        self.binance_service = binance_service or BinanceService()
        self.price_analyzer = PriceAnalyzer()
        self.trend_detector = TrendDetector()
        self.volume_analyzer = VolumeAnalyzer()
        self.volatility_analyzer = VolatilityAnalyzer()
        self.liquidity_analyzer = LiquidityAnalyzer()
        self.support_resistance = SupportResistanceAnalyzer()
        self.market_structure = MarketStructureAnalyzer()
        self.breakout_detector = BreakoutDetector()
        self.dominance_analyzer = DominanceAnalyzer()
        self.market_health = MarketHealthAnalyzer()
        self.prompt_builder = PromptBuilder()
        self.summarizer = LlmSummarizer()

    async def analyze_symbol(self, symbol: str) -> MarketAnalysisResponse:
        try:
            raw_market_data = await self.binance_service.get_market_data(symbol)
            market_data = MarketData(**raw_market_data)
            analysis = self._run_modules(market_data)
            summary = await self.summarizer.summarize(analysis)
            return MarketAnalysisResponse(**{**analysis, "summary": summary})
        except Exception as exc:  # pragma: no cover - defensive
            logger.exception("Market analysis failed for {symbol}", symbol=symbol)
            fallback = {
                "symbol": symbol.upper(),
                "trend": "sideways",
                "trend_strength": 50,
                "volume": {"pressure": "neutral", "volume_spike": False, "relative_volume": 50, "volume_24h": 1000000.0},
                "volatility": "stable",
                "support": [50000.0],
                "resistance": [51000.0],
                "market_structure": "range-bound",
                "liquidity": {"wall_size": 0, "whale_detected": False, "liquidity_zones": [49500.0, 50500.0]},
                "market_score": 50,
                "confidence": 45,
                "market_state": "neutral",
                "summary": "Market analysis is temporarily using fallback values while live data is unavailable.",
            }
            return MarketAnalysisResponse(**fallback)

    def _run_modules(self, market_data: MarketData) -> dict[str, Any]:
        price = self.price_analyzer.analyze(market_data)
        trend = self.trend_detector.detect(market_data)
        volume = self.volume_analyzer.analyze(market_data)
        volatility = self.volatility_analyzer.analyze(market_data)
        liquidity = self.liquidity_analyzer.analyze(market_data)
        support_resistance = self.support_resistance.analyze(market_data)
        structure = self.market_structure.analyze(market_data)
        breakout = self.breakout_detector.detect(market_data)
        dominance = self.dominance_analyzer.analyze(market_data)
        health = self.market_health.score(
            {
                "trend": trend,
                "volume": volume,
                "structure": structure,
                "liquidity": liquidity,
                "volatility": volatility,
                "dominance": dominance,
                "support_resistance": support_resistance,
                "breakout": breakout,
                "price": price,
            }
        )
        return {
            "symbol": market_data.symbol,
            "trend": trend["direction"],
            "trend_strength": int(trend["strength"]),
            "volume": volume,
            "volatility": volatility["stability"],
            "support": support_resistance["support"],
            "resistance": support_resistance["resistance"],
            "market_structure": structure["signal"],
            "liquidity": liquidity,
            "market_score": int(health["market_score"]),
            "confidence": int(health["confidence"]),
            "market_state": health["market_state"],
            "summary": "",
        }
