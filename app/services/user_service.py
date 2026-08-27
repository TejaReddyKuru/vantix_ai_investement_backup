from uuid import UUID

from sqlalchemy import select

from app.models.preferences import UserPreferences
from app.models.user import User, UserProfile
from app.schemas.user import UserProfileUpdate, UserPreferencesUpdate
from database.session import AsyncSessionLocal


async def get_current_user_profile(user_id: UUID) -> dict:
    """Return the active user's public profile data."""
    async with AsyncSessionLocal() as db:
        user = await db.get(User, user_id)
        if user is None:
            return None
        profile = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
        profile = profile.scalar_one_or_none()
        return {
            "id": str(user.id),
            "email": user.email,
            "is_active": user.is_active,
            "is_staff": user.is_staff,
            "email_verified": user.email_verified,
            "display_name": profile.display_name if profile else None,
        }


async def update_current_user_profile(user_id: UUID, payload: UserProfileUpdate) -> dict:
    """Create or update the current user's profile fields."""
    async with AsyncSessionLocal() as db:
        profile = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
        profile = profile.scalar_one_or_none()
        if profile is None:
            profile = UserProfile(user_id=user_id)
            db.add(profile)
            await db.flush()

        for field, value in payload.model_dump(exclude_none=True).items():
            if hasattr(profile, field):
                setattr(profile, field, value)

        await db.commit()
        await db.refresh(profile)

        user = await db.get(User, user_id)
        if user is None:
            return None
        return {
            "id": str(user.id),
            "email": user.email,
            "is_active": user.is_active,
            "is_staff": user.is_staff,
            "email_verified": user.email_verified,
            "display_name": profile.display_name,
        }


async def get_current_user_preferences(user_id: UUID) -> dict | None:
    """Return the current user's preferences."""
    async with AsyncSessionLocal() as db:
        prefs = await db.execute(select(UserPreferences).where(UserPreferences.user_id == user_id))
        prefs = prefs.scalar_one_or_none()
        if prefs is None:
            return None
        return {
            "id": str(prefs.id),
            "user_id": str(prefs.user_id),
            "trading_experience": prefs.trading_experience,
            "preferred_assets": prefs.preferred_assets,
            "trading_style": prefs.trading_style,
            "risk_preference": prefs.risk_preference,
            "default_timeframe": prefs.default_timeframe,
            "ai_preferences": prefs.ai_preferences,
            "theme_preference": prefs.theme_preference,
            "notification_preferences": prefs.notification_preferences,
            "created_at": prefs.created_at,
            "updated_at": prefs.updated_at,
        }


async def update_current_user_preferences(user_id: UUID, payload: UserPreferencesUpdate) -> dict:
    """Create or update the current user's preferences."""
    async with AsyncSessionLocal() as db:
        prefs = await db.execute(select(UserPreferences).where(UserPreferences.user_id == user_id))
        prefs = prefs.scalar_one_or_none()
        if prefs is None:
            prefs = UserPreferences(user_id=user_id)
            db.add(prefs)
            await db.flush()

        for field, value in payload.model_dump(exclude_none=True).items():
            if hasattr(prefs, field):
                setattr(prefs, field, value)

        await db.commit()
        await db.refresh(prefs)
        return {
            "id": str(prefs.id),
            "user_id": str(prefs.user_id),
            "trading_experience": prefs.trading_experience,
            "preferred_assets": prefs.preferred_assets,
            "trading_style": prefs.trading_style,
            "risk_preference": prefs.risk_preference,
            "default_timeframe": prefs.default_timeframe,
            "ai_preferences": prefs.ai_preferences,
            "theme_preference": prefs.theme_preference,
            "notification_preferences": prefs.notification_preferences,
            "created_at": prefs.created_at,
            "updated_at": prefs.updated_at,
        }
