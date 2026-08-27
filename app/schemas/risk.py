from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ProposedTrade(BaseModel):
    model_config = ConfigDict(extra='ignore')

    asset_id: str
    side: str = Field(..., pattern='^(BUY|SELL)$')
    quantity: Decimal = Field(..., gt=0)
    entry_price: Decimal = Field(..., gt=0)
    stop_loss: Optional[Decimal] = None
    take_profit: Optional[Decimal] = None

    @model_validator(mode='after')
    def validate_stop_loss(self) -> 'ProposedTrade':
        side_upper = self.side.upper()
        if side_upper == 'BUY':
            if self.stop_loss is None:
                raise ValueError("stop_loss is required for BUY trades.")
            if self.stop_loss <= 0:
                raise ValueError("stop_loss must be greater than zero.")
            if self.stop_loss >= self.entry_price:
                raise ValueError("stop_loss must be less than entry_price.")
        return self


class RiskAssessmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    approved: bool
    risk_amount: Decimal
    risk_percentage: Decimal
    position_value: Decimal
    exposure_percentage: Decimal
    available_cash: Decimal
    current_equity: Decimal
    warnings: list[str]
    rejection_reason: Optional[str] = None
