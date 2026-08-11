from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class AssetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    symbol: str
    base_asset: str
    quote_asset: str
    name: str
    exchange: str
    status: str
    asset_metadata: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class AssetListResponse(BaseModel):
    page: int
    page_size: int
    total: int
    items: list[AssetOut]
