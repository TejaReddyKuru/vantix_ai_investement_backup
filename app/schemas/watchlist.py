from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class WatchlistCreate(BaseModel):
    model_config = ConfigDict(extra='ignore')

    name: str = Field(..., min_length=1, max_length=255)


class WatchlistUpdate(BaseModel):
    model_config = ConfigDict(extra='ignore')

    name: Optional[str] = Field(default=None, min_length=1, max_length=255)


class WatchlistItemCreate(BaseModel):
    model_config = ConfigDict(extra='ignore')

    asset_id: str


class WatchlistItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    watchlist_id: str
    asset_id: str
    position: int
    created_at: datetime


class WatchlistOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    name: str
    created_at: datetime
    updated_at: datetime
    items: list[WatchlistItemOut] = []
