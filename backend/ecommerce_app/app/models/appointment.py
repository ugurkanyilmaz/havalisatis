from sqlalchemy import Column, Integer, String, DateTime, Text, Enum, func, ForeignKey
from ..database import Base
import enum

class AppointmentStatus(str, enum.Enum):
    pending = "pending"          # Oluşturuldu / sırada
    in_progress = "in_progress"  # Serviste işlemde
    completed = "completed"      # Tamamlandı teslim hazır
    cancelled = "cancelled"      # İptal edildi

class AppointmentOrigin(str, enum.Enum):
    admin = "admin"   # Admin / personel tarafından oluşturulan servis kaydı
    user = "user"     # Kullanıcının kendisinin oluşturduğu randevu talebi


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)  # Kayıtlı kullanıcı ile eşleşirse
    # Müşteri bilgileri
    customer_name = Column(String, nullable=False)
    customer_email = Column(String, nullable=False)
    customer_phone = Column(String, nullable=True)
    # Servise verilen ürün bilgileri
    item_name = Column(String, nullable=False)             # Ürün / cihaz adı
    item_brand = Column(String, nullable=True)
    item_serial_number = Column(String, nullable=True)
    # Süreç notları
    note = Column(Text, nullable=True)
    internal_note = Column(Text, nullable=True)
    # Durum
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.pending, nullable=False)
    origin = Column(Enum(AppointmentOrigin), default=AppointmentOrigin.admin, nullable=False, index=True)
    # Tarihler
    scheduled_at = Column(DateTime(timezone=True), nullable=True)          # Randevu zamanı (varsa)
    received_at = Column(DateTime(timezone=True), server_default=func.now())  # Cihazın kabul edildiği zaman
    estimated_completion_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    # İptal sebebi
    cancel_reason = Column(Text, nullable=True)
    # Sistem
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
