r"""Repair the specific legacy CoinCrest subscription schema diagnosed on 2026-08-27.

Place this file beside .env, app/, and database/ in the project root.
Stop the backend before applying; the frontend may remain running.

    python .\repair_coincrest_subscriptions.py            # read-only preview
    python .\repair_coincrest_subscriptions.py --apply    # backup, then repair

Requires the project's existing SQLAlchemy, psycopg, and python-dotenv packages,
plus PostgreSQL's pg_dump and pg_restore utilities (normally installed together).
Only a local, non-production database named vish_capitals is accepted.

No rows or columns are deleted. Existing price is retained as legacy data.
Monthly/yearly prices are copied ONLY for their recorded billing interval;
the other interval remains NULL, never an invented zero or multiplied price.
Existing entitlement codes become initial display names; permissions are unchanged.
This is a targeted local repair, NOT an Alembic revision or a production migration.
It does not change/stamp alembic_version. Reconcile the migration chain separately.

References:
https://www.postgresql.org/docs/current/sql-altertable.html
https://www.postgresql.org/docs/current/app-pgdump.html
"""

from __future__ import annotations

import argparse
import ipaddress
import os
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from uuid import uuid4


TABLES = ("subscription_plans", "subscriptions", "plan_entitlements")
MAX_PRICE = Decimal("99999999.99")  # Matches the current model's Numeric(10, 2).
INTERVALS = {
    "month": "price_monthly",
    "monthly": "price_monthly",
    "year": "price_yearly",
    "yearly": "price_yearly",
    "annual": "price_yearly",
    "annually": "price_yearly",
}


def build_statements(layout: dict, price_rows: list[dict]) -> list[str]:
    """Build only the diagnosed repair; reject conflicting/ambiguous schemas."""
    required = {
        "subscription_plans": {
            "id", "name", "code", "description", "price", "billing_interval",
            "created_at", "updated_at",
        },
        "subscriptions": {"id", "user_id", "plan_id", "status", "created_at", "updated_at"},
        "plan_entitlements": {"id", "plan_id", "entitlement_code", "created_at"},
    }
    renames = (
        ("subscription_plans", "is_active", "active", "BOOLEAN"),
        ("subscriptions", "start_at", "started_at", "TIMESTAMPWITHOUTTIMEZONE"),
        ("subscriptions", "end_at", "ended_at", "TIMESTAMPWITHOUTTIMEZONE"),
    )
    additions = {
        "subscription_plans": {"price_monthly", "price_yearly", "active", "is_active"},
        "subscriptions": {"start_at", "started_at", "end_at", "ended_at"},
        "plan_entitlements": {"name", "description"},
    }
    for table, names in required.items():
        if table not in layout or not names.issubset(layout[table]):
            raise RuntimeError(f"Unexpected schema for public.{table}; no repair selected.")
        for name, col in layout[table].items():
            if name not in names | additions[table] and not col["nullable"] and not col["default"]:
                raise RuntimeError(f"Unmapped required column: {table}.{name}. Review it first.")

    def normalized_type(table: str, name: str) -> str:
        return layout[table][name]["type"].upper().replace(" ", "")

    sql = []
    for table, old, new, expected_type in renames:
        old_exists, new_exists = old in layout[table], new in layout[table]
        if old_exists == new_exists:
            raise RuntimeError(f"Expected exactly one of {table}.{old} and {table}.{new}.")
        present = old if old_exists else new
        if normalized_type(table, present) != expected_type:
            raise RuntimeError(f"Unexpected type for {table}.{present}.")
        if old_exists:
            sql.append(f'ALTER TABLE public.{table} RENAME COLUMN "{old}" TO "{new}"')

    new_price_columns = {
        name for name in ("price_monthly", "price_yearly")
        if name not in layout["subscription_plans"]
    }
    for name in ("price_monthly", "price_yearly"):
        if name not in new_price_columns:
            if normalized_type("subscription_plans", name) != "NUMERIC(10,2)":
                raise RuntimeError(f"Unexpected existing type for subscription_plans.{name}.")

    if new_price_columns:
        if normalized_type("subscription_plans", "price") != "NUMERIC(20,2)":
            raise RuntimeError("The legacy price column differs from the inspected NUMERIC(20,2).")
        for row in price_rows:
            price = row["price"]
            if price is None:
                continue
            period = str(row["billing_interval"]).strip(" ").lower()
            target = INTERVALS.get(period)
            if target is None:
                raise RuntimeError(
                    f"Plan {row['code']!r} has billing interval {period!r}. "
                    "Confirm its price mapping first; nothing will be committed."
                )
            if target in new_price_columns and (
                not price.is_finite() or abs(price) > MAX_PRICE
            ):
                raise RuntimeError(f"Plan {row['code']!r} exceeds the current model's price range.")

    for name in ("price_monthly", "price_yearly"):
        if name in new_price_columns:
            sql.append(f"ALTER TABLE public.subscription_plans ADD COLUMN {name} NUMERIC(10, 2)")
            periods = ", ".join(f"'{key}'" for key, value in INTERVALS.items() if value == name)
            sql.append(
                f"UPDATE public.subscription_plans SET {name} = price "
                f"WHERE lower(btrim(billing_interval)) IN ({periods}) AND price IS NOT NULL"
            )

    entitlements = layout["plan_entitlements"]
    code_type = normalized_type("plan_entitlements", "entitlement_code")
    if code_type == "VARCHAR(50)":
        sql.append("ALTER TABLE public.plan_entitlements ALTER COLUMN entitlement_code TYPE VARCHAR(100)")
    elif code_type != "VARCHAR(100)":
        raise RuntimeError("Unexpected entitlement_code type; review before changing it.")

    if "name" not in entitlements:
        sql.append("ALTER TABLE public.plan_entitlements ADD COLUMN name VARCHAR(255)")
    elif normalized_type("plan_entitlements", "name") != "VARCHAR(255)":
        raise RuntimeError("Unexpected existing entitlement name type.")
    if "name" not in entitlements or entitlements["name"]["nullable"]:
        sql.extend([
            "UPDATE public.plan_entitlements SET name = entitlement_code WHERE name IS NULL",
            "ALTER TABLE public.plan_entitlements ALTER COLUMN name SET NOT NULL",
        ])
    if "description" not in entitlements:
        sql.append("ALTER TABLE public.plan_entitlements ADD COLUMN description VARCHAR(500)")
    elif normalized_type("plan_entitlements", "description") != "VARCHAR(500)":
        raise RuntimeError("Unexpected existing entitlement description type.")
    return sql


