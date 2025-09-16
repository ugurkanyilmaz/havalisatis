from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc
from fastapi import Request
from ..models.analytics import AnalyticsEvent
from ..models.product import Product, ProductAnalytics


def log_page_view(db: Session, path: str, req: Request | None = None) -> AnalyticsEvent:
    ev = AnalyticsEvent(event_type='page_view', path=path)
    if req is not None:
        ev.ip = req.client.host if req.client else None
        ev.user_agent = req.headers.get('user-agent')
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev


def log_product_view(db: Session, product_sku: str, req: Request | None = None) -> AnalyticsEvent:
    ev = AnalyticsEvent(event_type='product_view', product_sku=product_sku)
    if req is not None:
        ev.ip = req.client.host if req.client else None
        ev.user_agent = req.headers.get('user-agent')
    pa = db.scalar(select(ProductAnalytics).where(ProductAnalytics.product_sku == product_sku))
    if pa is None:
        pa = ProductAnalytics(product_sku=product_sku, page_views_count=1)
    else:
        pa.page_views_count = (pa.page_views_count or 0) + 1
    db.add(pa)
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev


def log_product_click(db: Session, product_sku: str, req: Request | None = None) -> AnalyticsEvent:
    ev = AnalyticsEvent(event_type='product_click', product_sku=product_sku)
    if req is not None:
        ev.ip = req.client.host if req.client else None
        ev.user_agent = req.headers.get('user-agent')
    # increment analytics table counter by sku
    pa = db.scalar(select(ProductAnalytics).where(ProductAnalytics.product_sku == product_sku))
    if pa is None:
        pa = ProductAnalytics(product_sku=product_sku, clicks_count=1)
    else:
        pa.clicks_count = (pa.clicks_count or 0) + 1
    db.add(pa)
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev


def get_summary(db: Session) -> dict:
    total_page_views = db.scalar(select(func.count()).select_from(AnalyticsEvent).where(AnalyticsEvent.event_type == 'page_view')) or 0
    total_product_clicks = db.scalar(select(func.count()).select_from(AnalyticsEvent).where(AnalyticsEvent.event_type == 'product_click')) or 0
    total_product_views = db.scalar(select(func.count()).select_from(AnalyticsEvent).where(AnalyticsEvent.event_type == 'product_view')) or 0
    return {
        'total_page_views': total_page_views,
        'total_product_clicks': total_product_clicks,
        'total_product_views': total_product_views,
    }

def get_top_products(db: Session, limit: int = 10, metric: str = 'clicks'):
    metric = (metric or 'clicks').lower()
    # Choose ordering column
    order_col = ProductAnalytics.clicks_count
    if metric in ('views', 'page_views', 'pageviews'):
        order_col = ProductAnalytics.page_views_count
    elif metric in ('sold', 'sales', 'sold_count'):
        order_col = ProductAnalytics.sold_count

    stmt = (
        select(
            Product.sku,
            Product.title,
            Product.price,
            Product.main_img,
            ProductAnalytics.clicks_count,
            ProductAnalytics.page_views_count,
            ProductAnalytics.sold_count,
        )
        .join(ProductAnalytics, ProductAnalytics.product_sku == Product.sku)
        .order_by(desc(order_col))
        .limit(limit)
    )
    rows = db.execute(stmt).all()
    return [
        {
            'sku': r[0],
            'name': r[1],
            'price': r[2],
            'image': r[3],
            'clicks': r[4] or 0,
            'views': r[5] or 0,
            'sold': r[6] or 0,
        }
        for r in rows
    ]
