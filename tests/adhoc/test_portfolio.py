import asyncio
import sys
from database.session import AsyncSessionLocal
from app.services.portfolio_service import PortfolioService
from app.models.user import User
from sqlalchemy import select

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def test_portfolio():
    async with AsyncSessionLocal() as db:
        users = (await db.execute(select(User))).scalars().all()
        portfolio_service = PortfolioService(db)
        for user in users:
            try:
                metrics = await portfolio_service.calculate_live_metrics(user.id, use_live_prices=False)
                print(f"User: {user.email}, Equity: {metrics['total_equity']}, Cash: {metrics['cash']}, Invested: {metrics['invested_value']}")
            except Exception as e:
                print(f"User: {user.email} - Error: {e}")

asyncio.run(test_portfolio())
