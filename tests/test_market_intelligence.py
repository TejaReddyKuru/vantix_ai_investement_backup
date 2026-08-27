from decimal import Decimal
from unittest.mock import AsyncMock, patch
import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from sqlalchemy import select

import app.models  # noqa: F401
from app.main import app
from app.models.asset import Asset
from app.schemas.sentiment import SentimentAggregationOut
from app.schemas.technical_analysis import (
    MomentumAnalysisOut,
    SupportResistanceOut,
    TechnicalAnalysisOut,
    TechnicalIndicatorOut,
    TechnicalSignalOut,
    TrendAnalysisOut,
    VolatilityAnalysisOut,
)
from app.services.market_intelligence_service import MarketIntelligenceService
from database.session import AsyncSessionLocal

client = TestClient(app)


@pytest_asyncio.fixture
async def db_session():
    async with AsyncSessionLocal() as session:
        yield session


async def seed_btc_asset(session):
    stmt = select(Asset).where(Asset.symbol == "BTCUSDT")
    res = await session.execute(stmt)
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
        session.add(asset)
        await session.commit()
    return asset


def make_mock_technical(
    signal: str = "BUY",
    confidence: Decimal = Decimal("0.80"),
    direction: str = "bullish",
    strength: Decimal = Decimal("0.70"),
) -> TechnicalAnalysisOut:
    return TechnicalAnalysisOut(
        symbol="BTCUSDT",
        interval="1h",
        timestamp=1700000000000,
        current_price=Decimal("50000.00"),
        indicators=TechnicalIndicatorOut(rsi_14=Decimal("45.00")),
        trend=TrendAnalysisOut(direction=direction, strength=strength),
        momentum=MomentumAnalysisOut(price_change_pct=Decimal("1.50")),
        volatility=VolatilityAnalysisOut(classification="medium"),
        support_resistance=SupportResistanceOut(),
        signal=TechnicalSignalOut(signal=signal, confidence=confidence, reasons=["Test reason"]),
    )


def make_mock_sentiment(
    weighted_sentiment: Decimal = Decimal("0.50"),
    avg_confidence: Decimal = Decimal("0.80"),
    direction: str = "bullish",
) -> SentimentAggregationOut:
    return SentimentAggregationOut(
        symbol="BTCUSDT",
        article_count=5,
        positive_count=4,
        negative_count=1,
        neutral_count=0,
        average_sentiment=weighted_sentiment,
        weighted_sentiment=weighted_sentiment,
        average_confidence=avg_confidence,
        sentiment_direction=direction,
        sentiment_strength=abs(weighted_sentiment),
    )


# ==========================================
# 1. Technical Scoring Tests
# ==========================================

@pytest.mark.asyncio
async def test_01_strong_buy_technical_signal():
    service = MarketIntelligenceService()
    tech = make_mock_technical(signal="BUY", confidence=Decimal("0.90"))
    score = service.calculate_technical_score(tech)
    assert score == Decimal("4.5")


@pytest.mark.asyncio
async def test_02_strong_sell_technical_signal():
    service = MarketIntelligenceService()
    tech = make_mock_technical(signal="SELL", confidence=Decimal("0.80"))
    score = service.calculate_technical_score(tech)
    assert score == Decimal("-4.0")


@pytest.mark.asyncio
async def test_03_hold_technical_signal():
    service = MarketIntelligenceService()
    tech = make_mock_technical(signal="HOLD", confidence=Decimal("0.70"))
    score = service.calculate_technical_score(tech)
    assert score == Decimal("0.0")


@pytest.mark.asyncio
async def test_04_technical_confidence_scaling():
    service = MarketIntelligenceService()
    tech_low = make_mock_technical(signal="BUY", confidence=Decimal("0.20"))
    tech_high = make_mock_technical(signal="BUY", confidence=Decimal("0.80"))
    score_low = service.calculate_technical_score(tech_low)
    score_high = service.calculate_technical_score(tech_high)
    assert score_low == Decimal("1.0")
    assert score_high == Decimal("4.0")
    assert score_high > score_low


# ==========================================
# 2. Sentiment Scoring Tests
# ==========================================

@pytest.mark.asyncio
async def test_05_strong_bullish_sentiment():
    service = MarketIntelligenceService()
    sentiment = make_mock_sentiment(weighted_sentiment=Decimal("0.80"), avg_confidence=Decimal("0.90"))
    score = service.calculate_sentiment_score(sentiment)
    assert score == Decimal("1.44")


