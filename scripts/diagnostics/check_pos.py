import asyncio
import sys
from sqlalchemy import select
from database.session import AsyncSessionLocal
from app.models.paper_trading import PaperPosition

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def check():
    async with AsyncSessionLocal() as db:
        pos_res = await db.execute(select(PaperPosition))
        positions = pos_res.scalars().all()
        print(f"Total positions in DB: {len(positions)}")
        for pos in positions:
            print(f"Acct: {pos.paper_account_id}, Asset: {pos.asset_id}, Qty: {pos.quantity}")

asyncio.run(check())
