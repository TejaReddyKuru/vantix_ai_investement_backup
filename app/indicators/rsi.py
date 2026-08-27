from typing import List


def rsi(values: List[float], period: int = 14) -> List[float]:
    if len(values) < 2:
        return []
    gains = []
    losses = []
    for i in range(1, len(values)):
        change = values[i] - values[i - 1]
        gains.append(max(0, change))
        losses.append(max(0, -change))
    avg_gain = sum(gains[:period]) / period if len(gains) >= period else sum(gains) / max(1, len(gains))
    avg_loss = sum(losses[:period]) / period if len(losses) >= period else sum(losses) / max(1, len(losses))
    rsi_values = []
    for i in range(len(gains)):
        if i < period:
            rsi_values.append(100 - 100 / (1 + (avg_gain / (avg_loss if avg_loss else 1))))
        else:
            avg_gain = (avg_gain * (period - 1) + gains[i]) / period
            avg_loss = (avg_loss * (period - 1) + losses[i]) / period
            rs = avg_gain / (avg_loss if avg_loss else 1)
            rsi_values.append(100 - 100 / (1 + rs))
    return rsi_values