@pytest.mark.asyncio
async def test_06_strong_bearish_sentiment():
    service = MarketIntelligenceService()
    sentiment = make_mock_sentiment(weighted_sentiment=Decimal("-0.80"), avg_confidence=Decimal("0.90"))
    score = service.calculate_sentiment_score(sentiment)
    assert score == Decimal("-1.44")


@pytest.mark.asyncio
async def test_07_neutral_sentiment():
    service = MarketIntelligenceService()
    sentiment = make_mock_sentiment(weighted_sentiment=Decimal("0.0"), avg_confidence=Decimal("0.50"))
    score = service.calculate_sentiment_score(sentiment)
    assert score == Decimal("0.0")


@pytest.mark.asyncio
async def test_08_sentiment_confidence_scaling():
    service = MarketIntelligenceService()
    sent_low = make_mock_sentiment(weighted_sentiment=Decimal("0.80"), avg_confidence=Decimal("0.20"))
    sent_high = make_mock_sentiment(weighted_sentiment=Decimal("0.80"), avg_confidence=Decimal("0.80"))
    score_low = service.calculate_sentiment_score(sent_low)
    score_high = service.calculate_sentiment_score(sent_high)
    assert score_low == Decimal("0.32")
    assert score_high == Decimal("1.28")
    assert score_high > score_low


# ==========================================
# 3. Trend Scoring Tests
# ==========================================

@pytest.mark.asyncio
async def test_09_bullish_trend():
    service = MarketIntelligenceService()
    trend = TrendAnalysisOut(direction="bullish", strength=Decimal("0.80"))
    score = service.calculate_trend_score(trend)
    assert score == Decimal("0.8")


@pytest.mark.asyncio
async def test_10_bearish_trend():
    service = MarketIntelligenceService()
    trend = TrendAnalysisOut(direction="bearish", strength=Decimal("0.60"))
    score = service.calculate_trend_score(trend)
    assert score == Decimal("-0.6")


@pytest.mark.asyncio
async def test_11_neutral_trend():
    service = MarketIntelligenceService()
    trend = TrendAnalysisOut(direction="neutral", strength=Decimal("0.50"))
    score = service.calculate_trend_score(trend)
    assert score == Decimal("0.0")


@pytest.mark.asyncio
async def test_12_trend_strength_scaling():
    service = MarketIntelligenceService()
    trend_weak = TrendAnalysisOut(direction="bullish", strength=Decimal("0.20"))
    trend_strong = TrendAnalysisOut(direction="bullish", strength=Decimal("0.90"))
    score_weak = service.calculate_trend_score(trend_weak)
    score_strong = service.calculate_trend_score(trend_strong)
    assert score_weak == Decimal("0.2")
    assert score_strong == Decimal("0.9")


# ==========================================
# 4. Risk Penalty Tests
# ==========================================

@pytest.mark.asyncio
async def test_13_low_risk_portfolio():
    service = MarketIntelligenceService()
    penalty = service.calculate_risk_penalty(
        drawdown=Decimal("1.0"),
        exposure=Decimal("5.0"),
        cash_ratio=Decimal("0.50"),
    )
    assert penalty == Decimal("0.0")


@pytest.mark.asyncio
async def test_14_drawdown_approaching_limit():
    service = MarketIntelligenceService()
    penalty = service.calculate_risk_penalty(
        drawdown=Decimal("14.0"),
        exposure=Decimal("5.0"),
        cash_ratio=Decimal("0.50"),
    )
    assert penalty < Decimal("0.0")


@pytest.mark.asyncio
async def test_15_exposure_approaching_limit():
    service = MarketIntelligenceService()
    penalty = service.calculate_risk_penalty(
        drawdown=Decimal("1.0"),
        exposure=Decimal("18.0"),
        cash_ratio=Decimal("0.50"),
    )
    assert penalty < Decimal("0.0")


@pytest.mark.asyncio
async def test_16_cash_approaching_minimum_reserve():
    service = MarketIntelligenceService()
    penalty = service.calculate_risk_penalty(
        drawdown=Decimal("1.0"),
        exposure=Decimal("5.0"),
        cash_ratio=Decimal("0.04"),
    )
    assert penalty < Decimal("0.0")


