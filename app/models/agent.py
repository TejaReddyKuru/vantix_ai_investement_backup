from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, String, Text, Numeric, Index
from sqlalchemy.dialects.postgresql import UUID

from database.base import Base


class AIAgentRun(Base):
    __tablename__ = "ai_agent_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    agent_name = Column(String(100), nullable=False, index=True)
    agent_version = Column(String(50), nullable=True)
    request_id = Column(String(255), nullable=True)
    input_reference = Column(Text, nullable=True)
    output_reference = Column(Text, nullable=True)
    status = Column(String(50), nullable=False)
    confidence = Column(Numeric(5, 4), nullable=True)
    duration_ms = Column(Numeric(10, 0), nullable=True)
    error_code = Column(String(100), nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index('ix_ai_agent_runs_status', 'status'),
    )


class AIInsight(Base):
    __tablename__ = "ai_insights"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    asset_id = Column(UUID(as_uuid=True), nullable=True)
    insight_type = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    summary = Column(Text, nullable=False)
    confidence = Column(Numeric(5, 4), nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    source = Column(String(100), nullable=True)

    __table_args__ = (
        Index('ix_ai_insights_asset_id', 'asset_id'),
        Index('ix_ai_insights_generated_at', 'generated_at'),
    )
