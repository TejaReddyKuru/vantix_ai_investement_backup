"""Tests for database models, integrity, and relationships."""
import pytest
import pytest_asyncio
from datetime import datetime, timedelta
import uuid

from sqlalchemy import select, and_, func
from sqlalchemy.exc import IntegrityError

from database.session import AsyncSessionLocal
from app.models.user import User, UserProfile
from app.models.session import UserSession
from app.models.preferences import UserPreferences
from app.models.subscription import SubscriptionPlan, Subscription, PlanEntitlement
from app.models.asset import Asset
from app.models.watchlist import Watchlist, WatchlistItem
from app.models.paper_trading import (
    PaperAccount,
    PaperOrder,
    PaperPosition,
    PaperTrade,
    PaperTransaction,
)
from app.models.journal import TradeJournalEntry
from app.models.portfolio import PortfolioSnapshot
from app.models.ai import AIConversation, AIMessage
from app.models.agent import AIAgentRun, AIInsight
from app.models.alert import AlertRule, AlertEvent
from app.models.notification import Notification
from app.models.community import (
    CommunityPost,
    CommunityComment,
    CommunityLike,
    CommunityFollow,
    CommunityBookmark,
    CommunityReport,
)
from app.models.tutor import (
    TutorCourse,
    TutorLesson,
    TutorQuestion,
    TutorQuiz,
    TutorQuizAttempt,
    TutorProgress,
)
from app.models.audit import AuditLog


@pytest_asyncio.fixture
async def db_session():
    """Provide a database session for tests."""
    async with AsyncSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def test_user(db_session):
    """Create a test user."""
    user = User(email="test@example.com", password_hash="hashed_password")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def test_asset(db_session):
    """Create a test asset."""
    asset = Asset(
        symbol="BTCUSDT",
        base_asset="BTC",
        quote_asset="USDT",
        name="Bitcoin",
        exchange="BINANCE",
        status="ACTIVE",
    )
    db_session.add(asset)
    await db_session.commit()
    await db_session.refresh(asset)
    return asset


@pytest.mark.asyncio
async def test_user_creation(db_session):
    """Test creating a user."""
    user = User(email="newuser@example.com", password_hash="hashed_password")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    assert user.id is not None
    assert user.email == "newuser@example.com"
    assert user.is_active is True
    assert user.email_verified is False


@pytest.mark.asyncio
async def test_user_email_uniqueness(db_session, test_user):
    """Test that user email must be unique."""
    duplicate_user = User(email=test_user.email, password_hash="different_hash")
    db_session.add(duplicate_user)

    with pytest.raises(IntegrityError):
        await db_session.commit()


@pytest.mark.asyncio
async def test_user_profile_creation(db_session, test_user):
    """Test creating a user profile."""
    profile = UserProfile(
        user_id=test_user.id,
        display_name="Test User",
        timezone="UTC",
        country="US",
    )
    db_session.add(profile)
    await db_session.commit()
    await db_session.refresh(profile)

    assert profile.id is not None
    assert profile.user_id == test_user.id
    assert profile.display_name == "Test User"


@pytest.mark.asyncio
async def test_user_profile_uniqueness(db_session, test_user):
    """Test that user can only have one profile."""
    profile1 = UserProfile(user_id=test_user.id, display_name="Profile 1")
    profile2 = UserProfile(user_id=test_user.id, display_name="Profile 2")
    db_session.add(profile1)
    db_session.add(profile2)

    with pytest.raises(IntegrityError):
        await db_session.commit()


@pytest.mark.asyncio
async def test_user_session_creation(db_session, test_user):
    """Test creating a user session."""
    expires_at = datetime.utcnow() + timedelta(hours=24)
    session = UserSession(
        user_id=test_user.id,
        session_hash="hashed_session_token",
        device_info="Chrome/Windows",
        ip_address="192.168.1.1",
        expires_at=expires_at,
    )
    db_session.add(session)
    await db_session.commit()
    await db_session.refresh(session)

    assert session.id is not None
    assert session.user_id == test_user.id
    assert session.session_hash == "hashed_session_token"


@pytest.mark.asyncio
async def test_user_preferences_creation(db_session, test_user):
    """Test creating user preferences."""
    prefs = UserPreferences(
        user_id=test_user.id,
        trading_experience="intermediate",
        risk_preference="moderate",
        theme_preference="dark",
    )
    db_session.add(prefs)
    await db_session.commit()
    await db_session.refresh(prefs)

    assert prefs.id is not None
    assert prefs.user_id == test_user.id
    assert prefs.trading_experience == "intermediate"


