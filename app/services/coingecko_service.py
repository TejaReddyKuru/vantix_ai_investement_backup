import asyncio
from typing import Any, Dict

import httpx

from app.core.config import settings
from app.core.exceptions import APIError
from app.core.logger import get_logger

logger = get_logger(__name__)

class CoinGeckoServiceError(APIError):
    def __init__(self, message: str) -> None:
        super().__init__(message=message, status_code=502)


class CoinGeckoService:
    def __init__(self, base_url: str = "https://api.coingecko.com/api/v3", timeout: float = 10.0) -> None:
        self.base_url = base_url
        self.timeout = timeout
        
        # Basic mapping of ticker symbols to CoinGecko IDs
        self.symbol_map = {
            "BTCUSDT": "bitcoin",
            "BTC": "bitcoin",
            "ETHUSDT": "ethereum",
            "ETH": "ethereum",
            "SOLUSDT": "solana",
            "SOL": "solana",
            "BNBUSDT": "binancecoin",
            "BNB": "binancecoin"
        }

    def _get_coin_id(self, symbol: str) -> str:
        symbol_upper = symbol.upper()
        if symbol_upper in self.symbol_map:
            return self.symbol_map[symbol_upper]
        
        # Fallback simplistic mapping
        clean_symbol = symbol_upper.replace("USDT", "").replace("USD", "").lower()
        # You'd typically want a better dynamic mapping or a full cached list, but this suffices for the MVP fallback.
        return clean_symbol

    async def _request(self, path: str, params: dict[str, Any] | None = None) -> Any:
        url = f"{self.base_url}{path}"
        # Inject API key if available
        headers = {}
        # if hasattr(settings, "coingecko_api_key") and settings.coingecko_api_key:
        #     headers["x-cg-demo-api-key"] = settings.coingecko_api_key.get_secret_value()
            
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(url, params=params, headers=headers)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as exc:
                logger.error("CoinGecko request failed: {error}", error=exc)
                raise CoinGeckoServiceError(f"CoinGecko request failed: {exc}") from exc

    async def get_market_data(self, symbol: str) -> Dict[str, Any]:
        """
        Fetch fallback market data from CoinGecko.
        Returns a dictionary compatible with the BinanceService.get_market_data output structure.
        """
        coin_id = self._get_coin_id(symbol)
        
        # 1. Get current price, volume, and change
        params = {
            "ids": coin_id,
            "vs_currencies": "usd",
            "include_24hr_vol": "true",
            "include_24hr_change": "true"
        }
        
        try:
            simple_data_task = self._request("/simple/price", params)
            ohlc_data_task = self._request(f"/coins/{coin_id}/ohlc", {"vs_currency": "usd", "days": "1"})
            
            simple_data, ohlc_data = await asyncio.gather(simple_data_task, ohlc_data_task)
            
            if coin_id not in simple_data:
                raise CoinGeckoServiceError(f"Data not found for {coin_id}")
                
            coin_data = simple_data[coin_id]
            
            # Convert OHLC to binance-like format [timestamp, open, high, low, close, volume]
            # CoinGecko returns [timestamp, open, high, low, close]
            candles = []
            if isinstance(ohlc_data, list):
                for kline in ohlc_data:
                    # Append a dummy volume of 0 to match 6-element structure if needed
                    candles.append([kline[0], kline[1], kline[2], kline[3], kline[4], 0.0])
                    
            return {
                "symbol": symbol,
                "price": float(coin_data.get("usd", 0.0)),
                "candles": {"1h": candles},
                "order_book": {"bids": [], "asks": []}, # CoinGecko doesn't provide easy order book in free tier
                "volume_24h": float(coin_data.get("usd_24h_vol", 0.0)),
                "change_24h": float(coin_data.get("usd_24h_change", 0.0)),
                "source": "coingecko"
            }
            
        except Exception as exc:
            logger.error(f"CoinGecko fallback also failed for {symbol}: {exc}")
            raise CoinGeckoServiceError("All market data providers failed.")
