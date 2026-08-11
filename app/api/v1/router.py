from fastapi import APIRouter

from app.api.v1.alerts import router as alerts_router
from app.api.v1.assets import router as assets_router
from app.api.v1.journal import router as journal_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.paper_trading import router as paper_trading_router
from app.api.v1.portfolio import router as portfolio_router
from app.api.v1.subscriptions import router as subscriptions_router
from app.api.v1.users import router as users_router
from app.api.v1.watchlists import router as watchlists_router

router = APIRouter(prefix="/api/v1")

router.include_router(users_router)
router.include_router(assets_router)
router.include_router(portfolio_router)
router.include_router(watchlists_router)
router.include_router(paper_trading_router)
router.include_router(journal_router)
router.include_router(alerts_router)
router.include_router(notifications_router)
router.include_router(subscriptions_router)
