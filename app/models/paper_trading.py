from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, String, Numeric, Index, Integer, CheckConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import synonym

from database.base import Base


class PaperAccount(Base):
    __tablename__ = "paper_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    initial_balance = Column(Numeric(20, 8), nullable=False)
    current_cash = Column(Numeric(20, 8), nullable=False)
    currency = Column(String(10), default="USDT")
    status = Column(String(50), default="active")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        CheckConstraint('current_cash >= 0', name='ck_paper_account_positive_cash'),
    )


class PaperOrder(Base):
    __tablename__ = "paper_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    paper_account_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    asset_id = Column(UUID(as_uuid=True), nullable=False)
    side = Column(String(10), nullable=False)
    order_type = Column(String(20), nullable=False)
    quantity = Column(Numeric(20, 8), nullable=False)
    requested_price = Column(Numeric(20, 8), nullable=False)
    executed_price = Column(Numeric(20, 8), nullable=True)
    stop_loss = Column(Numeric(20, 8), nullable=True)
    take_profit = Column(Numeric(20, 8), nullable=True)
    status = Column(String(50), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('ix_paper_orders_asset_id', 'asset_id'),
        Index('ix_paper_orders_status', 'status'),
    )


class PaperPosition(Base):
    __tablename__ = "paper_positions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    paper_account_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    asset_id = Column(UUID(as_uuid=True), nullable=False)
    quantity = Column(Numeric(20, 8), nullable=False)
    average_entry_price = Column(Numeric(20, 8), nullable=False)
    realized_pnl = Column(Numeric(20, 8), default=0)
    unrealized_pnl = Column(Numeric(20, 8), default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint('paper_account_id', 'asset_id', name='uq_paper_positions_account_asset'),
        Index('ix_paper_positions_asset_id', 'asset_id'),
    )


class PaperTrade(Base):
    __tablename__ = "paper_trades"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    paper_account_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    order_id = Column(UUID(as_uuid=True), nullable=True)
    asset_id = Column(UUID(as_uuid=True), nullable=False)
    side = Column(String(10), nullable=False)
    quantity = Column(Numeric(20, 8), nullable=False)
    execution_price = Column(Numeric(20, 8), nullable=False)
    fee = Column(Numeric(20, 8), default=0)
    slippage = Column(Numeric(20, 8), default=0)
    realized_pnl = Column(Numeric(20, 8), default=0)
    executed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('ix_paper_trades_asset_id', 'asset_id'),
        Index('ix_paper_trades_executed_at', 'executed_at'),
    )


class PaperTransaction(Base):
    __tablename__ = "paper_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    paper_account_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    transaction_type = Column(String(50), nullable=False)
    amount = Column(Numeric(20, 8), nullable=False)
    reference_id = Column(UUID(as_uuid=True), nullable=True)
    reference_type = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    type = synonym("transaction_type")

    __table_args__ = (
        Index('ix_paper_transactions_type', 'transaction_type'),
    )

