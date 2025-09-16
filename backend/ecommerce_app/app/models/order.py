from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from ..database import Base

class Order(Base):
    __tablename__ = 'orders'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True, index=True)
    status = Column(String, default='active', index=True)  # active | completed | cancelled
    total_amount = Column(Float, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    items = relationship('OrderItem', back_populates='order', cascade='all, delete-orphan')

class OrderItem(Base):
    __tablename__ = 'order_items'

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey('orders.id', ondelete='CASCADE'), index=True, nullable=False)
    product_sku = Column(String, ForeignKey('products.sku'), nullable=False, index=True)
    product_name = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False, default=0)
    line_total = Column(Float, nullable=False, default=0)

    order = relationship('Order', back_populates='items')