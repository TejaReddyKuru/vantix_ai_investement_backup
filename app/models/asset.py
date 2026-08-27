from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, String, Index, UniqueConstraint, Text
from sqlalchemy.dialects.postgresql import UUID

from database.base import Base


class Asset(Base):
    __tablename__ = "assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    symbol = Column(String(20), unique=True, nullable=False, index=True)
    base_asset = Column(String(20), nullable=False)
    quote_asset = Column(String(20), nullable=False, default="USDT")
    name = Column(String(255), nullable=False)
    exchange = Column(String(50), default="binance")
    status = Column(String(50), default="active")
    asset_metadata = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint('exchange', 'base_asset', 'quote_asset', name='uq_assets_exchange_pair'),
        Index('ix_assets_status', 'status'),
    )
