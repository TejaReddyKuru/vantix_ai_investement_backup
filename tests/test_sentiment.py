import pytest
import pytest_asyncio
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from sqlalchemy import select

from database.session import AsyncSessionLocal
from app.main import app
from app.models.asset import Asset
from app.schemas.news import NewsArticleOut
from app.schemas.sentiment import SentimentAggregationOut, CombinedAnalysisOut
from app.schemas.technical_analysis import TechnicalAnalysisOut, TechnicalSignalOut
from app.services.sentiment_service import (
    SentimentService,
    SentimentAggregationService,
    IntelligenceIntegrationService,
)


@pytest_asyncio.fixture
async def db_session():
    async with AsyncSessionLocal() as session:
        yield session


def test_positive_sentiment():
    service = SentimentService()
    res = service.analyze_text("Bitcoin experiences strong growth and profit.")
    assert res["label"] == "positive"
    assert res["score"] > Decimal("0.20")
    assert "growth" in res["matched_terms"]
    assert "profit" in res["matched_terms"]


def test_negative_sentiment():
    service = SentimentService()
    res = service.analyze_text("Markets face a decline, hack, and regulatory lawsuit warnings.")
    assert res["label"] == "negative"
    assert res["score"] < Decimal("-0.20")
    assert "decline" in res["matched_terms"]
    assert "hack" in res["matched_terms"]


def test_neutral_sentiment():
    service = SentimentService()
    res = service.analyze_text("Standard market updates today without volatility or major changes.")
    assert res["label"] == "neutral"
    assert -Decimal("0.20") < res["score"] < Decimal("0.20")


def test_score_and_confidence_bounds():
    service = SentimentService()
    # Extremely long list of positive indicators to check upper bounding
    text = " ".join(["growth profit surge rally"] * 10)
    res = service.analyze_text(text)
    assert -Decimal("1.0") <= res["score"] <= Decimal("1.0")
    assert Decimal("0.0") <= res["confidence"] <= Decimal("1.0")


def test_negation_handling():
    service = SentimentService()
    # Bullish term with negation
    res = service.analyze_text("This news is not bullish.")
    # The presence of "not" before "bullish" should invert it
    assert res["score"] < 0
    
    # Bearish term with negation
    res2 = service.analyze_text("Markets did not face a decline.")
    assert res2["score"] > 0


def test_intensity_modifiers():
    service = SentimentService()
    res_base = service.analyze_text("Bitcoin is bullish.")
    res_intense = service.analyze_text("Bitcoin is extremely bullish.")
    
    # Score for extremely bullish should be higher than normal bullish
    assert res_intense["score"] > res_base["score"]


def test_financial_terminology():
    service = SentimentService()
    # Check that financial-specific words trigger matches correctly
    res = service.analyze_text("Company profits beat expectations.")
    assert "profits" in res["matched_terms"]
    assert "beat expectations" in res["matched_terms"]


def test_recent_news_weighting():
    service = SentimentAggregationService()
    now = datetime.now(timezone.utc)
    
    # Positive article 1 hour ago
    a1 = NewsArticleOut(
        id="11111111-1111-1111-1111-111111111111",
        source="Desk",
        title="Bullish breakout",
        description="Bitcoin surges significantly.",
        url="https://test.com/1",
        published_at=now - timedelta(hours=1),
        symbol="BTCUSDT",
    )
    # Negative article 48 hours ago
    a2 = NewsArticleOut(
        id="22222222-2222-2222-2222-222222222222",
        source="Desk",
        title="Bearish decline",
        description="Markets crash warning.",
        url="https://test.com/2",
        published_at=now - timedelta(hours=48),
        symbol="BTCUSDT",
    )
    
    res = service.aggregate_sentiment("BTCUSDT", [a1, a2])
    # The recent positive article should dominate the time-decay sentiment index
    assert res.weighted_sentiment > 0
    assert res.sentiment_direction == "bullish"


def test_mixed_sentiment_aggregation():
    service = SentimentAggregationService()
    now = datetime.now(timezone.utc)
    
    # One positive, one negative, both at same age
    a1 = NewsArticleOut(
        id="11111111-1111-1111-1111-111111111111",
        source="Desk",
        title="Bullish breakout",
        description="Bitcoin surges.",
        url="https://test.com/1",
        published_at=now - timedelta(hours=1),
        symbol="BTCUSDT",
    )
    a2 = NewsArticleOut(
        id="22222222-2222-2222-2222-222222222222",
        source="Desk",
        title="Bearish decline",
        description="Markets decline.",
        url="https://test.com/2",
        published_at=now - timedelta(hours=1),
        symbol="BTCUSDT",
    )
    
    res = service.aggregate_sentiment("BTCUSDT", [a1, a2])
    # Scores should cancel out to neutral
    assert -Decimal("0.20") < res.weighted_sentiment < Decimal("0.20")
    assert res.sentiment_direction == "neutral"


