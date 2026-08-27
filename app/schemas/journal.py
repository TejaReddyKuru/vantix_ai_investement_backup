from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class JournalEntryCreate(BaseModel):
    model_config = ConfigDict(extra='ignore')

    title: str = Field(..., min_length=1, max_length=255)
    notes: Optional[str] = None
    strategy: Optional[str] = None
    setup: Optional[str] = None
    lessons: Optional[str] = None
    tags: Optional[str] = None


class JournalEntryUpdate(BaseModel):
    model_config = ConfigDict(extra='ignore')

    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    notes: Optional[str] = None
    strategy: Optional[str] = None
    setup: Optional[str] = None
    lessons: Optional[str] = None
    tags: Optional[str] = None


class JournalEntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    paper_trade_id: Optional[str] = None
    title: str
    notes: Optional[str] = None
    strategy: Optional[str] = None
    setup: Optional[str] = None
    lessons: Optional[str] = None
    tags: Optional[str] = None
    created_at: datetime
    updated_at: datetime
