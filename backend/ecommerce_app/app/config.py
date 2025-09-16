from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    APP_NAME: str = "Ecommerce App"
    DEBUG: bool = True
    DATABASE_URL: str = "sqlite:///./ecommerce.db"
    SECRET_KEY: str = "CHANGE_ME"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    RATE_LIMIT_LOGIN_MAX_ATTEMPTS: int = 5
    RATE_LIMIT_LOGIN_WINDOW_SECONDS: int = 300  # 5 dk

    class Config:
        env_file = '.env'
        case_sensitive = True

@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