def test_duplicate_news_protection():
    # Service fetch logic handles duplicates in O(n).
    # If we pass duplicate-looking text, the service handles it.
    from app.services.news_service import NewsService, NewsProvider
    
    class DupProvider(NewsProvider):
        async def fetch_news(self, symbol: str, limit: int = 10):
            return [
                {"title": "Dup", "description": "Same", "source": "A", "url": "https://a.com", "published_at": "2026-08-11T12:00:00Z"},
                {"title": "Dup", "description": "Same", "source": "B", "url": "https://b.com", "published_at": "2026-08-11T12:01:00Z"},
            ]
            
    service = NewsService(provider=DupProvider())
    import asyncio
    articles = asyncio.run(service.fetch_and_normalize_news("BTC"))
    # Deduplication must reduce duplicates to 1
    assert len(articles) == 1


def test_combined_technical_sentiment_signals():
    # 1. Aligned bullish signals
    tech_bull = TechnicalAnalysisOut(
        symbol="BTCUSDT",
        interval="1h",
        timestamp=1609459200000,
        current_price=Decimal("50000.00"),
        indicators={"sma_20": Decimal("49000.0")},
        trend={"direction": "bullish", "strength": Decimal("0.8")},
        momentum={"price_change_pct": Decimal("1.2")},
        volatility={"classification": "medium"},
        support_resistance={},
        signal=TechnicalSignalOut(signal="BUY", confidence=Decimal("0.8"), reasons=[]),
    )
    
    sent_bull = SentimentAggregationOut(
        symbol="BTCUSDT",
        article_count=5,
        positive_count=4,
        negative_count=0,
        neutral_count=1,
        average_sentiment=Decimal("0.60"),
        weighted_sentiment=Decimal("0.60"),
        average_confidence=Decimal("0.80"),
        sentiment_direction="bullish",
        sentiment_strength=Decimal("0.60"),
    )
    
    res = IntelligenceIntegrationService.combine_signals("BTCUSDT", tech_bull, sent_bull)
    assert res.combined_bias == "STRONG_BUY"
    assert "strong bullish outlook" in "".join(res.reasons)


def test_combined_divergent_signals():
    # 2. Divergent signals (Technical BUY, Sentiment Bearish)
    tech_bull = TechnicalAnalysisOut(
        symbol="BTCUSDT",
        interval="1h",
        timestamp=1609459200000,
        current_price=Decimal("50000.00"),
        indicators={"sma_20": Decimal("49000.0")},
        trend={"direction": "bullish", "strength": Decimal("0.8")},
        momentum={"price_change_pct": Decimal("1.2")},
        volatility={"classification": "medium"},
        support_resistance={},
        signal=TechnicalSignalOut(signal="BUY", confidence=Decimal("0.8"), reasons=[]),
    )
    
    sent_bear = SentimentAggregationOut(
        symbol="BTCUSDT",
        article_count=5,
        positive_count=0,
        negative_count=4,
        neutral_count=1,
        average_sentiment=-Decimal("0.60"),
        weighted_sentiment=-Decimal("0.60"),
        average_confidence=Decimal("0.80"),
        sentiment_direction="bearish",
        sentiment_strength=Decimal("0.60"),
    )
    
    res = IntelligenceIntegrationService.combine_signals("BTCUSDT", tech_bull, sent_bear)
    assert res.combined_bias == "CAUTIOUS"
    assert "Divergence" in "".join(res.reasons)


@pytest.mark.asyncio
async def test_api_news_sentiment_endpoint(db_session):
    # Ensure active asset BTCUSDT exists in DB
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

    # Login client
    client = TestClient(app)
    user_payload = {"email": "sent_user@example.com", "password": "Password1!", "display_name": "Sent User"}
    client.post('/api/v1/auth/register', json=user_payload)
    login_res = client.post('/api/v1/auth/login', json=user_payload)
    token = login_res.json()['tokens']['access_token']
    headers = {"Authorization": f"Bearer {token}"}
    
    # Mock Binance get_ohlcv
    with patch("app.services.binance_service.BinanceService.get_ohlcv", new_callable=AsyncMock) as mock_ohlcv:
        # Mock returns 200 candles matching our pattern
        mock_ohlcv.return_value = [
            [1609459200000 + i * 3600000, 100 + i * 0.1, 101 + i * 0.1, 99 + i * 0.1, 100 + i * 0.1, 1000]
            for i in range(200)
        ]
        
        res = client.get("/api/v1/news/BTCUSDT/sentiment", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["symbol"] == "BTCUSDT"
        assert "combined_bias" in data
        assert "sentiment_direction" in data
        assert "technical_signal" in data
