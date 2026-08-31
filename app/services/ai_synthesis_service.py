import json
from datetime import datetime, timezone
from typing import Any, Dict

import httpx

from app.core.config import settings
from app.core.logger import get_logger
from app.schemas.ahna import AHNAResponseOut, AgentStatus, TradeAgentEntry

logger = get_logger(__name__)

class AISynthesisService:
    def __init__(self):
        self.api_key = settings.openai_api_key.get_secret_value() if settings.openai_api_key else None
        self.base_url = settings.llm_base_url or "https://api.openai.com/v1"
        self.model = getattr(settings, 'llm_model', "qwen/qwen3.8-27b")

    def _build_prompt(self, user_question: str, data: Dict[str, Any]) -> str:
        prompt = f"""
You are AHNA, a senior multi-agent crypto intelligence system.
Analyze the following compiled data from our internal agents and answer the user's question.

User Question: {user_question if user_question else "Analyze the current state and provide a trading decision."}

Market Data:
{json.dumps(data.get("market", {}), indent=2)}

News Data:
{json.dumps(data.get("news", {}), indent=2)}

Sentiment Data:
{json.dumps(data.get("sentiment", {}), indent=2)}

Features:
{json.dumps(data.get("features", {}), indent=2)}

Risk Data:
{json.dumps(data.get("risk", {}), indent=2)}

Trade Strategy:
{json.dumps(data.get("trade", {}), indent=2)}

Instructions:
1. Synthesize this data into a final decision. Must be strictly one of: BUY, SELL, HOLD, WAIT.
2. Provide a market_view (BULLISH, BEARISH, NEUTRAL).
3. Provide a clear summary and reasoning.
4. Extract market_state directly from Market Data. If data is missing/null, leave it null. Do not convert missing data to 0.
5. Create a clear `instruction` for the user and `watch_conditions` (array of strings).
6. Provide `trade_plan` (entry_min, entry_max, stop_loss, take_profit, risk_reward) if applicable. For WAIT/HOLD, these should normally be null. Never invent prices.
7. Provide `ui_effect` (mode, highlight, animate_chart, show_entry_zone). highlight must be one of WAIT, BUY, SELL, HOLD, RISK, UNAVAILABLE.
8. Output MUST be strictly valid JSON matching the exact schema requested. Do not include markdown code blocks around the JSON.

Expected JSON Schema:
{{
    "decision": "WAIT",
    "confidence": 85.0,
    "market_view": "NEUTRAL",
    "risk_level": "MEDIUM",
    "summary": "Short explanation...",
    "reasoning": ["point 1", "point 2"],
    "entry": {{"min": 100, "max": 110}},
    "stop_loss": 90,
    "take_profit": [120, 130],
    "warnings": [],
    "market_regime": "CHOPPY",
    "market_state": {{
        "price": 100.5,
        "price_change_24h": 0.5,
        "volume_24h": null,
        "rsi": 55,
        "macd": null,
        "ema20": null,
        "ema50": null,
        "market_regime": "CHOPPY",
        "volatility": "LOW",
        "liquidity": "LOW"
    }},
    "instruction": {{
        "title": "No Trade Detected",
        "message": "Wait for volume and momentum confirmation before entering.",
        "action": "WAIT",
        "watch_conditions": ["Volume increases", "Clear trend appears"]
    }},
    "trade_plan": {{
        "entry_min": null,
        "entry_max": null,
        "stop_loss": null,
        "take_profit": null,
        "risk_reward": null
    }},
    "ui_effect": {{
        "mode": "HOLOGRAM",
        "highlight": "WAIT",
        "animate_chart": true,
        "show_entry_zone": false
    }}
}}
"""
        return prompt

    async def synthesize(self, symbol: str, user_question: str, data: Dict[str, Any], status: AgentStatus) -> AHNAResponseOut:
        if not self.api_key:
            logger.warning("No OpenAI API key provided. Returning fallback synthesis.")
            return self._fallback_synthesis(symbol, data, status)

        import copy
        llm_data = copy.deepcopy(data)
        if "market" in llm_data:
            if "candles" in llm_data["market"]:
                # Keep only last 5 candles
                for key, val in llm_data["market"]["candles"].items():
                    if isinstance(val, list):
                        llm_data["market"]["candles"][key] = val[-5:]
            if "order_book" in llm_data["market"]:
                # Keep only top 5 bids and asks
                ob = llm_data["market"]["order_book"]
                if "bids" in ob and isinstance(ob["bids"], list):
                    ob["bids"] = ob["bids"][:5]
                if "asks" in ob and isinstance(ob["asks"], list):
                    ob["asks"] = ob["asks"][:5]
                    
        prompt = self._build_prompt(user_question, llm_data)

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You are a helpful AI assistant that outputs strictly raw JSON. Do not wrap in markdown."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(f"{self.base_url}/chat/completions", json=payload, headers=headers)
                response.raise_for_status()
                result = response.json()
                
                content = result["choices"][0]["message"]["content"]
                parsed = json.loads(content)
                
                # Parse entry
                entry_data = parsed.get("entry")
                entry = TradeAgentEntry(min=entry_data["min"], max=entry_data["max"]) if entry_data else None

                decision = str(parsed.get("decision", "WAIT")).upper()
                if decision not in ["BUY", "SELL", "HOLD", "WAIT"]:
                    decision = "WAIT"

                try:
                    raw_conf = parsed.get("confidence", 50.0)
                    if isinstance(raw_conf, str) and "%" in raw_conf:
                        raw_conf = raw_conf.replace("%", "")
                    confidence = float(raw_conf)
                    if confidence > 100:
                        confidence = 100.0
                    elif confidence < 0:
                        confidence = 0.0
                except (ValueError, TypeError):
                    confidence = 50.0

                from app.schemas.ahna import AHNAMarketState, AHNAInstruction, AHNATradePlan, AHNAUIEffect
                
                market_state_dict = parsed.get("market_state")
                market_state = AHNAMarketState(**market_state_dict) if market_state_dict else None
                
                instruction_dict = parsed.get("instruction")
                instruction = AHNAInstruction(**instruction_dict) if instruction_dict else None

                trade_plan_dict = parsed.get("trade_plan")
                trade_plan = AHNATradePlan(**trade_plan_dict) if trade_plan_dict else None

                ui_effect_dict = parsed.get("ui_effect")
                ui_effect = AHNAUIEffect(**ui_effect_dict) if ui_effect_dict else None

                watch_conditions = parsed.get("watch_conditions")
                if not watch_conditions and instruction_dict:
                    watch_conditions = instruction_dict.get("watch_conditions", [])

                return AHNAResponseOut(
                    symbol=symbol,
                    decision=decision,
                    confidence=confidence,
                    market_view=parsed.get("market_view", "NEUTRAL"),
                    risk_level=parsed.get("risk_level", "MEDIUM"),
                    summary=parsed.get("summary", "Analysis complete."),
                    reasoning=parsed.get("reasoning", []),
                    entry=entry,
                    stop_loss=parsed.get("stop_loss"),
                    take_profit=parsed.get("take_profit"),
                    warnings=parsed.get("warnings", []),
                    agent_status=status,
                    created_at=datetime.now(timezone.utc),
                    market_regime=parsed.get("market_regime"),
                    market_state=market_state,
                    instruction=instruction,
                    watch_conditions=watch_conditions,
                    trade_plan=trade_plan,
                    ui_effect=ui_effect
                )

            except Exception as exc:
                logger.error(f"LLM Synthesis failed: {exc}")
                return self._fallback_synthesis(symbol, data, status)

    def _fallback_synthesis(self, symbol: str, data: Dict[str, Any], status: AgentStatus) -> AHNAResponseOut:
        from app.schemas.ahna import AHNAMarketState, AHNAInstruction, AHNATradePlan, AHNAUIEffect
        trade = data.get("trade", {})
        risk = data.get("risk", {})
        
        entry_data = trade.get("entry", {})
        entry = TradeAgentEntry(min=entry_data.get("min", 0), max=entry_data.get("max", 0)) if entry_data else None

        instruction = AHNAInstruction(
            title="Analysis Unavailable",
            message="There is not enough reliable data to generate a trade signal.",
            action="WAIT",
            watch_conditions=[
                "Wait for reliable market data",
                "Wait for sufficient liquidity",
                "Re-run analysis when data becomes available"
            ]
        )
        
        trade_plan = AHNATradePlan(
            entry_min=None,
            entry_max=None,
            stop_loss=None,
            take_profit=None,
            risk_reward=None
        )
        
        ui_effect = AHNAUIEffect(
            mode="HOLOGRAM",
            highlight="UNAVAILABLE",
            animate_chart=False,
            show_entry_zone=False
        )

        return AHNAResponseOut(
            symbol=symbol,
            decision="WAIT",
            confidence=0.0,
            market_view="NEUTRAL",
            risk_level=risk.get("risk_level", "MEDIUM"),
            summary="Fallback AI synthesis due to API unavailability.",
            reasoning=["LLM API error, relying on deterministic trade agent."],
            entry=entry,
            stop_loss=trade.get("stop_loss"),
            take_profit=trade.get("take_profit"),
            warnings=["AI Synthesis offline."],
            agent_status=status,
            created_at=datetime.now(timezone.utc),
            market_regime="UNKNOWN",
            market_state=None,
            instruction=instruction,
            watch_conditions=instruction.watch_conditions,
            trade_plan=trade_plan,
            ui_effect=ui_effect
        )
