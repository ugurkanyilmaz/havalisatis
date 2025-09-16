from pydantic import BaseModel
from datetime import datetime
from typing import List

class OrderItemCreate(BaseModel):
    sku: str
    product_name: str
    quantity: int
    unit_price: float

class OrderItemOut(BaseModel):
    id: int
    product_sku: str
    product_name: str
    quantity: int
    unit_price: float
    line_total: float

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    items: List[OrderItemCreate]

class OrderOut(BaseModel):
    id: int
    status: str
    total_amount: float
    created_at: datetime | None = None
    items: List[OrderItemOut]

    class Config:
        from_attributes = True