@pytest.mark.asyncio
async def test_subscription_plans_exist(db_session):
    """Test that subscription plans are seeded."""
    plans = await db_session.execute(select(SubscriptionPlan))
    plan_list = plans.scalars().all()

    assert len(plan_list) >= 3  # At least FREE, PRO, ELITE
    plan_codes = {p.code for p in plan_list}
    assert "FREE" in plan_codes
    assert "PRO" in plan_codes
    assert "ELITE" in plan_codes


@pytest.mark.asyncio
async def test_plan_entitlements(db_session):
    """Test that entitlements are properly linked to plans."""
    plans = await db_session.execute(select(SubscriptionPlan))
    for plan in plans.scalars().all():
        entitlements = await db_session.execute(
            select(PlanEntitlement).where(PlanEntitlement.plan_id == plan.id)
        )
        ents = entitlements.scalars().all()
        assert len(ents) > 0, f"Plan {plan.code} should have entitlements"


@pytest.mark.asyncio
async def test_subscription_creation(db_session, test_user):
    """Test creating a subscription."""
    # Get the FREE plan
    result = await db_session.execute(
        select(SubscriptionPlan).where(SubscriptionPlan.code == "FREE")
    )
    plan = result.scalar_one_or_none()
    assert plan is not None

    subscription = Subscription(
        user_id=test_user.id,
        plan_id=plan.id,
        status="active",
        start_at=datetime.utcnow(),
    )
    db_session.add(subscription)
    await db_session.commit()
    await db_session.refresh(subscription)

    assert subscription.id is not None
    assert subscription.user_id == test_user.id
    assert subscription.plan_id == plan.id


@pytest.mark.asyncio
async def test_asset_creation(db_session):
    """Test creating an asset."""
    asset = Asset(
        symbol="ETHUSDT",
        base_asset="ETH",
        quote_asset="USDT",
        name="Ethereum",
        exchange="BINANCE",
        status="ACTIVE",
    )
    db_session.add(asset)
    await db_session.commit()
    await db_session.refresh(asset)

    assert asset.id is not None
    assert asset.symbol == "ETHUSDT"
    assert asset.base_asset == "ETH"


@pytest.mark.asyncio
async def test_asset_symbol_uniqueness(db_session, test_asset):
    """Test that asset symbols are unique."""
    duplicate_asset = Asset(
        symbol=test_asset.symbol,
        base_asset="BTC",
        quote_asset="USDT",
        name="Bitcoin",
        exchange="BINANCE",
        status="ACTIVE",
    )
    db_session.add(duplicate_asset)

    with pytest.raises(IntegrityError):
        await db_session.commit()


@pytest.mark.asyncio
async def test_watchlist_creation(db_session, test_user):
    """Test creating a watchlist."""
    watchlist = Watchlist(user_id=test_user.id, name="My Watchlist")
    db_session.add(watchlist)
    await db_session.commit()
    await db_session.refresh(watchlist)

    assert watchlist.id is not None
    assert watchlist.user_id == test_user.id
    assert watchlist.name == "My Watchlist"


@pytest.mark.asyncio
async def test_watchlist_item_uniqueness(db_session, test_user, test_asset):
    """Test that watchlist items are unique per asset."""
    watchlist = Watchlist(user_id=test_user.id, name="Test Watchlist")
    db_session.add(watchlist)
    await db_session.commit()
    await db_session.refresh(watchlist)

    item1 = WatchlistItem(watchlist_id=watchlist.id, asset_id=test_asset.id, position=1)
    item2 = WatchlistItem(watchlist_id=watchlist.id, asset_id=test_asset.id, position=2)
    db_session.add(item1)
    db_session.add(item2)

    with pytest.raises(IntegrityError):
        await db_session.commit()


@pytest.mark.asyncio
async def test_paper_account_creation(db_session, test_user):
    """Test creating a paper trading account."""
    account = PaperAccount(
        user_id=test_user.id,
        name="Demo Account",
        initial_balance=10000,
        current_cash=10000,
        currency="USD",
        status="active",
    )
    db_session.add(account)
    await db_session.commit()
    await db_session.refresh(account)

    assert account.id is not None
    assert account.user_id == test_user.id
    assert account.current_cash == 10000


