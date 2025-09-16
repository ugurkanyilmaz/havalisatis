from pydantic import BaseModel, field_validator
from datetime import datetime


class CategoryBase(BaseModel):
    name: str
    parent_id: int | None = None
    path: str

    @field_validator('path')
    @classmethod
    def normalize_path(cls, v: str):
        # Trim and collapse spaces around '>'
        parts = [p.strip() for p in v.split('>') if p.strip()]
        return ' > '.join(parts)


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: str | None = None
    parent_id: int | None = None
    path: str | None = None


class CategoryOut(CategoryBase):
    id: int
    created_at: datetime | None = None

    class Config:
        from_attributes = True
