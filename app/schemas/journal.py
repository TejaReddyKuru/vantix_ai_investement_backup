from datetime import datetime
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, ConfigDict, Field


class JournalObservationCreate(BaseModel):
    model_config = ConfigDict(extra='ignore')
    text: str = Field(..., min_length=1)

class JournalObservationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    journal_entry_id: str
    user_id: str
    text: str
    created_at: datetime


class JournalEntryCreate(BaseModel):
    model_config = ConfigDict(extra='ignore')

    # Optional execution fields for manually logged trades
    symbol: Optional[str] = None
    side: Optional[str] = None
    status: Optional[str] = None
    entry_price: Optional[float] = None
    exit_price: Optional[float] = None
    quantity: Optional[float] = None
    realized_pnl: Optional[float] = None
    return_percentage: Optional[float] = None
    duration_seconds: Optional[int] = None
    entry_timestamp: Optional[datetime] = None
    exit_timestamp: Optional[datetime] = None

    title: Optional[str] = Field(default=None, max_length=255)
    notes: Optional[str] = None
    strategy: Optional[str] = None
    setup: Optional[str] = None
    lessons: Optional[str] = None
    tags: Optional[str] = None
    market_condition: Optional[str] = None
    entry_reason: Optional[str] = None
    trade_thesis: Optional[str] = None
    confidence: Optional[int] = None
    what_went_well: Optional[str] = None
    what_went_wrong: Optional[str] = None
    discipline_score: Optional[int] = None
    trade_plan_snapshot: Optional[Dict[str, Any]] = None
    ahna_snapshot: Optional[Dict[str, Any]] = None


class JournalEntryUpdate(BaseModel):
    model_config = ConfigDict(extra='ignore')

    title: Optional[str] = Field(default=None, max_length=255)
    notes: Optional[str] = None
    strategy: Optional[str] = None
    setup: Optional[str] = None
    lessons: Optional[str] = None
    tags: Optional[str] = None
    market_condition: Optional[str] = None
    entry_reason: Optional[str] = None
    trade_thesis: Optional[str] = None
    confidence: Optional[int] = None
    what_went_well: Optional[str] = None
    what_went_wrong: Optional[str] = None
    discipline_score: Optional[int] = None


class JournalEntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    paper_account_id: Optional[str] = None
    paper_trade_id: Optional[str] = None
    
    # Execution Summary Fields
    symbol: Optional[str] = None
    side: Optional[str] = None
    status: Optional[str] = None
    entry_price: Optional[float] = None
    exit_price: Optional[float] = None
    quantity: Optional[float] = None
    realized_pnl: Optional[float] = None
    return_percentage: Optional[float] = None
    duration_seconds: Optional[int] = None
    entry_timestamp: Optional[datetime] = None
    exit_timestamp: Optional[datetime] = None

    title: Optional[str] = None
    notes: Optional[str] = None
    strategy: Optional[str] = None
    setup: Optional[str] = None
    lessons: Optional[str] = None
    tags: Optional[str] = None
    
    market_condition: Optional[str] = None
    entry_reason: Optional[str] = None
    trade_thesis: Optional[str] = None
    confidence: Optional[int] = None
    what_went_well: Optional[str] = None
    what_went_wrong: Optional[str] = None
    discipline_score: Optional[int] = None
    trade_plan_snapshot: Optional[Dict[str, Any]] = None
    ahna_snapshot: Optional[Dict[str, Any]] = None

    observations: Optional[List[JournalObservationOut]] = None

    created_at: datetime
    updated_at: datetime
