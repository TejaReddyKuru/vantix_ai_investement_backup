from typing import List


def sma(values: List[float], period: int = 14) -> List[float]:
    if not values or period <= 0:
        return []
    result = []
    for i in range(len(values)):
        if i + 1 < period:
            result.append(sum(values[: i + 1]) / (i + 1))
        else:
            result.append(sum(values[i + 1 - period : i + 1]) / period)
    return result
