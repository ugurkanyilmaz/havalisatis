from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, func, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship, Mapped, mapped_column
from ..database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    stock = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    discount_percent = Column(Float, nullable=True)  # 0-100 arası indirim yüzdesi
    # Extended fields
    category = Column(String, nullable=True, index=True)  # legacy flat category
    category_id = Column(Integer, nullable=True, index=True)  # FK via migration
    sku = Column(String, nullable=False, unique=True, index=True)
    feature1 = Column(String, nullable=True)
    feature2 = Column(String, nullable=True)
    feature3 = Column(String, nullable=True)
    feature4 = Column(String, nullable=True)
    feature5 = Column(String, nullable=True)
    feature6 = Column(String, nullable=True)
    feature7 = Column(String, nullable=True)
    feature8 = Column(String, nullable=True)
    brand = Column(String, nullable=True)
    # Images (English naming)
    main_img = Column(String, nullable=True)
    img1 = Column(String, nullable=True)
    img2 = Column(String, nullable=True)
    img3 = Column(String, nullable=True)
    img4 = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    seo: Mapped["ProductSEO"] = relationship(
        "ProductSEO",
        back_populates="product",
        uselist=False,
        cascade="all, delete-orphan",
    )
    images: Mapped[list["ProductImage"]] = relationship(
        "ProductImage",
        back_populates="product",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    analytics: Mapped["ProductAnalytics"] = relationship(
        "ProductAnalytics",
        back_populates="product",
        uselist=False,
        cascade="all, delete-orphan",
    )


class ProductSEO(Base):
    __tablename__ = "product_seo"
    __table_args__ = (
        UniqueConstraint("product_sku", name="uq_product_seo_product_sku"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    product_sku: Mapped[str] = mapped_column(ForeignKey("products.sku", ondelete="CASCADE"), nullable=False, index=True)
    meta_title: Mapped[str | None] = mapped_column(String, nullable=True)
    meta_explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now())

    product: Mapped["Product"] = relationship("Product", back_populates="seo")


class ProductImage(Base):
    __tablename__ = "product_images"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    product_sku: Mapped[str] = mapped_column(ForeignKey("products.sku", ondelete="CASCADE"), nullable=False, index=True)
    url: Mapped[str] = mapped_column(String, nullable=False)
    is_main: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    product: Mapped["Product"] = relationship("Product", back_populates="images")


class ProductAnalytics(Base):
    __tablename__ = "product_analytics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    product_sku: Mapped[str] = mapped_column(ForeignKey("products.sku", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    clicks_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    page_views_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    sold_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now())

    product: Mapped["Product"] = relationship("Product", back_populates="analytics")


    
