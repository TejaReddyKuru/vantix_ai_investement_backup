import asyncio
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from uuid import uuid4
from sqlalchemy import select
from database.session import AsyncSessionLocal
from app.models.asset import Asset

async def seed_assets():
    print("Seeding default assets into database...")
    default_assets = [
        {"symbol": "BTCUSDT", "base_asset": "BTC", "quote_asset": "USDT", "name": "Bitcoin", "exchange": "binance", "status": "active"},
        {"symbol": "ETHUSDT", "base_asset": "ETH", "quote_asset": "USDT", "name": "Ethereum", "exchange": "binance", "status": "active"},
        {"symbol": "SOLUSDT", "base_asset": "SOL", "quote_asset": "USDT", "name": "Solana", "exchange": "binance", "status": "active"},
        {"symbol": "BNBUSDT", "base_asset": "BNB", "quote_asset": "USDT", "name": "BNB", "exchange": "binance", "status": "active"},
    ]
    
    async with AsyncSessionLocal() as db:
        for asset_data in default_assets:
            stmt = select(Asset).where(Asset.symbol == asset_data["symbol"])
            res = await db.execute(stmt)
            existing = res.scalar_one_or_none()
            if not existing:
                asset = Asset(
                    id=uuid4(),
                    symbol=asset_data["symbol"],
                    base_asset=asset_data["base_asset"],
                    quote_asset=asset_data["quote_asset"],
                    name=asset_data["name"],
                    exchange=asset_data["exchange"],
                    status=asset_data["status"]
                )
                db.add(asset)
                print(f"Added asset: {asset_data['symbol']}")
            else:
                print(f"Asset already exists: {asset_data['symbol']}")
        await db.commit()
    print("Done seeding default assets.")

if __name__ == "__main__":
    asyncio.run(seed_assets())
