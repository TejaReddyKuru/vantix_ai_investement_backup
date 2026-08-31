from app.schemas.ahna import NewsAgentOut
from app.services.cryptopanic_service import CryptoPanicService
from app.services.market_data_provider import MarketDataRouter
from app.core.logger import get_logger

logger = get_logger(__name__)

class NewsAgent:
    def __init__(self):
        self.cryptopanic = CryptoPanicService()
        self.router = MarketDataRouter()

    async def analyze(self, symbol: str) -> NewsAgentOut:
        try:
            asset_type = self.router.classify_asset(symbol)
            if asset_type == "stock":
                logger.info(f"Skipping CryptoPanic news fetch for stock asset: {symbol}")
                return NewsAgentOut(symbol=symbol, articles=[], total=0)

            articles = await self.cryptopanic.get_news(symbol, limit=20)
            return NewsAgentOut(
                symbol=symbol,
                articles=articles,
                total=len(articles)
            )
        except Exception as e:
            logger.error(f"NewsAgent failed to analyze {symbol}: {e}")
            # Fail gracefully returning empty news
            return NewsAgentOut(
                symbol=symbol,
                articles=[],
                total=0
            )
