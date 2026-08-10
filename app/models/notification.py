from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, String, Text, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import synonym

from database.base import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    type = Column(String(100), nullable=False)
    notification_type = synonym("type")
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    reference_type = Column(String(100), nullable=True)
    reference_id = Column(String(255), nullable=True)
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('ix_notifications_read_at', 'read_at'),
        Index('ix_notifications_user_read', 'user_id', 'read_at'),
    )
