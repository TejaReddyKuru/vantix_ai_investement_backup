from datetime import datetime
from uuid import uuid4

from sqlalchemy import Boolean, Column, DateTime, String, Text, UniqueConstraint, Index, ForeignKey, event
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    email_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    is_staff = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_login_at = Column(DateTime, nullable=True)

    profile = relationship("UserProfile", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)
    preferences = relationship("UserPreferences", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)
    paper_account = relationship("PaperAccount", back_populates="user", uselist=False, cascade="all, delete-orphan", passive_deletes=True)

    __table_args__ = (
        Index('ix_users_created_at', 'created_at'),
    )


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    display_name = Column(String(255), nullable=True)
    avatar_url = Column(Text, nullable=True)
    bio = Column(Text, nullable=True)
    timezone = Column(String(63), default="UTC")
    country = Column(String(2), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="profile")

    __table_args__ = (
        UniqueConstraint('user_id', name='uq_user_profiles_user_id'),
    )


@event.listens_for(User, "before_delete")
def _delete_user_related(mapper, connection, target):
    from app.models.preferences import UserPreferences
    from app.models.session import UserSession
    from app.models.paper_trading import PaperAccount

    connection.execute(UserProfile.__table__.delete().where(UserProfile.user_id == target.id))
    connection.execute(UserSession.__table__.delete().where(UserSession.user_id == target.id))
    connection.execute(UserPreferences.__table__.delete().where(UserPreferences.user_id == target.id))
    connection.execute(PaperAccount.__table__.delete().where(PaperAccount.user_id == target.id))
