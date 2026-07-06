from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine
from app.core.config import settings


def get_database_url() -> str:
    # placeholder for async DB URL, to be configured via .env
    return "sqlite+aiosqlite:///./data/dev.db"


engine: AsyncEngine = create_async_engine(get_database_url(), echo=False)
