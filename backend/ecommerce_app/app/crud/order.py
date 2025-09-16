from sqlalchemy.orm import Session
from sqlalchemy import select
from ..models.order import Order, OrderItem
from ..schemas.order import OrderCreate
from ..models.product import Product, ProductAnalytics

def create_order(db: Session, user_id: int | None, order_in: OrderCreate) -> Order:
    order = Order(user_id=user_id, status='active')
    total = 0
    for item in order_in.items:
        # Resolve product by sku
        prod = db.scalar(select(Product).where(Product.sku == item.sku.strip().upper()))
        if not prod:
            raise ValueError(f"Ürün bulunamadı (sku={item.sku})")
        line_total = item.quantity * item.unit_price
        total += line_total
        order.items.append(OrderItem(
            product_sku=prod.sku,
            product_name=item.product_name,
            quantity=item.quantity,
            unit_price=item.unit_price,
            line_total=line_total
        ))
    order.total_amount = total
    db.add(order)
    db.commit()
    db.refresh(order)
    return order

def list_orders(db: Session, status: str | None = None):
    stmt = select(Order).order_by(Order.id.desc())
    if status:
        stmt = stmt.where(Order.status == status)
    return db.scalars(stmt).unique().all()

def mark_order_completed(db: Session, order_id: int) -> Order | None:
    order = db.get(Order, order_id)
    if not order:
        return None
    order.status = 'completed'
    # Increment sold counters per item
    for it in order.items:
        pa = db.scalar(select(ProductAnalytics).where(ProductAnalytics.product_sku == it.product_sku))
        if pa is None:
            pa = ProductAnalytics(product_sku=it.product_sku, sold_count=it.quantity)
        else:
            pa.sold_count = (pa.sold_count or 0) + (it.quantity or 0)
        db.add(pa)
    db.add(order)
    db.commit()
    db.refresh(order)
    return order