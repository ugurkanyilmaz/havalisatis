from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..dependencies import admin_required, get_current_user
from ..database import get_db
from ..schemas.order import OrderCreate, OrderOut
from ..crud.order import create_order, list_orders, mark_order_completed

router = APIRouter()

@router.get('/stats')
def stats(current_admin = Depends(admin_required)):
    return {"message": "Admin istatistik placeholder"}

@router.get('/me')
def me(user = Depends(get_current_user)):
    return {"email": user.email, "is_admin": user.is_admin}

@router.post('/orders', response_model=OrderOut)
def admin_create_order(order_in: OrderCreate, db: Session = Depends(get_db), current_admin=Depends(admin_required)):
    return create_order(db, user_id=None, order_in=order_in)

@router.get('/orders/active', response_model=list[OrderOut])
def admin_list_active(db: Session = Depends(get_db), current_admin=Depends(admin_required)):
    return list_orders(db, status='active')

@router.get('/orders/completed', response_model=list[OrderOut])
def admin_list_completed(db: Session = Depends(get_db), current_admin=Depends(admin_required)):
    return list_orders(db, status='completed')

@router.post('/orders/{order_id}/complete', response_model=OrderOut)
def admin_complete_order(order_id: int, db: Session = Depends(get_db), current_admin=Depends(admin_required)):
    order = mark_order_completed(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail='Sipariş bulunamadı')
    return order
