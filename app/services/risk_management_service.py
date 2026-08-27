from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.asset import Asset
from app.models.paper_trading import PaperAccount, PaperPosition
from app.schemas.risk import RiskAssessmentOut
from app.services.binance_service import BinanceService
from app.services.portfolio_service import PortfolioService


class RiskManagementService:
    def __init__(self, db: AsyncSession, binance_service: BinanceService | None = None) -> None:
        self.db = db
        self.binance_service = binance_service or BinanceService()
        self.portfolio_service = PortfolioService(self.db, self.binance_service)

    async def assess_trade(
        self,
        user_id: UUID,
        asset_id: UUID,
        side: str,
        quantity: Decimal,
        entry_price: Decimal,
        stop_loss: Decimal | None,
        take_profit: Decimal | None = None
    ) -> RiskAssessmentOut:
        """
        Assess a proposed trade against risk management rules.
        Does not modify the database or execute trades.
        """
        # Local imports to prevent circular imports at the module level
        from app.services.paper_trading_service import (
            AccountNotFoundError,
            AccountInactiveError,
            AssetNotFoundError,
            AssetInactiveError,
            InvalidOrderInputError,
            PriceRetrievalError,
        )


        # 1. Fetch and validate paper account
        account_stmt = select(PaperAccount).where(PaperAccount.user_id == user_id)
        account_res = await self.db.execute(account_stmt)
        account = account_res.scalar_one_or_none()
        if not account:
            raise AccountNotFoundError("Paper account not found.")
        if account.status != "active":
            raise AccountInactiveError("Paper account is not active.")

        # 2. Fetch and validate asset
        if isinstance(asset_id, str):
            from uuid import UUID
            asset_id = UUID(asset_id)
        asset = await self.db.get(Asset, asset_id)

        if not asset:
            raise AssetNotFoundError("Asset not found.")
        if asset.status.lower() != "active":
            raise AssetInactiveError("Asset is not active.")
        if asset.exchange.lower() != "binance":
            raise InvalidOrderInputError(f"Asset exchange '{asset.exchange}' is not supported.")

        # 3. Calculate portfolio live metrics (does not commit a snapshot to DB)
        metrics = await self.portfolio_service.calculate_live_metrics(user_id)
        current_equity = metrics["total_equity"]
        available_cash = metrics["cash"]
        drawdown = metrics["drawdown"]

        # Convert settings float values to Decimal for precise financial calculations
        max_drawdown = Decimal(str(settings.max_portfolio_drawdown)) * Decimal("100.0")
        max_position_exposure = Decimal(str(settings.max_position_exposure)) * Decimal("100.0")
        max_risk_per_trade = Decimal(str(settings.max_risk_per_trade)) * Decimal("100.0")
        min_cash_reserve = Decimal(str(settings.min_cash_reserve)) * Decimal("100.0")

        side_upper = side.upper()
        position_value = quantity * entry_price

        # 4. Check drawdown limit (applies only to BUY)
        if side_upper == "BUY":
            if drawdown >= max_drawdown:
                return RiskAssessmentOut(
                    approved=False,
                    risk_amount=Decimal("0.0"),
                    risk_percentage=Decimal("0.0"),
                    position_value=position_value,
                    exposure_percentage=Decimal("0.0"),
                    available_cash=available_cash,
                    current_equity=current_equity,
                    warnings=[],
                    rejection_reason=f"Maximum portfolio drawdown limit reached ({drawdown:.2f}% >= {max_drawdown:.2f}%)."
                )

        # 5. Position Exposure & Concentration Check
        pos_stmt = select(PaperPosition).where(
            PaperPosition.paper_account_id == account.id,
            PaperPosition.asset_id == asset.id
        )
        pos_res = await self.db.execute(pos_stmt)
        position = pos_res.scalar_one_or_none()
        existing_qty = position.quantity if position else Decimal("0.0")

        if side_upper == "BUY":
            new_qty = existing_qty + quantity
        else:  # SELL
            new_qty = existing_qty - quantity
            if new_qty < 0:
                return RiskAssessmentOut(
                    approved=False,
                    risk_amount=Decimal("0.0"),
                    risk_percentage=Decimal("0.0"),
                    position_value=position_value,
                    exposure_percentage=Decimal("0.0"),
                    available_cash=available_cash,
                    current_equity=current_equity,
                    warnings=[],
                    rejection_reason="Cannot sell more than existing position quantity."
                )

        new_position_value = new_qty * entry_price
        exposure_percentage = (new_position_value / current_equity) * Decimal("100.0") if current_equity > 0 else Decimal("0.0")

        if side_upper == "BUY":
            if exposure_percentage > max_position_exposure:
                return RiskAssessmentOut(
                    approved=False,
                    risk_amount=Decimal("0.0"),
                    risk_percentage=Decimal("0.0"),
                    position_value=position_value,
                    exposure_percentage=exposure_percentage,
                    available_cash=available_cash,
                    current_equity=current_equity,
                    warnings=[],
                    rejection_reason=f"Excessive position exposure / portfolio concentration ({exposure_percentage:.2f}% > {max_position_exposure:.2f}%)."
                )

        # 6. Cash Reserve check (applies only to BUY)
        if side_upper == "BUY":
            required_reserve = current_equity * (min_cash_reserve / Decimal("100.0"))
            available_after_trade = available_cash - position_value
            if available_after_trade < required_reserve:
                return RiskAssessmentOut(
                    approved=False,
                    risk_amount=Decimal("0.0"),
                    risk_percentage=Decimal("0.0"),
                    position_value=position_value,
                    exposure_percentage=exposure_percentage,
                    available_cash=available_cash,
                    current_equity=current_equity,
                    warnings=[],
                    rejection_reason="Insufficient cash balance considering minimum cash reserve limit."
                )

        # 7. Risk Per Trade check (applies only to BUY)
        if side_upper == "BUY":
            if stop_loss is None or stop_loss <= 0 or stop_loss >= entry_price:
                return RiskAssessmentOut(
                    approved=False,
                    risk_amount=Decimal("0.0"),
                    risk_percentage=Decimal("0.0"),
                    position_value=position_value,
                    exposure_percentage=exposure_percentage,
                    available_cash=available_cash,
                    current_equity=current_equity,
                    warnings=[],
                    rejection_reason="Invalid stop-loss price."
                )
            risk_amount = quantity * (entry_price - stop_loss)
            risk_percentage = (risk_amount / current_equity) * Decimal("100.0") if current_equity > 0 else Decimal("0.0")
            if risk_percentage > max_risk_per_trade:
                return RiskAssessmentOut(
                    approved=False,
                    risk_amount=risk_amount,
                    risk_percentage=risk_percentage,
                    position_value=position_value,
                    exposure_percentage=exposure_percentage,
                    available_cash=available_cash,
                    current_equity=current_equity,
                    warnings=[],
                    rejection_reason=f"Excessive risk per trade limit exceeded ({risk_percentage:.2f}% > {max_risk_per_trade:.2f}%)."
                )
        else:  # SELL
            risk_amount = Decimal("0.0")
            risk_percentage = Decimal("0.0")

        # 8. Warnings (80% limit threshold)
        warnings = []
        if side_upper == "BUY":
            if exposure_percentage >= max_position_exposure * Decimal("0.80"):
                warnings.append("Position exposure is approaching the configured maximum.")
            if drawdown >= max_drawdown * Decimal("0.80"):
                warnings.append("Portfolio drawdown is approaching the configured maximum.")

        return RiskAssessmentOut(
            approved=True,
            risk_amount=risk_amount,
            risk_percentage=risk_percentage,
            position_value=position_value,
            exposure_percentage=exposure_percentage,
            available_cash=available_cash,
            current_equity=current_equity,
            warnings=warnings
        )
