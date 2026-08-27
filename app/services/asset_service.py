from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select

from app.models.asset import Asset
from app.schemas.asset import AssetListResponse, AssetOut
from database.session import AsyncSessionLocal


async def list_assets(page: int, page_size: int, q: str | None = None, status: str | None = None) -> dict:
    """Return a paginated asset collection."""
    async with AsyncSessionLocal() as db:
        stmt = select(Asset)
        if q:
            stmt = stmt.where((Asset.symbol.ilike(f"%{q}%")) | (Asset.name.ilike(f"%{q}%")))
        if status:
            stmt = stmt.where(Asset.status == status)

        total_stmt = select(func.count()).select_from(Asset)
        if q:
            total_stmt = total_stmt.where((Asset.symbol.ilike(f"%{q}%")) | (Asset.name.ilike(f"%{q}%")))
        if status:
            total_stmt = total_stmt.where(Asset.status == status)

        total_result = await db.execute(total_stmt)
        total = total_result.scalar_one() or 0

        stmt = stmt.order_by(Asset.symbol).limit(page_size).offset((page - 1) * page_size)
        result = await db.execute(stmt)
        items = result.scalars().all()
        return {
            "page": page,
            "page_size": page_size,
            "total": total,
            "items": [
                {
                    "id": str(item.id),
                    "symbol": item.symbol,
                    "base_asset": item.base_asset,
                    "quote_asset": item.quote_asset,
                    "name": item.name,
                    "exchange": item.exchange,
                    "status": item.status,
                    "asset_metadata": item.asset_metadata,
                    "created_at": item.created_at,
                    "updated_at": item.updated_at,
                }
                for item in items
            ],
        }


async def search_assets(q: str, page: int, page_size: int) -> dict:
    """Search asset rows by symbol or name."""
    async with AsyncSessionLocal() as db:
        stmt = select(Asset).where((Asset.symbol.ilike(f"%{q}%")) | (Asset.name.ilike(f"%{q}%")))
        total_stmt = select(func.count()).select_from(Asset).where((Asset.symbol.ilike(f"%{q}%")) | (Asset.name.ilike(f"%{q}%")))
        total_result = await db.execute(total_stmt)
        total = total_result.scalar_one() or 0
        stmt = stmt.order_by(Asset.symbol).limit(page_size).offset((page - 1) * page_size)
        result = await db.execute(stmt)
        items = result.scalars().all()
        return {
            "page": page,
            "page_size": page_size,
            "total": total,
            "items": [
                {
                    "id": str(item.id),
                    "symbol": item.symbol,
                    "base_asset": item.base_asset,
                    "quote_asset": item.quote_asset,
                    "name": item.name,
                    "exchange": item.exchange,
                    "status": item.status,
                    "asset_metadata": item.asset_metadata,
                    "created_at": item.created_at,
                    "updated_at": item.updated_at,
                }
                for item in items
            ],
        }


async def get_asset(asset_id: UUID) -> dict | None:
    """Return an asset detail payload or None."""
    async with AsyncSessionLocal() as db:
        asset = await db.get(Asset, asset_id)
        if asset is None:
            return None
        return {
            "id": str(asset.id),
            "symbol": asset.symbol,
            "base_asset": asset.base_asset,
            "quote_asset": asset.quote_asset,
            "name": asset.name,
            "exchange": asset.exchange,
            "status": asset.status,
            "asset_metadata": asset.asset_metadata,
            "created_at": asset.created_at,
            "updated_at": asset.updated_at,
        }
