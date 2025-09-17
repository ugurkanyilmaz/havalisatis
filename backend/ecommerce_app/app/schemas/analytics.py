from pydantic import BaseModel
from datetime import datetime


class PageViewIn(BaseModel):
    path: str


class ProductClickIn(BaseModel):
    sku: str


class EventOut(BaseModel):
    id: int
    event_type: str
    path: str | None
    product_sku: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class SummaryOut(BaseModel):
    total_page_views: int
    total_product_clicks: int
    total_product_views: int


class TopProductOut(BaseModel):
    sku: str
    clicks: int
    name: str | None = None
    image: str | None = None
    views: int | None = None
    sold: int | None = None
