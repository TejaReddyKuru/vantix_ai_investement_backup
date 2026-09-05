from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asset import Asset
from app.models.journal import TradeJournalEntry
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

    async def update_account_equity(self, account: PaperAccount, use_live_prices: bool = True) -> None:
        """Calculate and persist current balance and equity for the paper account."""
        # 1. Update balance to current cash
        account.balance = account.current_cash

        # 2. Calculate current value of positions
        pos_stmt = select(PaperPosition).where(PaperPosition.paper_account_id == account.id)
        pos_res = await self.db.execute(pos_stmt)
        positions = pos_res.scalars().all()

        total_position_value = Decimal("0")
        for pos in positions:
            pos_price = pos.current_price or pos.average_entry_price
            if pos.symbol and use_live_prices:
                try:
                    price_val = await self.binance_service.get_current_price(pos.symbol)
                    pos_price = Decimal(str(price_val))
                    pos.current_price = pos_price
                except Exception:
                    pass
            total_position_value += pos.quantity * pos_price
            pos.unrealized_pnl = (pos_price - pos.average_entry_price) * pos.quantity

        account.equity = account.current_cash + total_position_value

    async def get_paper_account(self, user_id: UUID, use_live_prices: bool = True) -> PaperAccount | None:
        """Fetch the paper trading account for a user."""
        stmt = select(PaperAccount).where(PaperAccount.user_id == user_id)
        result = await self.db.execute(stmt)
        account = result.scalar_one_or_none()
        if account:
            await self.update_account_equity(account, use_live_prices=use_live_prices)
        return account

    async def create_order(self, user_id: UUID, payload: PaperOrderCreate) -> PaperOrder:
        """
        Validate, retrieve prices, and execute a paper order atomically.
        """
        try:
            # 1. Fetch and validate paper account without making live Binance requests yet
            account = await self.get_paper_account(user_id, use_live_prices=False)
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
            if requested_price is not None and requested_price <= 0:
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

            # 4. Fetch price from BinanceService (with fallback)
            try:
                price_val = await self.binance_service.get_current_price(symbol)
                market_price = Decimal(str(price_val))
            except Exception as e:
                try:
                    from app.services.coingecko_service import CoinGeckoService
                    cg_service = CoinGeckoService()
                    price_val = await cg_service.get_current_price(symbol)
                    market_price = Decimal(str(price_val))
                except Exception:
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

            risk_entry_price = execution_price if execution_price is not None else requested_price

            # Determine the price to use for validating user's stop-loss input
            # We use requested_price (what they saw on the screen) to avoid rejecting orders 
            # just because the market moved in their favor before execution.
            validation_entry_price = requested_price if requested_price is not None else risk_entry_price

            # Temporary debug logging
            import logging
            log = logging.getLogger(__name__)
            log.info(f"PAPER_TRADE_VALIDATION side={side} requested_price={requested_price} execution_price={execution_price} validation_entry_price={validation_entry_price} stop_loss={payload.stop_loss} take_profit={payload.take_profit}")
            print(f"PAPER_TRADE_VALIDATION side={side} requested_price={requested_price} execution_price={execution_price} validation_entry_price={validation_entry_price} stop_loss={payload.stop_loss} take_profit={payload.take_profit}")

            # General stop-loss validations
            if payload.stop_loss is not None:
                if side == "BUY" and payload.stop_loss >= validation_entry_price:
                    print(f"\n\n🚨 VALIDATION TRIGGERED: BUY STOP LOSS FAILED! 🚨")
                    print(f"stop_loss: {payload.stop_loss} ({type(payload.stop_loss)})")
                    print(f"validation_entry_price: {validation_entry_price} ({type(validation_entry_price)})")
                    print(f"evaluation: {payload.stop_loss} >= {validation_entry_price} is True\n\n")
                    raise InvalidOrderInputError("Stop-loss must be below the entry price.")
                if side == "SELL" and payload.stop_loss <= validation_entry_price:
                    print(f"\n\n🚨 VALIDATION TRIGGERED: SELL STOP LOSS FAILED! 🚨")
                    print(f"stop_loss: {payload.stop_loss} ({type(payload.stop_loss)})")
                    print(f"validation_entry_price: {validation_entry_price} ({type(validation_entry_price)})")
                    print(f"evaluation: {payload.stop_loss} <= {validation_entry_price} is True\n\n")
                    raise InvalidOrderInputError("Stop-loss must be above the entry price.")

            # Run RiskManagementService validation for BUY orders with stop-loss
            if side == "BUY" and payload.stop_loss is not None:
                from app.services.risk_management_service import RiskManagementService
                risk_service = RiskManagementService(self.db, self.binance_service)
                assessment = await risk_service.assess_trade(
                    user_id=user_id,
                    asset_id=asset.id,
                    side=side,
                    quantity=quantity,
                    entry_price=validation_entry_price,
                    stop_loss=payload.stop_loss,
                    take_profit=payload.take_profit,
                )
                if not assessment.approved:
                    raise RiskValidationFailedError(assessment.rejection_reason)

            # Create PaperOrder
            order = PaperOrder(
                user_id=user_id,
                paper_account_id=account.id,
                asset_id=asset.id,
                symbol=symbol,
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

            realized_pnl = Decimal("0")

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
                            user_id=user_id,
                            paper_account_id=account.id,
                            asset_id=asset.id,
                            symbol=symbol,
                            quantity=quantity,
                            average_entry_price=execution_price,
                            current_price=execution_price,
                            realized_pnl=Decimal("0"),
                            unrealized_pnl=Decimal("0"),
                        )
                        self.db.add(position)
                        
                        journal_entry = TradeJournalEntry(
                            user_id=user_id,
                            paper_account_id=account.id,
                            symbol=symbol,
                            side="LONG",
                            status="OPEN",
                            entry_price=execution_price,
                            quantity=quantity,
                            entry_timestamp=datetime.utcnow(),
                            title=f"LONG {symbol}"
                        )
                        self.db.add(journal_entry)
                        await self.db.flush()
                    else:
                        old_qty = position.quantity
                        old_avg = position.average_entry_price
                        new_qty = old_qty + quantity
                        new_avg = ((old_qty * old_avg) + (quantity * execution_price)) / new_qty
                        
                        position.quantity = new_qty
                        position.average_entry_price = new_avg
                        position.current_price = execution_price
                        
                        # Update Journal Entry for add-on
                        journal_stmt = select(TradeJournalEntry).where(
                            TradeJournalEntry.paper_account_id == account.id,
                            TradeJournalEntry.symbol == symbol,
                            TradeJournalEntry.status.in_(["OPEN", "PARTIALLY_CLOSED"])
                        ).order_by(TradeJournalEntry.created_at.desc())
                        journal_res = await self.db.execute(journal_stmt)
                        journal_entry = journal_res.scalar_one_or_none()
                        if journal_entry:
                            old_j_qty = journal_entry.quantity or Decimal("0")
                            old_j_avg = journal_entry.entry_price or execution_price
                            journal_entry.quantity = old_j_qty + quantity
                            if old_j_qty + quantity > 0:
                                journal_entry.entry_price = ((old_j_qty * old_j_avg) + (quantity * execution_price)) / (old_j_qty + quantity)

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
                    position.current_price = execution_price
                    
                    journal_stmt = select(TradeJournalEntry).where(
                        TradeJournalEntry.paper_account_id == account.id,
                        TradeJournalEntry.symbol == symbol,
                        TradeJournalEntry.status.in_(["OPEN", "PARTIALLY_CLOSED"])
                    ).order_by(TradeJournalEntry.created_at.desc())
                    journal_res = await self.db.execute(journal_stmt)
                    journal_entry = journal_res.scalar_one_or_none()
                    
                    if journal_entry:
                        journal_entry.realized_pnl = (journal_entry.realized_pnl or Decimal("0")) + realized_pnl
                        
                        if journal_entry.exit_price is None:
                            journal_entry.exit_price = execution_price
                        else:
                            # approximate average exit price
                            closed_qty = (journal_entry.quantity or Decimal("0")) - position.quantity - quantity
                            if closed_qty < Decimal("0"): closed_qty = Decimal("0")
                            if (closed_qty + quantity) > 0:
                                journal_entry.exit_price = ((closed_qty * journal_entry.exit_price) + (quantity * execution_price)) / (closed_qty + quantity)
                        
                        if journal_entry.entry_price and journal_entry.entry_price > 0:
                            journal_entry.return_percentage = ((journal_entry.exit_price - journal_entry.entry_price) / journal_entry.entry_price) * 100

                    if position.quantity <= Decimal("0"):
                        await self.db.delete(position)
                        if journal_entry:
                            journal_entry.status = "CLOSED"
                            journal_entry.exit_timestamp = datetime.utcnow()
                            if journal_entry.entry_timestamp:
                                duration = (journal_entry.exit_timestamp - journal_entry.entry_timestamp).total_seconds()
                                journal_entry.duration_seconds = int(duration)
                    else:
                        if journal_entry:
                            journal_entry.status = "PARTIALLY_CLOSED"

                    txn_amount = net_proceeds

                # Create PaperTrade
                trade = PaperTrade(
                    user_id=user_id,
                    paper_account_id=account.id,
                    order_id=order.id,
                    asset_id=asset.id,
                    symbol=symbol,
                    side=side,
                    quantity=quantity,
                    execution_price=execution_price,
                    fee=fee,
                    slippage=slippage_amount,
                    realized_pnl=realized_pnl,
                    executed_at=datetime.utcnow(),
                    journal_id=journal_entry.id if 'journal_entry' in locals() and journal_entry else None
                )
                self.db.add(trade)
                await self.db.flush()  # Generate trade.id

                # Create PaperTransaction referencing the executed trade ID
                transaction = PaperTransaction(
                    user_id=user_id,
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
                order.realized_pnl = realized_pnl

            # Recalculate equity & balance (do not fetch live prices for all positions during execution to avoid Binance spam)
            await self.update_account_equity(account, use_live_prices=False)

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
            await self.update_account_equity(account)
            await self.db.commit()
            await self.db.refresh(account)
            return account
        except Exception as e:
            await self.db.rollback()
            raise e