@pytest.mark.asyncio
async def test_paper_account_cash_constraint(db_session, test_user):
    """Test that paper account cash cannot be negative."""
    account = PaperAccount(
        user_id=test_user.id,
        name="Bad Account",
        initial_balance=10000,
        current_cash=-1000,  # Should violate constraint
        currency="USD",
        status="active",
    )
    db_session.add(account)

    with pytest.raises(IntegrityError):
        await db_session.commit()


@pytest.mark.asyncio
async def test_paper_order_creation(db_session, test_user, test_asset):
    """Test creating a paper order."""
    account = PaperAccount(
        user_id=test_user.id,
        name="Test Account",
        initial_balance=10000,
        current_cash=10000,
        currency="USD",
        status="active",
    )
    db_session.add(account)
    await db_session.commit()
    await db_session.refresh(account)

    order = PaperOrder(
        paper_account_id=account.id,
        asset_id=test_asset.id,
        side="BUY",
        order_type="LIMIT",
        quantity=1,
        requested_price=50000,
        status="open",
    )
    db_session.add(order)
    await db_session.commit()
    await db_session.refresh(order)

    assert order.id is not None
    assert order.paper_account_id == account.id
    assert order.side == "BUY"


@pytest.mark.asyncio
async def test_paper_position_uniqueness(db_session, test_user, test_asset):
    """Test that paper positions are unique per asset per account."""
    account = PaperAccount(
        user_id=test_user.id,
        name="Test Account",
        initial_balance=10000,
        current_cash=10000,
        currency="USD",
        status="active",
    )
    db_session.add(account)
    await db_session.commit()
    await db_session.refresh(account)

    position1 = PaperPosition(
        paper_account_id=account.id,
        asset_id=test_asset.id,
        quantity=1,
        average_entry_price=50000,
        realized_pnl=0,
        unrealized_pnl=0,
    )
    position2 = PaperPosition(
        paper_account_id=account.id,
        asset_id=test_asset.id,
        quantity=2,
        average_entry_price=50000,
        realized_pnl=0,
        unrealized_pnl=0,
    )
    db_session.add(position1)
    db_session.add(position2)

    with pytest.raises(IntegrityError):
        await db_session.commit()


@pytest.mark.asyncio
async def test_ai_conversation_creation(db_session, test_user):
    """Test creating an AI conversation."""
    conversation = AIConversation(
        user_id=test_user.id,
        title="Market Analysis Discussion",
        context_type="market",
    )
    db_session.add(conversation)
    await db_session.commit()
    await db_session.refresh(conversation)

    assert conversation.id is not None
    assert conversation.user_id == test_user.id


@pytest.mark.asyncio
async def test_ai_message_creation(db_session, test_user):
    """Test creating an AI message."""
    conversation = AIConversation(
        user_id=test_user.id,
        title="Test Conversation",
    )
    db_session.add(conversation)
    await db_session.commit()
    await db_session.refresh(conversation)

    message = AIMessage(
        conversation_id=conversation.id,
        role="user",
        content="What is the market trend?",
        model="gpt-4",
    )
    db_session.add(message)
    await db_session.commit()
    await db_session.refresh(message)

    assert message.id is not None
    assert message.conversation_id == conversation.id


@pytest.mark.asyncio
async def test_alert_rule_creation(db_session, test_user, test_asset):
    """Test creating an alert rule."""
    rule = AlertRule(
        user_id=test_user.id,
        asset_id=test_asset.id,
        alert_type="price_change",
        condition={"type": "price_above", "value": 60000},
        threshold=60000,
        is_enabled=True,
    )
    db_session.add(rule)
    await db_session.commit()
    await db_session.refresh(rule)

    assert rule.id is not None
    assert rule.user_id == test_user.id


@pytest.mark.asyncio
async def test_notification_creation(db_session, test_user):
    """Test creating a notification."""
    notification = Notification(
        user_id=test_user.id,
        notification_type="alert",
        title="Price Alert",
        message="BTC has reached your alert price",
    )
    db_session.add(notification)
    await db_session.commit()
    await db_session.refresh(notification)

    assert notification.id is not None
    assert notification.user_id == test_user.id
    assert notification.read_at is None


@pytest.mark.asyncio
async def test_community_post_creation(db_session, test_user):
    """Test creating a community post."""
    post = CommunityPost(
        user_id=test_user.id,
        content="This is my first post!",
        visibility="public",
    )
    db_session.add(post)
    await db_session.commit()
    await db_session.refresh(post)

    assert post.id is not None
    assert post.user_id == test_user.id
    assert post.deleted_at is None


