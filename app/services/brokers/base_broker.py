from abc import ABC, abstractmethod
from typing import List, Optional
from app.schemas.execution import (
    NormalizedAccount,
    NormalizedOrder,
    NormalizedPosition,
    NormalizedTrade,
    ExecutionRequest,
    ExecutionResult,
)


class BrokerError(Exception):
    """Base exception for all broker interface and adapter errors."""
    pass


class BrokerConnectionError(BrokerError):
    """Raised when broker connection fails."""
    pass


class OrderSubmissionError(BrokerError):
    """Raised when order submission fails."""
    pass


class OrderRejectedError(BrokerError):
    """Raised when broker rejects an order."""
    pass


class BaseBrokerAdapter(ABC):
    """
    Abstract Base Class for all broker adapters (Binance, Bybit, Alpaca, InteractiveBrokers, Paper).
    Translates broker-specific structures into normalized application models.
    """

    def __init__(self, broker_name: str, is_paper: bool = True) -> None:
        self.broker_name = broker_name
        self.is_paper = is_paper
        self.is_connected = False

    @abstractmethod
    async def connect(self) -> bool:
        """Establish connection or session with broker API."""
        pass

    @abstractmethod
    async def disconnect(self) -> bool:
        """Close connection with broker API."""
        pass

    @abstractmethod
    async def get_account(self) -> NormalizedAccount:
        """Fetch normalized account balance and status."""
        pass

    @abstractmethod
    async def get_positions(self) -> List[NormalizedPosition]:
        """Fetch list of open positions."""
        pass

    @abstractmethod
    async def submit_order(self, request: ExecutionRequest) -> ExecutionResult:
        """Submit a normalized order request to the broker."""
        pass

    @abstractmethod
    async def cancel_order(self, order_id: str) -> bool:
        """Cancel an open order."""
        pass

    @abstractmethod
    async def get_orders(self) -> List[NormalizedOrder]:
        """Fetch historical and active orders."""
        pass

    @abstractmethod
    async def get_trades(self) -> List[NormalizedTrade]:
        """Fetch trade fills history."""
        pass
