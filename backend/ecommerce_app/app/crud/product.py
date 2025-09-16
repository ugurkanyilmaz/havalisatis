from sqlalchemy.orm import Session
from sqlalchemy import select, or_, and_, inspect
from ..models.product import Product, ProductSEO, ProductImage, ProductAnalytics
from ..schemas.product import ProductCreate, ProductUpdate
from .category import ensure_hierarchy


def list_products(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    category: str | None = None,
    category_id: int | None = None,
    category_ids: list[int] | None = None,
    discounted_only: bool = False,
):
    stmt = select(Product)
    if category:
        stmt = stmt.where(Product.category == category)
    if category_ids:
        stmt = stmt.where(Product.category_id.in_(category_ids))
    elif category_id:
        stmt = stmt.where(Product.category_id == category_id)
    if discounted_only:
        try:
            stmt = stmt.where((Product.discount_percent.isnot(None)) & (Product.discount_percent > 0))
        except Exception:
            # Fallback for older SQLAlchemy versions
            stmt = stmt.where((Product.discount_percent != None) & (Product.discount_percent > 0))  # noqa: E711
    stmt = stmt.offset(skip).limit(limit)
    return db.scalars(stmt).all()


def search_products(db: Session, query: str, skip: int = 0, limit: int = 20, category: str | None = None, category_id: int | None = None, category_ids: list[int] | None = None):
    q = f"%{query.lower()}%"
    filters = [
        Product.title.ilike(q),
        Product.description.ilike(q),
        Product.sku.ilike(q),
        Product.category.ilike(q),
        Product.feature1.ilike(q),
        Product.feature2.ilike(q),
        Product.feature3.ilike(q),
        Product.feature4.ilike(q),
        Product.feature5.ilike(q),
        Product.feature6.ilike(q),
        Product.feature7.ilike(q),
        Product.feature8.ilike(q),
    ]
    # Safely include brand if column exists
    try:
        getattr(Product, 'brand')
        filters.append(Product.brand.ilike(q))
    except Exception:
        pass
    stmt = select(Product).where(or_(*filters))
    if category:
        stmt = stmt.where(Product.category == category)
    if category_ids:
        stmt = stmt.where(Product.category_id.in_(category_ids))
    elif category_id:
        stmt = stmt.where(Product.category_id == category_id)
    stmt = stmt.offset(skip).limit(limit)
    return db.scalars(stmt).all()


def get_product(db: Session, product_id: int) -> Product | None:
    return db.get(Product, product_id)


def get_product_by_sku(db: Session, sku: str) -> Product | None:
    code = (sku or '').strip().upper()
    if not code:
        return None
    return db.scalar(select(Product).where(Product.sku == code))


def create_product(db: Session, product_in: ProductCreate) -> Product:
    data = product_in.model_dump()
    # Safety check for discount range (validator already ensures, but double guard)
    dp = data.get('discount_percent')
    if dp is not None and (dp < 0 or dp > 100):
        raise ValueError('discount_percent must be between 0 and 100')
    cat_path = data.pop('category_path', None)
    # Extract SEO
    seo_payload = data.pop('seo', None)
    if cat_path:
        cat = ensure_hierarchy(db, cat_path)
        data['category_id'] = cat.id
    product = Product(**data)
    db.add(product)
    db.commit()
    db.refresh(product)
    # Upsert SEO after product exists
    meta_title = None
    meta_description = None
    if seo_payload is not None:
        meta_title = seo_payload.get('meta_title')
        meta_description = seo_payload.get('meta_description')
    if (meta_title is not None) or (meta_description is not None):
        _upsert_product_seo(db, product, meta_title, meta_description)

    # Sync images if product_images table exists (from legacy fields)
    _sync_images(db, product, data)

    # Ensure analytics row exists if product_analytics table exists
    _ensure_analytics(db, product)
    return product


def update_product(db: Session, product: Product, product_in: ProductUpdate) -> Product:
    data = product_in.model_dump(exclude_unset=True)
    dp = data.get('discount_percent')
    if dp is not None and (dp < 0 or dp > 100):
        raise ValueError('discount_percent must be between 0 and 100')
    cat_path = data.pop('category_path', None)
    seo_payload = data.pop('seo', None)
    if cat_path:
        cat = ensure_hierarchy(db, cat_path)
        data['category_id'] = cat.id
    for k, v in data.items():
        setattr(product, k, v)
    db.add(product)
    db.commit()
    db.refresh(product)
    # Upsert SEO: prioritize nested seo payload
    meta_title = None
    meta_description = None
    if seo_payload is not None:
        meta_title = seo_payload.get('meta_title')
        meta_description = seo_payload.get('meta_description')
    if (meta_title is not None) or (meta_description is not None):
        _upsert_product_seo(db, product, meta_title, meta_description)

    # Sync images if table exists
    _sync_images(db, product, data)

    # Ensure analytics exists
    _ensure_analytics(db, product)
    return product


