"""Phase 2: Create users, profiles, sessions, and preferences tables.

Revision ID: 0002_phase2_users_and_auth
Revises: 0001_create_markets_table
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0002_phase2_users_and_auth"
down_revision = "0001_create_markets_table"
branch_labels = None
seqrevision = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        "users",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("email", sa.String(255), nullable=False, unique=True, index=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("email_verified", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("is_staff", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.Column("last_login_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create user_profiles table
    op.create_table(
        "user_profiles",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("user_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("display_name", sa.String(255), nullable=True),
        sa.Column("avatar_url", sa.String(2048), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("timezone", sa.String(63), nullable=True),
        sa.Column("country", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id"),
    )

    # Create user_sessions table
    op.create_table(
        "user_sessions",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("user_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("session_hash", sa.String(255), nullable=False, unique=True, index=True),
        sa.Column("device_info", sa.String(255), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("revoked_at", sa.DateTime(), nullable=True),
        sa.Column("last_seen_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("idx_user_sessions_user_id", "user_sessions", ["user_id"])
    op.create_index("idx_user_sessions_expires_at", "user_sessions", ["expires_at"])

    # Create user_preferences table
    op.create_table(
        "user_preferences",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("user_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("trading_experience", sa.String(50), nullable=True),
        sa.Column("preferred_assets", sa.JSON(), nullable=True),
        sa.Column("trading_style", sa.String(50), nullable=True),
        sa.Column("risk_preference", sa.String(50), nullable=True),
        sa.Column("default_timeframe", sa.String(50), nullable=True),
        sa.Column("ai_preferences", sa.JSON(), nullable=True),
        sa.Column("theme_preference", sa.String(50), server_default=sa.text("'light'"), nullable=False),
        sa.Column("timezone", sa.String(63), nullable=True),
        sa.Column("notification_preferences", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id"),
    )


def downgrade() -> None:
    op.drop_index("idx_user_sessions_expires_at", "user_sessions")
    op.drop_index("idx_user_sessions_user_id", "user_sessions")
    op.drop_table("user_preferences")
    op.drop_table("user_sessions")
    op.drop_table("user_profiles")
    op.drop_table("users")
