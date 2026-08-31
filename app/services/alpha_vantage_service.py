import httpx
from datetime import datetime, timezone
from typing import Any, Dict

from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger(__name__)

class AlphaVantageService:
    def __init__(self, base_url: str = "https://www.alphavantage.co/query", timeout: float = 10.0):
        self.base_url = base_url
        self.timeout = timeout
        self.api_key = settings.alpha_vantage_api_key.get_secret_value() if settings.alpha_vantage_api_key else None

    async def get_market_data(self, symbol: str) -> Dict[str, Any]:
        """
        Fetches stock data from Alpha Vantage and formats it similarly to Binance.
        """
        if not self.api_key:
            raise ValueError("ALPHA_VANTAGE_API_KEY is not configured.")

        # Clean symbol for Alpha Vantage (e.g. remove ".BSE" if needed, though AV supports some suffixes)
        # For this implementation, we will pass the symbol directly.
        params = {
            "function": "TIME_SERIES_DAILY",
            "symbol": symbol,
            "apikey": self.api_key,
            "outputsize": "compact" # returns latest 100 data points, enough for indicators
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(self.base_url, params=params)
                response.raise_for_status()
                data = response.json()
                
                if "Information" in data and "rate limit" in data["Information"].lower():
                    raise RuntimeError(f"Alpha Vantage rate limit reached: {data['Information']}")
                if "Error Message" in data:
                    raise ValueError(f"Alpha Vantage error for {symbol}: {data['Error Message']}")
                
                time_series = data.get("Time Series (Daily)", {})
                if not time_series:
                    raise ValueError(f"No time series data returned for {symbol}")

                # Format into candles: [timestamp, open, high, low, close, volume]
                # Alpha vantage returns data sorted newest first, we need oldest first for indicators.
                dates = sorted(list(time_series.keys()))
                
                candles_1h = []
                for date_str in dates:
                    day_data = time_series[date_str]
                    # Parse date to timestamp
                    dt = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                    ts = int(dt.timestamp() * 1000)
                    
                    candles_1h.append([
                        ts,
                        float(day_data["1. open"]),
                        float(day_data["2. high"]),
                        float(day_data["3. low"]),
                        float(day_data["4. close"]),
                        float(day_data["5. volume"])
                    ])

                # Get latest data for current price / 24h stats
                if len(candles_1h) >= 2:
                    latest = candles_1h[-1]
                    prev = candles_1h[-2]
                    
                    price = latest[4]
                    prev_price = prev[4]
                    change_24h = ((price - prev_price) / prev_price) * 100 if prev_price > 0 else 0.0
                    
                    high_24h = latest[2]
                    low_24h = latest[3]
                    volume_24h = latest[5]
                elif len(candles_1h) == 1:
                    latest = candles_1h[-1]
                    price = latest[4]
                    change_24h = 0.0
                    high_24h = latest[2]
                    low_24h = latest[3]
                    volume_24h = latest[5]
                else:
                    price = 0.0
                    change_24h = 0.0
                    high_24h = 0.0
                    low_24h = 0.0
                    volume_24h = 0.0

                return {
                    "symbol": symbol,
                    "price": price,
                    "change_24h": round(change_24h, 3),
                    "volume_24h": volume_24h,
                    "high_24h": high_24h,
                    "low_24h": low_24h,
                    "candles": {"1h": candles_1h}, # Mapped as 1h so existing code logic runs
                    "order_book": {"bids": [], "asks": []} # No order book for daily stocks
                }

            except httpx.HTTPError as exc:
                logger.error(f"Alpha Vantage API HTTP error: {exc}")
                raise RuntimeError(f"Alpha Vantage network error: {exc}")
            except Exception as exc:
                logger.error(f"Alpha Vantage parsing error: {exc}")
                raise
