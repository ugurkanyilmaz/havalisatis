from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import get_settings
from .database import engine, Base
from .models import product, category, analytics  # noqa: F401 ensure models imported
from .api import products, categories, analytics
from .middleware.rate_limit import RateLimitMiddleware, match_prefix, match_path

settings = get_settings()

# Tablo oluşturma artık Alembic migration'ları ile yönetiliyor.
# (Geliştirme sırasında hızlı deneme için isterseniz bu satırı yeniden ekleyebilirsiniz.)

app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG)

# Tables are managed via Alembic migrations. Avoid create_all to prevent drift.

if settings.DEBUG:
    # In development, allow all to ease testing from phone over LAN
    origins = ["*"]
else:
    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting middleware
# - Default: 120 req / 60s per IP per method+path bucket
# - Analytics endpoints are a common target for automated noise: stricter 60/60s
# - Health and root are already bypassed in middleware
app.add_middleware(
    RateLimitMiddleware,
    default_limit=settings.RATE_LIMIT_DEFAULT_LIMIT,
    default_window_seconds=settings.RATE_LIMIT_DEFAULT_WINDOW_SECONDS,
    trust_proxy_headers=True,
    policies=[
        # Stricter on analytics endpoints
        (match_prefix("/api/analytics"), settings.RATE_LIMIT_ANALYTICS_LIMIT, settings.RATE_LIMIT_ANALYTICS_WINDOW_SECONDS),
        # If you later add auth: (match_prefix("/api/auth"), 10, 60),
    ],
)

# Routers
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])

@app.get('/')
def root():
    return {"app": settings.APP_NAME, "status": "ok"}

@app.get('/api/health')
def health():
    return {"status": "healthy"}
