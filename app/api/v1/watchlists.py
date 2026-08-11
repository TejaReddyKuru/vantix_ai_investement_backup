from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import get_current_user
from app.models.user import User
from app.schemas.watchlist import WatchlistCreate, WatchlistItemCreate, WatchlistItemOut, WatchlistOut, WatchlistUpdate
from app.services.watchlist_service import (
    add_watchlist_item,
    create_watchlist,
    delete_watchlist,
    get_watchlist,
    list_watchlists,
    remove_watchlist_item,
    update_watchlist,
)

router = APIRouter(prefix="/watchlists", tags=["watchlists"])


@router.get("", response_model=dict, summary="List my watchlists")
async def list_watchlists_route(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    return await list_watchlists(user_id=current_user.id, page=page, page_size=page_size)


@router.post("", status_code=status.HTTP_201_CREATED, response_model=WatchlistOut, summary="Create a watchlist")
async def create_watchlist_route(payload: WatchlistCreate, current_user: User = Depends(get_current_user)):
    return await create_watchlist(user_id=current_user.id, payload=payload)


@router.get("/{watchlist_id}", response_model=WatchlistOut, summary="Get a watchlist")
async def get_watchlist_route(watchlist_id: str, current_user: User = Depends(get_current_user)):
    try:
        uuid_value = UUID(watchlist_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid watchlist id.")
    result = await get_watchlist(user_id=current_user.id, watchlist_id=uuid_value)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Watchlist not found.")
    return result


@router.patch("/{watchlist_id}", response_model=WatchlistOut, summary="Update a watchlist")
async def patch_watchlist_route(watchlist_id: str, payload: WatchlistUpdate, current_user: User = Depends(get_current_user)):
    try:
        uuid_value = UUID(watchlist_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid watchlist id.")
    result = await update_watchlist(user_id=current_user.id, watchlist_id=uuid_value, payload=payload)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Watchlist not found.")
    return result


@router.delete("/{watchlist_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a watchlist")
async def delete_watchlist_route(watchlist_id: str, current_user: User = Depends(get_current_user)):
    try:
        uuid_value = UUID(watchlist_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid watchlist id.")
    deleted = await delete_watchlist(user_id=current_user.id, watchlist_id=uuid_value)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Watchlist not found.")
    return None


@router.post("/{watchlist_id}/items", status_code=status.HTTP_201_CREATED, response_model=WatchlistItemOut, summary="Add an asset to a watchlist")
async def add_watchlist_item_route(watchlist_id: str, payload: WatchlistItemCreate, current_user: User = Depends(get_current_user)):
    try:
        watchlist_uuid = UUID(watchlist_id)
        asset_uuid = UUID(payload.asset_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid watchlist or asset id.")
    try:
        item = await add_watchlist_item(user_id=current_user.id, watchlist_id=watchlist_uuid, payload=payload)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Asset is already in the watchlist.")
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Watchlist not found.")
    return item


@router.delete("/{watchlist_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Remove an item from a watchlist")
async def delete_watchlist_item_route(watchlist_id: str, item_id: str, current_user: User = Depends(get_current_user)):
    try:
        watchlist_uuid = UUID(watchlist_id)
        item_uuid = UUID(item_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid id.")
    removed = await remove_watchlist_item(user_id=current_user.id, watchlist_id=watchlist_uuid, item_id=item_uuid)
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Watchlist item not found.")
    return None
