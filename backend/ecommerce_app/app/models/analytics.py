from sqlalchemy import Column, Integer, String, DateTime, func, ForeignKey
from ..database import Base


class AnalyticsEvent(Base):
    __tablename__ = 'analytics_events'

    id = Column(Integer, primary_key=True)
    event_type = Column(String, nullable=False, index=True)  # 'page_view' | 'product_click'
    path = Column(String, nullable=True, index=True)  # page path
    product_sku = Column(String, ForeignKey('products.sku', ondelete='SET NULL'), nullable=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)  # optional
    ip = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
