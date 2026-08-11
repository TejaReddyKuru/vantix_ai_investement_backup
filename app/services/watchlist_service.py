from uuid import UUID

from sqlalchemy import func, select

from app.models.watchlist import Watchlist, WatchlistItem
from app.schemas.watchlist import WatchlistCreate, WatchlistItemCreate, WatchlistUpdate
from database.session import AsyncSessionLocal


async def list_watchlists(user_id: UUID, page: int, page_size: int) -> dict:
    """List a user's watchlists with pagination."""
    async with AsyncSessionLocal() as db:
        stmt = select(Watchlist).where(Watchlist.user_id == user_id).order_by(Watchlist.created_at.desc())
        total_stmt = select(func.count()).select_from(Watchlist).where(Watchlist.user_id == user_id)
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
                    "name": item.name,
                    "created_at": item.created_at,
                    "updated_at": item.updated_at,
                    "items": [],
                }
                for item in items
            ],
        }


async def create_watchlist(user_id: UUID, payload: WatchlistCreate) -> dict:
    """Create a watchlist for the current user."""
    async with AsyncSessionLocal() as db:
        watchlist = Watchlist(user_id=user_id, name=payload.name)
        db.add(watchlist)
        await db.commit()
        await db.refresh(watchlist)
        return {
            "id": str(watchlist.id),
            "user_id": str(watchlist.user_id),
            "name": watchlist.name,
            "created_at": watchlist.created_at,
            "updated_at": watchlist.updated_at,
            "items": [],
        }


async def get_watchlist(user_id: UUID, watchlist_id: UUID) -> dict | None:
    """Return a watchlist owned by the current user."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Watchlist).where(Watchlist.id == watchlist_id, Watchlist.user_id == user_id))
        watchlist = result.scalar_one_or_none()
        if watchlist is None:
            return None
        item_result = await db.execute(select(WatchlistItem).where(WatchlistItem.watchlist_id == watchlist.id).order_by(WatchlistItem.position))
        items = item_result.scalars().all()
        return {
            "id": str(watchlist.id),
            "user_id": str(watchlist.user_id),
            "name": watchlist.name,
            "created_at": watchlist.created_at,
            "updated_at": watchlist.updated_at,
            "items": [
                {
                    "id": str(item.id),
                    "watchlist_id": str(item.watchlist_id),
                    "asset_id": str(item.asset_id),
                    "position": item.position,
                    "created_at": item.created_at,
                }
                for item in items
            ],
        }


async def update_watchlist(user_id: UUID, watchlist_id: UUID, payload: WatchlistUpdate) -> dict | None:
    """Update a user-owned watchlist."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Watchlist).where(Watchlist.id == watchlist_id, Watchlist.user_id == user_id))
        watchlist = result.scalar_one_or_none()
        if watchlist is None:
            return None
        if payload.name:
            watchlist.name = payload.name
        await db.commit()
        await db.refresh(watchlist)
        return {
            "id": str(watchlist.id),
            "user_id": str(watchlist.user_id),
            "name": watchlist.name,
            "created_at": watchlist.created_at,
            "updated_at": watchlist.updated_at,
            "items": [],
        }


async def delete_watchlist(user_id: UUID, watchlist_id: UUID) -> bool:
    """Delete a user-owned watchlist."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Watchlist).where(Watchlist.id == watchlist_id, Watchlist.user_id == user_id))
        watchlist = result.scalar_one_or_none()
        if watchlist is None:
            return False
        await db.delete(watchlist)
        await db.commit()
        return True


async def add_watchlist_item(user_id: UUID, watchlist_id: UUID, payload: WatchlistItemCreate) -> dict | None:
    """Add a watchlist item after verifying ownership."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Watchlist).where(Watchlist.id == watchlist_id, Watchlist.user_id == user_id))
        watchlist = result.scalar_one_or_none()
        if watchlist is None:
            return None
        asset_uuid = UUID(str(payload.asset_id))
        duplicate = await db.execute(select(WatchlistItem).where(WatchlistItem.watchlist_id == watchlist.id, WatchlistItem.asset_id == asset_uuid))
        if duplicate.scalar_one_or_none() is not None:
            raise ValueError('duplicate')
        item = WatchlistItem(watchlist_id=watchlist.id, asset_id=asset_uuid, position=0)
        db.add(item)
        await db.commit()
        await db.refresh(item)
        return {
            "id": str(item.id),
            "watchlist_id": str(item.watchlist_id),
            "asset_id": str(item.asset_id),
            "position": item.position,
            "created_at": item.created_at,
        }


async def remove_watchlist_item(user_id: UUID, watchlist_id: UUID, item_id: UUID) -> bool:
    """Remove a watchlist item after verifying ownership."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Watchlist).where(Watchlist.id == watchlist_id, Watchlist.user_id == user_id))
        watchlist = result.scalar_one_or_none()
        if watchlist is None:
            return False
        item = await db.get(WatchlistItem, item_id)
        if item is None or item.watchlist_id != watchlist.id:
            return False
        await db.delete(item)
        await db.commit()
        return True
