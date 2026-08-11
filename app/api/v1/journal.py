from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import get_current_user
from app.models.user import User
from app.schemas.journal import JournalEntryCreate, JournalEntryOut, JournalEntryUpdate
from app.services.journal_service import (
    create_entry,
    delete_entry,
    get_entry,
    list_entries,
    update_entry,
)

router = APIRouter(prefix="/journal", tags=["journal"])


@router.get("", response_model=dict, summary="List journal entries")
async def list_journal_entries_route(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    return await list_entries(user_id=current_user.id, page=page, page_size=page_size)


@router.post("", status_code=status.HTTP_201_CREATED, response_model=JournalEntryOut, summary="Create a journal entry")
async def create_journal_entry_route(payload: JournalEntryCreate, current_user: User = Depends(get_current_user)):
    return await create_entry(user_id=current_user.id, payload=payload)


@router.get("/{entry_id}", response_model=JournalEntryOut, summary="Get a journal entry")
async def get_journal_entry_route(entry_id: str, current_user: User = Depends(get_current_user)):
    try:
        entry_uuid = UUID(entry_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid journal entry id.")
    entry = await get_entry(user_id=current_user.id, entry_id=entry_uuid)
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal entry not found.")
    return entry


@router.patch("/{entry_id}", response_model=JournalEntryOut, summary="Update a journal entry")
async def patch_journal_entry_route(entry_id: str, payload: JournalEntryUpdate, current_user: User = Depends(get_current_user)):
    try:
        entry_uuid = UUID(entry_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid journal entry id.")
    entry = await update_entry(user_id=current_user.id, entry_id=entry_uuid, payload=payload)
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal entry not found.")
    return entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a journal entry")
async def delete_journal_entry_route(entry_id: str, current_user: User = Depends(get_current_user)):
    try:
        entry_uuid = UUID(entry_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid journal entry id.")
    deleted = await delete_entry(user_id=current_user.id, entry_id=entry_uuid)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal entry not found.")
    return None
