import asyncio
import sys
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models.paper_trading import PaperPosition

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def check():
    engine = create_async_engine("sqlite+aiosqlite:///./data/dev.db")
    SessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with SessionLocal() as db:
        pos_res = await db.execute(select(PaperPosition))
        positions = pos_res.scalars().all()
        print(f"Total positions in SQLite DB: {len(positions)}")
        for pos in positions:
            print(f"Acct: {pos.paper_account_id}, Asset: {pos.asset_id}, Qty: {pos.quantity}")

asyncio.run(check())
