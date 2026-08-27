from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select

from app.core.exceptions import BinanceServiceError
from app.core.security import get_current_user
from app.models.asset import Asset
from app.models.user import User
from app.schemas.intelligence_pipeline import UnifiedIntelligenceOut
from app.agents.pipeline.intelligence_pipeline import UnifiedIntelligencePipeline
from database.session import AsyncSessionLocal

router = APIRouter(prefix="/intelligence", tags=["intelligence"])


@router.get("/{symbol}", response_model=UnifiedIntelligenceOut, summary="Retrieve unified AI intelligence pipeline results for a symbol")
async def get_unified_intelligence(
    symbol: str,
    interval: str = Query("1h", description="Candle interval (1m, 5m, 15m, 1h, 4h, 1d)"),
    current_user: User = Depends(get_current_user),
):
    """
    Executes the Unified Intelligence Pipeline (technical, news, sentiment, market, portfolio, risk, strategy agents)
    for a given symbol and interval. Strictly read-only; performs zero trade execution or portfolio mutation.
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

        pipeline = UnifiedIntelligencePipeline()
        try:
            # We run the pipeline synchronously since it encapsulates its own async execution handling internally via the orchestrator/agents
            # The context is seeded with user_id so agents like Risk/Portfolio can look it up
            intelligence = pipeline.run(
                symbol=symbol_upper,
                interval=interval,
                user_id=current_user.id,
                db=db,
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
                detail=f"Unified intelligence pipeline failed: {exc}",
            )
