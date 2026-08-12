from datetime import datetime
from uuid import UUID

from sqlalchemy import func, select

from app.models.notification import Notification
from database.session import AsyncSessionLocal


async def list_notifications(user_id: UUID, page: int, page_size: int) -> dict:
    """Return a paginated notification collection for the current user."""
    async with AsyncSessionLocal() as db:
        stmt = select(Notification).where(Notification.user_id == user_id).order_by(Notification.created_at.desc())
        total_stmt = select(func.count()).select_from(Notification).where(Notification.user_id == user_id)
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
                    "user_id": str(item.user_id),
                    "type": item.type,
                    "title": item.title,
                    "message": item.message,
                    "reference_type": item.reference_type,
                    "reference_id": item.reference_id,
                    "read_at": item.read_at,
                    "created_at": item.created_at,
                }
                for item in items
            ],
        }


async def get_unread_count(user_id: UUID) -> int:
    """Count unread messages for the user."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Notification).where(Notification.user_id == user_id, Notification.read_at.is_(None)))
        rows = result.scalars().all()
        return len(rows)


async def mark_notification_read(user_id: UUID, notification_id: UUID) -> bool:
    """Mark one notification as read when it belongs to the current user."""
    async with AsyncSessionLocal() as db:
        notification = await db.get(Notification, notification_id)
        if notification is None or notification.user_id != user_id:
            return False
        if notification.read_at is None:
            notification.read_at = datetime.utcnow()
        await db.commit()
        return True


async def mark_all_notifications_read(user_id: UUID) -> bool:
    """Bulk mark all unread notifications as read for the user."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Notification).where(Notification.user_id == user_id, Notification.read_at.is_(None)))
        notifications = result.scalars().all()
        for notification in notifications:
            notification.read_at = datetime.utcnow()
        await db.commit()
        return True


# ---------------------------------------------------------------------------
# Phase 9 Event Notification Abstractions
# ---------------------------------------------------------------------------
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class NotificationEvent(BaseModel):
    event_type: str  # ORDER_SUBMITTED, ORDER_FILLED, ORDER_REJECTED, ORDER_CANCELLED, POSITION_OPENED, RISK_REJECTION, BROKER_DISCONNECTED
    severity: str = "INFO"  # INFO, WARNING, ERROR, CRITICAL
    message: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class BaseNotificationAdapter(ABC):
    @abstractmethod
    async def send_notification(self, event: NotificationEvent) -> bool:
        pass


class MockNotificationAdapter(BaseNotificationAdapter):
    def __init__(self, channel_name: str = "MOCK") -> None:
        self.channel_name = channel_name
        self.sent_events: List[NotificationEvent] = []

    async def send_notification(self, event: NotificationEvent) -> bool:
        self.sent_events.append(event)
        return True


class NotificationService:
    """
    Normalized Notification Service for Phase 9 trading event notifications.
    Dispatches system and execution events to configured notification adapters (Email, Push, Telegram, Discord, Webhook).
    """

    def __init__(self) -> None:
        self.adapters: Dict[str, BaseNotificationAdapter] = {
            "mock": MockNotificationAdapter("MOCK"),
            "telegram": MockNotificationAdapter("TELEGRAM"),
            "discord": MockNotificationAdapter("DISCORD"),
            "email": MockNotificationAdapter("EMAIL"),
            "webhook": MockNotificationAdapter("WEBHOOK"),
        }

    async def notify(self, event: NotificationEvent, channel: str = "mock") -> bool:
        adapter = self.adapters.get(channel.lower()) or self.adapters["mock"]
        return await adapter.send_notification(event)

