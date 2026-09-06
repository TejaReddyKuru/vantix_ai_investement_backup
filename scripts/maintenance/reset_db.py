import asyncio
import sys
from sqlalchemy import select, delete
from database.session import AsyncSessionLocal
from app.models.paper_trading import PaperAccount, PaperPosition, PaperOrder, PaperTrade, PaperTransaction

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def reset_account():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(PaperAccount))
        account = result.scalars().first()
        if not account:
            print("No paper account found.")
            return
            
        print(f"Found account {account.id}. Resetting...")
        
        await db.execute(delete(PaperOrder).where(PaperOrder.paper_account_id == account.id))
        await db.execute(delete(PaperPosition).where(PaperPosition.paper_account_id == account.id))
        await db.execute(delete(PaperTrade).where(PaperTrade.paper_account_id == account.id))
        await db.execute(delete(PaperTransaction).where(PaperTransaction.paper_account_id == account.id))
        
        account.current_cash = account.initial_balance
        account.balance = account.initial_balance
        account.equity = account.initial_balance
        
        await db.commit()
        print("Account reset successfully!")

asyncio.run(reset_account())
