from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select

from app.core.security import get_current_user
from app.models.paper_trading import PaperAccount, PaperOrder, PaperPosition, PaperTrade, PaperTransaction
from app.models.user import User
from app.schemas.paper_trading import (
    PaperAccountOut,
    PaperOrderCreate,
    PaperOrderOut,
    PaperPositionOut,
    PaperTradeOut,
    PaperTransactionOut,
)
from app.services.paper_trading_service import (
    PaperTradingService,
    PaperTradingError,
    AccountNotFoundError,
    AccountInactiveError,
    AssetNotFoundError,
    AssetInactiveError,
    InsufficientBalanceError,
    InsufficientPositionError,
    InvalidOrderInputError,
    PriceRetrievalError,
)
from database.session import AsyncSessionLocal

router = APIRouter(prefix="/paper-trading", tags=["paper-trading"])


async def _get_account_for_user(db, user_id: UUID) -> PaperAccount | None:
    result = await db.execute(select(PaperAccount).where(PaperAccount.user_id == user_id))
    return result.scalar_one_or_none()


@router.get("/account", response_model=PaperAccountOut, summary="Get the user's paper account")
async def get_paper_account(current_user: User = Depends(get_current_user)):
    async with AsyncSessionLocal() as db:
        account = await _get_account_for_user(db, current_user.id)
        if account is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paper account not found.")
        return {
            "id": str(account.id),
            "user_id": str(account.user_id),
            "name": account.name,
            "initial_balance": account.initial_balance,
            "current_cash": account.current_cash,
            "currency": account.currency,
            "status": account.status,
            "created_at": account.created_at,
            "updated_at": account.updated_at,
        }


@router.post("/orders", status_code=status.HTTP_201_CREATED, response_model=PaperOrderOut, summary="Create a paper order")
async def create_paper_order(payload: PaperOrderCreate, current_user: User = Depends(get_current_user)):
    async with AsyncSessionLocal() as db:
        service = PaperTradingService(db)
        try:
            order = await service.create_order(current_user.id, payload)
        except AccountNotFoundError as exc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
        except AssetNotFoundError as exc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
        except (AccountInactiveError, AssetInactiveError, InsufficientBalanceError, InsufficientPositionError, InvalidOrderInputError) as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
        except PriceRetrievalError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))
        except PaperTradingError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

        return {
            "id": str(order.id),
            "paper_account_id": str(order.paper_account_id),
            "asset_id": str(order.asset_id),
            "side": order.side,
            "order_type": order.order_type,
            "quantity": order.quantity,
            "requested_price": order.requested_price,
            "executed_price": order.executed_price,
            "stop_loss": order.stop_loss,
            "take_profit": order.take_profit,
            "status": order.status,
            "created_at": order.created_at,
            "updated_at": order.updated_at,
        }



@router.get("/orders", response_model=dict, summary="List paper orders")
async def list_paper_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    async with AsyncSessionLocal() as db:
        account = await _get_account_for_user(db, current_user.id)
        if account is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paper account not found.")
        stmt = select(PaperOrder).where(PaperOrder.paper_account_id == account.id).order_by(PaperOrder.created_at.desc())
        total_stmt = select(func.count()).select_from(PaperOrder).where(PaperOrder.paper_account_id == account.id)
        total_result = await db.execute(total_stmt)
        total = total_result.scalar_one() or 0
        stmt = stmt.limit(page_size).offset((page - 1) * page_size)
        result = await db.execute(stmt)
        items = result.scalars().all()
        return {
            "page": page,
            "page_size": page_size,
            "total": total or 0,
            "items": [
                {
                    "id": str(item.id),
                    "paper_account_id": str(item.paper_account_id),
                    "asset_id": str(item.asset_id),
                    "side": item.side,
                    "order_type": item.order_type,
                    "quantity": item.quantity,
                    "requested_price": item.requested_price,
                    "executed_price": item.executed_price,
                    "stop_loss": item.stop_loss,
                    "take_profit": item.take_profit,
                    "status": item.status,
                    "created_at": item.created_at,
                    "updated_at": item.updated_at,
                }
                for item in items
            ],
        }