@pytest.mark.asyncio
async def test_community_comment_creation(db_session, test_user):
    """Test creating a community comment."""
    post = CommunityPost(
        user_id=test_user.id,
        content="Original post",
        visibility="public",
    )
    db_session.add(post)
    await db_session.commit()
    await db_session.refresh(post)

    comment = CommunityComment(
        post_id=post.id,
        user_id=test_user.id,
        content="Great post!",
    )
    db_session.add(comment)
    await db_session.commit()
    await db_session.refresh(comment)

    assert comment.id is not None
    assert comment.post_id == post.id


@pytest.mark.asyncio
async def test_community_like_uniqueness(db_session, test_user):
    """Test that a user can only like something once."""
    post = CommunityPost(
        user_id=test_user.id,
        content="Likeable post",
        visibility="public",
    )
    db_session.add(post)
    await db_session.commit()
    await db_session.refresh(post)

    like1 = CommunityLike(
        user_id=test_user.id,
        target_type="post",
        target_id=post.id,
    )
    like2 = CommunityLike(
        user_id=test_user.id,
        target_type="post",
        target_id=post.id,
    )
    db_session.add(like1)
    db_session.add(like2)

    with pytest.raises(IntegrityError):
        await db_session.commit()


@pytest.mark.asyncio
async def test_tutor_course_creation(db_session):
    """Test creating a tutor course."""
    course = TutorCourse(
        title="Crypto Basics",
        description="Learn the basics of cryptocurrency",
        level="beginner",
    )
    db_session.add(course)
    await db_session.commit()
    await db_session.refresh(course)

    assert course.id is not None
    assert course.title == "Crypto Basics"


@pytest.mark.asyncio
async def test_tutor_lesson_creation(db_session):
    """Test creating a tutor lesson."""
    course = TutorCourse(
        title="Advanced Trading",
        level="advanced",
    )
    db_session.add(course)
    await db_session.commit()
    await db_session.refresh(course)

    lesson = TutorLesson(
        course_id=course.id,
        title="Technical Analysis",
        content="Learn to read charts",
        position=1,
    )
    db_session.add(lesson)
    await db_session.commit()
    await db_session.refresh(lesson)

    assert lesson.id is not None
    assert lesson.course_id == course.id


@pytest.mark.asyncio
async def test_tutor_progress_uniqueness(db_session, test_user):
    """Test that a user can only have one progress record per course."""
    course = TutorCourse(title="Test Course", level="beginner")
    db_session.add(course)
    await db_session.commit()
    await db_session.refresh(course)

    progress1 = TutorProgress(
        user_id=test_user.id,
        course_id=course.id,
        completed_lessons=0,
        total_lessons=5,
        progress_percentage=0,
    )
    progress2 = TutorProgress(
        user_id=test_user.id,
        course_id=course.id,
        completed_lessons=1,
        total_lessons=5,
        progress_percentage=20,
    )
    db_session.add(progress1)
    db_session.add(progress2)

    with pytest.raises(IntegrityError):
        await db_session.commit()


@pytest.mark.asyncio
async def test_audit_log_creation(db_session, test_user):
    """Test creating an audit log."""
    log = AuditLog(
        user_id=test_user.id,
        action="login",
        resource_type="user",
        resource_id=test_user.id,
        request_id="req-123",
        ip_address="192.168.1.1",
    )
    db_session.add(log)
    await db_session.commit()
    await db_session.refresh(log)

    assert log.id is not None
    assert log.action == "login"
    # Verify no sensitive data is stored
    assert "password" not in str(log)


@pytest.mark.asyncio
async def test_user_deletion_cascade(db_session, test_user):
    """Test that deleting a user cascades to their related records."""
    # Create related records
    profile = UserProfile(user_id=test_user.id, display_name="Test")
    session = UserSession(
        user_id=test_user.id,
        session_hash="test",
        expires_at=datetime.utcnow() + timedelta(hours=24),
    )
    prefs = UserPreferences(user_id=test_user.id)

    db_session.add_all([profile, session, prefs])
    await db_session.commit()

    # Delete the user
    await db_session.delete(test_user)
    await db_session.commit()

    # Verify related records are deleted
    remaining_profiles = await db_session.execute(
        select(UserProfile).where(UserProfile.user_id == test_user.id)
    )
    assert remaining_profiles.scalars().first() is None
