from fastapi import APIRouter, HTTPException, Path

from app.agents.market_analysis.orchestrator import MarketAnalysisOrchestrator

router = APIRouter(prefix="/market", tags=["market"])
orchestrator = MarketAnalysisOrchestrator()


@router.get("/analyze/{symbol}")
async def analyze_symbol(
    symbol: str = Path(
        ...,
        min_length=3,
        max_length=12,
        pattern="^[A-Za-z0-9]+$",
        description="Ticker symbol to analyze.",
    )
) -> dict[str, object]:
    try:
        return await orchestrator.analyze(symbol.upper())
    except Exception:
        raise HTTPException(status_code=502, detail="Market analysis failed")


@router.get("/summary/{symbol}")
async def summarize_symbol(
    symbol: str = Path(
        ...,
        min_length=3,
        max_length=12,
        pattern="^[A-Za-z0-9]+$",
        description="Ticker symbol to summarize.",
    )
) -> dict[str, object]:
    try:
        analysis = await orchestrator.analyze(symbol.upper())
        return {"symbol": symbol.upper(), "summary": analysis.get("summary", "")}
    except Exception:
        raise HTTPException(status_code=502, detail="Market summary generation failed")


@router.get("/score/{symbol}")
async def score_symbol(
    symbol: str = Path(
        ...,
        min_length=3,
        max_length=12,
        pattern="^[A-Za-z0-9]+$",
        description="Ticker symbol to score.",
    )
) -> dict[str, object]:
    try:
        analysis = await orchestrator.analyze(symbol.upper())
        return {"symbol": symbol.upper(), "market_score": analysis.get("market_score"), "confidence": analysis.get("confidence")}
    except Exception:
        raise HTTPException(status_code=502, detail="Market scoring failed")
