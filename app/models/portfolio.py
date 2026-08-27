from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, String, Numeric, Index
from sqlalchemy.dialects.postgresql import UUID

from database.base import Base


class PortfolioSnapshot(Base):
    __tablename__ = "portfolio_snapshots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    paper_account_id = Column(UUID(as_uuid=True), nullable=True)
    total_equity = Column(Numeric(20, 8), nullable=False)
    cash = Column(Numeric(20, 8), nullable=False)
    invested_value = Column(Numeric(20, 8), nullable=False)
    realized_pnl = Column(Numeric(20, 8), default=0)
    unrealized_pnl = Column(Numeric(20, 8), default=0)
    drawdown = Column(Numeric(10, 4), default=0)
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('ix_portfolio_snapshots_recorded_at', 'recorded_at'),
        Index('ix_portfolio_snapshots_user_recorded', 'user_id', 'recorded_at'),
    )
