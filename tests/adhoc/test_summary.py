import asyncio
import sys
from uuid import UUID
from database.session import AsyncSessionLocal
from app.services.portfolio_service import PortfolioService
from app.models.user import User
from sqlalchemy import select

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def test_summary():
    async with AsyncSessionLocal() as db:
        users = (await db.execute(select(User))).scalars().all()
        user_id = next(u.id for u in users if u.email == "kteja0816@gmail.com")
        
        service = PortfolioService(db)
        try:
            snapshot = await service.calculate_and_save_snapshot(user_id)
            print(f"Success! Equity: {snapshot.total_equity}")
        except Exception as e:
            import traceback
            traceback.print_exc()

asyncio.run(test_summary())
