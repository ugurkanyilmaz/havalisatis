from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func, UniqueConstraint
from sqlalchemy.orm import relationship
from ..database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey('categories.id', ondelete='SET NULL'), nullable=True, index=True)
    # Fully qualified path like: "PROFESYONEL > Havalı El Aletleri > BALANCER"
    path = Column(String, nullable=False, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    parent = relationship('Category', remote_side=[id], backref='children', lazy='joined')

    __table_args__ = (
        UniqueConstraint('name', 'parent_id', name='uq_categories_name_parent'),
    )
