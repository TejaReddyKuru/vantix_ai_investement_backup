from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asset import Asset
from app.models.paper_trading import PaperAccount, PaperOrder, PaperPosition, PaperTrade, PaperTransaction
from app.schemas.paper_trading import PaperOrderCreate
from app.services.binance_service import BinanceService


class PaperTradingError(Exception):
    """Base exception for all paper trading service errors."""
    pass


class AccountNotFoundError(PaperTradingError):
    """Raised when the user's paper account does not exist."""
    pass


class AccountInactiveError(PaperTradingError):
    """Raised when the paper account is inactive."""
    pass


class AssetNotFoundError(PaperTradingError):
    """Raised when the requested asset does not exist."""
    pass


class AssetInactiveError(PaperTradingError):
    """Raised when the requested asset is inactive."""
    pass


class InsufficientBalanceError(PaperTradingError):
    """Raised when a BUY order exceeds available cash."""
    pass


class InsufficientPositionError(PaperTradingError):
    """Raised when a SELL order exceeds available position size."""
    pass


class InvalidOrderInputError(PaperTradingError):
    """Raised when quantity, requested price, side, or order type are invalid."""
    pass


class RiskValidationFailedError(InvalidOrderInputError):
    """Raised when a proposed order fails risk management validation."""
    pass


class PriceRetrievalError(PaperTradingError):
    """Raised when the Binance market price could not be retrieved."""
    pass


