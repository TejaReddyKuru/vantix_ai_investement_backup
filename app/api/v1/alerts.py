from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select

from app.core.security import get_current_user
from app.models.alert import AlertEvent, AlertRule
from app.models.user import User
from app.schemas.alert import AlertEventOut, AlertRuleCreate, AlertRuleOut, AlertRuleUpdate
from database.session import AsyncSessionLocal

router = APIRouter(prefix="/alerts", tags=["alerts"])


async def _get_alert_rule_for_user(db, rule_id: UUID, user_id: UUID) -> AlertRule | None:
    result = await db.execute(select(AlertRule).where(AlertRule.id == rule_id, AlertRule.user_id == user_id))
    return result.scalar_one_or_none()


@router.get("/rules", response_model=dict, summary="List alert rules")
async def list_alert_rules(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    async with AsyncSessionLocal() as db:
        stmt = select(AlertRule).where(AlertRule.user_id == current_user.id).order_by(AlertRule.created_at.desc())
        total_stmt = select(func.count()).select_from(AlertRule).where(AlertRule.user_id == current_user.id)
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
                "user_id": str(item.user_id),
                "asset_id": str(item.asset_id),
                "alert_type": item.alert_type,
                "condition": item.condition,
                "threshold": item.threshold,
                "enabled": item.enabled,
                "cooldown_minutes": item.cooldown_minutes,
                "created_at": item.created_at,
                "updated_at": item.updated_at,
            } for item in items],
        }


@router.post("/rules", status_code=status.HTTP_201_CREATED, response_model=AlertRuleOut, summary="Create an alert rule")
async def create_alert_rule(payload: AlertRuleCreate, current_user: User = Depends(get_current_user)):
    async with AsyncSessionLocal() as db:
        rule = AlertRule(user_id=current_user.id, **payload.model_dump(exclude_none=True))
        db.add(rule)
        await db.commit()
        await db.refresh(rule)
        return {
            "id": str(rule.id),
            "user_id": str(rule.user_id),
            "asset_id": str(rule.asset_id),
            "alert_type": rule.alert_type,
            "condition": rule.condition,
            "threshold": rule.threshold,
            "enabled": rule.enabled,
            "cooldown_minutes": rule.cooldown_minutes,
            "created_at": rule.created_at,
            "updated_at": rule.updated_at,
        }


@router.get("/rules/{rule_id}", response_model=AlertRuleOut, summary="Get an alert rule")
async def get_alert_rule(rule_id: str, current_user: User = Depends(get_current_user)):
    async with AsyncSessionLocal() as db:
        try:
            rule_uuid = UUID(rule_id)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid alert rule id.")
        rule = await _get_alert_rule_for_user(db, rule_uuid, current_user.id)
        if rule is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert rule not found.")
        return {
            "id": str(rule.id),
            "user_id": str(rule.user_id),
            "asset_id": str(rule.asset_id),
            "alert_type": rule.alert_type,
            "condition": rule.condition,
            "threshold": rule.threshold,
            "enabled": rule.enabled,
            "cooldown_minutes": rule.cooldown_minutes,
            "created_at": rule.created_at,
            "updated_at": rule.updated_at,
        }


@router.patch("/rules/{rule_id}", response_model=AlertRuleOut, summary="Update an alert rule")
async def patch_alert_rule(rule_id: str, payload: AlertRuleUpdate, current_user: User = Depends(get_current_user)):
    async with AsyncSessionLocal() as db:
        try:
            rule_uuid = UUID(rule_id)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid alert rule id.")
        rule = await _get_alert_rule_for_user(db, rule_uuid, current_user.id)
        if rule is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert rule not found.")
        for field, value in payload.model_dump(exclude_none=True).items():
            if hasattr(rule, field):
                setattr(rule, field, value)
        await db.commit()
        await db.refresh(rule)
        return {
            "id": str(rule.id),
            "user_id": str(rule.user_id),
            "asset_id": str(rule.asset_id),
            "alert_type": rule.alert_type,
            "condition": rule.condition,
            "threshold": rule.threshold,
            "enabled": rule.enabled,
            "cooldown_minutes": rule.cooldown_minutes,
            "created_at": rule.created_at,
            "updated_at": rule.updated_at,
        }


@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete an alert rule")
async def delete_alert_rule(rule_id: str, current_user: User = Depends(get_current_user)):
    async with AsyncSessionLocal() as db:
        try:
            rule_uuid = UUID(rule_id)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid alert rule id.")
        rule = await _get_alert_rule_for_user(db, rule_uuid, current_user.id)
        if rule is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert rule not found.")
        await db.delete(rule)
        await db.commit()
        return None


@router.get("/events", response_model=dict, summary="List alert events")
async def list_alert_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    async with AsyncSessionLocal() as db:
        # Scope events through user-owned alert rules.
        stmt = select(AlertEvent).join(AlertRule, AlertRule.id == AlertEvent.alert_rule_id).where(AlertRule.user_id == current_user.id)
        total_stmt = select(func.count()).select_from(AlertEvent).join(AlertRule, AlertRule.id == AlertEvent.alert_rule_id).where(AlertRule.user_id == current_user.id)
        total_result = await db.execute(total_stmt)
        total = total_result.scalar_one() or 0
        stmt = stmt.order_by(AlertEvent.triggered_at.desc()).limit(page_size).offset((page - 1) * page_size)
        result = await db.execute(stmt)
        items = result.scalars().all()
        return {
            "page": page,
            "page_size": page_size,
            "total": total or 0,
            "items": [{
                "id": str(item.id),
                "alert_rule_id": str(item.alert_rule_id),
                "triggered_at": item.triggered_at,
                "value": item.value,
                "status": item.status,
                "notified": item.notified,
            } for item in items],
        }
