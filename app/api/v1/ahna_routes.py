from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.security import get_current_user, get_optional_user
from app.models.user import User
from database.session import AsyncSessionLocal
from app.schemas.ahna import AHNAAnalysisRequest, AHNAResponseOut, MarketAgentOut, NewsAgentOut, SentimentAgentOut, RiskAgentOut, TradeAgentOut
from app.services.ahna_orchestrator import AHNAOrchestrator
from app.agents.market_agent import MarketAgent
from app.agents.news_agent import NewsAgent
from app.agents.sentiment_agent import SentimentAgent
from app.agents.risk_agent import RiskAgent
from app.agents.trade_agent import TradeAgent
from app.agents.feature_builder import FeatureBuilder

router = APIRouter(prefix="/ahna", tags=["ahna"])

@router.post("/analyze", response_model=AHNAResponseOut, summary="Run full AHNA intelligence pipeline")
async def analyze_symbol(
    request: AHNAAnalysisRequest,
    current_user: User | None = Depends(get_optional_user)
):
    async with AsyncSessionLocal() as db:
        orchestrator = AHNAOrchestrator(db)
        try:
            user_id = current_user.id if current_user else None
            return await orchestrator.analyze(request.symbol, request.question or "", user_id)
        except RuntimeError as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected error: {str(e)}")

@router.get("/market/{symbol}", response_model=MarketAgentOut, summary="Get AHNA Market Agent data")
async def get_market_data(symbol: str, current_user: User | None = Depends(get_optional_user)):
    agent = MarketAgent()
    try:
        return await agent.analyze(symbol)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/news/{symbol}", response_model=NewsAgentOut, summary="Get AHNA News Agent data")
async def get_news_data(symbol: str, current_user: User | None = Depends(get_optional_user)):
    agent = NewsAgent()
    try:
        return await agent.analyze(symbol)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sentiment/{symbol}", response_model=SentimentAgentOut, summary="Get AHNA Sentiment Agent data")
async def get_sentiment_data(symbol: str, current_user: User | None = Depends(get_optional_user)):
    # To run standalone sentiment, we need news first
    news_agent = NewsAgent()
    sentiment_agent = SentimentAgent()
    try:
        news_data = await news_agent.analyze(symbol)
        return sentiment_agent.analyze(news_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/risk/{symbol}", response_model=RiskAgentOut, summary="Get AHNA Risk Agent data")
async def get_risk_data(symbol: str, current_user: User | None = Depends(get_optional_user)):
    market_agent = MarketAgent()
    risk_agent = RiskAgent()
    try:
        market_data = await market_agent.analyze(symbol)
        return risk_agent.analyze(market_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/trade/{symbol}", response_model=TradeAgentOut, summary="Get AHNA Trade Agent data")
async def get_trade_data(symbol: str, current_user: User | None = Depends(get_optional_user)):
    market_agent = MarketAgent()
    news_agent = NewsAgent()
    sentiment_agent = SentimentAgent()
    feature_builder = FeatureBuilder()
    risk_agent = RiskAgent()
    trade_agent = TradeAgent()
    
    try:
        market_data = await market_agent.analyze(symbol)
        news_data = await news_agent.analyze(symbol)
        sentiment_data = sentiment_agent.analyze(news_data)
        features = feature_builder.build(market_data, news_data, sentiment_data)
        risk_data = risk_agent.analyze(market_data)
        return trade_agent.analyze(features, risk_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