class PaperTradingService:
    def __init__(self, db: AsyncSession, binance_service: BinanceService | None = None) -> None:
        self.db = db
        self.binance_service = binance_service or BinanceService()

    async def get_paper_account(self, user_id: UUID) -> PaperAccount | None:
        """Fetch the paper trading account for a user."""
        stmt = select(PaperAccount).where(PaperAccount.user_id == user_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_order(self, user_id: UUID, payload: PaperOrderCreate) -> PaperOrder:
        """
        Validate, retrieve prices, and execute a paper order atomically.
        """
        try:
            # 1. Fetch and validate paper account
            account = await self.get_paper_account(user_id)
            if not account:
                raise AccountNotFoundError("Paper account not found.")
            if account.status != "active":
                raise AccountInactiveError("Paper account is not active.")

            # 2. Validate input parameters
            side = payload.side.upper()
            order_type = payload.order_type.upper()
            quantity = payload.quantity
            requested_price = payload.requested_price

            if side not in ("BUY", "SELL"):
                raise InvalidOrderInputError(f"Invalid order side: {side}")
            if order_type not in ("MARKET", "LIMIT"):
                raise InvalidOrderInputError(f"Unsupported order type: {order_type}")
            if quantity <= 0:
                raise InvalidOrderInputError("Quantity must be greater than zero.")
            if requested_price <= 0:
                raise InvalidOrderInputError("Requested price must be greater than zero.")

            # 3. Fetch and validate asset
            asset_uuid = UUID(payload.asset_id)
            asset = await self.db.get(Asset, asset_uuid)
            if not asset:
                raise AssetNotFoundError("Asset not found.")
            if asset.status.lower() != "active":
                raise AssetInactiveError("Asset is not active.")
            if asset.exchange.lower() != "binance":
                raise InvalidOrderInputError(f"Asset exchange '{asset.exchange}' is not supported.")

            symbol = asset.symbol

            # 4. Fetch price from BinanceService (no fallback)
            try:
                price_val = await self.binance_service.get_current_price(symbol)
                market_price = Decimal(str(price_val))
            except Exception as e:
                raise PriceRetrievalError(f"Failed to fetch market price for {symbol}: {e}")

            # 5. Determine triggering and execution price
            is_triggered = False
            execution_price = None
            slippage_amount = Decimal("0")

            if order_type == "MARKET":
                is_triggered = True
                if side == "BUY":
                    # MARKET BUY executes at market price plus 0.05% slippage
                    slippage_pct = Decimal("0.0005")
                    slippage_amount = market_price * slippage_pct
                    execution_price = market_price + slippage_amount
                else:
                    # MARKET SELL executes at market price minus 0.05% slippage
                    slippage_pct = Decimal("0.0005")
                    slippage_amount = market_price * slippage_pct
                    execution_price = market_price - slippage_amount
            elif order_type == "LIMIT":
                if side == "BUY" and market_price <= requested_price:
                    is_triggered = True
                    execution_price = market_price
                elif side == "SELL" and market_price >= requested_price:
                    is_triggered = True
                    execution_price = market_price

            # Run RiskManagementService validation for BUY orders with stop-loss
            if side == "BUY" and payload.stop_loss is not None:
                from app.services.risk_management_service import RiskManagementService
                risk_service = RiskManagementService(self.db, self.binance_service)
                risk_entry_price = execution_price if execution_price is not None else requested_price
                
                assessment = await risk_service.assess_trade(
                    user_id=user_id,
                    asset_id=asset.id,
                    side=side,
                    quantity=quantity,
                    entry_price=risk_entry_price,
                    stop_loss=payload.stop_loss,
                    take_profit=payload.take_profit,
                )
                if not assessment.approved:
                    raise RiskValidationFailedError(assessment.rejection_reason)


            # Create PaperOrder
            order = PaperOrder(
                paper_account_id=account.id,
                asset_id=asset.id,
                side=side,
                order_type=order_type,
                quantity=quantity,
                requested_price=requested_price,
                stop_loss=payload.stop_loss,
                take_profit=payload.take_profit,
                status="open",
            )
            self.db.add(order)
            await self.db.flush()  # Generate order.id

            if is_triggered:
                # Compute notional value & fee
                notional = quantity * execution_price
                fee = notional * Decimal("0.0010")  # 0.10% fee

                if side == "BUY":
                    total_cost = notional + fee
                    if account.current_cash < total_cost:
                        raise InsufficientBalanceError("Insufficient cash balance for this buy order.")

                    # Deduct cash
                    account.current_cash -= total_cost

                    # Fetch position
                    pos_stmt = select(PaperPosition).where(
                        PaperPosition.paper_account_id == account.id,
                        PaperPosition.asset_id == asset.id
                    )
                    pos_res = await self.db.execute(pos_stmt)
                    position = pos_res.scalar_one_or_none()

                    if not position:
                        position = PaperPosition(
                            paper_account_id=account.id,
                            asset_id=asset.id,
                            quantity=quantity,
                            average_entry_price=execution_price,
                            realized_pnl=Decimal("0"),
                            unrealized_pnl=Decimal("0"),
                        )
                        self.db.add(position)
                    else:
                        old_qty = position.quantity
                        old_avg = position.average_entry_price
                        new_qty = old_qty + quantity
                        new_avg = ((old_qty * old_avg) + (quantity * execution_price)) / new_qty
                        
                        position.quantity = new_qty
                        position.average_entry_price = new_avg

                    realized_pnl = Decimal("0")
                    txn_amount = -total_cost

                else:  # SELL
                    # Fetch position
                    pos_stmt = select(PaperPosition).where(
                        PaperPosition.paper_account_id == account.id,
                        PaperPosition.asset_id == asset.id
                    )
                    pos_res = await self.db.execute(pos_stmt)
                    position = pos_res.scalar_one_or_none()

                    if not position or position.quantity < quantity:
                        raise InsufficientPositionError("Insufficient position quantity for this sell order.")

                    # Net proceeds added to cash
                    net_proceeds = notional - fee
                    account.current_cash += net_proceeds

                    # Realized P&L
                    avg_entry = position.average_entry_price
                    realized_pnl = (execution_price - avg_entry) * quantity - fee

                    position.realized_pnl += realized_pnl
                    position.quantity -= quantity

                    if position.quantity == Decimal("0"):
                        await self.db.delete(position)

                    txn_amount = net_proceeds

                # Create PaperTrade
                trade = PaperTrade(
                    paper_account_id=account.id,
                    order_id=order.id,
                    asset_id=asset.id,
                    side=side,
                    quantity=quantity,
                    execution_price=execution_price,
                    fee=fee,
                    slippage=slippage_amount,
                    realized_pnl=realized_pnl,
                    executed_at=datetime.utcnow(),
                )
                self.db.add(trade)
                await self.db.flush()  # Generate trade.id

                # Create PaperTransaction referencing the executed trade ID
                transaction = PaperTransaction(
                    paper_account_id=account.id,
                    transaction_type="TRADE_BUY" if side == "BUY" else "TRADE_SELL",
                    amount=txn_amount,
                    reference_id=trade.id,
                    reference_type="trade",
                    created_at=datetime.utcnow(),
                )
                self.db.add(transaction)

                # Update order status
                order.status = "filled"
                order.executed_price = execution_price

            # Atomic Commit
            await self.db.commit()
            await self.db.refresh(order)
            return order

        except Exception as e:
            # Atomic Rollback
            await self.db.rollback()
            raise e

    async def reset_account(self, user_id: UUID) -> PaperAccount:
        """Reset the paper trading account: clears all orders, positions, trades, transactions and restores cash."""
        account = await self.get_paper_account(user_id)
        if not account:
            raise AccountNotFoundError("Paper account not found.")

        from sqlalchemy import delete
        try:
            await self.db.execute(delete(PaperOrder).where(PaperOrder.paper_account_id == account.id))
            await self.db.execute(delete(PaperPosition).where(PaperPosition.paper_account_id == account.id))
            await self.db.execute(delete(PaperTrade).where(PaperTrade.paper_account_id == account.id))
            await self.db.execute(delete(PaperTransaction).where(PaperTransaction.paper_account_id == account.id))
            
            account.current_cash = account.initial_balance
            await self.db.commit()
            await self.db.refresh(account)
            return account
        except Exception as e:
            await self.db.rollback()
            raise e
