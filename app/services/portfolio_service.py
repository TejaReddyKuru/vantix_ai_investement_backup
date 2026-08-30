from datetime import datetime, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asset import Asset
from app.models.paper_trading import PaperAccount, PaperPosition
from app.models.portfolio import PortfolioSnapshot
from app.services.binance_service import BinanceService


class PortfolioError(Exception):
    """Base exception for all portfolio service errors."""
    pass


class AccountNotFoundError(PortfolioError):
    """Raised when the user's paper account does not exist."""
    pass


class AssetNotFoundError(PortfolioError):
    """Raised when a position references a non-existent asset."""
    pass


class AssetInactiveError(PortfolioError):
    """Raised when an asset in the user's positions is inactive."""
    pass


class UnsupportedExchangeError(PortfolioError):
    """Raised when an asset is mapped to an unsupported exchange."""
    pass


class PriceRetrievalError(PortfolioError):
    """Raised when a position's asset price cannot be retrieved from Binance."""
    pass


class PortfolioService:
    def __init__(self, db: AsyncSession, binance_service: BinanceService | None = None) -> None:
        self.db = db
        self.binance_service = binance_service or BinanceService()

    async def calculate_live_metrics(self, user_id: UUID, use_live_prices: bool = True) -> dict:
        """
        Calculate live portfolio metrics without modifying database state.
        If use_live_prices is False, uses the cached current_price from the database.
        """
        # 1. Fetch paper account
        account_stmt = select(PaperAccount).where(PaperAccount.user_id == user_id)
        account_res = await self.db.execute(account_stmt)
        account = account_res.scalar_one_or_none()
        if not account:
            raise AccountNotFoundError("Paper account not found.")

        # 2. Fetch paper positions
        pos_stmt = select(PaperPosition).where(PaperPosition.paper_account_id == account.id)
        pos_res = await self.db.execute(pos_stmt)
        positions = pos_res.scalars().all()

        # 3. Calculate valuation
        cash = account.current_cash
        invested_value = Decimal("0.00000000")
        unrealized_pnl = Decimal("0.00000000")
        realized_pnl = Decimal("0.00000000")

        for position in positions:
            # Fetch asset details
            asset = await self.db.get(Asset, position.asset_id)
            if not asset:
                raise AssetNotFoundError(f"Asset with ID {position.asset_id} not found.")
            if asset.status.lower() != "active":
                raise AssetInactiveError(f"Asset {asset.symbol} is not active.")
            if asset.exchange.lower() != "binance":
                raise UnsupportedExchangeError(f"Asset {asset.symbol} exchange '{asset.exchange}' is not supported.")

            # Retrieve current price
            symbol = asset.symbol
            if use_live_prices:
                try:
                    price_val = await self.binance_service.get_current_price(symbol)
                    current_price = Decimal(str(price_val))
                except Exception as e:
                    raise PriceRetrievalError(f"Failed to fetch market price for {symbol}: {e}")
            else:
                current_price = position.current_price or position.average_entry_price

            # Position math
            pos_qty = position.quantity
            avg_entry = position.average_entry_price

            market_value = pos_qty * current_price
            pos_unrealized = pos_qty * (current_price - avg_entry)
            pos_realized = position.realized_pnl

            invested_value += market_value
            unrealized_pnl += pos_unrealized
            realized_pnl += pos_realized

        total_equity = cash + invested_value

        # 4. Calculate Drawdown
        # Query the highest previous total_equity across all snapshots for this user
        peak_stmt = select(PortfolioSnapshot.total_equity).where(
            PortfolioSnapshot.user_id == user_id
        ).order_by(PortfolioSnapshot.total_equity.desc()).limit(1)
        peak_res = await self.db.execute(peak_stmt)
        max_prev_equity = peak_res.scalar_one_or_none()

        if max_prev_equity is not None:
            peak_equity = max(max_prev_equity, total_equity)
        else:
            peak_equity = total_equity

        if peak_equity > 0:
            drawdown = ((peak_equity - total_equity) / peak_equity) * Decimal("100.0000")
        else:
            drawdown = Decimal("0.0000")

        if drawdown < 0:
            drawdown = Decimal("0.0000")

        return {
            "total_equity": total_equity,
            "cash": cash,
            "invested_value": invested_value,
            "realized_pnl": realized_pnl,
            "unrealized_pnl": unrealized_pnl,
            "drawdown": drawdown,
            "account_id": account.id,
        }

    async def calculate_and_save_snapshot(self, user_id: UUID) -> PortfolioSnapshot:
        """
        Calculate the live valuation of the user's portfolio and save or update a snapshot.
        Runs atomically.
        """
        try:
            metrics = await self.calculate_live_metrics(user_id)
            total_equity = metrics["total_equity"]
            cash = metrics["cash"]
            invested_value = metrics["invested_value"]
            realized_pnl = metrics["realized_pnl"]
            unrealized_pnl = metrics["unrealized_pnl"]
            drawdown = metrics["drawdown"]
            account_id = metrics["account_id"]

            # 5. Throttled Snapshot Persistence
            # Fetch latest snapshot to check age
            recent_stmt = select(PortfolioSnapshot).where(
                PortfolioSnapshot.user_id == user_id
            ).order_by(PortfolioSnapshot.recorded_at.desc()).limit(1)
            recent_res = await self.db.execute(recent_stmt)
            recent_snapshot = recent_res.scalar_one_or_none()

            now = datetime.utcnow()
            save_new = False

            if recent_snapshot is None:
                save_new = True
            else:
                time_diff = now - recent_snapshot.recorded_at
                if time_diff.total_seconds() > 300:  # 5 minutes
                    save_new = True

            if save_new:
                snapshot = PortfolioSnapshot(
                    user_id=user_id,
                    paper_account_id=account_id,
                    total_equity=total_equity,
                    cash=cash,
                    invested_value=invested_value,
                    realized_pnl=realized_pnl,
                    unrealized_pnl=unrealized_pnl,
                    drawdown=drawdown,
                    recorded_at=now
                )
                self.db.add(snapshot)
            else:
                snapshot = recent_snapshot
                snapshot.total_equity = total_equity
                snapshot.cash = cash
                snapshot.invested_value = invested_value
                snapshot.realized_pnl = realized_pnl
                snapshot.unrealized_pnl = unrealized_pnl
                snapshot.drawdown = drawdown

            # Atomic Commit
            await self.db.commit()
            await self.db.refresh(snapshot)
            return snapshot

        except Exception as e:
            # Atomic Rollback
            await self.db.rollback()
            raise e

