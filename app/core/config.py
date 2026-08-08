import os
from typing import List, Optional

from dotenv import load_dotenv
from pydantic import BaseModel, ConfigDict, Field, SecretStr, ValidationError, field_validator, model_validator

load_dotenv('.env')


class Settings(BaseModel):
    model_config = ConfigDict(extra='ignore')

    app_name: str = Field(default='Vish Capitals / Friday')
    environment: str = Field(default='development')

    binance_api_base_url: str = Field(default='https://api.binance.com')
    binance_timeout: float = Field(default=10.0)
    binance_rate_limit_delay: float = Field(default=0.2)
    binance_api_key: Optional[SecretStr] = None
    binance_api_secret: Optional[SecretStr] = None

    llm_api_key: Optional[SecretStr] = None
    llm_base_url: Optional[str] = None
    openai_api_key: Optional[SecretStr] = None

    database_url: Optional[str] = None
    redis_url: Optional[str] = None
    jwt_secret: Optional[SecretStr] = None
    encryption_key: Optional[SecretStr] = None

    cors_allowed_origins: List[str] = Field(default_factory=list)
    trend_weight: float = Field(default=0.25)
    volume_weight: float = Field(default=0.20)
    structure_weight: float = Field(default=0.20)
    liquidity_weight: float = Field(default=0.15)
    volatility_weight: float = Field(default=0.10)
    dominance_weight: float = Field(default=0.10)

    @model_validator(mode='before')
    @classmethod
    def _load_environment(cls, values):
        values = dict(values or {})
        values.pop('_env_file', None)
        values.setdefault('environment', os.getenv('ENV', 'development'))
        values.setdefault('database_url', os.getenv('DATABASE_URL') or None)
        values.setdefault('cors_allowed_origins', os.getenv('CORS_ALLOWED_ORIGINS', ''))
        values.setdefault('redis_url', os.getenv('REDIS_URL') or None)
        values.setdefault('binance_api_key', os.getenv('BINANCE_API_KEY') or None)
        values.setdefault('binance_api_secret', os.getenv('BINANCE_API_SECRET') or None)
        values.setdefault('llm_api_key', os.getenv('LLM_API_KEY') or None)
        values.setdefault('llm_base_url', os.getenv('LLM_BASE_URL') or None)
        values.setdefault('openai_api_key', os.getenv('OPENAI_API_KEY') or None)
        values.setdefault('jwt_secret', os.getenv('JWT_SECRET') or None)
        values.setdefault('encryption_key', os.getenv('ENCRYPTION_KEY') or None)
        return values

    @field_validator('environment', mode='before')
    @classmethod
    def normalize_environment(cls, value: Optional[str]) -> str:
        return (value or 'development').strip().lower()

    @field_validator('cors_allowed_origins', mode='before')
    @classmethod
    def split_cors_origins(cls, value):
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(',') if origin.strip()]
        if value is None:
            return []
        return value

    @model_validator(mode='after')
    def _set_defaults_and_validate(self):
        if self.environment != 'production' and not self.cors_allowed_origins:
            self.cors_allowed_origins = ['http://localhost:8000', 'http://127.0.0.1:8000']

        if self.environment == 'production':
            if not self.database_url:
                raise ValueError('DATABASE_URL must be set in production')
            if not self.cors_allowed_origins:
                raise ValueError('CORS_ALLOWED_ORIGINS must be set in production')

        return self
        environment = values.environment
        if environment != 'production' and not values.cors_allowed_origins:
            values.cors_allowed_origins = ['http://localhost:8000', 'http://127.0.0.1:8000']

        if environment == 'production':
            if not values.cors_allowed_origins:
                raise ValueError('CORS_ALLOWED_ORIGINS must be set in production')
            if not values.database_url:
                raise ValueError('DATABASE_URL must be set in production')

        return values


try:
    settings = Settings()
except ValidationError as exc:
    raise RuntimeError('Invalid application configuration') from exc
