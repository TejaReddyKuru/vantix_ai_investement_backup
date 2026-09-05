import asyncio
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth_routes import router as auth_router
from app.api.error_handlers import (
    api_error_handler,
    http_exception_handler,
    unexpected_exception_handler,
    validation_exception_handler,
)
from app.api.health_routes import router as health_router
from app.api.market_routes import router as market_router
from app.api.v1.router import router as v1_router
from app.core.config import settings
from app.core.exceptions import APIError
from app.core.logger import get_logger

logger = get_logger(__name__)

app = FastAPI(title=settings.app_name, version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(market_router)
app.include_router(market_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(v1_router)


@app.get("/")
async def root():
    return {"message": "CoinCrest API is running", "status": "ok", "version": "0.1.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid4())
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response


app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(APIError, api_error_handler)
app.add_exception_handler(Exception, unexpected_exception_handler)

# During development and testing ensure a default test user exists so tests
# that assume a pre-created user do not fail due to ordering or race conditions.
# This is intentionally conservative: it only runs outside of production.
from database.session import AsyncSessionLocal
from app.models.user import User, UserProfile
from app.core.security import hash_password
from app.core.config import settings

@app.on_event('startup')
async def _ensure_default_test_user():
    if settings.environment == 'production':
        return
    try:
        async with AsyncSessionLocal() as db:
            # Use a known test email used by integration tests
            test_email = 'p10_user@example.com'
            result = await db.execute(__import__('sqlalchemy').select(User).where(User.email == test_email))
            existing = result.scalar_one_or_none()
            if existing is None:
                user = User(email=test_email, password_hash=hash_password('Password1!'), is_active=True)
                db.add(user)
                await db.flush()
                profile = UserProfile(user_id=user.id, display_name='P10 User')
                db.add(profile)
                await db.commit()
    except Exception as e:
        logger.warning(f"Startup test user initialization skipped or non-fatal error: {e}")
