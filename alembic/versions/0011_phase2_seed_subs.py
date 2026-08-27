"""Phase 2: Seed subscription plans and entitlements.

Revision ID: 0011_phase2_seed_subscription_data
Revises: 0010_phase2_audit
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime
import uuid

# revision identifiers, used by Alembic.
revision = "0011_phase2_seed_subs"
down_revision = "0010_phase2_audit"
branch_labels = None
seqrevision = None


def upgrade() -> None:
    # Insert subscription plans
    free_plan_id = str(uuid.uuid4())
    pro_plan_id = str(uuid.uuid4())
    elite_plan_id = str(uuid.uuid4())
    
    op.execute(
        f"""
        INSERT INTO subscription_plans (id, name, code, description, price_monthly, price_yearly, billing_interval, active, created_at, updated_at)
        VALUES 
            ('{free_plan_id}', 'Free', 'FREE', 'Basic access to market analysis and paper trading', 0.00, 0.00, 'month', true, '{datetime.utcnow().isoformat()}', '{datetime.utcnow().isoformat()}'),
            ('{pro_plan_id}', 'Pro', 'PRO', 'Advanced market analysis, AI tutor, and community features', 29.00, 290.00, 'month', true, '{datetime.utcnow().isoformat()}', '{datetime.utcnow().isoformat()}'),
            ('{elite_plan_id}', 'Elite', 'ELITE', 'Full access to all features including alerts and AI agents', 99.00, 990.00, 'month', true, '{datetime.utcnow().isoformat()}', '{datetime.utcnow().isoformat()}')
        """
    )
    
    # Insert entitlements for FREE plan
    free_entitlements = [
        ('MARKET_ANALYSIS', free_plan_id),
        ('PAPER_TRADING', free_plan_id),
    ]
    
    # Insert entitlements for PRO plan
    pro_entitlements = [
        ('MARKET_ANALYSIS', pro_plan_id),
        ('PAPER_TRADING', pro_plan_id),
        ('AI_CHAT', pro_plan_id),
        ('PORTFOLIO', pro_plan_id),
        ('AI_TUTOR', pro_plan_id),
        ('COMMUNITY', pro_plan_id),
    ]
    
    # Insert entitlements for ELITE plan
    elite_entitlements = [
        ('MARKET_ANALYSIS', elite_plan_id),
        ('PAPER_TRADING', elite_plan_id),
        ('AI_CHAT', elite_plan_id),
        ('PORTFOLIO', elite_plan_id),
        ('AI_TUTOR', elite_plan_id),
        ('COMMUNITY', elite_plan_id),
        ('ALERTS', elite_plan_id),
    ]
    
    for entitlement_code, plan_id in free_entitlements + pro_entitlements + elite_entitlements:
        entitlement_id = str(uuid.uuid4())
        op.execute(
            f"""
            INSERT INTO plan_entitlements (id, plan_id, entitlement_code, created_at)
            VALUES ('{entitlement_id}', '{plan_id}', '{entitlement_code}', '{datetime.utcnow().isoformat()}')
            """
        )


def downgrade() -> None:
    # Delete all entitlements first
    op.execute("DELETE FROM plan_entitlements")
    # Delete all plans
    op.execute("DELETE FROM subscription_plans")
