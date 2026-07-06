class VantixError(Exception):
    """Base exception for Vantix application errors."""


class BinanceServiceError(VantixError):
    """Raised when the Binance service cannot fulfill a request."""


class AnalysisError(VantixError):
    """Raised when market analysis fails."""
