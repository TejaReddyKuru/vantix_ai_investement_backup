from decimal import Decimal
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class SubscriptionPlanOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    code: str
    description: Optional[str] = None
    price_monthly: Optional[Decimal] = None
    price_yearly: Optional[Decimal] = None
    billing_interval: str
    active: bool
    created_at: datetime
    updated_at: datetime


class SubscriptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    plan_id: str
    status: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class PlanEntitlementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    plan_id: str
    entitlement_code: str
    name: str
    description: Optional[str] = None
    created_at: datetime
