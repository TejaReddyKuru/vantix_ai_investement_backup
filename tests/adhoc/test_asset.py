import asyncio
import sys
from database.session import AsyncSessionLocal
from app.models.asset import Asset
from sqlalchemy import select

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def test():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Asset).where(Asset.symbol == "BTCUSDT"))
        items = res.scalars().all()
        for item in items:
            print(f"ID: {item.id}, Symbol: {item.symbol}")

asyncio.run(test())
