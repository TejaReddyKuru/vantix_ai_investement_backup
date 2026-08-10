"""Phase 2: Create AI agent execution and insights, alerts, and notifications tables.

Revision ID: 0007_phase2_agents_alerts_notifications
Revises: 0006_phase2_journal_portfolio_ai
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0007_phase2_agents_alerts_notifications"
down_revision = "0006_phase2_journal_portfolio_ai"
branch_labels = None
seqrevision = None


def upgrade() -> None:
    # Create ai_agent_runs table
    op.create_table(
        "ai_agent_runs",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("user_id", sa.UUID(as_uuid=True), nullable=True),
        sa.Column("agent_name", sa.String(100), nullable=False, index=True),
        sa.Column("agent_version", sa.String(50), nullable=False),
        sa.Column("request_id", sa.String(255), nullable=False, index=True),
        sa.Column("input_reference", sa.String(255), nullable=True),
        sa.Column("output_reference", sa.String(255), nullable=True),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column("confidence", sa.Numeric(5, 2), nullable=True),
        sa.Column("duration_ms", sa.Integer(), nullable=True),
        sa.Column("error_code", sa.String(100), nullable=True),
        sa.Column("started_at", sa.DateTime(), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("idx_ai_agent_runs_user_id", "ai_agent_runs", ["user_id"])
    op.create_index("idx_ai_agent_runs_agent_name", "ai_agent_runs", ["agent_name"])

    # Create ai_insights table
    op.create_table(
        "ai_insights",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("user_id", sa.UUID(as_uuid=True), nullable=True),
        sa.Column("asset_id", sa.UUID(as_uuid=True), nullable=True),
        sa.Column("insight_type", sa.String(50), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("confidence", sa.Numeric(5, 2), nullable=False),
        sa.Column("generated_at", sa.DateTime(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
        sa.Column("source_metadata", sa.JSON(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"], ondelete="SET NULL"),
    )
    op.create_index("idx_ai_insights_user_id", "ai_insights", ["user_id"])
    op.create_index("idx_ai_insights_asset_id", "ai_insights", ["asset_id"])

    # Create alert_rules table
    op.create_table(
        "alert_rules",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("user_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("asset_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("alert_type", sa.String(50), nullable=False),
        sa.Column("condition", sa.JSON(), nullable=False),
        sa.Column("threshold", sa.Numeric(20, 8), nullable=True),
        sa.Column("is_enabled", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("cooldown_seconds", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"], ondelete="CASCADE"),
    )
    op.create_index("idx_alert_rules_user_id", "alert_rules", ["user_id"])

    # Create alert_events table
    op.create_table(
        "alert_events",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("alert_rule_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("triggered_at", sa.DateTime(), nullable=False),
        sa.Column("value", sa.Numeric(20, 8), nullable=False),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column("notification_sent", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["alert_rule_id"], ["alert_rules.id"], ondelete="CASCADE"),
    )
    op.create_index("idx_alert_events_alert_rule_id", "alert_events", ["alert_rule_id"])
    op.create_index("idx_alert_events_triggered_at", "alert_events", ["triggered_at"])

    # Create notifications table
    op.create_table(
        "notifications",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("user_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("notification_type", sa.String(50), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("reference_type", sa.String(50), nullable=True),
        sa.Column("reference_id", sa.UUID(as_uuid=True), nullable=True),
        sa.Column("read_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("idx_notifications_user_id", "notifications", ["user_id"])
    op.create_index("idx_notifications_user_read", "notifications", ["user_id", "read_at"])


def downgrade() -> None:
    op.drop_index("idx_notifications_user_read", "notifications")
    op.drop_index("idx_notifications_user_id", "notifications")
    op.drop_table("notifications")
    op.drop_index("idx_alert_events_triggered_at", "alert_events")
    op.drop_index("idx_alert_events_alert_rule_id", "alert_events")
    op.drop_table("alert_events")
    op.drop_index("idx_alert_rules_user_id", "alert_rules")
    op.drop_table("alert_rules")
    op.drop_index("idx_ai_insights_asset_id", "ai_insights")
    op.drop_index("idx_ai_insights_user_id", "ai_insights")
    op.drop_table("ai_insights")
    op.drop_index("idx_ai_agent_runs_agent_name", "ai_agent_runs")
    op.drop_index("idx_ai_agent_runs_user_id", "ai_agent_runs")
    op.drop_table("ai_agent_runs")
