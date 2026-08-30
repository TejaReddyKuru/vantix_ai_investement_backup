import asyncio
import sys
from decimal import Decimal
from uuid import UUID
from database.session import AsyncSessionLocal
from app.services.risk_management_service import RiskManagementService
from app.services.binance_service import BinanceService
from app.models.user import User
from sqlalchemy import select

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def test_assess():
    async with AsyncSessionLocal() as db:
        users = (await db.execute(select(User))).scalars().all()
        from app.models.asset import Asset
        assets = (await db.execute(select(Asset).where(Asset.symbol == "BTCUSDT"))).scalars().all()
        asset = assets[0]
        
        service = RiskManagementService(db, BinanceService())
        
        for user in users:
            print(f"Testing for user {user.email}")
            try:
                result = await service.assess_trade(
                    user_id=user.id,
                    asset_id=asset.id,
                    side="BUY",
                    quantity=Decimal("0.015"),
                    entry_price=Decimal("78560.02"),
                    stop_loss=Decimal("77500.00"),
                    take_profit=Decimal("81000.00")
                )
                print("Approved:", result.approved)
                print("Rejection:", getattr(result, "rejection_reason", None))
                print("Exposure:", result.exposure_percentage)
            except Exception as e:
                print("Error:", e)
            print("-" * 20)

asyncio.run(test_assess())
