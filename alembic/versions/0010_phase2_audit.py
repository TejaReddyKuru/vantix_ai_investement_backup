"""Phase 2: Create audit logs table for security and compliance tracking.

Revision ID: 0010_phase2_audit
Revises: 0009_phase2_tutor
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0010_phase2_audit"
down_revision = "0009_phase2_tutor"
branch_labels = None
seqrevision = None


def upgrade() -> None:
    # Create audit_logs table
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("user_id", sa.UUID(as_uuid=True), nullable=True),
        sa.Column("action", sa.String(100), nullable=False, index=True),
        sa.Column("resource_type", sa.String(50), nullable=False),
        sa.Column("resource_id", sa.UUID(as_uuid=True), nullable=True),
        sa.Column("request_id", sa.String(255), nullable=False, index=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("user_agent", sa.String(255), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_index("idx_audit_logs_user_id", "audit_logs", ["user_id"])
    op.create_index("idx_audit_logs_action", "audit_logs", ["action"])
    op.create_index("idx_audit_logs_created_at", "audit_logs", ["created_at"])
    op.create_index("idx_audit_logs_resource", "audit_logs", ["resource_type", "resource_id"])


def downgrade() -> None:
    op.drop_index("idx_audit_logs_resource", "audit_logs")
    op.drop_index("idx_audit_logs_created_at", "audit_logs")
    op.drop_index("idx_audit_logs_action", "audit_logs")
    op.drop_index("idx_audit_logs_user_id", "audit_logs")
    op.drop_table("audit_logs")
