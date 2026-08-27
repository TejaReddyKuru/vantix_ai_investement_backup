import random
from statistics import mean
from typing import List

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


def expected_direction(change: float) -> str:
    return "bullish" if change >= 0 else "bearish"


def expected_momentum(change: float) -> int:
    return min(100, int(abs(change) * 10))


def expected_acceleration(change: float) -> int:
    return max(-100, min(100, int(change * 8)))


def evaluate(n: int = 1000, seed: int = 123) -> None:
    random.seed(seed)
    pa = PriceAnalyzer()

    dir_true: List[str] = []
    dir_pred: List[str] = []

    momentum_errors: List[float] = []
    accel_errors: List[float] = []

    for _ in range(n):
        change = random.uniform(-12.0, 12.0)
        sample = make_sample(change)

        out = pa.analyze(sample)

        dir_true.append(expected_direction(change))
        dir_pred.append(out["direction"])

        momentum_errors.append((out["momentum_strength"] - expected_momentum(change)) ** 2)
        accel_errors.append(abs(out["acceleration"] - expected_acceleration(change)))

    dir_acc = sum(1 for a, b in zip(dir_pred, dir_true) if a == b) / n
    momentum_mse = mean(momentum_errors)
    accel_mae = mean(accel_errors)

    print(f"PriceAnalyzer direction accuracy: {dir_acc:.4f} ({dir_acc*100:.1f}%)")
    print(f"PriceAnalyzer momentum MSE: {momentum_mse:.4f}")
    print(f"PriceAnalyzer acceleration MAE: {accel_mae:.4f}")


if __name__ == "__main__":
    evaluate()
