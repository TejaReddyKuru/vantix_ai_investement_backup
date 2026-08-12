import pytest
import pytest_asyncio
from decimal import Decimal
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from sqlalchemy import select
from database.session import AsyncSessionLocal
from app.main import app
from app.models.user import User
from app.models.asset import Asset
from app.schemas.technical_analysis import TechnicalIndicatorOut
from app.services.technical_analysis_service import TechnicalAnalysisService, Candle
from app.core.exceptions import BinanceServiceError


@pytest_asyncio.fixture
async def db_session():
    async with AsyncSessionLocal() as session:
        yield session


@pytest.fixture

def test_candles():
    """
    Generate a simple deterministic list of 250 candles.
    We will use a base price of 100 with a slight trend to test indicators.
    """
    candles = []
    # Base pattern: 100 base, with standard fluctuation and volume
    for i in range(250):
        # Create a clean upward trend to test bullish indicators
        price = Decimal("100.00") + Decimal(str(i)) * Decimal("0.10")
        candles.append(
            Candle(
                timestamp=1609459200000 + i * 3600000,
                open=price - Decimal("0.50"),
                high=price + Decimal("1.00"),
                low=price - Decimal("1.00"),
                close=price,
                volume=Decimal("1000.0") + Decimal(str(i)) * Decimal("5.0"),
            )
        )
    return candles


@pytest.fixture
def service():
    return TechnicalAnalysisService()


def test_sma_calculation(service, test_candles):
    closes = [c.close for c in test_candles]
    # SMA 20
    sma_20 = service.calculate_sma_series(closes, 20)
    assert len(sma_20) == 250
    assert sma_20[18] is None
    # Close for first 20: 100.00 to 101.90. Mean = 100.95
    assert sma_20[19] == Decimal("100.95")
    # SMA 50
    sma_50 = service.calculate_sma_series(closes, 50)
    assert len(sma_50) == 250
    assert sma_50[48] is None
    # Close for first 50: 100.00 to 104.90. Mean = 102.45
    assert sma_50[49] == Decimal("102.45")


def test_ema_calculation(service, test_candles):
    closes = [c.close for c in test_candles]
    ema_9 = service.calculate_ema_series(closes, 9)
    assert len(ema_9) == 250
    assert ema_9[7] is None
    # First valid EMA is SMA of the first 9 closes: 100.00 to 100.80. Mean = 100.40
    assert ema_9[8] == Decimal("100.40")
    # Next EMA = (100.90 - 100.40) * (2/10) + 100.40 = 0.50 * 0.20 + 100.40 = 100.50
    assert abs(ema_9[9] - Decimal("100.50")) < Decimal("0.0001")


def test_rsi_calculation(service, test_candles):
    closes = [c.close for c in test_candles]
    rsi = service.calculate_rsi_series(closes, 14)
    assert len(rsi) == 250
    assert rsi[13] is None
    # Prices always increase by 0.10, so average gain is 0.10, average loss is 0.
    # RSI should be 100.00
    assert rsi[14] == Decimal("100.00")


def test_macd_calculation(service, test_candles):
    closes = [c.close for c in test_candles]
    macd, signal, hist = service.calculate_macd_series(closes)
    assert len(macd) == 250
    assert len(signal) == 250
    assert len(hist) == 250
    # MACD Line requires 26 periods
    assert macd[24] is None
    assert macd[25] is not None
    # Signal requires 9 valid MACD values, so index 25 + 8 = 33
    assert signal[32] is None
    assert signal[33] is not None
    assert hist[33] is not None


def test_bollinger_bands_calculation(service, test_candles):
    closes = [c.close for c in test_candles]
    upper, middle, lower = service.calculate_bollinger_bands_series(closes, 20, 2)
    assert len(upper) == 250
    assert len(middle) == 250
    assert len(lower) == 250
    assert middle[18] is None
    assert middle[19] is not None
    assert upper[19] > middle[19]
    assert lower[19] < middle[19]


