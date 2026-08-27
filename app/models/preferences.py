from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import relationship

from database.base import Base


class UserPreferences(Base):
    __tablename__ = "user_preferences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    trading_experience = Column(String(50), default="beginner")
    preferred_assets = Column(JSON, default="BTC,ETH")
    trading_style = Column(String(50), default="swing")
    risk_preference = Column(String(50), default="moderate")
    default_timeframe = Column(String(10), default="1h")
    ai_preferences = Column(JSON, default=dict)
    theme_preference = Column(String(20), default="dark")
    notification_preferences = Column(JSON, default=dict)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    user = relationship("User", back_populates="preferences")

    __table_args__ = ()