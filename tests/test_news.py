import pytest
import pytest_asyncio
from decimal import Decimal
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from sqlalchemy import select

from database.session import AsyncSessionLocal
from app.main import app
from app.models.asset import Asset
from app.services.news_service import NewsService, MockNewsProvider, NewsProvider


@pytest_asyncio.fixture
async def db_session():
    async with AsyncSessionLocal() as session:
        yield session


@pytest.mark.asyncio
async def test_news_provider_deterministic():
    provider = MockNewsProvider()
    res = await provider.fetch_news("BTCUSDT", 2)
    assert len(res) == 2
    assert "Bitcoin" in res[0]["title"]
    assert "BTCUSDT" in res[0]["symbol"]
    assert res[0]["url"].startswith("https://mocknews.example.com")


@pytest.mark.asyncio
async def test_news_normalization_and_sorting():
    service = NewsService()
    articles = await service.fetch_and_normalize_news("BTC", limit=5)
    assert len(articles) > 0
    # Validate sorting: published_at descending
    for i in range(len(articles) - 1):
        assert articles[i].published_at >= articles[i + 1].published_at


@pytest.mark.asyncio
async def test_news_validation_invalid_handled():
    class BadProvider(NewsProvider):
        async def fetch_news(self, symbol: str, limit: int = 10):
            return [
                # Missing URL
                {"title": "Missing URL", "description": "Desc", "source": "Coindesk", "published_at": "2026-08-11T12:00:00Z"},
                # Malformed published_at
                {"title": "Bad Date", "description": "Desc", "source": "Coindesk", "url": "https://test.com", "published_at": "bad-date"},
                # Valid
                {"title": "Valid One", "description": "Desc", "source": "Coindesk", "url": "https://test.com", "published_at": "2026-08-11T12:00:00Z"},
            ]
            
    service = NewsService(provider=BadProvider())
    articles = await service.fetch_and_normalize_news("BTC")
    assert len(articles) == 1
    assert articles[0].title == "Valid One"


@pytest.mark.asyncio
async def test_news_deduplication():
    class DuplicateProvider(NewsProvider):
        async def fetch_news(self, symbol: str, limit: int = 10):
            return [
                {"title": "Duplicate", "description": "Match", "source": "Coindesk", "url": "https://test.com", "published_at": "2026-08-11T12:00:00Z"},
                {"title": "Duplicate", "description": "Match", "source": "Coindesk", "url": "https://test2.com", "published_at": "2026-08-11T12:05:00Z"},
                {"title": "Unique", "description": "Diff", "source": "Coindesk", "url": "https://test3.com", "published_at": "2026-08-11T12:10:00Z"},
            ]
            
    service = NewsService(provider=DuplicateProvider())
    articles = await service.fetch_and_normalize_news("BTC")
    assert len(articles) == 2
    titles = [a.title for a in articles]
    assert "Duplicate" in titles
    assert "Unique" in titles


@pytest.mark.asyncio
async def test_empty_news_response():
    class EmptyProvider(NewsProvider):
        async def fetch_news(self, symbol: str, limit: int = 10):
            return []
            
    service = NewsService(provider=EmptyProvider())
    articles = await service.fetch_and_normalize_news("BTC")
    assert articles == []


@pytest.mark.asyncio
async def test_relevance_calculation():
    service = NewsService()
    # Title match -> 1.0
    r1 = service._calculate_relevance("BTC", "Bitcoin hits new high", "Crypto market surges.")
    assert r1 == Decimal("1.00")
    
    # Description match -> 0.8
    r2 = service._calculate_relevance("BTC", "Market analysis today", "Many institutional investors buy Bitcoin.")
    assert r2 == Decimal("0.80")
    
    # No match -> 0.5
    r3 = service._calculate_relevance("BTC", "Market update", "Altcoins are rallying today.")
    assert r3 == Decimal("0.50")


@pytest.mark.asyncio
async def test_provider_failure_handling():
    class BrokenProvider(NewsProvider):
        async def fetch_news(self, symbol: str, limit: int = 10):
            raise Exception("API Limit exceeded")
            
    service = NewsService(provider=BrokenProvider())
    with pytest.raises(RuntimeError) as exc_info:
        await service.fetch_and_normalize_news("BTC")
    assert "provider failed to fetch data" in str(exc_info.value)


@pytest.mark.asyncio
async def test_api_auth_required():
    client = TestClient(app)
    # Non-authenticated query returns 401
    res = client.get("/api/v1/news/BTCUSDT")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_api_symbol_validation_and_fetch(db_session):
    # Ensure active asset BTCUSDT exists
    stmt = select(Asset).where(Asset.symbol == "BTCUSDT")
    res = await db_session.execute(stmt)
    asset = res.scalar_one_or_none()
    if not asset:
        asset = Asset(
            symbol="BTCUSDT",
            base_asset="BTC",
            quote_asset="USDT",
            name="Bitcoin",
            exchange="BINANCE",
            status="active",
        )
        db_session.add(asset)
        await db_session.commit()
        
    client = TestClient(app)
    
    # Register & login
    user_payload = {"email": "news_user@example.com", "password": "Password1!", "display_name": "News User"}
    client.post('/api/v1/auth/register', json=user_payload)
    login_res = client.post('/api/v1/auth/login', json=user_payload)
    token = login_res.json()['tokens']['access_token']
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Valid fetch
    res = client.get("/api/v1/news/BTCUSDT?limit=2", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["symbol"] == "BTCUSDT"
    assert len(data["articles"]) <= 2
    
    # 2. Invalid symbol returns 404
    res_bad = client.get("/api/v1/news/DOGEUSDT", headers=headers)
    assert res_bad.status_code == 404
    assert "not found" in res_bad.json()["error"]["message"]
