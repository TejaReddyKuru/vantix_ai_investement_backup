"""Phase 2: Add paper trading persistence and user isolation fields.

Revision ID: 0013_paper_trading_persistence
Revises: 54c5f5d1c6fc
Create Date: 2026-08-28 19:20:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0013_paper_trading_persistence"
down_revision = "54c5f5d1c6fc"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    is_sqlite = bind.dialect.name == "sqlite"

    if is_sqlite:
        with op.batch_alter_table("paper_accounts") as batch_op:
            batch_op.create_unique_constraint("uq_paper_accounts_user_id", ["user_id"])
            batch_op.add_column(sa.Column("balance", sa.Numeric(20, 8), nullable=True))
            batch_op.add_column(sa.Column("equity", sa.Numeric(20, 8), nullable=True))

        with op.batch_alter_table("paper_orders") as batch_op:
            batch_op.add_column(sa.Column("user_id", sa.UUID(as_uuid=True), nullable=True))
            batch_op.add_column(sa.Column("symbol", sa.String(length=50), nullable=True))
            batch_op.add_column(sa.Column("realized_pnl", sa.Numeric(20, 8), server_default="0", nullable=False))
            batch_op.create_foreign_key("fk_paper_orders_user_id", "users", ["user_id"], ["id"], ondelete="CASCADE")
            batch_op.create_index("idx_paper_orders_user_id", ["user_id"])

        with op.batch_alter_table("paper_positions") as batch_op:
            batch_op.add_column(sa.Column("user_id", sa.UUID(as_uuid=True), nullable=True))
            batch_op.add_column(sa.Column("symbol", sa.String(length=50), nullable=True))
            batch_op.add_column(sa.Column("current_price", sa.Numeric(20, 8), nullable=True))
            batch_op.create_foreign_key("fk_paper_positions_user_id", "users", ["user_id"], ["id"], ondelete="CASCADE")
            batch_op.create_index("idx_paper_positions_user_id", ["user_id"])

        with op.batch_alter_table("paper_trades") as batch_op:
            batch_op.add_column(sa.Column("user_id", sa.UUID(as_uuid=True), nullable=True))
            batch_op.add_column(sa.Column("symbol", sa.String(length=50), nullable=True))
            batch_op.create_foreign_key("fk_paper_trades_user_id", "users", ["user_id"], ["id"], ondelete="CASCADE")
            batch_op.create_index("idx_paper_trades_user_id", ["user_id"])

        with op.batch_alter_table("paper_transactions") as batch_op:
            batch_op.add_column(sa.Column("user_id", sa.UUID(as_uuid=True), nullable=True))
            batch_op.create_foreign_key("fk_paper_transactions_user_id", "users", ["user_id"], ["id"], ondelete="CASCADE")
            batch_op.create_index("idx_paper_transactions_user_id", ["user_id"])

        op.execute("UPDATE paper_accounts SET balance = current_cash, equity = current_cash")
    else:
        # 1. paper_accounts unique constraint on user_id and new columns
        op.create_unique_constraint("uq_paper_accounts_user_id", "paper_accounts", ["user_id"])
        op.add_column("paper_accounts", sa.Column("balance", sa.Numeric(20, 8), nullable=True))
        op.add_column("paper_accounts", sa.Column("equity", sa.Numeric(20, 8), nullable=True))

        # 2. paper_orders new columns
        op.add_column("paper_orders", sa.Column("user_id", sa.UUID(as_uuid=True), nullable=True))
        op.add_column("paper_orders", sa.Column("symbol", sa.String(length=50), nullable=True))
        op.add_column("paper_orders", sa.Column("realized_pnl", sa.Numeric(20, 8), server_default="0", nullable=False))
        op.create_foreign_key("fk_paper_orders_user_id", "paper_orders", "users", ["user_id"], ["id"], ondelete="CASCADE")
        op.create_index("idx_paper_orders_user_id", "paper_orders", ["user_id"])

        # 3. paper_positions new columns
        op.add_column("paper_positions", sa.Column("user_id", sa.UUID(as_uuid=True), nullable=True))
        op.add_column("paper_positions", sa.Column("symbol", sa.String(length=50), nullable=True))
        op.add_column("paper_positions", sa.Column("current_price", sa.Numeric(20, 8), nullable=True))
        op.create_foreign_key("fk_paper_positions_user_id", "paper_positions", "users", ["user_id"], ["id"], ondelete="CASCADE")
        op.create_index("idx_paper_positions_user_id", "paper_positions", ["user_id"])

        # 4. paper_trades new columns
        op.add_column("paper_trades", sa.Column("user_id", sa.UUID(as_uuid=True), nullable=True))
        op.add_column("paper_trades", sa.Column("symbol", sa.String(length=50), nullable=True))
        op.create_foreign_key("fk_paper_trades_user_id", "paper_trades", "users", ["user_id"], ["id"], ondelete="CASCADE")
        op.create_index("idx_paper_trades_user_id", "paper_trades", ["user_id"])

        # 5. paper_transactions new columns
        op.add_column("paper_transactions", sa.Column("user_id", sa.UUID(as_uuid=True), nullable=True))
        op.create_foreign_key("fk_paper_transactions_user_id", "paper_transactions", "users", ["user_id"], ["id"], ondelete="CASCADE")
        op.create_index("idx_paper_transactions_user_id", "paper_transactions", ["user_id"])

        # --- Data Backfilling ---
        # Populate balance and equity in paper_accounts
        op.execute("UPDATE paper_accounts SET balance = current_cash, equity = current_cash")

        # Populate user_id and symbol for existing orders, positions, trades, transactions
        op.execute("UPDATE paper_orders o SET user_id = a.user_id FROM paper_accounts a WHERE o.paper_account_id = a.id")
        op.execute("UPDATE paper_orders o SET symbol = ast.symbol FROM assets ast WHERE o.asset_id = ast.id")

        op.execute("UPDATE paper_positions p SET user_id = a.user_id FROM paper_accounts a WHERE p.paper_account_id = a.id")
        op.execute("UPDATE paper_positions p SET symbol = ast.symbol FROM assets ast WHERE p.asset_id = ast.id")

        op.execute("UPDATE paper_trades t SET user_id = a.user_id FROM paper_accounts a WHERE t.paper_account_id = a.id")
        op.execute("UPDATE paper_trades t SET symbol = ast.symbol FROM assets ast WHERE t.asset_id = ast.id")

        op.execute("UPDATE paper_transactions tx SET user_id = a.user_id FROM paper_accounts a WHERE tx.paper_account_id = a.id")


def downgrade() -> None:
    # Drop foreign keys and indexes
    op.drop_index("idx_paper_transactions_user_id", table_name="paper_transactions")
    op.drop_constraint("fk_paper_transactions_user_id", "paper_transactions", type_="foreignkey")
    op.drop_column("paper_transactions", "user_id")

    op.drop_index("idx_paper_trades_user_id", table_name="paper_trades")
    op.drop_constraint("fk_paper_trades_user_id", "paper_trades", type_="foreignkey")
    op.drop_column("paper_trades", "symbol")
    op.drop_column("paper_trades", "user_id")

    op.drop_index("idx_paper_positions_user_id", table_name="paper_positions")
    op.drop_constraint("fk_paper_positions_user_id", "paper_positions", type_="foreignkey")
    op.drop_column("paper_positions", "current_price")
    op.drop_column("paper_positions", "symbol")
    op.drop_column("paper_positions", "user_id")

    op.drop_index("idx_paper_orders_user_id", table_name="paper_orders")
    op.drop_constraint("fk_paper_orders_user_id", "paper_orders", type_="foreignkey")
    op.drop_column("paper_orders", "realized_pnl")
    op.drop_column("paper_orders", "symbol")
    op.drop_column("paper_orders", "user_id")

    op.drop_constraint("uq_paper_accounts_user_id", "paper_accounts", type_="unique")
    op.drop_column("paper_accounts", "equity")
    op.drop_column("paper_accounts", "balance")
