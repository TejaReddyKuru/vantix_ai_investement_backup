from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    type: str
    title: str
    message: str
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    read_at: Optional[datetime] = None
    created_at: datetime


class NotificationListResponse(BaseModel):
    page: int
    page_size: int
    total: int
    items: list[NotificationOut]
