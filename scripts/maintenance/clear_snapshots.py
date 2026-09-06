import asyncio
import sys
from database.session import AsyncSessionLocal
from app.models.portfolio import PortfolioSnapshot
from sqlalchemy import delete

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def clear_snapshots():
    async with AsyncSessionLocal() as db:
        await db.execute(delete(PortfolioSnapshot))
        await db.commit()
        print("Cleared all portfolio snapshots!")

asyncio.run(clear_snapshots())
