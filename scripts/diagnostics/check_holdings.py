import asyncio
from sqlalchemy import select
from app.db.session import async_session
from app.models.paper_trading import PaperAccount, PaperPosition
from app.models.asset import Asset

async def get_holdings():
    async with async_session() as session:
        result = await session.execute(select(PaperAccount))
        account = result.scalars().first()
        if not account:
            print("No paper account found.")
            return
            
        print(f"Equity: {account.equity}")
        
        pos_res = await session.execute(
            select(PaperPosition, Asset)
            .join(Asset, PaperPosition.asset_id == Asset.id)
            .where(PaperPosition.paper_account_id == account.id)
        )
        positions = pos_res.all()
        for pos, asset in positions:
            print(f"Holding: {pos.quantity} of {asset.symbol}")

asyncio.run(get_holdings())
