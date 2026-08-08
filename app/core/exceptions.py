class VantixError(Exception):
    """Base exception for Vish Capitals application errors."""


class APIError(VantixError):
    """Base exception for API-related issues."""


class BinanceServiceError(VantixError):
    """Raised when the Binance service cannot fulfill a request."""


class AnalysisError(VantixError):
    """Raised when market analysis fails."""
