from uuid import UUID
from datetime import datetime, timedelta
from typing import Dict, Any, List

from sqlalchemy import func, select, desc
from sqlalchemy.orm import selectinload

from app.models.journal import TradeJournalEntry, JournalObservation
from app.schemas.journal import JournalEntryCreate, JournalEntryUpdate, JournalObservationCreate
from database.session import AsyncSessionLocal


def _entry_to_dict(entry: TradeJournalEntry) -> dict:
    return {
        "id": str(entry.id),
        "user_id": str(entry.user_id),
        "paper_account_id": str(entry.paper_account_id) if entry.paper_account_id else None,
        "paper_trade_id": str(entry.paper_trade_id) if entry.paper_trade_id else None,
        "symbol": entry.symbol,
        "side": entry.side,
        "status": entry.status,
        "entry_price": float(entry.entry_price) if entry.entry_price is not None else None,
        "exit_price": float(entry.exit_price) if entry.exit_price is not None else None,
        "quantity": float(entry.quantity) if entry.quantity is not None else None,
        "realized_pnl": float(entry.realized_pnl) if entry.realized_pnl is not None else None,
        "return_percentage": float(entry.return_percentage) if entry.return_percentage is not None else None,
        "duration_seconds": entry.duration_seconds,
        "entry_timestamp": entry.entry_timestamp,
        "exit_timestamp": entry.exit_timestamp,
        "title": entry.title,
        "notes": entry.notes,
        "strategy": entry.strategy,
        "setup": entry.setup,
        "lessons": entry.lessons,
        "tags": entry.tags,
        "market_condition": entry.market_condition,
        "entry_reason": entry.entry_reason,
        "trade_thesis": entry.trade_thesis,
        "confidence": entry.confidence,
        "what_went_well": entry.what_went_well,
        "what_went_wrong": entry.what_went_wrong,
        "discipline_score": entry.discipline_score,
        "trade_plan_snapshot": entry.trade_plan_snapshot,
        "ahna_snapshot": entry.ahna_snapshot,
        "observations": [
            {
                "id": str(obs.id),
                "journal_entry_id": str(obs.journal_entry_id),
                "user_id": str(obs.user_id),
                "text": obs.text,
                "created_at": obs.created_at
            }
            for obs in (entry.observations or [])
        ],
        "created_at": entry.created_at,
        "updated_at": entry.updated_at,
    }


async def list_entries(user_id: UUID, page: int, page_size: int, status: str = None, symbol: str = None, strategy: str = None) -> dict:
    """List journal entries for the current user."""
    async with AsyncSessionLocal() as db:
        stmt = select(TradeJournalEntry).where(TradeJournalEntry.user_id == user_id).options(selectinload(TradeJournalEntry.observations)).order_by(desc(TradeJournalEntry.created_at))
        total_stmt = select(func.count()).select_from(TradeJournalEntry).where(TradeJournalEntry.user_id == user_id)
        
        if status:
            stmt = stmt.where(TradeJournalEntry.status == status)
            total_stmt = total_stmt.where(TradeJournalEntry.status == status)
        if symbol:
            stmt = stmt.where(TradeJournalEntry.symbol == symbol)
            total_stmt = total_stmt.where(TradeJournalEntry.symbol == symbol)
        if strategy:
            stmt = stmt.where(TradeJournalEntry.strategy == strategy)
            total_stmt = total_stmt.where(TradeJournalEntry.strategy == strategy)
            
        total_result = await db.execute(total_stmt)
        total = total_result.scalar_one() or 0
        stmt = stmt.limit(page_size).offset((page - 1) * page_size)
        result = await db.execute(stmt)
        items = result.scalars().all()
        return {
            "page": page,
            "page_size": page_size,
            "total": total or 0,
            "items": [_entry_to_dict(item) for item in items],
        }


async def create_entry(user_id: UUID, payload: JournalEntryCreate) -> dict:
    """Create a journal entry owned by the current user."""
    async with AsyncSessionLocal() as db:
        entry = TradeJournalEntry(user_id=user_id, **payload.model_dump(exclude_none=True))
        db.add(entry)
        await db.commit()
        await db.refresh(entry)
        # Note: observations might not be loaded initially, but it's empty
        entry.observations = []
        return _entry_to_dict(entry)


async def get_entry(user_id: UUID, entry_id: UUID) -> dict | None:
    """Fetch one journal entry owned by the current user."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(TradeJournalEntry).where(TradeJournalEntry.id == entry_id, TradeJournalEntry.user_id == user_id).options(selectinload(TradeJournalEntry.observations)))
        entry = result.scalar_one_or_none()
        if entry is None:
            return None
        return _entry_to_dict(entry)


async def update_entry(user_id: UUID, entry_id: UUID, payload: JournalEntryUpdate) -> dict | None:
    """Update one journal entry owned by the current user."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(TradeJournalEntry).where(TradeJournalEntry.id == entry_id, TradeJournalEntry.user_id == user_id).options(selectinload(TradeJournalEntry.observations)))
        entry = result.scalar_one_or_none()
        if entry is None:
            return None
        for field, value in payload.model_dump(exclude_none=True).items():
            if hasattr(entry, field):
                setattr(entry, field, value)
        await db.commit()
        await db.refresh(entry)
        return _entry_to_dict(entry)


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


