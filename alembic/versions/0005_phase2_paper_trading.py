"""Phase 2: Create paper trading tables (accounts, orders, positions, trades, transactions).

Revision ID: 0005_phase2_paper_trading
Revises: 0004_phase2_assets_and_watchlists
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0005_phase2_paper_trading"
down_revision = "0004_phase2_assets_and_watchlists"
branch_labels = None
seqrevision = None


def upgrade() -> None:
    # Create paper_accounts table
    op.create_table(
        "paper_accounts",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("user_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("initial_balance", sa.Numeric(20, 8), nullable=False),
        sa.Column("current_cash", sa.Numeric(20, 8), nullable=False),
        sa.Column("currency", sa.String(10), nullable=False),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.CheckConstraint("current_cash >= 0"),
    )
    op.create_index("idx_paper_accounts_user_id", "paper_accounts", ["user_id"])

    # Create paper_orders table
    op.create_table(
        "paper_orders",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("paper_account_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("asset_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("side", sa.String(10), nullable=False),
        sa.Column("order_type", sa.String(50), nullable=False),
        sa.Column("quantity", sa.Numeric(20, 8), nullable=False),
        sa.Column("requested_price", sa.Numeric(20, 8), nullable=False),
        sa.Column("executed_price", sa.Numeric(20, 8), nullable=True),
        sa.Column("stop_loss", sa.Numeric(20, 8), nullable=True),
        sa.Column("take_profit", sa.Numeric(20, 8), nullable=True),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["paper_account_id"], ["paper_accounts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"], ondelete="RESTRICT"),
    )
    op.create_index("idx_paper_orders_paper_account_id", "paper_orders", ["paper_account_id"])
    op.create_index("idx_paper_orders_status", "paper_orders", ["status"])

    # Create paper_positions table
    op.create_table(
        "paper_positions",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("paper_account_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("asset_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("quantity", sa.Numeric(20, 8), nullable=False),
        sa.Column("average_entry_price", sa.Numeric(20, 8), nullable=False),
        sa.Column("realized_pnl", sa.Numeric(20, 8), nullable=False),
        sa.Column("unrealized_pnl", sa.Numeric(20, 8), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["paper_account_id"], ["paper_accounts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"], ondelete="RESTRICT"),
        sa.UniqueConstraint("paper_account_id", "asset_id"),
    )
    op.create_index("idx_paper_positions_paper_account_id", "paper_positions", ["paper_account_id"])

    # Create paper_trades table (execution events)
    op.create_table(
        "paper_trades",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("paper_account_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("order_id", sa.UUID(as_uuid=True), nullable=True),
        sa.Column("asset_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("side", sa.String(10), nullable=False),
        sa.Column("quantity", sa.Numeric(20, 8), nullable=False),
        sa.Column("execution_price", sa.Numeric(20, 8), nullable=False),
        sa.Column("fee", sa.Numeric(20, 8), nullable=False),
        sa.Column("slippage", sa.Numeric(20, 8), nullable=False),
        sa.Column("realized_pnl", sa.Numeric(20, 8), nullable=False),
        sa.Column("executed_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["paper_account_id"], ["paper_accounts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["order_id"], ["paper_orders.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"], ondelete="RESTRICT"),
    )
    op.create_index("idx_paper_trades_paper_account_id", "paper_trades", ["paper_account_id"])
    op.create_index("idx_paper_trades_executed_at", "paper_trades", ["executed_at"])

    # Create paper_transactions table (balance movements for audit trail)
    op.create_table(
        "paper_transactions",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("paper_account_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("transaction_type", sa.String(50), nullable=False),
        sa.Column("amount", sa.Numeric(20, 8), nullable=False),
        sa.Column("reference_id", sa.UUID(as_uuid=True), nullable=True),
        sa.Column("reference_type", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["paper_account_id"], ["paper_accounts.id"], ondelete="CASCADE"),
    )
    op.create_index("idx_paper_transactions_paper_account_id", "paper_transactions", ["paper_account_id"])


def downgrade() -> None:
    op.drop_index("idx_paper_transactions_paper_account_id", "paper_transactions")
    op.drop_table("paper_transactions")
    op.drop_index("idx_paper_trades_executed_at", "paper_trades")
    op.drop_index("idx_paper_trades_paper_account_id", "paper_trades")
    op.drop_table("paper_trades")
    op.drop_index("idx_paper_positions_paper_account_id", "paper_positions")
    op.drop_table("paper_positions")
    op.drop_index("idx_paper_orders_status", "paper_orders")
    op.drop_index("idx_paper_orders_paper_account_id", "paper_orders")
    op.drop_table("paper_orders")
    op.drop_index("idx_paper_accounts_user_id", "paper_accounts")
    op.drop_table("paper_accounts")
