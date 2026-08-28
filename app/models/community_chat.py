from datetime import datetime
from uuid import uuid4
from sqlalchemy import Column, DateTime, String, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from database.base import Base

class ChatCommunity(Base):
    __tablename__ = "chat_communities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    category = Column(String(100), nullable=False, default="General")
    description = Column(String(500), nullable=True)
    icon = Column(String(100), default="MessageSquare")
    avatar_bg = Column(String(100), default="bg-[#0F2D1F]")
    icon_color = Column(String(100), default="text-[#D8E9DD]")
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class ChatCommunityMember(Base):
    __tablename__ = "chat_community_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    community_id = Column(UUID(as_uuid=True), ForeignKey("chat_communities.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), default="Member", nullable=False)  # Admin, Moderator, Member
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class ChatCommunityMessage(Base):
    __tablename__ = "chat_community_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    community_id = Column(UUID(as_uuid=True), ForeignKey("chat_communities.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    reply_to_name = Column(String(255), nullable=True)
    reply_to_content = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
