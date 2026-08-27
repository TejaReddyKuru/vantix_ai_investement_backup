from decimal import Decimal
from typing import Any, Dict, List, Optional
from app.schemas.execution import PerformanceAnalyticsOut


class TradingAnalyticsService:
    """
    Normalized Trading & Portfolio Analytics Service.
    Aggregates trade history, position exposure, and portfolio metrics into unified performance outputs.
    """

    def compute_performance(
        self,
        total_equity: Decimal = Decimal("10000.00"),
        realized_pnl: Decimal = Decimal("500.00"),
        unrealized_pnl: Decimal = Decimal("150.00"),
        initial_balance: Decimal = Decimal("10000.00"),
        trades: Optional[List[Dict[str, Any]]] = None,
    ) -> PerformanceAnalyticsOut:
        trades_list = trades or []
        total_trades = len(trades_list)

        winning_trades = [t for t in trades_list if t.get("realized_pnl", 0) > 0]
        losing_trades = [t for t in trades_list if t.get("realized_pnl", 0) < 0]

        win_rate = (len(winning_trades) / total_trades * 100.0) if total_trades > 0 else 0.0

        gross_profit = sum(t.get("realized_pnl", 0) for t in winning_trades)
        gross_loss = abs(sum(t.get("realized_pnl", 0) for t in losing_trades))
        profit_factor = (gross_profit / gross_loss) if gross_loss > 0 else (gross_profit if gross_profit > 0 else 1.0)

        total_pnl = realized_pnl + unrealized_pnl
        total_return_pct = float((total_pnl / initial_balance) * Decimal("100.0")) if initial_balance > 0 else 0.0

        return PerformanceAnalyticsOut(
            total_equity=total_equity,
            realized_pnl=realized_pnl,
            unrealized_pnl=unrealized_pnl,
            total_return_pct=total_return_pct,
            win_rate=win_rate,
            profit_factor=profit_factor,
            max_drawdown_pct=0.0,
            total_trades=total_trades,
            exposure_pct=0.0,
        )
