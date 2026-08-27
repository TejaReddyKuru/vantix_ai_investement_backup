from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import get_current_user
from app.models.user import User
from app.schemas.asset import AssetListResponse, AssetOut
from app.services.asset_service import get_asset, list_assets, search_assets

router = APIRouter(prefix="/assets", tags=["assets"])


@router.get("", response_model=AssetListResponse, summary="List assets")
async def list_assets_route(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    q: str | None = Query(default=None, max_length=50),
    status: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
):
    """Read-only asset discovery listing."""
    return await list_assets(page=page, page_size=page_size, q=q, status=status)


@router.get("/search", response_model=AssetListResponse, summary="Search assets")
async def search_assets_route(
    q: str = Query(..., min_length=1, max_length=50),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    """Search assets by symbol or name."""
    return await search_assets(q=q, page=page, page_size=page_size)


@router.get("/{asset_id}", response_model=AssetOut, summary="Get an asset")
async def get_asset_route(asset_id: str, current_user: User = Depends(get_current_user)):
    """Fetch an asset by UUID."""
    try:
        asset_uuid = UUID(asset_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid asset id.")

    asset = await get_asset(asset_uuid)
    if asset is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found.")
    return asset
