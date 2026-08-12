import asyncio
from typing import Any, Dict, List, Optional
from decimal import Decimal

from app.agents.base_agent import BaseAgent
from app.agents.context import AgentContext
from app.services.technical_analysis_service import TechnicalAnalysisService


def _run_async(coro):
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as pool:
            return pool.submit(asyncio.run, coro).result()
    else:
        return asyncio.run(coro)


class TechnicalAgent(BaseAgent):
    """
    Technical Analysis Agent: Runs technical indicators (SMA, EMA, RSI, MACD, Bollinger Bands, ATR, ADX)
    and trend analysis on candles. Stores results in AgentContext.technical_analysis.
    """

    name: str = "TechnicalAgent"
    description: str = "Runs technical indicators and market trend analysis"
    version: str = "1.0.0"
    priority: int = 90
    dependencies: List[str] = []

    def __init__(self, service: Optional[TechnicalAnalysisService] = None) -> None:
        self.service = service or TechnicalAnalysisService()

    def validate(self, context: AgentContext) -> bool:
        symbol = context.get("symbol")
        return bool(symbol and isinstance(symbol, str))

    def execute(self, context: AgentContext) -> Dict[str, Any]:
        symbol = context.get("symbol", "BTCUSDT")
        interval = context.get("interval", "1h")
        klines = context.get("klines")

        if klines is None:
            # Generate default sample klines if none provided in context
            base_time = 1700000000000
            klines = []
            price = Decimal("50000.00")
            for i in range(250):
                t = base_time + (i * 3600000)
                p_open = price + Decimal(str(i % 10 - 5))
                p_high = p_open + Decimal("20.00")
                p_low = p_open - Decimal("20.00")
                p_close = p_open + Decimal("5.00")
                vol = Decimal("10.5")
                klines.append([t, str(p_open), str(p_high), str(p_low), str(p_close), str(vol)])

        result = _run_async(self.service.analyze(symbol, interval, klines))
        res_dict = result.model_dump() if hasattr(result, "model_dump") else dict(result)

        context.technical_analysis = res_dict
        return {"technical_analysis": res_dict}