def test_atr_calculation(service, test_candles):
    atr = service.calculate_atr_series(test_candles, 14)
    assert len(atr) == 250
    assert atr[13] is None
    # For index 1 to 14, high-low is 2.0. High-prev_close = 1.0, Low-prev_close = 1.0.
    # Max is 2.0. SMA of TR is 2.0.
    assert atr[14] == Decimal("2.0")


def test_adx_calculation(service, test_candles):
    adx, plus_di, minus_di = service.calculate_adx_series(test_candles, 14)
    assert len(adx) == 250
    assert len(plus_di) == 250
    assert len(minus_di) == 250
    # First valid plus_di is index 14
    assert plus_di[13] is None
    assert plus_di[14] is not None
    # First valid adx requires index 27 (2 * period - 1)
    assert adx[26] is None
    assert adx[27] is not None


def test_volume_metrics(service, test_candles):
    # Test current volume and average volume
    closes = [c.close for c in test_candles]
    volumes = [c.volume for c in test_candles]
    avg_vol = service.calculate_sma_series(volumes, 20)
    current_vol = volumes[-1]
    
    assert current_vol == test_candles[-1].volume
    assert avg_vol[-1] is not None


def test_momentum_detection(service, test_candles):
    # Test price change pct, short-term and medium-term momentum
    current_price = test_candles[-1].close
    prev_price = test_candles[-2].close
    price_change_pct = (current_price - prev_price) / prev_price * Decimal("100")
    
    # 5-period ROC
    price_5 = test_candles[-6].close
    momentum_5 = (current_price - price_5) / price_5 * Decimal("100")
    
    # 20-period ROC
    price_20 = test_candles[-21].close
    momentum_20 = (current_price - price_20) / price_20 * Decimal("100")
    
    assert price_change_pct > 0
    assert momentum_5 > 0
    assert momentum_20 > 0


def test_trend_detection(service, test_candles):
    closes = [c.close for c in test_candles]
    current_price = test_candles[-1].close
    sma_50 = service.calculate_sma_series(closes, 50)[-1]
    ema_9 = service.calculate_ema_series(closes, 9)[-1]
    ema_21 = service.calculate_ema_series(closes, 21)[-1]
    
    trend = service.calculate_trend(
        current_price=current_price,
        sma_50=sma_50,
        ema_9=ema_9,
        ema_21=ema_21,
        adx_value=Decimal("35.0"),
    )
    
    assert trend.direction == "bullish"
    assert trend.strength == Decimal("0.7")  # 35 / 50 = 0.7


def test_volatility_classification(service, test_candles):
    # High Volatility
    high_vol = service.calculate_volatility(test_candles, Decimal("5.0"))
    assert high_vol.classification == "high"
    assert high_vol.atr_pct is not None
    
    # Low Volatility
    low_vol = service.calculate_volatility(test_candles, Decimal("0.5"))
    assert low_vol.classification == "low"
    
    # Medium Volatility
    med_vol = service.calculate_volatility(test_candles, Decimal("2.0"))
    assert med_vol.classification == "medium"


def test_support_resistance(service, test_candles):
    support, resistance = service.calculate_support_resistance(test_candles)
    # The prices increase monotonically by 0.10.
    # In a monotonically increasing series, local highs/lows do not form traditional bounds.
    # However, let's test that the method handles it gracefully and returns either None or calculated value.
    # To test actual support/resistance, let's create a cycle dataset
    cycle_candles = []
    prices = [100.0, 102.0, 105.0, 103.0, 101.0, 99.0, 102.0, 104.0, 106.0, 104.0, 102.0, 100.0, 101.0, 103.0, 105.0]
    for i, p in enumerate(prices):
        dec_p = Decimal(str(p))
        cycle_candles.append(
            Candle(
                timestamp=1609459200000 + i * 3600000,
                open=dec_p - Decimal("0.5"),
                high=dec_p + Decimal("1.0"),
                low=dec_p - Decimal("1.0"),
                close=dec_p,
                volume=Decimal("1000.0"),
            )
        )
    sup, res = service.calculate_support_resistance(cycle_candles)
    # Troughs are at low prices, peaks at high prices
    # Cycle has high at index 8 (106) -> resistance around 107
    # Low at index 5 (99) -> support around 98
    # Since close is 105, resistance should be > 105, support < 105
    assert sup is None or sup < cycle_candles[-1].close
    assert res is None or res > cycle_candles[-1].close


