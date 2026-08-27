from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import get_current_user
from app.models.user import User
from app.schemas.notification import NotificationListResponse
from app.services.notification_service import (
    get_unread_count,
    list_notifications,
    mark_all_notifications_read,
    mark_notification_read,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=NotificationListResponse, summary="List notifications")
async def list_notifications_route(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    return await list_notifications(user_id=current_user.id, page=page, page_size=page_size)


@router.get("/unread-count", summary="Count unread notifications")
async def unread_count(current_user: User = Depends(get_current_user)):
    unread = await get_unread_count(user_id=current_user.id)
    return {"unread_count": unread}


@router.post("/{notification_id}/read", status_code=status.HTTP_200_OK, summary="Mark a notification as read")
async def mark_notification_read_route(notification_id: str, current_user: User = Depends(get_current_user)):
    try:
        notification_uuid = UUID(notification_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid notification id.")
    read = await mark_notification_read(user_id=current_user.id, notification_id=notification_uuid)
    if not read:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")
    return {"message": "Notification marked as read."}


@router.post("/read-all", status_code=status.HTTP_200_OK, summary="Mark all notifications as read")
async def read_all_notifications(current_user: User = Depends(get_current_user)):
    await mark_all_notifications_read(user_id=current_user.id)
    return {"message": "Notifications marked as read."}
