from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List, Optional

class Settings(BaseSettings):
    APP_NAME: str = "Ketenhavalisatis"
    DEBUG: bool = True
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

@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
