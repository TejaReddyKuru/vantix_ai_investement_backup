"""Phase 2: Create assets and watchlist tables.

Revision ID: 0004_phase2_assets_and_watchlists
Revises: 0003_phase2_subscriptions
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0004_phase2_assets_and_watchlists"
down_revision = "0003_phase2_subscriptions"
branch_labels = None
seqrevision = None


def upgrade() -> None:
    # Create assets table
    op.create_table(
        "assets",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("symbol", sa.String(50), nullable=False, unique=True, index=True),
        sa.Column("base_asset", sa.String(50), nullable=False),
        sa.Column("quote_asset", sa.String(50), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("exchange", sa.String(50), nullable=False),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column("asset_metadata", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create watchlists table
    op.create_table(
        "watchlists",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("user_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("idx_watchlists_user_id", "watchlists", ["user_id"])

    # Create watchlist_items table
    op.create_table(
        "watchlist_items",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("watchlist_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("asset_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["watchlist_id"], ["watchlists.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("watchlist_id", "asset_id"),
    )
    op.create_index("idx_watchlist_items_watchlist_id", "watchlist_items", ["watchlist_id"])


def downgrade() -> None:
    op.drop_index("idx_watchlist_items_watchlist_id", "watchlist_items")
    op.drop_table("watchlist_items")
    op.drop_index("idx_watchlists_user_id", "watchlists")
    op.drop_table("watchlists")
    op.drop_table("assets")
