import random
from statistics import mean
from typing import List

from app.agents.market_analysis.modules.trend_detector import TrendDetector
from app.agents.market_analysis.modules.price_analyzer import PriceAnalyzer
from app.agents.market_analysis.schema import MarketData


def make_sample(change: float) -> MarketData:
    return MarketData(
        symbol="TEST",
        price=100.0,
        candles={"1h": []},
        order_book={"bids": [], "asks": []},
        volume_24h=0.0,
        change_24h=change,
    )


def expected_trend(change: float) -> str:
    if change > 4:
        return "uptrend"
    if change < -4:
        return "downtrend"
    if change > 1.5:
        return "uptrend"
    if change < -1.5:
        return "downtrend"
    return "sideways"


def expected_price_direction(change: float) -> str:
    return "bullish" if change >= 0 else "bearish"


def expected_momentum(change: float) -> int:
    return min(100, int(abs(change) * 10))


def evaluate(n: int = 200, seed: int = 42) -> None:
    random.seed(seed)
    td = TrendDetector()
    pa = PriceAnalyzer()

    trend_preds: List[str] = []
    trend_trues: List[str] = []

    dir_preds: List[str] = []
    dir_trues: List[str] = []

    momentum_errors: List[float] = []

    for _ in range(n):
        change = random.uniform(-10.0, 10.0)
        sample = make_sample(change)

        t_true = expected_trend(change)
        p_true = expected_price_direction(change)
        m_true = expected_momentum(change)

        t_pred = td.detect(sample)["direction"]
        p_out = pa.analyze(sample)
        p_pred = p_out["direction"]
        m_pred = p_out["momentum_strength"]

        trend_trues.append(t_true)
        trend_preds.append(t_pred)

        dir_trues.append(p_true)
        dir_preds.append(p_pred)

        momentum_errors.append((m_pred - m_true) ** 2)

    trend_acc = sum(1 for a, b in zip(trend_preds, trend_trues) if a == b) / n
    dir_acc = sum(1 for a, b in zip(dir_preds, dir_trues) if a == b) / n
    mse = mean(momentum_errors)

    print(f"TrendDetector accuracy: {trend_acc:.3f} ({int(trend_acc * 100)}%)")
    print(f"PriceAnalyzer direction accuracy: {dir_acc:.3f} ({int(dir_acc * 100)}%)")
    print(f"PriceAnalyzer momentum MSE: {mse:.3f}")


if __name__ == "__main__":
    evaluate()
