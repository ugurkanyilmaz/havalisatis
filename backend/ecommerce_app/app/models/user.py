from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from ..database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, unique=True, index=True, nullable=False)  # Telefon numarası (zorunlu)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True, index=True)
    # Adres bilgileri
    city = Column(String, nullable=True)       # İl
    district = Column(String, nullable=True)   # İlçe
    address = Column(String, nullable=True)    # Açık adres
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    # refresh_tokens relationship declared via backref in RefreshToken model
