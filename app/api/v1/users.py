from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_user
from app.models.user import User
from app.schemas.user import UserPreferencesOut, UserPreferencesUpdate, UserProfileUpdate, UserPublic
from app.services.user_service import (
    get_current_user_preferences,
    get_current_user_profile,
    update_current_user_preferences,
    update_current_user_profile,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserPublic, summary="Get signed-in user profile")
async def get_me(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's public profile."""
    profile = await get_current_user_profile(current_user.id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")
    return profile


@router.patch("/me", response_model=UserPublic, summary="Update signed-in user profile")
async def patch_me(payload: UserProfileUpdate, current_user: User = Depends(get_current_user)):
    """Update the signed-in user's profile fields."""
    profile = await update_current_user_profile(current_user.id, payload)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")
    return profile


@router.get("/me/preferences", response_model=UserPreferencesOut, summary="Get signed-in user's preferences")
async def get_me_preferences(current_user: User = Depends(get_current_user)):
    """Return the signed-in user's preferences."""
    prefs = await get_current_user_preferences(current_user.id)
    if prefs is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preferences not found.")
    return prefs


@router.patch("/me/preferences", response_model=UserPreferencesOut, summary="Update signed-in user preferences")
async def patch_me_preferences(payload: UserPreferencesUpdate, current_user: User = Depends(get_current_user)):
    """Update the signed-in user's preferences."""
    prefs = await update_current_user_preferences(current_user.id, payload)
    return prefs
