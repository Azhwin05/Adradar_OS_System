from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    database_url: str = "postgresql+asyncpg://adradar:changeme@localhost:5432/adradar"

    # Redis / Celery
    redis_url: str = "redis://localhost:6379/0"

    # JWT
    secret_key: str = "dev-secret-key-change-in-production-min-32-chars"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours

    # Anthropic
    anthropic_api_key: str = ""

    # Supabase (optional)
    supabase_url: str = ""
    supabase_service_key: str = ""

    # App
    app_name: str = "AdRadar"
    debug: bool = False
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001"]
    # Override with comma-separated URLs in production: CORS_ORIGINS=https://app.vercel.app,https://yourdomain.com
    extra_cors_origins: str = ""

    @property
    def all_cors_origins(self) -> list[str]:
        extras = [o.strip() for o in self.extra_cors_origins.split(",") if o.strip()]
        return self.cors_origins + extras


@lru_cache
def get_settings() -> Settings:
    return Settings()
