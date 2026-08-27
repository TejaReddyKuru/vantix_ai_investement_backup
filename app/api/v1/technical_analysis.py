from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select

from app.core.exceptions import BinanceServiceError
from app.core.security import get_current_user
from app.models.asset import Asset
from app.models.user import User
from app.schemas.technical_analysis import TechnicalAnalysisOut
from app.services.binance_service import BinanceService
from app.services.technical_analysis_service import TechnicalAnalysisService
from database.session import AsyncSessionLocal

router = APIRouter(prefix="/technical-analysis", tags=["technical-analysis"])


@router.get("/{symbol}", response_model=TechnicalAnalysisOut, summary="Perform technical analysis on a symbol")
async def get_technical_analysis(
    symbol: str,
    interval: str = Query("1h", description="Candle interval (1m, 5m, 15m, 1h, 4h, 1d)"),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve historical candles for the specified symbol, compute technical indicators,
    and output a normalized BUY/SELL/HOLD signal with a confidence rating.
    """
    symbol_upper = symbol.upper()
    if interval not in ("1m", "5m", "15m", "1h", "4h", "1d"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported interval '{interval}'. Use one of 1m, 5m, 15m, 1h, 4h, 1d.",
        )

    async with AsyncSessionLocal() as db:
        # Validate symbol against database assets
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

    # Fetch live OHLCV data from Binance
    binance_service = BinanceService()
    try:
        klines = await binance_service.get_ohlcv(symbol_upper, interval)
        if not klines or len(klines) == 0:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to fetch market data for {symbol_upper} from Binance.",
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

    # Perform deterministic technical analysis
    analysis_service = TechnicalAnalysisService()
    try:
        analysis = await analysis_service.analyze(symbol_upper, interval, klines)
        return analysis
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate technical analysis: {exc}",
        )