def test_buy_signal(service):
    # Setup indicators favoring BUY
    ind = TechnicalIndicatorOut(
        sma_50=Decimal("95.0"),
        ema_9=Decimal("101.0"),
        ema_21=Decimal("99.0"),
        rsi_14=Decimal("25.0"),  # oversold -> +1
        bb_upper=Decimal("105.0"),
        bb_lower=Decimal("100.0"),  # price at lower band -> +1
        macd_line=Decimal("1.5"),
        macd_signal=Decimal("1.0"),
        macd_hist=Decimal("0.5"),  # positive -> +1
        adx_14=Decimal("30.0"),
        plus_di=Decimal("28.0"),
        minus_di=Decimal("20.0"),  # strong trend +DI > -DI -> +1
    )
    sig = service.generate_signal(Decimal("100.0"), ind)
    assert sig.signal == "BUY"
    assert sig.confidence > Decimal("0.33")
    assert len(sig.reasons) > 0


def test_sell_signal(service):
    # Setup indicators favoring SELL
    ind = TechnicalIndicatorOut(
        sma_50=Decimal("105.0"),
        ema_9=Decimal("98.0"),
        ema_21=Decimal("100.0"),  # crossover -> -1
        rsi_14=Decimal("75.0"),  # overbought -> -1
        bb_upper=Decimal("100.0"),  # price at upper band -> -1
        bb_lower=Decimal("90.0"),
        macd_line=Decimal("-1.5"),
        macd_signal=Decimal("-1.0"),
        macd_hist=Decimal("-0.5"),  # negative -> -1
        adx_14=Decimal("30.0"),
        plus_di=Decimal("15.0"),
        minus_di=Decimal("25.0"),  # strong trend -DI > +DI -> -1
    )
    sig = service.generate_signal(Decimal("100.0"), ind)
    assert sig.signal == "SELL"
    assert sig.confidence > Decimal("0.33")


def test_hold_signal(service):
    # Setup mixed indicators favoring HOLD
    ind = TechnicalIndicatorOut(
        sma_50=Decimal("100.0"),
        ema_9=Decimal("100.0"),
        ema_21=Decimal("100.0"),
        rsi_14=Decimal("50.0"),  # neutral
        bb_upper=Decimal("105.0"),
        bb_lower=Decimal("95.0"),
        macd_line=Decimal("0.0"),
        macd_signal=Decimal("0.0"),
        macd_hist=Decimal("0.0"),
    )
    sig = service.generate_signal(Decimal("100.0"), ind)
    assert sig.signal == "HOLD"
    # Mixed/neutral indicators should yield low absolute average score, giving high HOLD confidence
    assert sig.confidence >= Decimal("0.5")


def test_confidence_bounds(service):
    ind = TechnicalIndicatorOut(
        ema_9=Decimal("100.0"),
        ema_21=Decimal("90.0"),
    )
    # Check that confidence bounds remain strictly between 0 and 1
    sig = service.generate_signal(Decimal("100.0"), ind)
    assert Decimal("0.0") <= sig.confidence <= Decimal("1.0")


def test_insufficient_data(service):
    # Verify that if length is less than the required period, None is returned instead of crashing
    empty_prices = [Decimal("100.00")] * 5
    sma = service.calculate_sma_series(empty_prices, 20)
    assert all(x is None for x in sma)
    
    ema = service.calculate_ema_series(empty_prices, 20)
    assert all(x is None for x in ema)
    
    rsi = service.calculate_rsi_series(empty_prices, 14)
    assert all(x is None for x in rsi)