def inspect_repair(conn) -> list[str]:
    from sqlalchemy import inspect

    database, address = conn.exec_driver_sql(
        "SELECT current_database(), inet_server_addr()::text"
    ).one()
    if database != "vish_capitals":
        raise RuntimeError("Refusing to modify any database other than vish_capitals.")
    if address is not None and not ipaddress.ip_interface(address).ip.is_loopback:
        raise RuntimeError("This repair is restricted to a PostgreSQL server on localhost.")
    inspector = inspect(conn)
    layout = {}
    for table in TABLES:
        if not inspector.has_table(table, schema="public"):
            raise RuntimeError(f"Expected public.{table} is missing.")
        same_table = conn.exec_driver_sql(
            f"SELECT to_regclass('{table}') = to_regclass('public.{table}')"
        ).scalar_one()
        if not same_table:
            raise RuntimeError(f"The application search path resolves {table} outside public.")
        layout[table] = {
            col["name"]: {
                "type": col["type"].compile(dialect=conn.dialect),
                "nullable": col["nullable"],
                "default": col.get("default"),
            }
            for col in inspector.get_columns(table, schema="public")
        }
    rows = conn.exec_driver_sql(
        "SELECT code, price, billing_interval FROM public.subscription_plans ORDER BY code"
    ).mappings().all()
    return build_statements(layout, list(rows))