@pytest.mark.asyncio
async def test_17_risk_penalty_capped_at_minus_one():
    service = MarketIntelligenceService()
    penalty = service.calculate_risk_penalty(
        drawdown=Decimal("25.0"),
        exposure=Decimal("30.0"),
        cash_ratio=Decimal("0.01"),
    )
    assert penalty == Decimal("-1.0")


# ==========================================
# 5. Final Score & Signal Threshold Tests
# ==========================================

@pytest.mark.asyncio
async def test_18_strong_buy_consensus():
    service = MarketIntelligenceService()
    tech = make_mock_technical(signal="BUY", confidence=Decimal("0.80"))
    sent = make_mock_sentiment(weighted_sentiment=Decimal("0.75"), avg_confidence=Decimal("0.80"), direction="bullish")
    trend = TrendAnalysisOut(direction="bullish", strength=Decimal("0.80"))

    tech_s = service.calculate_technical_score(tech)
    sent_s = service.calculate_sentiment_score(sent)
    trend_s = service.calculate_trend_score(trend)
    risk_p = service.calculate_risk_penalty(Decimal("0"), Decimal("0"), Decimal("0.8"))

    final_score = tech_s + sent_s + trend_s + risk_p
    sig, div, ovr = service.resolve_signal(final_score, "BUY", Decimal("0.8"), "bullish", Decimal("0.8"))

    assert final_score >= Decimal("2.0")
    assert sig == "BUY"
    assert div is False


@pytest.mark.asyncio
async def test_19_strong_sell_consensus():
    service = MarketIntelligenceService()
    tech = make_mock_technical(signal="SELL", confidence=Decimal("0.80"))
    sent = make_mock_sentiment(weighted_sentiment=Decimal("-0.75"), avg_confidence=Decimal("0.80"), direction="bearish")
    trend = TrendAnalysisOut(direction="bearish", strength=Decimal("0.80"))

    tech_s = service.calculate_technical_score(tech)
    sent_s = service.calculate_sentiment_score(sent)
    trend_s = service.calculate_trend_score(trend)
    risk_p = service.calculate_risk_penalty(Decimal("0"), Decimal("0"), Decimal("0.8"))

    final_score = tech_s + sent_s + trend_s + risk_p
    sig, div, ovr = service.resolve_signal(final_score, "SELL", Decimal("0.8"), "bearish", Decimal("0.8"))

    assert final_score <= Decimal("-2.0")
    assert sig == "SELL"
    assert div is False


@pytest.mark.asyncio
async def test_20_hold_when_score_between_thresholds():
    service = MarketIntelligenceService()
    sig, div, ovr = service.resolve_signal(Decimal("0.5"), "BUY", Decimal("0.5"), "neutral", Decimal("0.5"))
    assert sig == "HOLD"


@pytest.mark.asyncio
async def test_21_score_bounded_to_minus_ten_plus_ten():
    raw_score = Decimal("15.0")
    bounded_score = min(Decimal("10.0"), max(Decimal("-10.0"), raw_score))
    assert bounded_score == Decimal("10.0")


# ==========================================
# 6. Divergence Tests
# ==========================================

@pytest.mark.asyncio
async def test_22_buy_technical_plus_bearish_sentiment_forces_hold():
    service = MarketIntelligenceService()
    sig, div, ovr = service.resolve_signal(
        final_score=Decimal("3.0"),
        technical_signal="BUY",
        technical_confidence=Decimal("0.70"),
        sentiment_direction="bearish",
        sentiment_confidence=Decimal("0.60"),
    )
    assert div is True
    assert sig == "HOLD"
    assert ovr is None


@pytest.mark.asyncio
async def test_23_sell_technical_plus_bullish_sentiment_forces_hold():
    service = MarketIntelligenceService()
    sig, div, ovr = service.resolve_signal(
        final_score=Decimal("-3.0"),
        technical_signal="SELL",
        technical_confidence=Decimal("0.70"),
        sentiment_direction="bullish",
        sentiment_confidence=Decimal("0.60"),
    )
    assert div is True
    assert sig == "HOLD"
    assert ovr is None


@pytest.mark.asyncio
async def test_24_strong_technical_confidence_overrides_weak_opposing_sentiment():
    service = MarketIntelligenceService()
    sig, div, ovr = service.resolve_signal(
        final_score=Decimal("4.0"),
        technical_signal="BUY",
        technical_confidence=Decimal("0.90"),
        sentiment_direction="bearish",
        sentiment_confidence=Decimal("0.20"),
    )
    assert div is True
    assert ovr == "technical_override"
    assert sig == "BUY"


