import asyncio

from sqlalchemy import text

from .connection import engine
from .base import Base
from app.models import (
    User, UserProfile, UserSession, UserPreferences,
    SubscriptionPlan, Subscription, PlanEntitlement,
    Asset, Watchlist, WatchlistItem,
    PaperAccount, PaperOrder, PaperPosition, PaperTrade, PaperTransaction,
    TradeJournalEntry, PortfolioSnapshot,
    AIConversation, AIMessage, AIAgentRun, AIInsight,
    AlertRule, AlertEvent, Notification,
    CommunityPost, CommunityComment, CommunityLike, CommunityFollow, CommunityBookmark, CommunityReport,
    TutorCourse, TutorLesson, TutorQuestion, TutorQuiz, TutorQuizAttempt, TutorProgress,
    AuditLog, Market
)


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def sanity_check() -> bool:
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


if __name__ == "__main__":
    asyncio.run(init_db())
