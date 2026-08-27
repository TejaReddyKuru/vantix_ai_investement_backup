from copy import deepcopy
from typing import Any, Dict, Mapping, Optional

KNOWN_FIELDS = {
    "user",
    "symbol",
    "interval",
    "portfolio_snapshot",
    "market_intelligence",
    "technical_analysis",
    "sentiment",
    "risk_assessment",
    "metadata",
}


class AgentContext:
    """
    Shared, lightweight execution context for AI agents.
    Supports attribute access (context.symbol) and dictionary access (context["symbol"]).
    """

    def __init__(
        self,
        user: Optional[Any] = None,
        symbol: Optional[str] = None,
        interval: Optional[str] = None,
        portfolio_snapshot: Optional[Any] = None,
        market_intelligence: Optional[Any] = None,
        technical_analysis: Optional[Any] = None,
        sentiment: Optional[Any] = None,
        risk_assessment: Optional[Any] = None,
        metadata: Optional[Dict[str, Any]] = None,
        **extra: Any,
    ) -> None:
        self.user = user
        self.symbol = symbol
        self.interval = interval
        self.portfolio_snapshot = portfolio_snapshot
        self.market_intelligence = market_intelligence
        self.technical_analysis = technical_analysis
        self.sentiment = sentiment
        self.risk_assessment = risk_assessment
        self.metadata: Dict[str, Any] = metadata if metadata is not None else {}

        for k, v in extra.items():
            self[k] = v

    def __getitem__(self, key: str) -> Any:
        if hasattr(self, key):
            val = getattr(self, key)
            if val is not None or key in KNOWN_FIELDS:
                return val
        if key in self.metadata:
            return self.metadata[key]
        raise KeyError(f"Key '{key}' not found in AgentContext")

    def __setitem__(self, key: str, value: Any) -> None:
        if key in KNOWN_FIELDS:
            setattr(self, key, value)
        else:
            self.metadata[key] = value

    def __delitem__(self, key: str) -> None:
        if key in KNOWN_FIELDS:
            setattr(self, key, None)
        elif key in self.metadata:
            del self.metadata[key]
        elif hasattr(self, key):
            delattr(self, key)
        else:
            raise KeyError(f"Key '{key}' not found in AgentContext")

    def __contains__(self, key: str) -> bool:
        if hasattr(self, key):
            val = getattr(self, key)
            if val is not None:
                return True
        return key in self.metadata

    def get(self, key: str, default: Any = None) -> Any:
        try:
            val = self[key]
            return val if val is not None else default
        except KeyError:
            return default

    def update(self, other: Any = None, **kwargs: Any) -> None:
        if other is not None:
            if isinstance(other, Mapping):
                for k, v in other.items():
                    self[k] = v
            elif isinstance(other, AgentContext):
                for k, v in other.to_dict().items():
                    self[k] = v
        for k, v in kwargs.items():
            self[k] = v

    def to_dict(self) -> Dict[str, Any]:
        return {
            "user": self.user,
            "symbol": self.symbol,
            "interval": self.interval,
            "portfolio_snapshot": self.portfolio_snapshot,
            "market_intelligence": self.market_intelligence,
            "technical_analysis": self.technical_analysis,
            "sentiment": self.sentiment,
            "risk_assessment": self.risk_assessment,
            "metadata": dict(self.metadata),
        }

    def copy(self) -> "AgentContext":
        return self.clone()

    def clone(self) -> "AgentContext":
        return deepcopy(self)
