from pathlib import Path
from dataclasses import dataclass
from dotenv import load_dotenv
import os

load_dotenv(Path(".env"))


@dataclass(slots=True)
class Settings:
    app_name: str = os.getenv("APP_NAME", "Vantix AI Trading")
    environment: str = os.getenv("ENV", "development")
    binance_api_base_url: str = os.getenv("BINANCE_API_BASE_URL", "https://api.binance.com")
    binance_timeout: float = float(os.getenv("BINANCE_TIMEOUT", "10"))
    binance_rate_limit_delay: float = float(os.getenv("BINANCE_RATE_LIMIT_DELAY", "0.2"))
    llm_api_key: str | None = os.getenv("LLM_API_KEY")
    llm_base_url: str | None = os.getenv("LLM_BASE_URL")
    trend_weight: float = float(os.getenv("TREND_WEIGHT", "0.25"))
    volume_weight: float = float(os.getenv("VOLUME_WEIGHT", "0.20"))
    structure_weight: float = float(os.getenv("STRUCTURE_WEIGHT", "0.20"))
    liquidity_weight: float = float(os.getenv("LIQUIDITY_WEIGHT", "0.15"))
    volatility_weight: float = float(os.getenv("VOLATILITY_WEIGHT", "0.10"))
    dominance_weight: float = float(os.getenv("DOMINANCE_WEIGHT", "0.10"))


settings = Settings()
