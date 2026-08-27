from sqlalchemy import event
from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine

from app.core.config import settings


def get_database_url() -> str:
    if settings.database_url:
        return settings.database_url
    return "sqlite+aiosqlite:///./data/dev.db"


def get_async_engine() -> AsyncEngine:
    async_engine = create_async_engine(get_database_url(), echo=False, future=True)

    @event.listens_for(async_engine.sync_engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, connection_record):
        if dbapi_connection.__class__.__module__.startswith("sqlite3"):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

    return async_engine


engine: AsyncEngine = get_async_engine()
