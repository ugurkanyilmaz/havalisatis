from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.analytics import PageViewIn, ProductClickIn, SummaryOut, TopProductOut, EventOut
from ..crud.analytics import log_page_view, log_product_click, log_product_view, get_summary, get_top_products
from sqlalchemy import select
from ..models.product import Product

router = APIRouter()


@router.post('/page-view', response_model=EventOut)
def page_view(payload: PageViewIn, request: Request, db: Session = Depends(get_db)):
    return log_page_view(db, payload.path, request)


@router.post('/product-click', response_model=EventOut)
def product_click(payload: ProductClickIn, request: Request, db: Session = Depends(get_db)):
    sku = payload.sku.strip().upper()
    prod = db.scalar(select(Product).where(Product.sku == sku))
    if not prod:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail='Ürün bulunamadı (sku)')
    return log_product_click(db, sku, request)


@router.post('/product-view', response_model=EventOut)
def product_view(payload: ProductClickIn, request: Request, db: Session = Depends(get_db)):
    sku = payload.sku.strip().upper()
    prod = db.scalar(select(Product).where(Product.sku == sku))
    if not prod:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail='Ürün bulunamadı (sku)')
    return log_product_view(db, sku, request)


@router.get('/summary', response_model=SummaryOut)
def summary(db: Session = Depends(get_db)):
    return get_summary(db)


@router.get('/top-products', response_model=list[TopProductOut])
def top_products(limit: int = 10, metric: str = 'clicks', db: Session = Depends(get_db)):
    return get_top_products(db, limit, metric)
