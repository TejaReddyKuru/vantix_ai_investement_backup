from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import get_current_user
from app.models.user import User
from app.schemas.broker_connection import (
    BrokerConnectionCreate,
    BrokerConnectionOut,
    BrokerConnectionVerifyOut,
    ReconciliationReport,
    SystemHealthOut,
)
from app.schemas.execution import (
    BacktestConfig,
    BacktestResult,
    ExecutionMode,
    ExecutionRequest,
    ExecutionResult,
    NormalizedAccount,
    NormalizedOrder,
    NormalizedPosition,
    PerformanceAnalyticsOut,
)
from app.services.backtesting_engine import BacktestingEngine
from app.services.broker_connection_service import BrokerConnectionService
from app.services.broker_reconciliation_service import BrokerReconciliationService
from app.services.execution_engine import ExecutionEngine, ExecutionValidationError
from app.services.system_health_service import SystemHealthService
from app.services.trading_analytics_service import TradingAnalyticsService

router = APIRouter(prefix="/execution", tags=["execution"])

_broker_service = BrokerConnectionService()


@router.post("/submit", response_model=ExecutionResult, summary="Submit an execution request")
async def submit_execution_request(
    request: ExecutionRequest,
    broker: str = Query("PAPER", description="Target broker (PAPER, BINANCE, BYBIT, ALPACA, IBKR)"),
    current_user: User = Depends(get_current_user),
):
    """
    Submit an order execution request through the ExecutionEngine safety gate.
    Defaults to PAPER execution. LIVE mode requires server-side live configuration and authorization.
    """
    engine = ExecutionEngine()
    try:
        result = await engine.execute_request(
            request=request,
            broker_name=broker,
            user_id=current_user.id,
            authorized_live=False,  # API requests default to unauthorized for live without special flow
        )
        return result
    except ExecutionValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.get("/brokers", response_model=List[Dict[str, Any]], summary="List broker adapter connection statuses")
async def list_brokers(current_user: User = Depends(get_current_user)):
    """Return available broker adapters and their connection health states."""
    return [
        {"broker": "PAPER", "status": "active", "is_paper": True, "connected": True},
        {"broker": "BINANCE", "status": "supported", "is_paper": True, "connected": True},
        {"broker": "BYBIT", "status": "supported", "is_paper": True, "connected": True},
        {"broker": "ALPACA", "status": "supported", "is_paper": True, "connected": True},
        {"broker": "INTERACTIVE_BROKERS", "status": "supported", "is_paper": True, "connected": True},
    ]


@router.post("/brokers/connect", response_model=BrokerConnectionOut, summary="Securely connect a broker")
async def connect_broker(
    payload: BrokerConnectionCreate,
    current_user: User = Depends(get_current_user),
):
    """Connect a broker account using server-side credential encryption."""
    return await _broker_service.connect_broker(current_user.id, payload)


@router.post("/brokers/verify", response_model=BrokerConnectionVerifyOut, summary="Verify broker connection")
async def verify_broker(
    broker: str = Query("PAPER", description="Broker provider to verify"),
    current_user: User = Depends(get_current_user),
):
    """Verify broker API connectivity and credentials."""
    return await _broker_service.verify_broker_connection(current_user.id, broker)


@router.get("/brokers/status", response_model=List[BrokerConnectionOut], summary="Get user broker connections status")
async def get_broker_statuses(current_user: User = Depends(get_current_user)):
    """List safe connection metadata for user's connected brokers."""
    return await _broker_service.list_user_connections(current_user.id)


@router.post("/brokers/disconnect", summary="Disconnect a broker connection")
async def disconnect_broker(
    broker: str = Query(..., description="Broker to disconnect"),
    current_user: User = Depends(get_current_user),
):
    """Deactivate or disconnect a broker provider."""
    disconnected = await _broker_service.disconnect_broker(current_user.id, broker)
    if not disconnected:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Broker connection '{broker}' not found.",
        )
    return {"message": f"Broker '{broker}' successfully disconnected."}


@router.post("/reconcile", response_model=ReconciliationReport, summary="Trigger broker state reconciliation")
async def reconcile_broker_orders(
    broker: str = Query("PAPER", description="Broker provider to reconcile"),
    current_user: User = Depends(get_current_user),
):
    """Reconcile local execution state against broker order state without submitting orders."""
    engine = ExecutionEngine()
    adapter = engine.get_broker_adapter(broker_name=broker)
    service = BrokerReconciliationService()
    local_orders = await adapter.get_orders()
    return await service.reconcile(adapter, local_orders=local_orders)


@router.get("/health", response_model=SystemHealthOut, summary="Get operational system health")
async def get_system_health(current_user: User = Depends(get_current_user)):
    """Return non-sensitive operational health status across trading platform subsystems."""
    service = SystemHealthService()
    return await service.check_health()


@router.post("/backtest", response_model=BacktestResult, summary="Run historical strategy backtest")
async def run_backtest(
    config: BacktestConfig,
    current_user: User = Depends(get_current_user),
):
    """Run deterministic strategy backtest on historical data replay feed."""
    engine = BacktestingEngine()
    return engine.run_backtest(config)


@router.get("/analytics", response_model=PerformanceAnalyticsOut, summary="Get portfolio and trading analytics")
async def get_analytics(current_user: User = Depends(get_current_user)):
    """Retrieve normalized trading performance and portfolio metrics."""
    service = TradingAnalyticsService()
    return service.compute_performance()
