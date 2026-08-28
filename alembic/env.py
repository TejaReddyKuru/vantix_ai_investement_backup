import asyncio
import os
import sys
from logging.config import fileConfig

from sqlalchemy import Column, MetaData, String, Table, pool
from sqlalchemy.ext.asyncio import create_async_engine
from alembic import context
from alembic.ddl.impl import DefaultImpl

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from database.base import Base
import app.models

from alembic.operations import Operations
original_create_table = Operations.create_table

def patched_create_table(self, name, *columns, **kw):
    patched_cols = []
    for col in columns:
        if hasattr(col, 'server_default') and col.server_default is not None:
            default_val = getattr(col.server_default, 'arg', None)
            if default_val is not None:
                default_str = str(default_val)
                if 'uuid_generate_v4' in default_str or 'gen_random_uuid' in default_str:
                    col.server_default = None
        patched_cols.append(col)
    return original_create_table(self, name, *patched_cols, **kw)

Operations.create_table = patched_create_table


config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

database_url = settings.database_url or "sqlite+aiosqlite:///./data/dev.db"

config.set_main_option(
    "sqlalchemy.url",
    database_url.replace("%", "%%"),
)

target_metadata = Base.metadata


def custom_version_table_impl(
    self,
    *,
    version_table,
    version_table_schema,
    version_table_pk,
    **kw,
):
    columns = [
        Column("version_num", String(255), nullable=False),
    ]

    if version_table_pk:
        from sqlalchemy import PrimaryKeyConstraint

        columns.append(
            PrimaryKeyConstraint(
                "version_num",
                name="alembic_version_pkc",
            )
        )

    return Table(
        version_table,
        MetaData(),
        *columns,
        schema=version_table_schema,
    )


DefaultImpl.version_table_impl = custom_version_table_impl


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        version_table="alembic_version",
        version_table_pk=True,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    url = config.get_main_option("sqlalchemy.url")

    connectable = create_async_engine(
        url,
        poolclass=pool.NullPool,
        future=True,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(_run_migrations)

    await connectable.dispose()


def _run_migrations(connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        version_table="alembic_version",
        version_table_pk=True,
    )

    with context.begin_transaction():
        context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())