import asyncio
from app.services.binance_service import BinanceService

async def main():
    bs = BinanceService()
    price = await bs.get_current_price("BTCUSDT")
    print(f"BTCUSDT Price: {price}")

asyncio.run(main())
