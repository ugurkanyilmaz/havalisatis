from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from typing import Optional
import re

class UserBase(BaseModel):
    email: EmailStr
    phone: str
    full_name: str | None = None

class UserCreate(UserBase):
    password: str
    
    # Password policy: min 8 char, at least 1 letter & 1 digit
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str):
        if len(v) < 8:
            raise ValueError('Şifre en az 8 karakter olmalı')
        if not re.search(r'[A-Za-z]', v) or not re.search(r'\d', v):
            raise ValueError('Şifre en az bir harf ve bir rakam içermeli')
        return v

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: str):
        # Normalize spaces / dashes
        digits = re.sub(r'[^0-9]', '', v)
        # Accept Turkish patterns: 10 digits (5XXXXXXXXX) or 11 with leading 0, or 12 with 90
        if digits.startswith('90') and len(digits) == 12:
            digits = digits[2:]
        if digits.startswith('0') and len(digits) == 11:
            digits = digits[1:]
        if not (len(digits) == 10 and digits.startswith('5')):
            raise ValueError('Telefon 5XX ile başlayan 10 haneli olmalı')
        return digits

    @field_validator('email')
    @classmethod
    def normalize_email(cls, v: EmailStr):
        return v.lower()

class UserAddressUpdate(BaseModel):
    city: str | None = None
    district: str | None = None
    address: str | None = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

    @field_validator('email')
    @classmethod
    def normalize_login_email(cls, v: EmailStr):
        return v.lower()

class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds for access token

class RefreshRequest(BaseModel):
    refresh_token: str

class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None  # if missing, revoke all for current user

class UserOut(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True
