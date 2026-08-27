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
    live_execution_enabled: bool = Field(default=False)

    llm_api_key: Optional[SecretStr] = None
    llm_base_url: Optional[str] = None
    openai_api_key: Optional[SecretStr] = None

    database_url: Optional[str] = None
    redis_url: Optional[str] = None
    jwt_secret: Optional[SecretStr] = None
    jwt_algorithm: str = Field(default='HS256')
    access_token_expire_minutes: int = Field(default=15)
    refresh_token_expire_days: int = Field(default=30)
    password_hash_scheme: str = Field(default='bcrypt')
    email_verification_required: bool = Field(default=False)
    rate_limits: dict = Field(default_factory=lambda: {
        'register': {'limit': 5, 'window_seconds': 60},
        'login': {'limit': 10, 'window_seconds': 60},
        'refresh': {'limit': 20, 'window_seconds': 60},
        'password_reset': {'limit': 5, 'window_seconds': 300},
        'email_verification': {'limit': 5, 'window_seconds': 300},
    })
    encryption_key: Optional[SecretStr] = None

    cors_allowed_origins: List[str] = Field(default_factory=list)
    max_position_exposure: float = Field(default=0.20)
    max_portfolio_drawdown: float = Field(default=0.15)
    max_risk_per_trade: float = Field(default=0.02)
    min_cash_reserve: float = Field(default=0.05)
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
        values.setdefault('max_position_exposure', float(os.getenv('MAX_POSITION_EXPOSURE', '0.20')))
        values.setdefault('max_portfolio_drawdown', float(os.getenv('MAX_PORTFOLIO_DRAWDOWN', '0.15')))
        values.setdefault('max_risk_per_trade', float(os.getenv('MAX_RISK_PER_TRADE', '0.02')))
        values.setdefault('min_cash_reserve', float(os.getenv('MIN_CASH_RESERVE', '0.05')))

        values.setdefault('binance_api_key', os.getenv('BINANCE_API_KEY') or None)
        values.setdefault('binance_api_secret', os.getenv('BINANCE_API_SECRET') or None)
        values.setdefault('llm_api_key', os.getenv('LLM_API_KEY') or None)
        values.setdefault('llm_base_url', os.getenv('LLM_BASE_URL') or None)
        values.setdefault('openai_api_key', os.getenv('OPENAI_API_KEY') or None)
        values.setdefault('jwt_secret', os.getenv('JWT_SECRET') or None)
        values.setdefault('jwt_algorithm', os.getenv('JWT_ALGORITHM') or 'HS256')
        values.setdefault('access_token_expire_minutes', int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '15')))
        values.setdefault('refresh_token_expire_days', int(os.getenv('REFRESH_TOKEN_EXPIRE_DAYS', '30')))
        values.setdefault('password_hash_scheme', os.getenv('PASSWORD_HASH_SCHEME') or 'bcrypt')
        values.setdefault('email_verification_required', os.getenv('EMAIL_VERIFICATION_REQUIRED', 'false').strip().lower() in {'1', 'true', 'yes', 'on'})
        values.setdefault('encryption_key', os.getenv('ENCRYPTION_KEY') or None)
        rate_limits_raw = os.getenv('RATE_LIMITS')
        if rate_limits_raw:
            try:
                values['rate_limits'] = eval(rate_limits_raw, {'__builtins__': {}}, {})
            except Exception:
                values['rate_limits'] = {
                    'register': {'limit': 5, 'window_seconds': 60},
                    'login': {'limit': 10, 'window_seconds': 60},
                    'refresh': {'limit': 20, 'window_seconds': 60},
                    'password_reset': {'limit': 5, 'window_seconds': 300},
                    'email_verification': {'limit': 5, 'window_seconds': 300},
                }
        return values

    @field_validator('environment', mode='before')
    @classmethod
    def normalize_environment(cls, value: Optional[str]) -> str:
        return (value or 'development').strip().lower()

    @field_validator('database_url', mode='after')
    @classmethod
    def convert_postgresql_url(cls, value: Optional[str]) -> Optional[str]:
        if value and value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+psycopg://", 1)
        return value

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
