from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, String, Integer, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from database.base import Base


class Watchlist(Base):
    __tablename__ = "watchlists"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = ()


class WatchlistItem(Base):
    __tablename__ = "watchlist_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    watchlist_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    asset_id = Column(UUID(as_uuid=True), nullable=False)
    position = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint('watchlist_id', 'asset_id', name='uq_watchlist_items'),
        Index('ix_watchlist_items_asset_id', 'asset_id'),
    )
