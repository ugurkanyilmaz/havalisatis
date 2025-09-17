from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import get_settings
from .database import engine, Base
from .models import product, category, analytics  # noqa: F401 ensure models imported
from .api import products, categories, analytics

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
