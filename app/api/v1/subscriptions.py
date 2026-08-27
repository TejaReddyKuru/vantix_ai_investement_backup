from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select

from app.core.security import get_current_user
from app.models.subscription import PlanEntitlement, Subscription, SubscriptionPlan
from app.models.user import User
from app.schemas.subscription import PlanEntitlementOut, SubscriptionOut, SubscriptionPlanOut
from database.session import AsyncSessionLocal

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.get("/plans", response_model=dict, summary="List subscription plans")
async def list_plans(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    async with AsyncSessionLocal() as db:
        stmt = select(SubscriptionPlan).order_by(SubscriptionPlan.created_at.desc())
        total_stmt = select(func.count()).select_from(SubscriptionPlan)
        total_result = await db.execute(total_stmt)
        total = total_result.scalar_one() or 0
        stmt = stmt.limit(page_size).offset((page - 1) * page_size)
        result = await db.execute(stmt)
        plans = result.scalars().all()
        return {
            "page": page,
            "page_size": page_size,
            "total": total or 0,
            "items": [{
                "id": str(item.id),
                "name": item.name,
                "code": item.code,
                "description": item.description,
                "price_monthly": item.price_monthly,
                "price_yearly": item.price_yearly,
                "billing_interval": item.billing_interval,
                "active": item.active,
                "created_at": item.created_at,
                "updated_at": item.updated_at,
            } for item in plans],
        }


@router.get("/me", response_model=dict, summary="Get current user subscription")
async def get_my_subscription(current_user: User = Depends(get_current_user)):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Subscription).where(Subscription.user_id == current_user.id).order_by(Subscription.created_at.desc()).limit(1))
        item = result.scalar_one_or_none()
        if item is None:
            return {"items": []}
        plan_result = await db.get(SubscriptionPlan, item.plan_id)
        plan = plan_result
        return {
            "id": str(item.id),
            "user_id": str(item.user_id),
            "plan_id": str(item.plan_id),
            "plan": {
                "id": str(plan.id),
                "name": plan.name,
                "code": plan.code,
                "description": plan.description,
                "price_monthly": plan.price_monthly,
                "price_yearly": plan.price_yearly,
                "billing_interval": plan.billing_interval,
                "active": plan.active,
                "created_at": plan.created_at,
                "updated_at": plan.updated_at,
            } if plan else None,
            "status": item.status,
            "started_at": item.started_at,
            "ended_at": item.ended_at,
            "created_at": item.created_at,
            "updated_at": item.updated_at,
        }
