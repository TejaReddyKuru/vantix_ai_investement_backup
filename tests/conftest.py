import pytest_asyncio
from sqlalchemy import text

import app.models  # noqa: F401  # Register all mapped models before schema creation
from app.models.subscription import SubscriptionPlan, PlanEntitlement
from database.base import Base
from database.connection import engine
from database.session import AsyncSessionLocal


from app.core.security import rate_limiters


@pytest_asyncio.fixture(autouse=True)
async def reset_database():
    """Create a clean SQLite schema and seed default subscription plans for each test."""
    for limiter in rate_limiters.values():
        limiter._hits.clear()
    async with engine.begin() as conn:
        def _reset_schema(sync_conn):
            sync_conn.execute(text("PRAGMA foreign_keys = OFF;"))
            for table in reversed(Base.metadata.sorted_tables):
                sync_conn.execute(text(f'DROP TABLE IF EXISTS "{table.name}";'))
            Base.metadata.create_all(sync_conn)
            sync_conn.execute(text("PRAGMA foreign_keys = ON;"))

        await conn.run_sync(_reset_schema)

    async with AsyncSessionLocal() as session:
        plans = [
            SubscriptionPlan(name="Free", code="FREE", description="Basic access", price_monthly=0, price_yearly=0),
            SubscriptionPlan(name="Pro", code="PRO", description="Advanced access", price_monthly=29.99, price_yearly=299.99),
            SubscriptionPlan(name="Elite", code="ELITE", description="Premium access", price_monthly=99.99, price_yearly=999.99),
        ]
        session.add_all(plans)
        await session.commit()

        for plan in plans:
            await session.refresh(plan)
            session.add_all(
                [
                    PlanEntitlement(plan_id=plan.id, entitlement_code=f"{plan.code.lower()}_basic", name=f"{plan.name} basic access", description="Default entitlement"),
                    PlanEntitlement(plan_id=plan.id, entitlement_code=f"{plan.code.lower()}_premium", name=f"{plan.name} premium access", description="Premium entitlement"),
                ]
            )
        await session.commit()

    yield
