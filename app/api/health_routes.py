from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.core.logger import get_logger
from database.connection import engine

router = APIRouter(prefix="/health", tags=["health"])
logger = get_logger(__name__)


@router.get("", include_in_schema=False)
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/live")
async def live() -> dict[str, str]:
    return {"status": "alive"}


@router.get("/ready")
async def ready() -> JSONResponse:
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
        return JSONResponse(status_code=200, content={"status": "ready", "database": "ok"})
    except Exception as exc:
        logger.warning("Readiness probe failed: {error}", error=exc)
        return JSONResponse(status_code=503, content={"status": "not_ready", "database": "unavailable"})
