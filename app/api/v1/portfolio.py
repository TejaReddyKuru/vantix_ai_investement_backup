from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select

from app.core.security import get_current_user
from app.models.portfolio import PortfolioSnapshot
from app.models.user import User
from app.schemas.portfolio import PortfolioListResponse, PortfolioSnapshotOut, PortfolioSummary
from database.session import AsyncSessionLocal

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("", response_model=PortfolioListResponse, summary="List portfolio snapshots")
async def list_portfolio(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    """Return portfolio snapshots scoped to the current authenticated user."""
    async with AsyncSessionLocal() as db:
        stmt = select(PortfolioSnapshot).where(PortfolioSnapshot.user_id == current_user.id).order_by(PortfolioSnapshot.recorded_at.desc())
        total_stmt = select(func.count()).select_from(PortfolioSnapshot).where(PortfolioSnapshot.user_id == current_user.id)
        total_result = await db.execute(total_stmt)
        total = total_result.scalar_one() or 0
        stmt = stmt.limit(page_size).offset((page - 1) * page_size)
        result = await db.execute(stmt)
        items = result.scalars().all()
        return {
            "page": page,
            "page_size": page_size,
            "total": total or 0,
            "items": [
                {
                    "id": str(item.id),
                    "user_id": str(item.user_id),
                    "paper_account_id": str(item.paper_account_id) if item.paper_account_id else None,
                    "total_equity": item.total_equity,
                    "cash": item.cash,
                    "invested_value": item.invested_value,
                    "realized_pnl": item.realized_pnl,
                    "unrealized_pnl": item.unrealized_pnl,
                    "drawdown": item.drawdown,
                    "recorded_at": item.recorded_at,
                }
                for item in items
            ],
        }


@router.get("/summary", response_model=PortfolioSummary, summary="Get the latest portfolio summary")
async def portfolio_summary(current_user: User = Depends(get_current_user)):
    """Return the most recent paper-trading portfolio summary for the active user."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(PortfolioSnapshot)
            .where(PortfolioSnapshot.user_id == current_user.id)
            .order_by(PortfolioSnapshot.recorded_at.desc())
            .limit(1)
        )
        snapshot = result.scalar_one_or_none()
        if snapshot is None:
            return {
                "user_id": str(current_user.id),
                "total_equity": None,
                "cash": None,
                "invested_value": None,
                "realized_pnl": None,
                "unrealized_pnl": None,
                "drawdown": None,
            }
        return {
            "user_id": str(snapshot.user_id),
            "total_equity": snapshot.total_equity,
            "cash": snapshot.cash,
            "invested_value": snapshot.invested_value,
            "realized_pnl": snapshot.realized_pnl,
            "unrealized_pnl": snapshot.unrealized_pnl,
            "drawdown": snapshot.drawdown,
        }


@router.get("/snapshots", response_model=PortfolioListResponse, summary="Get portfolio snapshots")
async def get_snapshots(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    """Compatibility alias for materialized snapshots."""
    return await list_portfolio(page=page, page_size=page_size, current_user=current_user)
