from uuid import UUID

from sqlalchemy import func, select

from app.models.journal import TradeJournalEntry
from app.schemas.journal import JournalEntryCreate, JournalEntryUpdate
from database.session import AsyncSessionLocal


async def list_entries(user_id: UUID, page: int, page_size: int) -> dict:
    """List journal entries for the current user."""
    async with AsyncSessionLocal() as db:
        stmt = select(TradeJournalEntry).where(TradeJournalEntry.user_id == user_id).order_by(TradeJournalEntry.created_at.desc())
        total_stmt = select(func.count()).select_from(TradeJournalEntry).where(TradeJournalEntry.user_id == user_id)
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
                    "paper_trade_id": str(item.paper_trade_id) if item.paper_trade_id else None,
                    "title": item.title,
                    "notes": item.notes,
                    "strategy": item.strategy,
                    "setup": item.setup,
                    "lessons": item.lessons,
                    "tags": item.tags,
                    "created_at": item.created_at,
                    "updated_at": item.updated_at,
                }
                for item in items
            ],
        }


async def create_entry(user_id: UUID, payload: JournalEntryCreate) -> dict:
    """Create a journal entry owned by the current user."""
    async with AsyncSessionLocal() as db:
        entry = TradeJournalEntry(user_id=user_id, **payload.model_dump(exclude_none=True))
        db.add(entry)
        await db.commit()
        await db.refresh(entry)
        return {
            "id": str(entry.id),
            "user_id": str(entry.user_id),
            "paper_trade_id": str(entry.paper_trade_id) if entry.paper_trade_id else None,
            "title": entry.title,
            "notes": entry.notes,
            "strategy": entry.strategy,
            "setup": entry.setup,
            "lessons": entry.lessons,
            "tags": entry.tags,
            "created_at": entry.created_at,
            "updated_at": entry.updated_at,
        }


async def get_entry(user_id: UUID, entry_id: UUID) -> dict | None:
    """Fetch one journal entry owned by the current user."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(TradeJournalEntry).where(TradeJournalEntry.id == entry_id, TradeJournalEntry.user_id == user_id))
        entry = result.scalar_one_or_none()
        if entry is None:
            return None
        return {
            "id": str(entry.id),
            "user_id": str(entry.user_id),
            "paper_trade_id": str(entry.paper_trade_id) if entry.paper_trade_id else None,
            "title": entry.title,
            "notes": entry.notes,
            "strategy": entry.strategy,
            "setup": entry.setup,
            "lessons": entry.lessons,
            "tags": entry.tags,
            "created_at": entry.created_at,
            "updated_at": entry.updated_at,
        }


async def update_entry(user_id: UUID, entry_id: UUID, payload: JournalEntryUpdate) -> dict | None:
    """Update one journal entry owned by the current user."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(TradeJournalEntry).where(TradeJournalEntry.id == entry_id, TradeJournalEntry.user_id == user_id))
        entry = result.scalar_one_or_none()
        if entry is None:
            return None
        for field, value in payload.model_dump(exclude_none=True).items():
            if hasattr(entry, field):
                setattr(entry, field, value)
        await db.commit()
        await db.refresh(entry)
        return {
            "id": str(entry.id),
            "user_id": str(entry.user_id),
            "paper_trade_id": str(entry.paper_trade_id) if entry.paper_trade_id else None,
            "title": entry.title,
            "notes": entry.notes,
            "strategy": entry.strategy,
            "setup": entry.setup,
            "lessons": entry.lessons,
            "tags": entry.tags,
            "created_at": entry.created_at,
            "updated_at": entry.updated_at,
        }


async def delete_entry(user_id: UUID, entry_id: UUID) -> bool:
    """Delete one journal entry owned by the current user."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(TradeJournalEntry).where(TradeJournalEntry.id == entry_id, TradeJournalEntry.user_id == user_id))
        entry = result.scalar_one_or_none()
        if entry is None:
            return False
        await db.delete(entry)
        await db.commit()
        return True
