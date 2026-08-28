from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from typing import Any, List, Dict
from datetime import datetime

from app.core.security import get_current_user
from app.models.asset import Asset
from app.models.user import User
from app.services.binance_service import BinanceService
from database.session import AsyncSessionLocal

router = APIRouter(prefix="/markets", tags=["markets"])


@router.get("", summary="List all active assets / markets")
async def list_active_markets(current_user: User = Depends(get_current_user)):
    """Fetch active assets from database to populate watchlists and tickers."""
    async with AsyncSessionLocal() as db:
        stmt = select(Asset).where(Asset.status == "active").order_by(Asset.symbol)
        res = await db.execute(stmt)
        assets = res.scalars().all()
        return [
            {
                "id": str(asset.id),
                "symbol": asset.symbol,
                "base_asset": asset.base_asset,
                "quote_asset": asset.quote_asset,
                "name": asset.name,
                "exchange": asset.exchange,
                "status": asset.status,
            }
            for asset in assets
        ]


@router.get("/{symbol}", summary="Get asset metadata")
async def get_market_detail(symbol: str, current_user: User = Depends(get_current_user)):
    """Get active asset details by symbol."""
    async with AsyncSessionLocal() as db:
        stmt = select(Asset).where(Asset.symbol == symbol.upper(), Asset.status == "active")
        res = await db.execute(stmt)
        asset = res.scalar_one_or_none()
        if not asset:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Market symbol {symbol} not found or inactive")
        return {
            "id": str(asset.id),
            "symbol": asset.symbol,
            "base_asset": asset.base_asset,
            "quote_asset": asset.quote_asset,
            "name": asset.name,
            "exchange": asset.exchange,
            "status": asset.status,
        }


@router.get("/{symbol}/ticker", summary="Get 24h ticker for a symbol")
async def get_market_ticker(symbol: str, current_user: User = Depends(get_current_user)):
    """Fetch 24h market ticker stats from Binance."""
    binance_service = BinanceService()
    try:
        stats = await binance_service.get_24h_stats(symbol.upper())
        price = await binance_service.get_current_price(symbol.upper())
        return {
            "symbol": symbol.upper(),
            "price": price,
            "change_24h": float(stats.get("priceChangePercent", 0.0)),
            "high_24h": float(stats.get("highPrice", 0.0)),
            "low_24h": float(stats.get("lowPrice", 0.0)),
            "volume_24h": float(stats.get("volume", 0.0)),
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch ticker stats for {symbol}: {exc}",
        )


@router.get("/{symbol}/candles", summary="Get historical candles for a symbol")
async def get_market_candles(
    symbol: str,
    interval: str = Query("1h", description="Candle interval (1m, 5m, 15m, 1h, 4h, 1d)"),
    current_user: User = Depends(get_current_user),
):
    """Fetch historical OHLCV data from Binance."""
    if interval not in ("1m", "5m", "15m", "1h", "4h", "1d"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported interval '{interval}'"
        )
    binance_service = BinanceService()
    try:
        klines = await binance_service.get_ohlcv(symbol.upper(), interval)
        return klines
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch candlestick data for {symbol}: {exc}",
        )


@router.get("/{symbol}/orderbook", summary="Get order book depth for a symbol")
async def get_market_orderbook(
    symbol: str,
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    """Fetch order book depth data from Binance."""
    binance_service = BinanceService()
    try:
        order_book = await binance_service.get_order_book(symbol.upper(), limit)
        return order_book
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch order book for {symbol}: {exc}",
        )