@router.get("/orders/{order_id}", response_model=PaperOrderOut, summary="Get a paper order")
async def get_paper_order(order_id: str, current_user: User = Depends(get_current_user)):
    async with AsyncSessionLocal() as db:
        try:
            order_uuid = UUID(order_id)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid order id.")
        order = await db.get(PaperOrder, order_uuid)
        if order is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")
        account = await _get_account_for_user(db, current_user.id)
        if account is None or order.paper_account_id != account.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        return {
            "id": str(order.id),
            "paper_account_id": str(order.paper_account_id),
            "asset_id": str(order.asset_id),
            "side": order.side,
            "order_type": order.order_type,
            "quantity": order.quantity,
            "requested_price": order.requested_price,
            "executed_price": order.executed_price,
            "stop_loss": order.stop_loss,
            "take_profit": order.take_profit,
            "status": order.status,
            "created_at": order.created_at,
            "updated_at": order.updated_at,
        }


@router.delete("/orders/{order_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Cancel a paper order")
async def delete_paper_order(order_id: str, current_user: User = Depends(get_current_user)):
    async with AsyncSessionLocal() as db:
        try:
            order_uuid = UUID(order_id)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid order id.")
        order = await db.get(PaperOrder, order_uuid)
        if order is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")
        account = await _get_account_for_user(db, current_user.id)
        if account is None or order.paper_account_id != account.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        order.status = "cancelled"
        await db.commit()
        return None


@router.get("/positions", response_model=dict, summary="List paper positions")
async def get_positions(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    async with AsyncSessionLocal() as db:
        account = await _get_account_for_user(db, current_user.id)
        if account is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paper account not found.")
        stmt = select(PaperPosition).where(PaperPosition.paper_account_id == account.id).order_by(PaperPosition.created_at.desc())
        total_stmt = select(func.count()).select_from(PaperPosition).where(PaperPosition.paper_account_id == account.id)
        total_result = await db.execute(total_stmt)
        total = total_result.scalar_one() or 0
        stmt = stmt.limit(page_size).offset((page - 1) * page_size)
        result = await db.execute(stmt)
        items = result.scalars().all()
        return {
            "page": page,
            "page_size": page_size,
            "total": total or 0,
            "items": [{
                "id": str(item.id),
                "paper_account_id": str(item.paper_account_id),
                "asset_id": str(item.asset_id),
                "quantity": item.quantity,
                "average_entry_price": item.average_entry_price,
                "realized_pnl": item.realized_pnl,
                "unrealized_pnl": item.unrealized_pnl,
                "created_at": item.created_at,
                "updated_at": item.updated_at,
            } for item in items],
        }


@router.get("/trades", response_model=dict, summary="List paper trades")
async def get_trades(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    async with AsyncSessionLocal() as db:
        account = await _get_account_for_user(db, current_user.id)
        if account is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paper account not found.")
        stmt = select(PaperTrade).where(PaperTrade.paper_account_id == account.id).order_by(PaperTrade.executed_at.desc())
        total_stmt = select(func.count()).select_from(PaperTrade).where(PaperTrade.paper_account_id == account.id)
        total_result = await db.execute(total_stmt)
        total = total_result.scalar_one() or 0
        stmt = stmt.limit(page_size).offset((page - 1) * page_size)
        result = await db.execute(stmt)
        items = result.scalars().all()
        return {
            "page": page,
            "page_size": page_size,
            "total": total or 0,
            "items": [{
                "id": str(item.id),
                "paper_account_id": str(item.paper_account_id),
                "order_id": str(item.order_id) if item.order_id else None,
                "asset_id": str(item.asset_id),
                "side": item.side,
                "quantity": item.quantity,
                "execution_price": item.execution_price,
                "fee": item.fee,
                "slippage": item.slippage,
                "realized_pnl": item.realized_pnl,
                "executed_at": item.executed_at,
            } for item in items],
        }


@router.get("/transactions", response_model=dict, summary="List paper transactions")
async def get_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    async with AsyncSessionLocal() as db:
        account = await _get_account_for_user(db, current_user.id)
        if account is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paper account not found.")
        stmt = select(PaperTransaction).where(PaperTransaction.paper_account_id == account.id).order_by(PaperTransaction.created_at.desc())
        total_stmt = select(func.count()).select_from(PaperTransaction).where(PaperTransaction.paper_account_id == account.id)
        total_result = await db.execute(total_stmt)
        total = total_result.scalar_one() or 0
        stmt = stmt.limit(page_size).offset((page - 1) * page_size)
        result = await db.execute(stmt)
        items = result.scalars().all()
        return {
            "page": page,
            "page_size": page_size,
            "total": total or 0,
            "items": [{
                "id": str(item.id),
                "paper_account_id": str(item.paper_account_id),
                "type": item.transaction_type,
                "amount": item.amount,
                "reference_id": str(item.reference_id) if item.reference_id else None,
                "created_at": item.created_at,
            } for item in items],
        }
