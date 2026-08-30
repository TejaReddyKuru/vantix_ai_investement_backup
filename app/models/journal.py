from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, String, Text, Index, Integer, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from database.base import Base


class TradeJournalEntry(Base):
    __tablename__ = "trade_journal_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    paper_account_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    paper_trade_id = Column(UUID(as_uuid=True), nullable=True) # Legacy or primary closing trade
    
    # Logical Trade Execution Fields
    symbol = Column(String(50), nullable=True, index=True)
    side = Column(String(10), nullable=True)
    status = Column(String(50), default="OPEN") # OPEN, PARTIALLY_CLOSED, CLOSED
    entry_price = Column(Numeric(20, 8), nullable=True)
    exit_price = Column(Numeric(20, 8), nullable=True)
    quantity = Column(Numeric(20, 8), nullable=True)
    realized_pnl = Column(Numeric(20, 8), nullable=True)
    return_percentage = Column(Numeric(10, 4), nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    entry_timestamp = Column(DateTime, nullable=True)
    exit_timestamp = Column(DateTime, nullable=True)

    title = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    strategy = Column(String(255), nullable=True)
    setup = Column(Text, nullable=True)
    lessons = Column(Text, nullable=True)
    tags = Column(JSONB, nullable=True)
    
    market_condition = Column(String(255), nullable=True)
    entry_reason = Column(Text, nullable=True)
    trade_thesis = Column(Text, nullable=True)
    confidence = Column(Integer, nullable=True)
    what_went_well = Column(Text, nullable=True)
    what_went_wrong = Column(Text, nullable=True)
    discipline_score = Column(Integer, nullable=True)
    trade_plan_snapshot = Column(JSONB, nullable=True)
    ahna_snapshot = Column(JSONB, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    observations = relationship("JournalObservation", back_populates="journal_entry", cascade="all, delete-orphan")

    __table_args__ = ()


class JournalObservation(Base):
    __tablename__ = "journal_observations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    journal_entry_id = Column(UUID(as_uuid=True), ForeignKey("trade_journal_entries.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    journal_entry = relationship("TradeJournalEntry", back_populates="observations")
