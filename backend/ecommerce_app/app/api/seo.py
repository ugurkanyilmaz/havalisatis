from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.product import Product
from sqlalchemy import select
from ..config import get_settings

router = APIRouter()


def _base_url() -> str:
    settings = get_settings()
    base = (settings.SITE_BASE_URL or '').strip().rstrip('/')
    # Fallback – do not emit sitemap if no base
    return base


@router.get('/sitemap.xml')
def sitemap_xml(db: Session = Depends(get_db)):
    base = _base_url()
    if not base:
        # Minimal empty sitemap to avoid 404s
        xml = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>"""
        return Response(content=xml, media_type='application/xml')

    urls = []
    # Static pages
    urls.append(f"{base}/")
    urls.append(f"{base}/urunler")

    # Products by SKU
    stmt = select(Product.sku).where(Product.is_active == True)  # noqa: E712
    for (sku,) in db.execute(stmt):
        urls.append(f"{base}/urunler/{sku}")

    # Build XML
    parts = ["<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
             "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">"]
    for u in urls:
        parts.append(f"  <url><loc>{u}</loc></url>")
    parts.append("</urlset>")
    xml = "\n".join(parts)
    return Response(content=xml, media_type='application/xml')


@router.get('/robots.txt')
def robots_txt():
    base = _base_url()
    lines = [
        "User-agent: *",
        "Allow: /",
    ]
    if base:
        lines.append(f"Sitemap: {base}/sitemap.xml")
    body = "\n".join(lines) + "\n"
    return Response(content=body, media_type='text/plain')
