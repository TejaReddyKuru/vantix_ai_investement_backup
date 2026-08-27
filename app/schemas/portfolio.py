from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict


class PortfolioSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    total_equity: Decimal | None = None
    cash: Decimal | None = None
    invested_value: Decimal | None = None
    realized_pnl: Decimal | None = None
    unrealized_pnl: Decimal | None = None
    drawdown: Decimal | None = None


class PortfolioSnapshotOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    paper_account_id: Optional[str] = None
    total_equity: Decimal
    cash: Decimal
    invested_value: Decimal
    realized_pnl: Decimal | None = None
    unrealized_pnl: Decimal | None = None
    drawdown: Decimal | None = None
    recorded_at: datetime


class PortfolioListResponse(BaseModel):
    page: int
    page_size: int
    total: int
    items: list[PortfolioSnapshotOut]
