from decimal import Decimal
from typing import List, Optional
from uuid import uuid4

from app.schemas.execution import (
    ExecutionMode,
    ExecutionRequest,
    ExecutionResult,
    NormalizedAccount,
    NormalizedOrder,
    NormalizedOrderState,
    NormalizedPosition,
    NormalizedTrade,
)
from app.services.brokers.base_broker import (
    BaseBrokerAdapter,
    BrokerConnectionError,
    OrderRejectedError,
    OrderSubmissionError,
)


class BinanceBrokerAdapter(BaseBrokerAdapter):
    def __init__(self, is_paper: bool = True) -> None:
        super().__init__(broker_name="BINANCE", is_paper=is_paper)
        self._orders: List[NormalizedOrder] = []
        self._trades: List[NormalizedTrade] = []

    async def connect(self) -> bool:
        self.is_connected = True
        return True

    async def disconnect(self) -> bool:
        self.is_connected = False
        return True

    async def get_account(self) -> NormalizedAccount:
        return NormalizedAccount(
            account_id="binance_acc_001",
            broker="BINANCE",
            currency="USDT",
            total_balance=Decimal("10000.00"),
            available_balance=Decimal("10000.00"),
            status="active",
        )

    async def get_positions(self) -> List[NormalizedPosition]:
        return []

    async def submit_order(self, request: ExecutionRequest) -> ExecutionResult:
        if not self.is_connected:
            await self.connect()

        order_id = f"binance_ord_{uuid4().hex[:8]}"
        trade_id = f"binance_trd_{uuid4().hex[:8]}"

        order = NormalizedOrder(
            order_id=order_id,
            client_order_id=request.idempotency_key,
            broker="BINANCE",
            symbol=request.symbol,
            side=request.side,
            order_type=request.order_type,
            quantity=request.quantity,
            requested_price=request.price,
            executed_price=request.price,
            stop_loss=request.stop_loss,
            take_profit=request.take_profit,
            status=NormalizedOrderState.FILLED,
            execution_mode=request.execution_mode,
        )

        trade = NormalizedTrade(
            trade_id=trade_id,
            order_id=order_id,
            symbol=request.symbol,
            side=request.side,
            quantity=request.quantity,
            execution_price=request.price,
            fee=request.quantity * request.price * Decimal("0.001"),
        )

        self._orders.append(order)
        self._trades.append(trade)

        return ExecutionResult(
            success=True,
            execution_mode=request.execution_mode,
            order=order,
            trade=trade,
            idempotency_key=request.idempotency_key,
        )

    async def cancel_order(self, order_id: str) -> bool:
        for order in self._orders:
            if order.order_id == order_id:
                order.status = NormalizedOrderState.CANCELLED
                return True
        return False

    async def get_orders(self) -> List[NormalizedOrder]:
        return self._orders

    async def get_trades(self) -> List[NormalizedTrade]:
        return self._trades


class BybitBrokerAdapter(BaseBrokerAdapter):
    def __init__(self, is_paper: bool = True) -> None:
        super().__init__(broker_name="BYBIT", is_paper=is_paper)
        self._orders: List[NormalizedOrder] = []
        self._trades: List[NormalizedTrade] = []

    async def connect(self) -> bool:
        self.is_connected = True
        return True

    async def disconnect(self) -> bool:
        self.is_connected = False
        return True

    async def get_account(self) -> NormalizedAccount:
        return NormalizedAccount(
            account_id="bybit_acc_001",
            broker="BYBIT",
            currency="USDT",
            total_balance=Decimal("10000.00"),
            available_balance=Decimal("10000.00"),
            status="active",
        )

    async def get_positions(self) -> List[NormalizedPosition]:
        return []

    async def submit_order(self, request: ExecutionRequest) -> ExecutionResult:
        if not self.is_connected:
            await self.connect()

        order_id = f"bybit_ord_{uuid4().hex[:8]}"
        order = NormalizedOrder(
            order_id=order_id,
            client_order_id=request.idempotency_key,
            broker="BYBIT",
            symbol=request.symbol,
            side=request.side,
            order_type=request.order_type,
            quantity=request.quantity,
            requested_price=request.price,
            executed_price=request.price,
            status=NormalizedOrderState.FILLED,
            execution_mode=request.execution_mode,
        )
        trade = NormalizedTrade(
            trade_id=f"bybit_trd_{uuid4().hex[:8]}",
            order_id=order_id,
            symbol=request.symbol,
            side=request.side,
            quantity=request.quantity,
            execution_price=request.price,
        )
        self._orders.append(order)
        self._trades.append(trade)
        return ExecutionResult(
            success=True,
            execution_mode=request.execution_mode,
            order=order,
            trade=trade,
            idempotency_key=request.idempotency_key,
        )

    async def cancel_order(self, order_id: str) -> bool:
        return True

    async def get_orders(self) -> List[NormalizedOrder]:
        return self._orders

    async def get_trades(self) -> List[NormalizedTrade]:
        return self._trades


