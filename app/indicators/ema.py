from typing import List


def ema(values: List[float], period: int = 14) -> List[float]:
    if not values:
        return []
    ema_values = []
    k = 2 / (period + 1)
    ema_prev = values[0]
    for v in values:
        ema_prev = v * k + ema_prev * (1 - k)
        ema_values.append(ema_prev)
    return ema_values
