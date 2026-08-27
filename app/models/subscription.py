from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, String, Numeric, Boolean, Index, UniqueConstraint
from sqlalchemy.orm import synonym
from sqlalchemy.dialects.postgresql import UUID

from database.base import Base


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(String(500), nullable=True)
    price_monthly = Column(Numeric(10, 2), nullable=True)
    price_yearly = Column(Numeric(10, 2), nullable=True)
    billing_interval = Column(String(20), default="monthly")
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    plan_id = Column(UUID(as_uuid=True), nullable=False)
    status = Column(String(50), default="active")
    started_at = Column("start_at", DateTime, default=datetime.utcnow, nullable=False)
    start_at = synonym("started_at")
    ended_at = Column("end_at", DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('ix_subscriptions_plan_id', 'plan_id'),
    )


class PlanEntitlement(Base):
    __tablename__ = "plan_entitlements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    plan_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    entitlement_code = Column(String(100), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint('plan_id', 'entitlement_code', name='uq_plan_entitlements'),
    )
