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

class MarketDataRouter:
    def __init__(self):
        self.binance = BinanceMarketDataProvider()
        self.coingecko = CoinGeckoMarketDataProvider()
        self.alpha_vantage = AlphaVantageMarketDataProvider()
        
    def classify_asset(self, symbol: str) -> str:
        symbol_upper = symbol.upper()
        # Simple heuristic for crypto vs stock
        if symbol_upper.endswith("USDT") or symbol_upper.endswith("USD") or symbol_upper.endswith("BTC") or symbol_upper.endswith("ETH"):
            return "crypto"
        return "stock"

    async def get_market_data(self, symbol: str) -> Dict[str, Any]:
        asset_type = self.classify_asset(symbol)
        
        if asset_type == "crypto":
            try:
                data = await self.binance.get_market_data(symbol)
            except Exception as e:
                # Fallback to coingecko
                try:
                    data = await self.coingecko.get_market_data(symbol)
                except Exception as e2:
                    raise RuntimeError("All crypto market data sources failed.")
        else:
            # Stock
            data = await self.alpha_vantage.get_market_data(symbol)
            
        data["asset_type"] = asset_type
        return data
