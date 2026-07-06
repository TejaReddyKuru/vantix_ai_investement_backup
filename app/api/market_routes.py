from fastapi import APIRouter, HTTPException

from app.agents.market_analysis.orchestrator import MarketAnalysisOrchestrator

router = APIRouter(prefix="/market", tags=["market"])
orchestrator = MarketAnalysisOrchestrator()


@router.get("/analyze/{symbol}")
async def analyze_symbol(symbol: str) -> dict[str, object]:
    try:
        return await orchestrator.analyze(symbol.upper())
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/summary/{symbol}")
async def summarize_symbol(symbol: str) -> dict[str, object]:
    try:
        analysis = await orchestrator.analyze(symbol.upper())
        return {"symbol": symbol.upper(), "summary": analysis.get("summary", "")}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/score/{symbol}")
async def score_symbol(symbol: str) -> dict[str, object]:
    try:
        analysis = await orchestrator.analyze(symbol.upper())
        return {"symbol": symbol.upper(), "market_score": analysis.get("market_score"), "confidence": analysis.get("confidence")}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
