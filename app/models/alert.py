from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, String, Numeric, Boolean, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import synonym

from database.base import Base


class AlertRule(Base):
    __tablename__ = "alert_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    asset_id = Column(UUID(as_uuid=True), nullable=False)
    alert_type = Column(String(100), nullable=False)
    condition = Column(JSON, nullable=False)
    threshold = Column(Numeric(20, 8), nullable=False)
    enabled = Column(Boolean, default=True)
    is_enabled = synonym("enabled")
    cooldown_minutes = Column(Numeric(10, 0), default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('ix_alert_rules_asset_id', 'asset_id'),
    )


class AlertEvent(Base):
    __tablename__ = "alert_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    alert_rule_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    triggered_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    value = Column(Numeric(20, 8), nullable=False)
    status = Column(String(50), default="active")
    notified = Column(Boolean, default=False)

    __table_args__ = (
        Index('ix_alert_events_triggered_at', 'triggered_at'),
    )
