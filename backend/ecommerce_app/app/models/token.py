from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, func
from sqlalchemy.orm import relationship
from ..database import Base

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String, unique=True, nullable=False, index=True)
    user_agent = Column(String, nullable=True)
    ip = Column(String, nullable=True)
    is_revoked = Column(Boolean, default=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="refresh_tokens")
