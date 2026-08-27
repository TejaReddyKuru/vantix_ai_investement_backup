import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy import select, func

from app.core.security import get_current_user, get_user_by_token
from app.models.user import User
from app.models.community_chat import ChatCommunity, ChatCommunityMember, ChatCommunityMessage
from database.session import AsyncSessionLocal
from app.websocket.manager import manager

router = APIRouter(prefix="/communities", tags=["chat"])

@router.get("")
async def list_communities(current_user: User = Depends(get_current_user)):
    """Fetch communities with member count and latest message preview."""
    async with AsyncSessionLocal() as db:
        # Load all communities
        stmt = select(ChatCommunity).order_by(ChatCommunity.name)
        result = await db.execute(stmt)
        communities = result.scalars().all()

        response = []
        for c in communities:
            # Count members
            member_count_stmt = select(func.count(ChatCommunityMember.id)).where(ChatCommunityMember.community_id == c.id)
            member_count_res = await db.execute(member_count_stmt)
            member_count = member_count_res.scalar_one() or 0

            # Get latest message
            latest_msg_stmt = (
                select(ChatCommunityMessage, User)
                .join(User, ChatCommunityMessage.user_id == User.id)
                .where(ChatCommunityMessage.community_id == c.id)
                .order_by(ChatCommunityMessage.created_at.desc())
                .limit(1)
            )
            latest_msg_res = await db.execute(latest_msg_stmt)
            latest_msg_tuple = latest_msg_res.first()

            latest_msg_data = None
            if latest_msg_tuple:
                msg, sender = latest_msg_tuple
                latest_msg_data = {
                    "text": msg.content,
                    "senderName": sender.display_name or sender.email,
                    "time": msg.created_at.strftime("%I:%M %p")
                }

            response.append({
                "id": c.slug,  # Frontend uses slugs as active IDs (e.g. 'general-discussion')
                "name": c.name,
                "slug": c.slug,
                "category": c.category,
                "description": c.description or "",
                "icon": c.icon,
                "avatarBg": c.avatar_bg,
                "iconColor": c.icon_color,
                "memberCount": member_count + 120,  # add base online offset for display
                "onlineCount": max(12, (member_count + 120) // 5),
                "unreadCount": 0,
                "latestMessage": latest_msg_data or {
                    "text": "No messages yet.",
                    "senderName": "System",
                    "time": "Just now"
                },
                "rules": [
                    {"id": 1, "title": "Respect and Civility", "description": "Maintain a respectful, professional tone in all discussions."},
                    {"id": 2, "title": "No Financial Advice", "description": "All commentary is for educational and sharing purposes only."}
                ],
                "moderators": ["Vish Capitals Team"]
            })

@router.post("")
async def create_community(
    payload: dict,
    current_user: User = Depends(get_current_user)
):
    """Create a new community channel."""
    name = payload.get("name")
    category = payload.get("category", "General")
    description = payload.get("description", "")
    icon = payload.get("icon", "MessageSquare")

    if not name:
        raise HTTPException(status_code=400, detail="Name is required")

    # Generate slug from name
    slug = name.lower().replace(" ", "-").replace("/", "-")

    async with AsyncSessionLocal() as db:
        # Check if slug exists
        exist_stmt = select(ChatCommunity).where(ChatCommunity.slug == slug)
        exist_res = await db.execute(exist_stmt)
        if exist_res.scalar_one_or_none():
            # Add a random suffix to slug to make it unique
            slug = f"{slug}-{uuid.uuid4().hex[:6]}"

        community = ChatCommunity(
            id=uuid.uuid4(),
            name=name,
            slug=slug,
            category=category,
            description=description,
            icon=icon,
            created_by=current_user.id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(community)
        
        # Add creator as Admin member
        member = ChatCommunityMember(
            id=uuid.uuid4(),
            community_id=community.id,
            user_id=current_user.id,
            role="Admin",
            joined_at=datetime.utcnow()
        )
        db.add(member)
        
        await db.commit()
        return {
            "id": community.slug,
            "name": community.name,
            "slug": community.slug,
            "category": community.category,
            "description": community.description,
            "icon": community.icon,
            "avatarBg": "bg-[#0F2D1F]",
            "iconColor": "text-white",
            "memberCount": 1,
            "onlineCount": 1,
            "unreadCount": 0,
            "latestMessage": {
                "text": "Channel created.",
                "senderName": "System",
                "time": "Just now"
            },
            "rules": [
                {"id": 1, "title": "Respect and Civility", "description": "Maintain a respectful, professional tone in all discussions."}
            ],
            "moderators": [current_user.display_name or current_user.email]
        }


@router.get("/{community_slug}/messages")
async def get_messages(community_slug: str, current_user: User = Depends(get_current_user)):
    """Fetch message history for a community channel."""
    async with AsyncSessionLocal() as db:
        # Resolve community slug to id
        comm_stmt = select(ChatCommunity).where(ChatCommunity.slug == community_slug)
        comm_res = await db.execute(comm_stmt)
        community = comm_res.scalar_one_or_none()
        if not community:
            raise HTTPException(status_code=404, detail="Community not found")

        # Load latest messages (e.g. 50)
        stmt = (
            select(ChatCommunityMessage, User)
            .join(User, ChatCommunityMessage.user_id == User.id)
            .where(ChatCommunityMessage.community_id == community.id)
            .order_by(ChatCommunityMessage.created_at.asc())
            .limit(50)
        )
        res = await db.execute(stmt)
        rows = res.all()

        messages = []
        for msg, sender in rows:
            time_str = msg.created_at.strftime("%I:%M %p")
            messages.append({
                "id": str(msg.id),
                "communityId": community.slug,
                "senderId": str(sender.id),
                "senderName": sender.display_name or sender.email,
                "senderAvatar": ((sender.display_name or sender.email)[:2]).upper(),
                "senderRole": "Admin" if sender.is_staff else "Member",
                "content": msg.content,
                "timestamp": time_str,
                "date": msg.created_at.strftime("%B %d, %Y"),
                "isCurrentUser": sender.id == current_user.id,
                "reactions": [],
                "replyTo": {
                    "senderName": msg.reply_to_name,
                    "content": msg.reply_to_content
                } if msg.reply_to_name else None
            })
        return messages


@router.post("/{community_slug}/messages")
async def post_message(
    community_slug: str,
    payload: dict,
    current_user: User = Depends(get_current_user)
):
    """Post a new message and broadcast it via WebSocket."""
    content = payload.get("content")
    if not content:
        raise HTTPException(status_code=400, detail="Content is required")

    async with AsyncSessionLocal() as db:
        # Resolve community
        comm_stmt = select(ChatCommunity).where(ChatCommunity.slug == community_slug)
        comm_res = await db.execute(comm_stmt)
        community = comm_res.scalar_one_or_none()
        if not community:
            raise HTTPException(status_code=404, detail="Community not found")

        # Create message
        msg = ChatCommunityMessage(
            id=uuid.uuid4(),
            community_id=community.id,
            user_id=current_user.id,
            content=content,
            reply_to_name=payload.get("reply_to_name"),
            reply_to_content=payload.get("reply_to_content"),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(msg)
        await db.commit()

        # Format message payload for frontend client
        time_str = msg.created_at.strftime("%I:%M %p")
        formatted_msg = {
            "id": str(msg.id),
            "communityId": community_slug,
            "senderId": str(current_user.id),
            "senderName": current_user.display_name or current_user.email,
            "senderAvatar": ((current_user.display_name or current_user.email)[:2]).upper(),
            "senderRole": "Admin" if current_user.is_staff else "Member",
            "content": msg.content,
            "timestamp": time_str,
            "date": msg.created_at.strftime("%B %d, %Y"),
            "isCurrentUser": False,  # clients determine this dynamically on receipt
            "reactions": [],
            "replyTo": {
                "senderName": msg.reply_to_name,
                "content": msg.reply_to_content
            } if msg.reply_to_name else None
        }

        # Broadcast via WebSocket manager using slug as the channel identifier
        await manager.broadcast(
            community_slug,
            {
                "type": "new_message",
                "message": formatted_msg
            }
        )

        return {"status": "ok", "message": formatted_msg}


@router.websocket("/{community_slug}/ws")
async def websocket_endpoint(websocket: WebSocket, community_slug: str, token: Optional[str] = Query(None)):
    """Authenticated WebSocket endpoint for real-time channel updates."""
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Authenticate user from JWT token
    try:
        user = await get_user_by_token(token)
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    if not user or not user.is_active:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Accept connection and register user
    await manager.connect(community_slug, websocket)
    try:
        # Keep connection open and handle incoming socket ping-pongs/messages
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(community_slug, websocket)
    except Exception:
        manager.disconnect(community_slug, websocket)
