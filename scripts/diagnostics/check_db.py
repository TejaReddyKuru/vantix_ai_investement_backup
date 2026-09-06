import asyncio
import sys
from sqlalchemy import select
from database.session import AsyncSessionLocal
from app.models.paper_trading import PaperAccount, PaperPosition
from app.models.user import User

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def check_db():
    async with AsyncSessionLocal() as db:
        users = (await db.execute(select(User))).scalars().all()
        print(f"Total Users: {len(users)}")
        for u in users:
            print(f"User: {u.id} - {u.email}")
            
        accounts = (await db.execute(select(PaperAccount))).scalars().all()
        print(f"Total Accounts: {len(accounts)}")
        for a in accounts:
            print(f"Account: {a.id} User: {a.user_id} Cash: {a.current_cash}")
            pos_res = await db.execute(select(PaperPosition).where(PaperPosition.paper_account_id == a.id))
            positions = pos_res.scalars().all()
            for pos in positions:
                print(f"  Holding: {pos.quantity} of asset {pos.asset_id}")

asyncio.run(check_db())
