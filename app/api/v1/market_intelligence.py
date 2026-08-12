from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select

from app.core.exceptions import BinanceServiceError
from app.core.security import get_current_user
from app.models.asset import Asset
from app.models.user import User
from app.schemas.market_intelligence import MarketIntelligenceOut
from app.services.market_intelligence_service import MarketIntelligenceService
from database.session import AsyncSessionLocal

router = APIRouter(prefix="/market-intelligence", tags=["market-intelligence"])


@router.get("/{symbol}", response_model=MarketIntelligenceOut, summary="Retrieve market intelligence synthesis for a symbol")
async def get_market_intelligence(
    symbol: str,
    interval: str = Query("1h", description="Candle interval (1m, 5m, 15m, 1h, 4h, 1d)"),
    current_user: User = Depends(get_current_user),
):
    """
    Synthesize technical analysis, news sentiment, trend direction, and portfolio risk state
    into an analytical BUY/SELL/HOLD decision with confidence rating and human-readable reasons.
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

        service = MarketIntelligenceService(db=db)
        try:
            intelligence = await service.analyze(
                symbol=symbol_upper,
                interval=interval,
                user_id=current_user.id,
            )
            return intelligence
        except BinanceServiceError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Market data service failure: {exc}",
            )
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(exc),
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Market intelligence calculation failed: {exc}",
            )