async def add_observation(user_id: UUID, entry_id: UUID, payload: JournalObservationCreate) -> dict | None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(TradeJournalEntry).where(TradeJournalEntry.id == entry_id, TradeJournalEntry.user_id == user_id))
        entry = result.scalar_one_or_none()
        if entry is None:
            return None
        obs = JournalObservation(journal_entry_id=entry_id, user_id=user_id, text=payload.text)
        db.add(obs)
        await db.commit()
        await db.refresh(obs)
        return {
            "id": str(obs.id),
            "journal_entry_id": str(obs.journal_entry_id),
            "user_id": str(obs.user_id),
            "text": obs.text,
            "created_at": obs.created_at
        }


async def get_analytics(user_id: UUID) -> dict:
    """Calculate dashboard analytics from real trades."""
    async with AsyncSessionLocal() as db:
        stmt = select(TradeJournalEntry).where(TradeJournalEntry.user_id == user_id, TradeJournalEntry.status == "CLOSED")
        result = await db.execute(stmt)
        entries = result.scalars().all()
        
        total_trades = len(entries)
        wins = [e for e in entries if e.realized_pnl and e.realized_pnl > 0]
        losses = [e for e in entries if e.realized_pnl and e.realized_pnl < 0]
        
        win_rate = (len(wins) / total_trades * 100) if total_trades > 0 else 0
        total_pnl = sum([float(e.realized_pnl) for e in entries if e.realized_pnl])
        
        best_trade = max(entries, key=lambda e: e.realized_pnl or 0) if entries else None
        worst_trade = min(entries, key=lambda e: e.realized_pnl or 0) if entries else None
        
        avg_return = sum([float(e.return_percentage) for e in entries if e.return_percentage]) / total_trades if total_trades > 0 else 0
        
        # Monthly performance
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_entries = [e for e in entries if e.exit_timestamp and e.exit_timestamp >= thirty_days_ago]
        monthly_return = sum([float(e.return_percentage) for e in recent_entries if e.return_percentage])
        
        # Strategy breakdown
        strategy_stats = {}
        for e in entries:
            strat = e.strategy or "Uncategorized"
            if strat not in strategy_stats:
                strategy_stats[strat] = {"trades": 0, "wins": 0, "pnl": 0.0, "total_return": 0.0}
            strategy_stats[strat]["trades"] += 1
            if e.realized_pnl and e.realized_pnl > 0:
                strategy_stats[strat]["wins"] += 1
            strategy_stats[strat]["pnl"] += float(e.realized_pnl or 0)
            strategy_stats[strat]["total_return"] += float(e.return_percentage or 0)
            
        strategy_breakdown = [
            {
                "strategy": s,
                "trades": stats["trades"],
                "win_rate": (stats["wins"] / stats["trades"] * 100),
                "pnl": stats["pnl"],
                "avg_return": stats["total_return"] / stats["trades"]
            }
            for s, stats in strategy_stats.items()
        ]
        
        # Asset breakdown
        asset_stats = {}
        for e in entries:
            asset = e.symbol or "Unknown"
            if asset not in asset_stats:
                asset_stats[asset] = {"trades": 0, "wins": 0, "pnl": 0.0, "total_return": 0.0}
            asset_stats[asset]["trades"] += 1
            if e.realized_pnl and e.realized_pnl > 0:
                asset_stats[asset]["wins"] += 1
            asset_stats[asset]["pnl"] += float(e.realized_pnl or 0)
            asset_stats[asset]["total_return"] += float(e.return_percentage or 0)
            
        asset_breakdown = [
            {
                "asset": a,
                "trades": stats["trades"],
                "win_rate": (stats["wins"] / stats["trades"] * 100),
                "pnl": stats["pnl"],
                "avg_return": stats["total_return"] / stats["trades"]
            }
            for a, stats in asset_stats.items()
        ]
        
        return {
            "total_trades": total_trades,
            "winning_trades": len(wins),
            "losing_trades": len(losses),
            "win_rate": win_rate,
            "total_pnl": total_pnl,
            "average_return": avg_return,
            "best_trade": _entry_to_dict(best_trade) if best_trade else None,
            "worst_trade": _entry_to_dict(worst_trade) if worst_trade else None,
            "monthly_return": monthly_return,
            "monthly_target": 10.0, # default 10%
            "strategy_breakdown": strategy_breakdown,
            "asset_breakdown": asset_breakdown,
            "discipline_score": 90, # calculate properly later based on rules
        }