def make_backup(url) -> Path:
    from sqlalchemy.engine import URL

    dump = shutil.which("pg_dump")
    if not dump:
        fallback = Path(r"C:\Program Files\PostgreSQL\18\bin\pg_dump.exe")
        if fallback.is_file():
            dump = str(fallback)
    if not dump:
        raise RuntimeError("pg_dump was not found. No database changes made.")
    restore = Path(dump).with_name("pg_restore.exe" if os.name == "nt" else "pg_restore")
    if not restore.is_file():
        raise RuntimeError("pg_restore was not found beside pg_dump. No database changes made.")

    directory = Path.home() / "CoinCrest-backups"
    directory.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    destination = directory / f"vish_capitals_before_subscription_repair_{stamp}_{uuid4().hex[:8]}.dump"
    # Keep the configured password out of command arguments and console output.
    backup_url = URL.create(
        "postgresql", username=url.username, host=url.host, port=url.port,
        database=url.database, query={**url.query, "connect_timeout": "10"},
    )
    environment = os.environ.copy()
    if url.password is not None:
        environment["PGPASSWORD"] = str(url.password)
    print("Creating a full database backup...", flush=True)
    subprocess.run(
        [dump, "--no-password", "--format=custom", "--file", str(destination),
         "--dbname", backup_url.render_as_string(hide_password=False)],
        env=environment, check=True, timeout=120,
    )
    if not destination.is_file() or destination.stat().st_size == 0:
        raise RuntimeError("The backup file is missing or empty. No database changes made.")
    subprocess.run(
        [str(restore), "--list", str(destination)],
        stdout=subprocess.DEVNULL, check=True, timeout=20,
    )
    print(f"Backup created and archive directory checked: {destination}", flush=True)
    return destination


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="back up and apply the repair")
    args = parser.parse_args()
    project_root = Path(__file__).resolve().parent
    if not (project_root / "app" / "models" / "subscription.py").is_file():
        raise RuntimeError("Place this script in the project root, beside app/, database/, and .env.")
    if not (project_root / ".env").is_file():
        raise RuntimeError("The project .env file is missing.")
    os.chdir(project_root)

    from dotenv import load_dotenv
    from sqlalchemy import create_engine, select

    load_dotenv(project_root / ".env")
    from app.core.config import settings
    from app.models.subscription import PlanEntitlement, Subscription, SubscriptionPlan
    from database.connection import engine as app_engine

    if str(settings.environment).lower() in {"prod", "production"}:
        raise RuntimeError("Production is excluded from this local repair.")
    url = app_engine.url.set(drivername="postgresql+psycopg")
    if url.database != "vish_capitals" or url.host not in {"localhost", "127.0.0.1", "::1"}:
        raise RuntimeError("Expected a local DATABASE_URL targeting vish_capitals. No changes made.")
    if url.password is None and "password" in url.query:
        raise RuntimeError("Put database passwords in the URL password field, not a query parameter.")
    # Do not let URL query parameters override the validated connection target.
    if {"host", "hostaddr", "port", "dbname", "database", "service", "password"} & set(url.query):
        raise RuntimeError("Connection target overrides require review before this local repair.")

    engine = create_engine(url, connect_args={"connect_timeout": 10})
    try:
        with engine.connect() as conn:
            conn.exec_driver_sql("SET TRANSACTION READ ONLY")
            conn.exec_driver_sql("SET LOCAL statement_timeout = '15s'")
            statements = inspect_repair(conn)
        print("Target: local vish_capitals / public (subscription tables only)")
        if not statements:
            print("The diagnosed subscription schema changes are already present. Nothing changed.")
            return 0
        print("Planned SQL:")
        for statement in statements:
            print(f"  {statement};")
        if not args.apply:
            print("Preview only. Stop the backend, then run this script with --apply to proceed.")
            return 0

        backup = make_backup(url)  # MUST succeed before entering the write transaction.
        with engine.begin() as conn:
            conn.exec_driver_sql("SET LOCAL lock_timeout = '5s'")
            conn.exec_driver_sql("SET LOCAL statement_timeout = '30s'")
            conn.exec_driver_sql(
                "LOCK TABLE public.subscription_plans, public.subscriptions, "
                "public.plan_entitlements IN ACCESS EXCLUSIVE MODE"
            )
            # Revalidate under the lock, so a changed schema never uses a stale plan.
            locked_statements = inspect_repair(conn)
            if locked_statements != statements:
                raise RuntimeError("The schema changed after the preview. Run the repair again.")
            before = {
                table: conn.exec_driver_sql(f"SELECT count(*) FROM public.{table}").scalar_one()
                for table in TABLES
            }
            for statement in statements:
                conn.exec_driver_sql(statement)
            for model in (SubscriptionPlan, Subscription, PlanEntitlement):
                conn.execute(select(model.__table__).limit(0)).close()
            for table in TABLES:
                after = conn.exec_driver_sql(f"SELECT count(*) FROM public.{table}").scalar_one()
                if after != before[table]:
                    raise RuntimeError(f"Unexpected row-count change in {table}; rolling back.")
            if inspect_repair(conn):
                raise RuntimeError("The post-repair schema check failed; rolling back.")
        print("SUCCESS: subscription schema repair committed. Existing row counts are unchanged.")
        print(f"Keep this backup private: {backup}")
        print("Restart the backend and retry registration. Registration itself is not tested here.")
        print("This local repair did not update Alembic history; keep it for migration reconciliation.")
        return 0
    finally:
        engine.dispose()


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"STOPPED: {type(exc).__name__}: {exc}", file=sys.stderr)
        print("Paste this error before proceeding. Failed repair transactions are rolled back.", file=sys.stderr)
        raise SystemExit(1)
