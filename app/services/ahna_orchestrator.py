import asyncio
from datetime import datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.logger import get_logger

from app.schemas.ahna import AHNAResponseOut, AgentStatus
from app.agents.market_agent import MarketAgent
from app.agents.news_agent import NewsAgent
from app.agents.sentiment_agent import SentimentAgent
from app.agents.feature_builder import FeatureBuilder
from app.agents.risk_agent import RiskAgent
from app.agents.trade_agent import TradeAgent
from app.services.ai_synthesis_service import AISynthesisService
from app.models.ahna_analysis import AHNAAnalysis

logger = get_logger(__name__)

class AHNAOrchestrator:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.market_agent = MarketAgent()
        self.news_agent = NewsAgent()
        self.sentiment_agent = SentimentAgent()
        self.feature_builder = FeatureBuilder()
        self.risk_agent = RiskAgent()
        self.trade_agent = TradeAgent()
        self.ai_synthesis = AISynthesisService()

    async def analyze(self, symbol: str, question: str, user_id: UUID) -> AHNAResponseOut:
        symbol = symbol.upper()
        
        # 1. Fetch independent external data concurrently
        market_task = self.market_agent.analyze(symbol)
        news_task = self.news_agent.analyze(symbol)
        
        market_res, news_res = await asyncio.gather(market_task, news_task, return_exceptions=True)
        
        # Determine status
        status = AgentStatus(market="success", news="success", sentiment="success", risk="success", trade="success")
        
        if isinstance(market_res, Exception):
            logger.error(f"Market agent failed: {market_res}")
            status.market = "error"
            # Cannot proceed without market data
            raise RuntimeError("Critical failure: Market data unavailable.")
            
        from app.schemas.ahna import NewsAgentOut, SentimentAgentOut
        
        if isinstance(news_res, Exception) or not news_res:
            logger.error(f"News agent failed or missing: {news_res}")
            status.news = "error" if isinstance(news_res, Exception) else "skipped"
            news_res = NewsAgentOut(symbol=symbol, articles=[], total=0)
            
        # 2. Sentiment (depends on News)
        if status.news == "success" and news_res.articles:
            sentiment_res = self.sentiment_agent.analyze(news_res)
        else:
            status.sentiment = "skipped"
            sentiment_res = SentimentAgentOut(
                symbol=symbol, score=0.0, label="NEUTRAL", confidence=0.0,
                bullish_count=0, bearish_count=0, neutral_count=0
            )

        # 3. Build Features (depends on Market, News, Sentiment)
        try:
            features_res = self.feature_builder.build(market_res, news_res, sentiment_res)
        except Exception as e:
            logger.error(f"Feature builder failed: {e}")
            raise RuntimeError("Critical failure: Feature building failed.")

        # 4. Risk and Trade logic (concurrent, purely mathematical)
        try:
            risk_res = self.risk_agent.analyze(market_res)
        except Exception as e:
            status.risk = "error"
            risk_res = None

        try:
            trade_res = self.trade_agent.analyze(features_res, risk_res)
        except Exception as e:
            status.trade = "error"
            trade_res = None

        # 5. AI Synthesis
        data_payload = {
            "market": market_res.model_dump(mode="json") if market_res else {},
            "news": news_res.model_dump(mode="json") if news_res else {},
            "sentiment": sentiment_res.model_dump(mode="json") if sentiment_res else {},
            "features": features_res.model_dump(mode="json") if features_res else {},
            "risk": risk_res.model_dump(mode="json") if risk_res else {},
            "trade": trade_res.model_dump(mode="json") if trade_res else {}
        }

        ai_response = await self.ai_synthesis.synthesize(symbol, question, data_payload, status)

        # 6. Database Persistence
        try:
            analysis_record = AHNAAnalysis(
                user_id=user_id,
                symbol=symbol,
                question=question,
                market_data=data_payload["market"],
                news_data=data_payload["news"],
                sentiment_data=data_payload["sentiment"],
                feature_data=data_payload["features"],
                risk_data=data_payload["risk"],
                trade_data=data_payload["trade"],
                ai_response=ai_response.model_dump(mode="json"),
                decision=ai_response.decision,
                confidence=ai_response.confidence,
                model_version=self.ai_synthesis.model
            )
            self.db.add(analysis_record)
            await self.db.commit()
        except Exception as e:
            logger.error(f"Failed to persist AHNA analysis: {e}")
            await self.db.rollback()

        return ai_response
