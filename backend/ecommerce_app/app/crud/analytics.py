from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc, update
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
    """Log a product view; create analytics row if missing and increment page_views_count atomically."""
    ev = AnalyticsEvent(event_type='product_view', product_sku=product_sku)
    if req is not None:
        ev.ip = req.client.host if req.client else None
        ev.user_agent = req.headers.get('user-agent')
    # Try atomic update first
    res = db.execute(
        update(ProductAnalytics)
        .where(ProductAnalytics.product_sku == product_sku)
        .values(page_views_count=(ProductAnalytics.page_views_count + 1))
    )
    if res.rowcount == 0:
        # No existing row; create
        db.add(ProductAnalytics(product_sku=product_sku, page_views_count=1, clicks_count=0, sold_count=0))
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev


def log_product_click(db: Session, product_sku: str, req: Request | None = None) -> AnalyticsEvent:
    """Log a product click with atomic increment. Creates analytics row if missing."""
    ev = AnalyticsEvent(event_type='product_click', product_sku=product_sku)
    if req is not None:
        ev.ip = req.client.host if req.client else None
        ev.user_agent = req.headers.get('user-agent')
    res = db.execute(
        update(ProductAnalytics)
        .where(ProductAnalytics.product_sku == product_sku)
        .values(clicks_count=(ProductAnalytics.clicks_count + 1))
    )
    if res.rowcount == 0:
        db.add(ProductAnalytics(product_sku=product_sku, clicks_count=1, page_views_count=0, sold_count=0))
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

def get_top_products(db: Session, limit: int = 10, metric: str = 'views'):
    # Default now uses page views instead of clicks
    metric = (metric or 'views').lower()
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
            'image': r[2],
            'clicks': r[3] or 0,
            'views': r[4] or 0,
            'sold': r[5] or 0,
        }
        for r in rows
    ]
