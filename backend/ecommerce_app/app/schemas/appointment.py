from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class AppointmentBase(BaseModel):
    customer_name: str
    customer_email: EmailStr
    customer_phone: Optional[str] = None
    item_name: str
    item_brand: Optional[str] = None
    item_serial_number: Optional[str] = None
    note: Optional[str] = None
    scheduled_at: Optional[datetime] = None

class AppointmentCreate(AppointmentBase):
    estimated_completion_at: Optional[datetime] = None  # Admin/personel oluştururken tahmini bitiş verebilir

class UserAppointmentCreate(BaseModel):
    # Kullanıcı sadece basit randevu talebi oluşturur (servis kaydına dönüşebilir)
    item_name: str
    note: Optional[str] = None
    scheduled_at: Optional[datetime] = None

class AppointmentUpdate(BaseModel):
    customer_name: str | None = None
    customer_email: EmailStr | None = None
    customer_phone: str | None = None
    item_name: str | None = None
    item_brand: str | None = None
    item_serial_number: str | None = None
    note: str | None = None
    internal_note: str | None = None
    scheduled_at: datetime | None = None
    estimated_completion_at: datetime | None = None
    status: str | None = None
    cancel_reason: str | None = None

class AppointmentOut(AppointmentBase):
    id: int
    user_id: int | None = None
    status: str
    origin: str
    internal_note: Optional[str] = None
    estimated_completion_at: Optional[datetime] = None
    received_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    cancel_reason: Optional[str] = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True
