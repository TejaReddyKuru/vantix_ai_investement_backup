"""Phase 2: Create community tables (posts, comments, likes, follows, bookmarks, reports).

Revision ID: 0008_phase2_community
Revises: 0007_phase2_agents_alerts_notifications
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0008_phase2_community"
down_revision = "0007_phase2_agents_alerts"
branch_labels = None
seqrevision = None


def upgrade() -> None:
    # Create community_posts table
    op.create_table(
        "community_posts",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("user_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("visibility", sa.String(50), nullable=False),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("idx_community_posts_user_id", "community_posts", ["user_id"])
    op.create_index("idx_community_posts_created_at", "community_posts", ["created_at"])

    # Create community_comments table
    op.create_table(
        "community_comments",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("post_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["post_id"], ["community_posts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("idx_community_comments_post_id", "community_comments", ["post_id"])
    op.create_index("idx_community_comments_user_id", "community_comments", ["user_id"])

    # Create community_likes table
    op.create_table(
        "community_likes",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("user_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("target_type", sa.String(50), nullable=False),
        sa.Column("target_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", "target_type", "target_id"),
    )
    op.create_index("idx_community_likes_user_id", "community_likes", ["user_id"])

    # Create community_follows table
    op.create_table(
        "community_follows",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("follower_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("following_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["follower_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["following_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("follower_id", "following_id"),
    )
    op.create_index("idx_community_follows_follower_id", "community_follows", ["follower_id"])
    op.create_index("idx_community_follows_following_id", "community_follows", ["following_id"])

    # Create community_bookmarks table
    op.create_table(
        "community_bookmarks",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("user_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("post_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["post_id"], ["community_posts.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", "post_id"),
    )
    op.create_index("idx_community_bookmarks_user_id", "community_bookmarks", ["user_id"])

    # Create community_reports table
    op.create_table(
        "community_reports",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("reporter_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("target_type", sa.String(50), nullable=False),
        sa.Column("target_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("reason", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["reporter_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("idx_community_reports_reporter_id", "community_reports", ["reporter_id"])
    op.create_index("idx_community_reports_status", "community_reports", ["status"])


def downgrade() -> None:
    op.drop_index("idx_community_reports_status", "community_reports")
    op.drop_index("idx_community_reports_reporter_id", "community_reports")
    op.drop_table("community_reports")
    op.drop_index("idx_community_bookmarks_user_id", "community_bookmarks")
    op.drop_table("community_bookmarks")
    op.drop_index("idx_community_follows_following_id", "community_follows")
    op.drop_index("idx_community_follows_follower_id", "community_follows")
    op.drop_table("community_follows")
    op.drop_index("idx_community_likes_user_id", "community_likes")
    op.drop_table("community_likes")
    op.drop_index("idx_community_comments_user_id", "community_comments")
    op.drop_index("idx_community_comments_post_id", "community_comments")
    op.drop_table("community_comments")
    op.drop_index("idx_community_posts_created_at", "community_posts")
    op.drop_index("idx_community_posts_user_id", "community_posts")
    op.drop_table("community_posts")
