from pydantic import BaseModel, field_validator
from datetime import datetime


class ProductSEO(BaseModel):
    meta_title: str | None = None
    meta_description: str | None = None

    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    title: str
    description: str | None = None
    price: float
    stock: int = 0
    discount_percent: float | None = None
    category: str | None = None
    category_id: int | None = None
    category_path: str | None = None  # convenience input like "Parent > Child > Sub"
    sku: str | None = None
    brand: str | None = None
    feature1: str | None = None
    feature2: str | None = None
    feature3: str | None = None
    feature4: str | None = None
    feature5: str | None = None
    feature6: str | None = None
    feature7: str | None = None
    feature8: str | None = None
    # Images
    main_img: str | None = None
    img1: str | None = None
    img2: str | None = None
    img3: str | None = None
    img4: str | None = None
    # SEO (nested)
    seo: ProductSEO | None = None

    @field_validator('discount_percent')
    @classmethod
    def validate_discount(cls, v):
        if v is not None:
            if v < 0 or v > 100:
                raise ValueError('discount_percent 0 ile 100 arasında olmalı')
        return v

    @field_validator('sku')
    @classmethod
    def normalize_code(cls, v):
        if v is None:
            return v
        v = v.strip()
        if not v:
            return None
        return v.upper()

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    price: float | None = None
    stock: int | None = None
    is_active: bool | None = None
    discount_percent: float | None = None
    category: str | None = None
    category_id: int | None = None
    category_path: str | None = None
    sku: str | None = None
    brand: str | None = None
    feature1: str | None = None
    feature2: str | None = None
    feature3: str | None = None
    feature4: str | None = None
    feature5: str | None = None
    feature6: str | None = None
    feature7: str | None = None
    feature8: str | None = None
    # Images
    main_img: str | None = None
    img1: str | None = None
    img2: str | None = None
    img3: str | None = None
    img4: str | None = None
    # SEO (nested)
    seo: ProductSEO | None = None

class ProductOut(ProductBase):
    id: int
    is_active: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None

    @property
    def discounted_price(self) -> float:
        if self.discount_percent:
            return round(self.price * (1 - self.discount_percent / 100), 2)
        return self.price

    class Config:
        from_attributes = True


    
