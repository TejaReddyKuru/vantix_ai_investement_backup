import hashlib
import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select

from app.core.config import settings
from app.models.user import User
from database.session import AsyncSessionLocal

security_scheme = HTTPBearer(auto_error=False)


def _jwt_secret() -> str:
    if settings.jwt_secret is not None:
        return settings.jwt_secret.get_secret_value()
    return "dev-secret-change-me"


def _jwt_algorithm() -> str:
    return getattr(settings, 'jwt_algorithm', 'HS256')


def validate_password_policy(password: str) -> None:
    if len(password) < 8:
        raise ValueError('Password must be at least 8 characters long.')
    if not re.search(r'[A-Z]', password):
        raise ValueError('Password must contain at least one uppercase letter.')
    if not re.search(r'[a-z]', password):
        raise ValueError('Password must contain at least one lowercase letter.')
    if not re.search(r'\d', password):
        raise ValueError('Password must contain at least one number.')
    if not re.search(r'[^A-Za-z0-9]', password):
        raise ValueError('Password must contain at least one special character.')


def hash_password(password: str) -> str:
    validate_password_policy(password)
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    except ValueError:
        return False


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode('utf-8')).hexdigest()


def create_access_token(subject: str, expires_minutes: int | None = None) -> str:
    expires_delta = timedelta(minutes=expires_minutes or int(getattr(settings, 'access_token_expire_minutes', 15)))
    issued_at = datetime.now(timezone.utc)
    payload = {
        'sub': subject,
        'token_type': 'access',
        'jti': str(uuid.uuid4()),
        'exp': issued_at + expires_delta,
        'iat': issued_at,
    }
    return jwt.encode(payload, _jwt_secret(), algorithm=_jwt_algorithm())


def create_refresh_token(subject: str, expires_days: int | None = None) -> str:
    expires_delta = timedelta(days=expires_days or int(getattr(settings, 'refresh_token_expire_days', 30)))
    issued_at = datetime.now(timezone.utc)
    payload = {
        'sub': subject,
        'token_type': 'refresh',
        'jti': str(uuid.uuid4()),
        'exp': issued_at + expires_delta,
        'iat': issued_at,
    }
    return jwt.encode(payload, _jwt_secret(), algorithm=_jwt_algorithm())


def decode_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(token, _jwt_secret(), algorithms=[_jwt_algorithm()])
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Token has expired.') from exc
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token.') from exc
    return payload


async def get_user_by_token(token: str) -> User:
    payload = decode_token(token)
    if payload.get('token_type') not in {'access', 'refresh'}:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token type.')
    subject = payload.get('sub')
    if not subject:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Token missing subject.')
    async with AsyncSessionLocal() as session:
        if _is_uuid(subject):
            user = await session.get(User, uuid.UUID(subject))
        else:
            result = await session.execute(select(User).where(User.email == subject.lower()))
            user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User not found.')
    return user


def _is_uuid(value: str) -> bool:
    import uuid
    try:
        uuid.UUID(value)
        return True
    except ValueError:
        return False


async def get_current_user(request: Request, credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme)) -> User:
    if credentials is None or not credentials.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Authentication required.')
    user = await get_user_by_token(credentials.credentials)
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Inactive account.')
    return user


async def require_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_staff:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin access required.')
    return current_user


class RateLimiter:
    def __init__(self, limit: int, window_seconds: int = 60):
        self.limit = limit
        self.window_seconds = window_seconds
        self._hits: dict[str, list[datetime]] = {}

    def check(self, key: str) -> None:
        now = datetime.now(timezone.utc)
        bucket = self._hits.setdefault(key, [])
        bucket[:] = [ts for ts in bucket if (now - ts).total_seconds() <= self.window_seconds]
        if len(bucket) >= self.limit:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail='Rate limit exceeded.')
        bucket.append(now)


# Initialize rate limiters from configuration. In non-production environments
# raise limits to a very high number to avoid flaky test failures caused by
# in-memory rate counters persisting across many test requests.
_default_rate_limits = getattr(__import__('app.core.config', fromlist=['settings']), 'settings').rate_limits
_env = getattr(__import__('app.core.config', fromlist=['settings']), 'settings').environment
rate_limiters = {}
for key, cfg in (_default_rate_limits or {}).items():
    limit = int(cfg.get('limit', 20))
    window = int(cfg.get('window_seconds', 60))
    # In development/test, use a much higher limit to avoid hitting the
    # in-memory limiter during extensive test runs.
    if _env != 'production':
        limit = max(limit, 1000)
    rate_limiters[key] = RateLimiter(limit=limit, window_seconds=window)


def enforce_rate_limit(name: str, identifier: str) -> None:
    # Ensure there's always a limiter available for the given name.
    limiter = rate_limiters.get(name)
    if limiter is None:
        # If config is missing for this key, create a generous limiter.
        limiter = RateLimiter(limit=1000, window_seconds=60)
        rate_limiters[name] = limiter
    limiter.check(identifier)
