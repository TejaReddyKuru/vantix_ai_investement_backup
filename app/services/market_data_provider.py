from typing import Any, Dict, Protocol
from app.services.binance_service import BinanceService
from app.services.coingecko_service import CoinGeckoService
from app.services.alpha_vantage_service import AlphaVantageService

class MarketDataProvider(Protocol):
    async def get_market_data(self, symbol: str) -> Dict[str, Any]:
        ...

class BinanceMarketDataProvider:
    def __init__(self):
        self.service = BinanceService()
    
    async def get_market_data(self, symbol: str) -> Dict[str, Any]:
        data = await self.service.get_market_data(symbol)
        data["provider"] = "binance"
        data["data_quality"] = "REALTIME"
        return data

class CoinGeckoMarketDataProvider:
    def __init__(self):
        self.service = CoinGeckoService()
    
    async def get_market_data(self, symbol: str) -> Dict[str, Any]:
        data = await self.service.get_market_data(symbol)
        data["provider"] = "coingecko"
        data["data_quality"] = "DELAYED"
        return data

class AlphaVantageMarketDataProvider:
    def __init__(self):
        self.service = AlphaVantageService()
    
    async def get_market_data(self, symbol: str) -> Dict[str, Any]:
        data = await self.service.get_market_data(symbol)
        data["provider"] = "alpha_vantage"
        data["data_quality"] = "HISTORICAL"  # Time Series Daily is technically EOD/Historical
        return data

from app.core.logger import get_logger

logger = get_logger(__name__)

KNOWN_CRYPTO = {
    "BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "AVAX", "LINK", "DOGE", "USDT",
    "MATIC", "DOT", "UNI", "LTC", "NEAR", "ATOM", "TRX", "SHIB", "ICP", "BCH",
    "XLM", "XMR", "ETC", "APT", "FIL", "ARB", "OP", "INJ", "SUI", "TIA", "RENDER",
    "FET", "RUNE", "PEPE", "WIF", "BONK", "FLOKI"
}

class MarketDataRouter:
    def __init__(self):
        self.binance = BinanceMarketDataProvider()
        self.coingecko = CoinGeckoMarketDataProvider()
        self.alpha_vantage = AlphaVantageMarketDataProvider()
        
    def classify_asset(self, symbol: str) -> str:
        s = symbol.upper().strip()
        if s in KNOWN_CRYPTO or any(s.endswith(quote) for quote in ("USDT", "USD", "USDC", "BUSD", "FDUSD")):
            return "crypto"
        return "stock"

    def normalize_crypto_pair(self, symbol: str) -> str:
        s = symbol.upper().strip()
        if any(s.endswith(quote) for quote in ("USDT", "USDC", "BUSD", "FDUSD")):
            return s
        if s.endswith("USD"):
            return f"{s[:-3]}USDT"
        return f"{s}USDT"

    async def get_market_data(self, symbol: str) -> Dict[str, Any]:
        clean_symbol = symbol.upper().strip()
        asset_type = self.classify_asset(clean_symbol)
        
        if asset_type == "crypto":
            pair = self.normalize_crypto_pair(clean_symbol)
            try:
                data = await self.binance.get_market_data(pair)
            except Exception as e:
                logger.warning(f"Binance fetch failed for {pair}: {e}. Falling back to CoinGecko...")
                try:
                    data = await self.coingecko.get_market_data(clean_symbol)
                except Exception as e2:
                    logger.error(f"CoinGecko fallback failed for {clean_symbol}: {e2}")
                    raise RuntimeError("All crypto market data sources failed.")
        else:
            # Stock
            data = await self.alpha_vantage.get_market_data(clean_symbol)
            
        data["asset_type"] = asset_type
        data["symbol"] = clean_symbol
        return data