# ---- SEO Helpers (tolerant when migrations are skipped) ----
_SEO_TABLE_DETECTED: bool | None = None
_IMAGES_TABLE_DETECTED: bool | None = None
_ANALYTICS_TABLE_DETECTED: bool | None = None


def _has_seo_table(db: Session) -> bool:
    global _SEO_TABLE_DETECTED
    if _SEO_TABLE_DETECTED is not None:
        return _SEO_TABLE_DETECTED
    try:
        engine = db.get_bind()
        insp = inspect(engine)
        _SEO_TABLE_DETECTED = insp.has_table("product_seo")
    except Exception:
        _SEO_TABLE_DETECTED = False
    return _SEO_TABLE_DETECTED


def _has_images_table(db: Session) -> bool:
    global _IMAGES_TABLE_DETECTED
    if _IMAGES_TABLE_DETECTED is not None:
        return _IMAGES_TABLE_DETECTED
    try:
        engine = db.get_bind()
        insp = inspect(engine)
        _IMAGES_TABLE_DETECTED = insp.has_table("product_images")
    except Exception:
        _IMAGES_TABLE_DETECTED = False
    return _IMAGES_TABLE_DETECTED


def _has_analytics_table(db: Session) -> bool:
    global _ANALYTICS_TABLE_DETECTED
    if _ANALYTICS_TABLE_DETECTED is not None:
        return _ANALYTICS_TABLE_DETECTED
    try:
        engine = db.get_bind()
        insp = inspect(engine)
        _ANALYTICS_TABLE_DETECTED = insp.has_table("product_analytics")
    except Exception:
        _ANALYTICS_TABLE_DETECTED = False
    return _ANALYTICS_TABLE_DETECTED


def _upsert_product_seo(db: Session, product: Product, meta_title: str | None, meta_description: str | None) -> None:
    """If product_seo table exists, upsert there; else no-op (legacy fields removed)."""
    if not _has_seo_table(db):
        # Table not yet created; skip silently
        return

    # Upsert into product_seo table
    existing_seo = db.scalar(select(ProductSEO).where(ProductSEO.product_sku == product.sku))
    if existing_seo:
        if meta_title is not None:
            existing_seo.meta_title = meta_title
        if meta_description is not None:
            existing_seo.meta_description = meta_description
        db.add(existing_seo)
    else:
        db.add(ProductSEO(
            product_sku=product.sku,
            meta_title=meta_title,
            meta_description=meta_description,
        ))
    db.commit()


def _sync_images(db: Session, product: Product, data: dict) -> None:
    """Create ProductImage rows from legacy image fields if table exists.
    Respects fields: main_img, img1, img2, img3, img4
    """
    if not _has_images_table(db):
        return
    urls: list[tuple[str, bool, int]] = []
    def add(url: str | None, main: bool, pos: int):
        if url and str(url).strip():
            urls.append((str(url).strip(), main, pos))
    add(data.get('main_img'), True, 0)
    add(data.get('img1'), False, 1)
    add(data.get('img2'), False, 2)
    add(data.get('img3'), False, 3)
    add(data.get('img4'), False, 4)
    if not urls:
        return
    # Clear existing images
    db.query(ProductImage).filter(ProductImage.product_sku == product.sku).delete()
    # Insert new set
    for url, is_main, position in urls:
        db.add(ProductImage(product_sku=product.sku, url=url, is_main=is_main, position=position))
    db.commit()


def _ensure_analytics(db: Session, product: Product) -> None:
    if not _has_analytics_table(db):
        return
    existing = db.scalar(select(ProductAnalytics).where(ProductAnalytics.product_sku == product.sku))
    if not existing:
        db.add(ProductAnalytics(product_sku=product.sku, clicks_count=0))
        db.commit()


    


def delete_product(db: Session, product: Product) -> None:
    db.delete(product)
    db.commit()
