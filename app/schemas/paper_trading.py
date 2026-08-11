from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class PaperAccountOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    name: str
    initial_balance: Decimal
    current_cash: Decimal
    currency: str
    status: str
    created_at: datetime
    updated_at: datetime


class PaperOrderCreate(BaseModel):
    model_config = ConfigDict(extra='ignore')

    asset_id: str
    side: str = Field(..., pattern='^(BUY|SELL)$')
    order_type: str = Field(default='LIMIT', max_length=20)
    quantity: Decimal = Field(..., gt=0)
    requested_price: Decimal = Field(..., gt=0)
    stop_loss: Optional[Decimal] = None
    take_profit: Optional[Decimal] = None


class PaperOrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    paper_account_id: str
    asset_id: str
    side: str
    order_type: str
    quantity: Decimal
    requested_price: Decimal
    executed_price: Optional[Decimal] = None
    stop_loss: Optional[Decimal] = None
    take_profit: Optional[Decimal] = None
    status: str
    created_at: datetime
    updated_at: datetime


class PaperPositionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    paper_account_id: str
    asset_id: str
    quantity: Decimal
    average_entry_price: Decimal
    realized_pnl: Decimal
    unrealized_pnl: Decimal
    created_at: datetime
    updated_at: datetime


class PaperTradeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    paper_account_id: str
    order_id: Optional[str] = None
    asset_id: str
    side: str
    quantity: Decimal
    execution_price: Decimal
    fee: Decimal
    slippage: Decimal
    realized_pnl: Decimal
    executed_at: datetime


class PaperTransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    paper_account_id: str
    type: str
    amount: Decimal
    reference_id: Optional[str] = None
    created_at: datetime
