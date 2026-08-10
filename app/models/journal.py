from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, String, Text, Index
from sqlalchemy.dialects.postgresql import UUID

from database.base import Base


class TradeJournalEntry(Base):
    __tablename__ = "trade_journal_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    paper_trade_id = Column(UUID(as_uuid=True), nullable=True)
    title = Column(String(255), nullable=False)
    notes = Column(Text, nullable=True)
    strategy = Column(String(255), nullable=True)
    setup = Column(Text, nullable=True)
    lessons = Column(Text, nullable=True)
    tags = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = ()
