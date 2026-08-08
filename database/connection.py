from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine
from app.core.config import settings


def get_database_url() -> str:
    if settings.database_url:
        return settings.database_url
    return "sqlite+aiosqlite:///./data/dev.db"


def get_async_engine() -> AsyncEngine:
    return create_async_engine(get_database_url(), echo=False, future=True)


engine: AsyncEngine = get_async_engine()
