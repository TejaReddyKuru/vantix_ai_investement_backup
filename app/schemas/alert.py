from datetime import datetime
from decimal import Decimal
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class AlertRuleCreate(BaseModel):
    model_config = ConfigDict(extra='ignore')

    asset_id: str
    alert_type: str = Field(..., max_length=100)
    condition: dict[str, Any]
    threshold: Decimal = Field(..., gt=0)
    enabled: bool = True
    cooldown_minutes: int = 0


class AlertRuleUpdate(BaseModel):
    model_config = ConfigDict(extra='ignore')

    asset_id: Optional[str] = None
    alert_type: Optional[str] = Field(default=None, max_length=100)
    condition: Optional[dict[str, Any]] = None
    threshold: Optional[Decimal] = Field(default=None, gt=0)
    enabled: Optional[bool] = None
    cooldown_minutes: Optional[int] = None


class AlertRuleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    asset_id: str
    alert_type: str
    condition: dict[str, Any]
    threshold: Decimal
    enabled: bool
    cooldown_minutes: Decimal
    created_at: datetime
    updated_at: datetime


class AlertEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    alert_rule_id: str
    triggered_at: datetime
    value: Decimal
    status: str
    notified: bool
