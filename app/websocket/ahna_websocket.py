import asyncio
import json
import websockets
from typing import Dict, Any

from app.core.logger import get_logger
from app.agents.market_agent import MarketAgent
from app.agents.feature_builder import FeatureBuilder

logger = get_logger(__name__)

class AHNAWebSocketPipeline:
    def __init__(self):
        self.market_agent = MarketAgent()
        self.feature_builder = FeatureBuilder()
        self.last_price = {}
        self.analysis_callbacks = []
        
    def add_callback(self, callback):
        self.analysis_callbacks.append(callback)

    async def _handle_message(self, symbol: str, msg: str):
        try:
            data = json.loads(msg)
            # Binance kline stream
            if "k" in data:
                kline = data["k"]
                if kline.get("x"):  # is candle closed
                    close_price = float(kline["c"])
                    last_p = self.last_price.get(symbol)
                    
                    # Meaningful change logic: > 1% price movement
                    if last_p is not None:
                        change = abs((close_price - last_p) / last_p)
                        if change > 0.01:
                            logger.info(f"Significant price change for {symbol}: {change:.2%}. Triggering AHNA analysis.")
                            for cb in self.analysis_callbacks:
                                asyncio.create_task(cb(symbol))
                                
                    self.last_price[symbol] = close_price
                    
        except Exception as e:
            logger.error(f"WebSocket message handling error: {e}")

    async def start(self, symbol: str):
        symbol_lower = symbol.lower()
        ws_endpoints = [
            f"wss://data-stream.binance.vision:9443/ws/{symbol_lower}@kline_1m",
            f"wss://stream.binance.com:9443/ws/{symbol_lower}@kline_1m",
        ]
        
        while True:
            for uri in ws_endpoints:
                try:
                    async with websockets.connect(uri) as websocket:
                        logger.info(f"Connected to Binance WS for {symbol} on {uri}")
                        while True:
                            msg = await websocket.recv()
                            await self._handle_message(symbol, msg)
                except Exception as e:
                    logger.error(f"Binance WS ({uri}) disconnected for {symbol}, trying next endpoint... Error: {e}")
                    await asyncio.sleep(2)
            await asyncio.sleep(5)
