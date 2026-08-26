from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

from dotenv import dotenv_values
from sqlalchemy import text
from sqlalchemy.engine import make_url

if sys.platform == "win32":
    asyncio.set_event_loop_policy(
        asyncio.WindowsSelectorEventLoopPolicy()
    )


def pytest_asyncio_loop_factories(config, item):
    """Use a Psycopg-compatible event loop on Windows."""
    if sys.platform == "win32":
        return {"windows-selector": asyncio.SelectorEventLoop}

    return {"stdlib": asyncio.new_event_loop}


# Configure the isolated test database before importing the application engine.
PROJECT_ROOT = Path(__file__).resolve().parents[1]
local_environment = dotenv_values(PROJECT_ROOT / ".env")

source_database_url = (
    os.getenv("TEST_DATABASE_URL")
    or os.getenv("DATABASE_URL")
    or local_environment.get("DATABASE_URL")
)

if not source_database_url:
    raise RuntimeError(
        "DATABASE_URL or TEST_DATABASE_URL is required for the test suite."
    )

source_url = make_url(str(source_database_url))
source_database_name = source_url.database or ""

if not source_database_name:
    raise RuntimeError("The configured database URL has no database name.")

test_database_name = (
    source_database_name
    if source_database_name.lower().endswith("_test")
    else f"{source_database_name}_test"
)

test_url = source_url.set(database=test_database_name)

if not test_database_name.lower().endswith("_test"):
    raise RuntimeError(
        "Refusing to run tests against a database that does not end in '_test'."
    )

os.environ["DATABASE_URL"] = test_url.render_as_string(
    hide_password=False
)


import pytest_asyncio

import app.models  # noqa: E402, F401
from app.core.security import rate_limiters  # noqa: E402
from app.models.subscription import (  # noqa: E402
    PlanEntitlement,
    SubscriptionPlan,
)
from database.base import Base  # noqa: E402
from database.connection import engine  # noqa: E402
from database.session import AsyncSessionLocal  # noqa: E402


@pytest_asyncio.fixture(autouse=True)
async def reset_database():
    """Reset only the isolated test database and seed default plans."""
    for limiter in rate_limiters.values():
        limiter._hits.clear()

    async with engine.begin() as conn:

        def _reset_schema(sync_conn):
            database_name = sync_conn.engine.url.database or ""

            if not database_name.lower().endswith("_test"):
                raise RuntimeError(
                    "Safety stop: refusing to reset a non-test database."
                )

            dialect = sync_conn.dialect.name

            if dialect == "postgresql":
                sync_conn.execute(
                    text("DROP SCHEMA IF EXISTS public CASCADE;")
                )
                sync_conn.execute(text("CREATE SCHEMA public;"))
                Base.metadata.create_all(sync_conn)
                return

            if dialect == "sqlite":
                sync_conn.execute(text("PRAGMA foreign_keys = OFF;"))
                Base.metadata.drop_all(sync_conn)
                Base.metadata.create_all(sync_conn)
                sync_conn.execute(text("PRAGMA foreign_keys = ON;"))
                return

            Base.metadata.drop_all(sync_conn)
            Base.metadata.create_all(sync_conn)

        await conn.run_sync(_reset_schema)

    async with AsyncSessionLocal() as session:
        plans = [
            SubscriptionPlan(
                name="Free",
                code="FREE",
                description="Basic access",
                price_monthly=0,
                price_yearly=0,
            ),
            SubscriptionPlan(
                name="Pro",
                code="PRO",
                description="Advanced access",
                price_monthly=29.99,
                price_yearly=299.99,
            ),
            SubscriptionPlan(
                name="Elite",
                code="ELITE",
                description="Premium access",
                price_monthly=99.99,
                price_yearly=999.99,
            ),
        ]

        session.add_all(plans)
        await session.commit()

        for plan in plans:
            await session.refresh(plan)
            session.add_all(
                [
                    PlanEntitlement(
                        plan_id=plan.id,
                        entitlement_code=f"{plan.code.lower()}_basic",
                        name=f"{plan.name} basic access",
                        description="Default entitlement",
                    ),
                    PlanEntitlement(
                        plan_id=plan.id,
                        entitlement_code=f"{plan.code.lower()}_premium",
                        name=f"{plan.name} premium access",
                        description="Premium entitlement",
                    ),
                ]
            )

        await session.commit()

    yield
