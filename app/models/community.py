from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, String, Text, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import synonym

from database.base import Base


class CommunityPost(Base):
    __tablename__ = "community_posts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    content = Column(Text, nullable=False)
    visibility = Column(String(50), default="public")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index('ix_community_posts_created_at', 'created_at'),
    )


class CommunityComment(Base):
    __tablename__ = "community_comments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    post_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index('ix_community_comments_user_id', 'user_id'),
    )


class CommunityLike(Base):
    __tablename__ = "community_likes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    target_type = Column(String(20), nullable=False, default='post')
    target_id = Column(UUID(as_uuid=True), nullable=False)
    post_id = Column(UUID(as_uuid=True), nullable=True)
    comment_id = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint('user_id', 'target_type', 'target_id', name='uq_community_likes'),
        Index('ix_community_likes_post_id', 'post_id'),
    )


class CommunityFollow(Base):
    __tablename__ = "community_follows"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    follower_id = Column(UUID(as_uuid=True), nullable=False)
    following_id = Column(UUID(as_uuid=True), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint('follower_id', 'following_id', name='uq_community_follows'),
        Index('ix_community_follows_following_id', 'following_id'),
    )


class CommunityBookmark(Base):
    __tablename__ = "community_bookmarks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    post_id = Column(UUID(as_uuid=True), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint('user_id', 'post_id', name='uq_community_bookmarks'),
    )


class CommunityReport(Base):
    __tablename__ = "community_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    reporter_id = Column(UUID(as_uuid=True), nullable=False)
    post_id = Column(UUID(as_uuid=True), nullable=True)
    comment_id = Column(UUID(as_uuid=True), nullable=True)
    reason = Column(String(255), nullable=False)
    status = Column(String(50), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('ix_community_reports_reporter_id', 'reporter_id'),
        Index('ix_community_reports_status', 'status'),
    )
