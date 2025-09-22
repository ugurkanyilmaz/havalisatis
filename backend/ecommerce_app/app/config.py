from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List, Optional
import secrets

class Settings(BaseSettings):
    APP_NAME: str = "Ketenhavalisatis"
    DEBUG: bool = False
    DATABASE_URL: str = "sqlite:///./ecommerce.db"
    SECRET_KEY: str = "CHANGE_ME"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    RATE_LIMIT_LOGIN_MAX_ATTEMPTS: int = 5
    RATE_LIMIT_LOGIN_WINDOW_SECONDS: int = 300  # 5 dk
    # Global rate limiting (middleware)
    RATE_LIMIT_DEFAULT_LIMIT: int = 120
    RATE_LIMIT_DEFAULT_WINDOW_SECONDS: int = 60
    RATE_LIMIT_ANALYTICS_LIMIT: int = 60
    RATE_LIMIT_ANALYTICS_WINDOW_SECONDS: int = 60
    # CORS: comma-separated origins, e.g. "https://a.com,https://b.com"
    CORS_ALLOWED_ORIGINS: Optional[str] = None
    # API keys
    PRODUCT_UPLOAD_API_KEY: Optional[str] = None
    # Public site base URL (e.g., https://havalielaletlerisatis.com)
    SITE_BASE_URL: Optional[str] = None

    class Config:
        env_file = '.env'
        case_sensitive = True

    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ALLOWED_ORIGINS:
            return []
        return [o.strip() for o in self.CORS_ALLOWED_ORIGINS.split(',') if o.strip()]

    def validate_for_production(self) -> None:
        """Fail fast if critical settings are missing when DEBUG is False."""
        if self.DEBUG:
            return
        # SECRET_KEY must not be placeholder
        if not self.SECRET_KEY or self.SECRET_KEY.strip().upper() in {"CHANGE_ME", "CHANGEME", "SECRET"}:
            raise RuntimeError("SECRET_KEY must be set to a strong random value in production")
        # PRODUCT_UPLOAD_API_KEY should be set to use protected endpoints
        if not self.PRODUCT_UPLOAD_API_KEY:
            # Soft error -> raise to avoid accidental open endpoint
            raise RuntimeError("PRODUCT_UPLOAD_API_KEY must be set in production to protect import endpoints")
        # SITE_BASE_URL is recommended for correct sitemap/robots
        if not (self.SITE_BASE_URL and self.SITE_BASE_URL.startswith("http")):
            # Warn via exception message guidance would be too strict; keep as soft warning in logs later if needed
            pass

@lru_cache(maxsize=1)
def get_settings() -> Settings:
    s = Settings()
    # Validate on load
    try:
        s.validate_for_production()
    except Exception as e:
        # Re-raise to fail-fast on startup
        raise
    return s
