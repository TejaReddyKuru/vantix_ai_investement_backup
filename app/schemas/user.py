from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    is_active: bool
    is_staff: bool
    email_verified: bool
    display_name: Optional[str] = None


class UserProfileUpdate(BaseModel):
    model_config = ConfigDict(extra='ignore')

    display_name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    timezone: Optional[str] = Field(default=None, max_length=63)
    country: Optional[str] = Field(default=None, min_length=2, max_length=2)


class UserPreferencesOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    trading_experience: Optional[str] = None
    preferred_assets: Optional[str] = None
    trading_style: Optional[str] = None
    risk_preference: Optional[str] = None
    default_timeframe: Optional[str] = None
    ai_preferences: Optional[dict[str, Any]] = None
    theme_preference: Optional[str] = None
    notification_preferences: Optional[dict[str, Any]] = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class UserPreferencesUpdate(BaseModel):
    model_config = ConfigDict(extra='ignore')

    trading_experience: Optional[str] = Field(default=None, max_length=50)
    preferred_assets: Optional[str] = None
    trading_style: Optional[str] = Field(default=None, max_length=50)
    risk_preference: Optional[str] = Field(default=None, max_length=50)
    default_timeframe: Optional[str] = Field(default=None, max_length=10)
    ai_preferences: Optional[dict[str, Any]] = None
    theme_preference: Optional[str] = Field(default=None, max_length=20)
    notification_preferences: Optional[dict[str, Any]] = None
