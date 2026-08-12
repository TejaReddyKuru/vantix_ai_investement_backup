from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4
from pydantic import BaseModel, Field


class BrokerConnectionCreate(BaseModel):
    broker: str = Field(..., description="Broker name (binance, bybit, alpaca, interactive_brokers, paper)")
    environment: str = Field("PAPER", description="Execution environment (PAPER, LIVE)")
    api_key: Optional[str] = Field(None, description="Broker API Key (server-side encrypted)")
    api_secret: Optional[str] = Field(None, description="Broker API Secret (server-side encrypted)")


class BrokerConnectionOut(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str
    broker: str
    environment: str
    status: str = "CONNECTED"  # CONNECTED, DISCONNECTED, UNVERIFIED, ERROR
    credentials_present: bool = True
    last_verified_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class BrokerConnectionVerifyOut(BaseModel):
    broker: str
    environment: str
    verified: bool
    status: str
    message: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ReconciliationMismatch(BaseModel):
    mismatch_type: str  # MISSING_LOCAL, MISSING_BROKER, STATUS_MISMATCH, QUANTITY_MISMATCH, FILL_MISMATCH
    order_id: str
    local_status: Optional[str] = None
    broker_status: Optional[str] = None
    details: str


class ReconciliationReport(BaseModel):
    broker: str
    environment: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    matched_count: int
    mismatch_count: int
    mismatches: List[ReconciliationMismatch] = Field(default_factory=list)


class SubsystemHealth(BaseModel):
    name: str
    status: str  # healthy, degraded, unavailable
    details: Dict[str, Any] = Field(default_factory=dict)


class SystemHealthOut(BaseModel):
    status: str  # healthy, degraded, unavailable
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    subsystems: Dict[str, SubsystemHealth] = Field(default_factory=dict)
