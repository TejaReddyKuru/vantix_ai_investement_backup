import os

from app.core.config import Settings


def test_settings_defaults() -> None:
    os.environ.pop("ENV", None)
    os.environ.pop("DATABASE_URL", None)
    os.environ.pop("CORS_ALLOWED_ORIGINS", None)
    settings = Settings(_env_file=None)

    assert settings.app_name == "Vish Capitals / Friday"
    assert settings.environment == "development"
    assert settings.database_url is None
    assert settings.cors_allowed_origins
    assert any("localhost" in origin for origin in settings.cors_allowed_origins)


def test_production_requires_database_url() -> None:
    os.environ["ENV"] = "production"
    os.environ.pop("DATABASE_URL", None)
    try:
        Settings(_env_file=None)
    except Exception as exc:
        assert "DATABASE_URL must be set in production" in str(exc)
    else:
        raise AssertionError("Production should require DATABASE_URL")