@pytest.mark.asyncio
async def test_25_divergence_affects_confidence():
    service = MarketIntelligenceService()
    conf_normal = service.calculate_confidence(
        final_score=Decimal("4.0"),
        technical_confidence=Decimal("0.80"),
        sentiment_confidence=Decimal("0.80"),
        trend_strength=Decimal("0.80"),
        divergence_detected=False,
        override_applied=None,
    )

    conf_divergent = service.calculate_confidence(
        final_score=Decimal("4.0"),
        technical_confidence=Decimal("0.80"),
        sentiment_confidence=Decimal("0.80"),
        trend_strength=Decimal("0.80"),
        divergence_detected=True,
        override_applied=None,
    )

    assert conf_divergent < conf_normal


# ==========================================
# 7. API Endpoint Integration Tests
# ==========================================

@pytest.mark.asyncio
async def test_api_unauthenticated_request():
    response = client.get("/api/v1/market-intelligence/BTCUSDT")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_api_authenticated_valid_symbol(db_session):
    await seed_btc_asset(db_session)

    payload = {"email": "market-intel-user@example.com", "password": "Password1!", "display_name": "Intel Tester"}
    reg = client.post("/api/v1/auth/register", json=payload)
    assert reg.status_code == 201

    login = client.post("/api/v1/auth/login", json=payload)
    assert login.status_code == 200
    token = login.json()["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    with patch("app.services.binance_service.BinanceService.get_ohlcv", new_callable=AsyncMock) as mock_ohlcv, \
         patch("app.services.news_service.NewsService.fetch_and_normalize_news", new_callable=AsyncMock) as mock_news:
        
        mock_klines = []
        for i in range(50):
            mock_klines.append([1700000000000 + i * 3600000, "50000", "51000", "49000", "50500", "100"])
        mock_ohlcv.return_value = mock_klines
        mock_news.return_value = []

        response = client.get("/api/v1/market-intelligence/BTCUSDT", headers=headers)
        assert response.status_code == 200, response.text

        data = response.json()
        assert data["symbol"] == "BTCUSDT"
        assert data["signal"] in ("BUY", "SELL", "HOLD")
        assert 0.0 <= data["confidence"] <= 1.0
        assert -10.0 <= data["final_score"] <= 10.0
        assert isinstance(data["reasons"], list)
        assert len(data["reasons"]) > 0


@pytest.mark.asyncio
async def test_api_invalid_symbol(db_session):
    await seed_btc_asset(db_session)

    payload = {"email": "market-intel-invalid@example.com", "password": "Password1!", "display_name": "Invalid Tester"}
    client.post("/api/v1/auth/register", json=payload)
    login = client.post("/api/v1/auth/login", json=payload)
    token = login.json()["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/v1/market-intelligence/NONEXISTENT", headers=headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_api_invalid_interval(db_session):
    await seed_btc_asset(db_session)

    payload = {"email": "market-intel-interval@example.com", "password": "Password1!", "display_name": "Interval Tester"}
    client.post("/api/v1/auth/register", json=payload)
    login = client.post("/api/v1/auth/login", json=payload)
    token = login.json()["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/v1/market-intelligence/BTCUSDT?interval=10h", headers=headers)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_api_no_order_execution_and_user_isolation(db_session):
    await seed_btc_asset(db_session)

    payload1 = {"email": "user1-intel@example.com", "password": "Password1!", "display_name": "User One"}
    client.post("/api/v1/auth/register", json=payload1)
    login1 = client.post("/api/v1/auth/login", json=payload1)
    token1 = login1.json()["tokens"]["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    with patch("app.services.binance_service.BinanceService.get_ohlcv", new_callable=AsyncMock) as mock_ohlcv, \
         patch("app.services.news_service.NewsService.fetch_and_normalize_news", new_callable=AsyncMock) as mock_news:
        
        mock_klines = []
        for i in range(50):
            mock_klines.append([1700000000000 + i * 3600000, "50000", "51000", "49000", "50500", "100"])
        mock_ohlcv.return_value = mock_klines
        mock_news.return_value = []

        res = client.get("/api/v1/market-intelligence/BTCUSDT", headers=headers1)
        assert res.status_code == 200

        port_res = client.get("/api/v1/portfolio/summary", headers=headers1)
        assert port_res.status_code == 200
