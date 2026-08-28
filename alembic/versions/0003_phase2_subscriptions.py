"""Phase 2: Create subscription tables (plans, subscriptions, entitlements).

Revision ID: 0003_phase2_subscriptions
Revises: 0002_phase2_users_and_auth
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0003_phase2_subscriptions"
down_revision = "0002_phase2_users_and_auth"
branch_labels = None
seqrevision = None


def upgrade() -> None:
    # Create subscription_plans table
    op.create_table(
        "subscription_plans",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("code", sa.String(50), nullable=False, unique=True, index=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("price", sa.Numeric(20, 2), nullable=True),
        sa.Column("price_monthly", sa.Numeric(10, 2), nullable=True),
        sa.Column("price_yearly", sa.Numeric(10, 2), nullable=True),
        sa.Column("billing_interval", sa.String(50), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create subscriptions table
    op.create_table(
        "subscriptions",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("user_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("plan_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, index=True),
        sa.Column("start_at", sa.DateTime(), nullable=True),
        sa.Column("started_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("end_at", sa.DateTime(), nullable=True),
        sa.Column("ended_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["plan_id"], ["subscription_plans.id"], ondelete="RESTRICT"),
    )
    op.create_index("idx_subscriptions_user_id", "subscriptions", ["user_id"])

    # Create plan_entitlements table
    op.create_table(
        "plan_entitlements",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("plan_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("entitlement_code", sa.String(50), nullable=False),
        sa.Column("name", sa.String(255), nullable=True),
        sa.Column("description", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["plan_id"], ["subscription_plans.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("plan_id", "entitlement_code"),
    )


def downgrade() -> None:
    op.drop_table("plan_entitlements")
    op.drop_index("idx_subscriptions_user_id", "subscriptions")
    op.drop_table("subscriptions")
    op.drop_table("subscription_plans")