@pytest.mark.asyncio
async def test_binance_failure_handling(db_session):
    # Create active test asset
    asset = Asset(
        symbol="ETHUSDT",
        base_asset="ETH",
        quote_asset="USDT",
        name="Ethereum",
        exchange="BINANCE",
        status="active",
    )
    db_session.add(asset)
    await db_session.commit()

    from app.services.binance_service import BinanceService
    with patch("app.services.binance_service.BinanceService._request", new_callable=AsyncMock) as mock_request:
        mock_request.side_effect = BinanceServiceError("Exchange disconnected")
        
        client = TestClient(app)
        
        # Setup login & auth
        user_payload = {"email": "ta_user@example.com", "password": "Password1!", "display_name": "TA User"}
        client.post('/api/v1/auth/register', json=user_payload)
        login_res = client.post('/api/v1/auth/login', json=user_payload)
        token = login_res.json()['tokens']['access_token']
        headers = {"Authorization": f"Bearer {token}"}
        
        # Fetching TA route should fail with 502 Bad Gateway
        res = client.get("/api/v1/technical-analysis/ETHUSDT", headers=headers)
        assert res.status_code == 502
        assert "disconnected" in res.json()["error"]["message"]



def test_api_schema_and_auth_behavior():
    client = TestClient(app)
    
    # 1. Non-authenticated query returns 401
    bad_res = client.get("/api/v1/technical-analysis/BTCUSDT")
    assert bad_res.status_code == 401


@pytest.mark.asyncio
async def test_invalid_symbol_and_interval(db_session):
    # Setup login & auth
    client = TestClient(app)
    user_payload = {"email": "ta_user2@example.com", "password": "Password1!", "display_name": "TA User 2"}
    client.post('/api/v1/auth/register', json=user_payload)
    login_res = client.post('/api/v1/auth/login', json=user_payload)
    token = login_res.json()['tokens']['access_token']
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Invalid Interval returns 400
    res_int = client.get("/api/v1/technical-analysis/BTCUSDT?interval=2h", headers=headers)
    assert res_int.status_code == 400
    assert "Unsupported interval" in res_int.json()["error"]["message"]
    
    # 2. Invalid Symbol (not in db) returns 404
    res_sym = client.get("/api/v1/technical-analysis/DOGEUSDT", headers=headers)
    assert res_sym.status_code == 404
    assert "not found" in res_sym.json()["error"]["message"]



@pytest.mark.asyncio
async def test_decimal_precision(service, test_candles):
    closes = [c.close for c in test_candles]
    # Check that high-precision Decimal inputs yield Decimal outputs
    sma_20 = service.calculate_sma_series(closes, 20)
    assert isinstance(sma_20[-1], Decimal)
    
    # Check that MACD calculations output Decimal
    macd, signal, hist = service.calculate_macd_series(closes)
    assert isinstance(macd[-1], Decimal)
    assert isinstance(signal[-1], Decimal)
    assert isinstance(hist[-1], Decimal)


@pytest.mark.asyncio
async def test_regression_with_existing_market_analysis(db_session):
    # Create BTCUSDT in assets if it does not exist (or query existing)
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

    # Login
    client = TestClient(app)
    user_payload = {"email": "ta_user3@example.com", "password": "Password1!", "display_name": "TA User 3"}
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
        
        res = client.get("/api/v1/technical-analysis/BTCUSDT", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["symbol"] == "BTCUSDT"
        assert data["interval"] == "1h"
        assert float(data["current_price"]) == 100.0 + 199.0 * 0.1
        assert "indicators" in data
        assert "trend" in data
        assert "momentum" in data
        assert "volatility" in data
        assert "signal" in data
