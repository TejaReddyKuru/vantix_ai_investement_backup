"""Phase 2: Create journal, portfolio, and AI conversation tables.

Revision ID: 0006_phase2_journal_portfolio_ai
Revises: 0005_phase2_paper_trading
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0006_phase2_journal_portfolio_ai"
down_revision = "0005_phase2_paper_trading"
branch_labels = None
seqrevision = None


def upgrade() -> None:
    # Create trade_journal_entries table
    op.create_table(
        "trade_journal_entries",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("user_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("paper_trade_id", sa.UUID(as_uuid=True), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("strategy", sa.String(255), nullable=True),
        sa.Column("setup", sa.Text(), nullable=True),
        sa.Column("lessons", sa.Text(), nullable=True),
        sa.Column("tags", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["paper_trade_id"], ["paper_trades.id"], ondelete="SET NULL"),
    )
    op.create_index("idx_trade_journal_entries_user_id", "trade_journal_entries", ["user_id"])

    # Create portfolio_snapshots table (time-series data)
    op.create_table(
        "portfolio_snapshots",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("user_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("paper_account_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("total_equity", sa.Numeric(20, 8), nullable=False),
        sa.Column("cash", sa.Numeric(20, 8), nullable=False),
        sa.Column("invested_value", sa.Numeric(20, 8), nullable=False),
        sa.Column("realized_pnl", sa.Numeric(20, 8), nullable=False),
        sa.Column("unrealized_pnl", sa.Numeric(20, 8), nullable=False),
        sa.Column("drawdown", sa.Numeric(20, 8), nullable=False),
        sa.Column("recorded_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["paper_account_id"], ["paper_accounts.id"], ondelete="CASCADE"),
    )
    op.create_index("idx_portfolio_snapshots_user_id", "portfolio_snapshots", ["user_id"])
    op.create_index("idx_portfolio_snapshots_recorded_at", "portfolio_snapshots", ["recorded_at"])
    op.create_index("idx_portfolio_snapshots_user_recorded", "portfolio_snapshots", ["user_id", "recorded_at"])

    # Create ai_conversations table
    op.create_table(
        "ai_conversations",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("user_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("context_type", sa.String(50), nullable=True),
        sa.Column("context_asset_id", sa.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["context_asset_id"], ["assets.id"], ondelete="SET NULL"),
    )
    op.create_index("idx_ai_conversations_user_id", "ai_conversations", ["user_id"])

    # Create ai_messages table
    op.create_table(
        "ai_messages",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("conversation_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("role", sa.String(50), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("model", sa.String(255), nullable=True),
        sa.Column("provider", sa.String(255), nullable=True),
        sa.Column("tokens_used", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["conversation_id"], ["ai_conversations.id"], ondelete="CASCADE"),
    )
    op.create_index("idx_ai_messages_conversation_id", "ai_messages", ["conversation_id"])


def downgrade() -> None:
    op.drop_index("idx_ai_messages_conversation_id", "ai_messages")
    op.drop_table("ai_messages")
    op.drop_index("idx_ai_conversations_user_id", "ai_conversations")
    op.drop_table("ai_conversations")
    op.drop_index("idx_portfolio_snapshots_user_recorded", "portfolio_snapshots")
    op.drop_index("idx_portfolio_snapshots_recorded_at", "portfolio_snapshots")
    op.drop_index("idx_portfolio_snapshots_user_id", "portfolio_snapshots")
    op.drop_table("portfolio_snapshots")
    op.drop_index("idx_trade_journal_entries_user_id", "trade_journal_entries")
    op.drop_table("trade_journal_entries")
