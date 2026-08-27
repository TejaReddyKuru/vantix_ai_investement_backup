from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum
from typing import Any, Callable, Dict, List, Optional
from pydantic import BaseModel, Field


class StreamState(str, Enum):
    CONNECTED = "CONNECTED"
    DISCONNECTED = "DISCONNECTED"
    RECONNECTING = "RECONNECTING"


class NormalizedMarketEvent(BaseModel):
    event_type: str = "candle"  # candle, trade, quote, book_update
    symbol: str
    price: Decimal
    quantity: Decimal = Decimal("1.0")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    data: Dict[str, Any] = Field(default_factory=dict)


class MarketDataStreamManager:
    """
    Normalized Market Data Stream Manager.
    Handles streaming connections, events normalization, and reconnect behavior.
    """

    def __init__(self, provider_name: str = "BINANCE") -> None:
        self.provider_name = provider_name
        self.state = StreamState.DISCONNECTED
        self._subscriptions: List[str] = []
        self._listeners: List[Callable[[NormalizedMarketEvent], None]] = []

    async def connect(self) -> bool:
        self.state = StreamState.CONNECTED
        return True

    async def disconnect(self) -> bool:
        self.state = StreamState.DISCONNECTED
        return True

    async def subscribe(self, symbol: str) -> bool:
        symbol_upper = symbol.upper()
        if symbol_upper not in self._subscriptions:
            self._subscriptions.append(symbol_upper)
        return True

    async def unsubscribe(self, symbol: str) -> bool:
        symbol_upper = symbol.upper()
        if symbol_upper in self._subscriptions:
            self._subscriptions.remove(symbol_upper)
        return True

    def register_listener(self, callback: Callable[[NormalizedMarketEvent], None]) -> None:
        if callback not in self._listeners:
            self._listeners.append(callback)

    def dispatch_event(self, event: NormalizedMarketEvent) -> None:
        for callback in self._listeners:
            callback(event)


class FakeMarketDataStream(MarketDataStreamManager):
    """
    Deterministic offline market data stream for testing.
    """

    def __init__(self) -> None:
        super().__init__(provider_name="FAKE_STREAM")

    def simulate_tick(self, symbol: str = "BTCUSDT", price: float = 50000.0) -> NormalizedMarketEvent:
        event = NormalizedMarketEvent(
            event_type="candle",
            symbol=symbol,
            price=Decimal(str(price)),
            quantity=Decimal("0.5"),
            data={"open": price, "high": price * 1.01, "low": price * 0.99, "close": price},
        )
        self.dispatch_event(event)
        return event
