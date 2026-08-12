from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_user
from app.models.user import User
from app.schemas.risk import ProposedTrade, RiskAssessmentOut
from app.services.risk_management_service import RiskManagementService
from app.services.paper_trading_service import (
    AccountNotFoundError,
    AccountInactiveError,
    AssetNotFoundError,
    AssetInactiveError,
    InvalidOrderInputError,
    PriceRetrievalError,
)
from database.session import AsyncSessionLocal

router = APIRouter(prefix="/risk", tags=["risk"])


@router.post("/assess", response_model=RiskAssessmentOut, summary="Assess a proposed trade against risk management policies")
async def assess_proposed_trade(
    payload: ProposedTrade,
    current_user: User = Depends(get_current_user)
):
    """
    Evaluate trade parameters and stop loss constraints against account equity,
    drawdown limits, and position concentration.
    """
    async with AsyncSessionLocal() as db:
        service = RiskManagementService(db)
        try:
            from uuid import UUID
            assessment = await service.assess_trade(
                user_id=current_user.id,
                asset_id=UUID(payload.asset_id),
                side=payload.side,

                quantity=payload.quantity,
                entry_price=payload.entry_price,
                stop_loss=payload.stop_loss,
                take_profit=payload.take_profit,
            )
            return assessment
        except AccountNotFoundError as exc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
        except AccountInactiveError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
        except AssetNotFoundError as exc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
        except AssetInactiveError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
        except PriceRetrievalError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))
        except InvalidOrderInputError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))
