from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select

from app.core.exceptions import BinanceServiceError
from app.core.security import get_current_user
from app.models.asset import Asset
from app.models.user import User
from app.schemas.news import NewsListOut
from app.schemas.sentiment import CombinedAnalysisOut
from app.services.binance_service import BinanceService
from app.services.news_service import NewsService
from app.services.sentiment_service import SentimentAggregationService, IntelligenceIntegrationService
from app.services.technical_analysis_service import TechnicalAnalysisService
from database.session import AsyncSessionLocal

router = APIRouter(prefix="/news", tags=["news"])


async def _validate_asset(symbol: str) -> None:
    """
    Validate that the asset symbol exists in the database and is active.
    """
    symbol_upper = symbol.upper()
    async with AsyncSessionLocal() as db:
        stmt = select(Asset).where(Asset.symbol == symbol_upper)
        res = await db.execute(stmt)
        asset = res.scalar_one_or_none()
        if not asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Asset symbol '{symbol_upper}' not found in registered database assets.",
            )
        if asset.status.lower() != "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Asset symbol '{symbol_upper}' is inactive.",
            )


@router.get("/{symbol}", response_model=NewsListOut, summary="Retrieve normalized news articles for a symbol")
async def get_news(
    symbol: str,
    limit: int = Query(10, ge=1, le=50, description="Number of articles to fetch"),
    current_user: User = Depends(get_current_user),
):
    """
    Fetch, validate, and deduplicate news articles for the requested symbol.
    """
    symbol_upper = symbol.upper()
    await _validate_asset(symbol_upper)

    news_service = NewsService()
    try:
        articles = await news_service.fetch_and_normalize_news(symbol_upper, limit)
        return NewsListOut(symbol=symbol_upper, articles=articles)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to retrieve news articles: {exc}",
        )


@router.get("/{symbol}/sentiment", response_model=CombinedAnalysisOut, summary="Get combined sentiment and technical analysis signal")
async def get_news_sentiment(
    symbol: str,
    current_user: User = Depends(get_current_user),
):
    """
    Fetch news, aggregate sentiment with time-decay, run technical analysis, and return a combined bias.
    """
    symbol_upper = symbol.upper()
    await _validate_asset(symbol_upper)

    # 1. Fetch news articles
    news_service = NewsService()
    try:
        articles = await news_service.fetch_and_normalize_news(symbol_upper, 20)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to retrieve news articles for sentiment: {exc}",
        )

    # 2. Aggregate sentiment
    aggregation_service = SentimentAggregationService()
    sentiment = aggregation_service.aggregate_sentiment(symbol_upper, articles)

    # 3. Retrieve technical analysis klines from Binance
    binance_service = BinanceService()
    try:
        klines = await binance_service.get_ohlcv(symbol_upper, "1h")
        if not klines:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Empty market data returned from Binance for {symbol_upper}.",
            )
    except BinanceServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Binance market data query failed: {exc}",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error while fetching market data: {exc}",
        )

    # 4. Perform technical analysis
    ta_service = TechnicalAnalysisService()
    try:
        technical = await ta_service.analyze(symbol_upper, "1h", klines)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate technical analysis: {exc}",
        )

    # 5. Synthesize Combined Intelligence
    combined = IntelligenceIntegrationService.combine_signals(symbol_upper, technical, sentiment)
    return combined