class AlpacaBrokerAdapter(BaseBrokerAdapter):
    def __init__(self, is_paper: bool = True) -> None:
        super().__init__(broker_name="ALPACA", is_paper=is_paper)
        self._orders: List[NormalizedOrder] = []

    async def connect(self) -> bool:
        self.is_connected = True
        return True

    async def disconnect(self) -> bool:
        self.is_connected = False
        return True

    async def get_account(self) -> NormalizedAccount:
        return NormalizedAccount(
            account_id="alpaca_acc_001",
            broker="ALPACA",
            currency="USD",
            total_balance=Decimal("25000.00"),
            available_balance=Decimal("25000.00"),
            status="active",
        )

    async def get_positions(self) -> List[NormalizedPosition]:
        return []

    async def submit_order(self, request: ExecutionRequest) -> ExecutionResult:
        order_id = f"alpaca_ord_{uuid4().hex[:8]}"
        order = NormalizedOrder(
            order_id=order_id,
            client_order_id=request.idempotency_key,
            broker="ALPACA",
            symbol=request.symbol,
            side=request.side,
            order_type=request.order_type,
            quantity=request.quantity,
            requested_price=request.price,
            executed_price=request.price,
            status=NormalizedOrderState.FILLED,
            execution_mode=request.execution_mode,
        )
        self._orders.append(order)
        return ExecutionResult(
            success=True,
            execution_mode=request.execution_mode,
            order=order,
            idempotency_key=request.idempotency_key,
        )

    async def cancel_order(self, order_id: str) -> bool:
        return True

    async def get_orders(self) -> List[NormalizedOrder]:
        return self._orders

    async def get_trades(self) -> List[NormalizedTrade]:
        return []


class InteractiveBrokersAdapter(BaseBrokerAdapter):
    def __init__(self, is_paper: bool = True) -> None:
        super().__init__(broker_name="INTERACTIVE_BROKERS", is_paper=is_paper)
        self._orders: List[NormalizedOrder] = []

    async def connect(self) -> bool:
        self.is_connected = True
        return True

    async def disconnect(self) -> bool:
        self.is_connected = False
        return True

    async def get_account(self) -> NormalizedAccount:
        return NormalizedAccount(
            account_id="ibkr_acc_001",
            broker="INTERACTIVE_BROKERS",
            currency="USD",
            total_balance=Decimal("50000.00"),
            available_balance=Decimal("50000.00"),
            status="active",
        )

    async def get_positions(self) -> List[NormalizedPosition]:
        return []

    async def submit_order(self, request: ExecutionRequest) -> ExecutionResult:
        order_id = f"ibkr_ord_{uuid4().hex[:8]}"
        order = NormalizedOrder(
            order_id=order_id,
            client_order_id=request.idempotency_key,
            broker="INTERACTIVE_BROKERS",
            symbol=request.symbol,
            side=request.side,
            order_type=request.order_type,
            quantity=request.quantity,
            requested_price=request.price,
            executed_price=request.price,
            status=NormalizedOrderState.FILLED,
            execution_mode=request.execution_mode,
        )
        self._orders.append(order)
        return ExecutionResult(
            success=True,
            execution_mode=request.execution_mode,
            order=order,
            idempotency_key=request.idempotency_key,
        )

    async def cancel_order(self, order_id: str) -> bool:
        return True

    async def get_orders(self) -> List[NormalizedOrder]:
        return self._orders

    async def get_trades(self) -> List[NormalizedTrade]:
        return []


class PaperBrokerAdapter(BaseBrokerAdapter):
    def __init__(self) -> None:
        super().__init__(broker_name="PAPER", is_paper=True)
        self._orders: List[NormalizedOrder] = []
        self._trades: List[NormalizedTrade] = []

    async def connect(self) -> bool:
        self.is_connected = True
        return True

    async def disconnect(self) -> bool:
        self.is_connected = False
        return True

    async def get_account(self) -> NormalizedAccount:
        return NormalizedAccount(
            account_id="paper_account_001",
            broker="PAPER",
            currency="USDT",
            total_balance=Decimal("10000.00"),
            available_balance=Decimal("10000.00"),
            status="active",
        )

    async def get_positions(self) -> List[NormalizedPosition]:
        return []

    async def submit_order(self, request: ExecutionRequest) -> ExecutionResult:
        order_id = f"paper_ord_{uuid4().hex[:8]}"
        trade_id = f"paper_trd_{uuid4().hex[:8]}"
        order = NormalizedOrder(
            order_id=order_id,
            client_order_id=request.idempotency_key,
            broker="PAPER",
            symbol=request.symbol,
            side=request.side,
            order_type=request.order_type,
            quantity=request.quantity,
            requested_price=request.price,
            executed_price=request.price,
            stop_loss=request.stop_loss,
            take_profit=request.take_profit,
            status=NormalizedOrderState.FILLED,
            execution_mode=ExecutionMode.PAPER,
        )
        trade = NormalizedTrade(
            trade_id=trade_id,
            order_id=order_id,
            symbol=request.symbol,
            side=request.side,
            quantity=request.quantity,
            execution_price=request.price,
        )
        self._orders.append(order)
        self._trades.append(trade)
        return ExecutionResult(
            success=True,
            execution_mode=ExecutionMode.PAPER,
            order=order,
            trade=trade,
            idempotency_key=request.idempotency_key,
        )

    async def cancel_order(self, order_id: str) -> bool:
        return True

    async def get_orders(self) -> List[NormalizedOrder]:
        return self._orders

    async def get_trades(self) -> List[NormalizedTrade]:
        return self._trades
