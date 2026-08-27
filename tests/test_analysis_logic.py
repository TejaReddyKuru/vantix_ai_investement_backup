from app.agents.market_analysis.modules.volume_analyzer import VolumeAnalyzer
from app.agents.market_analysis.schema import MarketData


def _build_market_data(volume_24h: float, avg_volume: float) -> MarketData:
    candles = [[0, 0, 0, 0, avg_volume, avg_volume] for _ in range(20)]
    return MarketData(
        symbol="BTCUSDT",
        price=50000.0,
        candles={"1h": candles},
        order_book={"bids": [], "asks": []},
        volume_24h=volume_24h,
        change_24h=2.0,
    )


def test_volume_analyzer_distinguishes_high_volume() -> None:
    high_volume = _build_market_data(volume_24h=10_000_000.0, avg_volume=500_000.0)
    low_volume = _build_market_data(volume_24h=100_000.0, avg_volume=50_000.0)

    high_result = VolumeAnalyzer().analyze(high_volume)
    low_result = VolumeAnalyzer().analyze(low_volume)

    assert high_result["relative_volume"] > low_result["relative_volume"]
    assert high_result["relative_volume"] >= 50
