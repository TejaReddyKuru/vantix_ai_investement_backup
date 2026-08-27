from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0001_create_markets_table"
down_revision = None
branch_labels = None
def upgrade() -> None:
    op.create_table(
        "markets",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("symbol", sa.String(length=255), nullable=False, index=True, unique=True),
        sa.Column("last_price", sa.Float(), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=True),
    )

def downgrade() -> None:
    op.drop_table("markets")
