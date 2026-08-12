from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4
from pydantic import BaseModel, Field


class ExecutionMode(str, Enum):
    PAPER = "PAPER"
    LIVE = "LIVE"
    BACKTEST = "BACKTEST"


class NormalizedOrderState(str, Enum):
    CREATED = "CREATED"
    SUBMITTED = "SUBMITTED"
    ACCEPTED = "ACCEPTED"
    PARTIALLY_FILLED = "PARTIALLY_FILLED"
    FILLED = "FILLED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"
    FAILED = "FAILED"


class NormalizedAccount(BaseModel):
    account_id: str
    broker: str
    currency: str = "USDT"
    total_balance: Decimal
    available_balance: Decimal
    used_margin: Decimal = Decimal("0.0")
    status: str = "active"


class NormalizedPosition(BaseModel):
    position_id: str
    symbol: str
    side: str = "LONG"
    quantity: Decimal
    average_entry_price: Decimal
    current_price: Decimal
    unrealized_pnl: Decimal = Decimal("0.0")
    realized_pnl: Decimal = Decimal("0.0")
    exposure: Decimal = Decimal("0.0")
    leverage: Decimal = Decimal("1.0")


class NormalizedOrder(BaseModel):
    order_id: str = Field(default_factory=lambda: str(uuid4()))
    client_order_id: str
    broker: str
    symbol: str
    side: str
    order_type: str
    quantity: Decimal
    requested_price: Decimal
    executed_price: Optional[Decimal] = None
    stop_loss: Optional[Decimal] = None
    take_profit: Optional[Decimal] = None
    status: NormalizedOrderState = NormalizedOrderState.CREATED
    execution_mode: ExecutionMode = ExecutionMode.PAPER
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class NormalizedTrade(BaseModel):
    trade_id: str = Field(default_factory=lambda: str(uuid4()))
    order_id: str
    symbol: str
    side: str
    quantity: Decimal
    execution_price: Decimal
    fee: Decimal = Decimal("0.0")
    slippage: Decimal = Decimal("0.0")
    realized_pnl: Decimal = Decimal("0.0")
    executed_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ExecutionRequest(BaseModel):
    symbol: str
    side: str
    quantity: Decimal
    order_type: str = "MARKET"
    price: Decimal
    stop_loss: Optional[Decimal] = None
    take_profit: Optional[Decimal] = None
    execution_mode: ExecutionMode = ExecutionMode.PAPER
    idempotency_key: str = Field(default_factory=lambda: str(uuid4()))
    strategy_source: str = "UnifiedIntelligencePipeline"


class ExecutionResult(BaseModel):
    success: bool
    execution_mode: ExecutionMode
    order: Optional[NormalizedOrder] = None
    trade: Optional[NormalizedTrade] = None
    error_message: Optional[str] = None
    risk_assessment: Optional[Dict[str, Any]] = None
    idempotency_key: str


class BacktestConfig(BaseModel):
    symbol: str = "BTCUSDT"
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    initial_capital: Decimal = Decimal("10000.00")
    strategy_name: str = "UnifiedIntelligenceStrategy"


class BacktestResult(BaseModel):
    symbol: str
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    total_return_pct: float
    max_drawdown_pct: float
    profit_factor: float
    sharpe_ratio: float
    final_equity: Decimal
    benchmark_return_pct: float = 0.0


class PerformanceAnalyticsOut(BaseModel):
    total_equity: Decimal
    realized_pnl: Decimal
    unrealized_pnl: Decimal
    total_return_pct: float
    win_rate: float
    profit_factor: float
    max_drawdown_pct: float
    total_trades: int
    exposure_pct: float
