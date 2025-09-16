from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentOut, UserAppointmentCreate
from ..crud.appointment import (
    list_appointments,
    get_appointment,
    create_appointment,
    update_appointment,
    delete_appointment,
    cancel_appointment,
    create_user_booking,
)
from ..database import get_db
from ..dependencies import get_current_user, admin_required
from sqlalchemy import select, or_

router = APIRouter()

@router.get('/', response_model=list[AppointmentOut], dependencies=[Depends(admin_required)])
def list_all(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return list_appointments(db, skip, limit)

@router.get('/me', response_model=list[AppointmentOut])
def my_appointments(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # Kayıtlı user_id atanmış veya email/telefon eşleşen kayıtlar
    stmt = select(AppointmentOut.__config__.orm_mode)  # placeholder to avoid error if misused
    from ..models.appointment import Appointment  # local import to avoid circular
    filters = []
    if current_user.email:
        filters.append(Appointment.customer_email == current_user.email)
    if getattr(current_user, 'phone', None):
        filters.append(Appointment.customer_phone == current_user.phone)
    q = select(Appointment).where(or_(*filters)) if filters else select(Appointment).where(False)
    return db.scalars(q).all()

@router.post('/admin', response_model=AppointmentOut, dependencies=[Depends(admin_required)])
def create_admin(appointment_in: AppointmentCreate, db: Session = Depends(get_db)):
    return create_appointment(db, appointment_in)

@router.post('/book', response_model=AppointmentOut)
def user_book(booking_in: UserAppointmentCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return create_user_booking(
        db,
        user_id=current_user.id,
        user_email=current_user.email,
        user_phone=getattr(current_user, 'phone', None),
        user_name=current_user.email.split('@')[0],
        booking_in=booking_in
    )

@router.get('/{appointment_id}', response_model=AppointmentOut)
def retrieve(appointment_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    appt = get_appointment(db, appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail='Kayıt bulunamadı')
    # Admin ise serbest
    if current_user.is_admin:
        return appt
    # Kullanıcıya ait mi? user_id eşleşiyor veya email/telefon eşleşiyor
    if (appt.user_id == current_user.id) or (appt.customer_email == current_user.email) or (getattr(current_user,'phone',None) and appt.customer_phone == current_user.phone):
        return appt
    raise HTTPException(status_code=403, detail='Yetkisiz')

@router.put('/{appointment_id}', response_model=AppointmentOut, dependencies=[Depends(admin_required)])
def update(appointment_id: int, appointment_in: AppointmentUpdate, db: Session = Depends(get_db)):
    appt = get_appointment(db, appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail='Kayıt bulunamadı')
    return update_appointment(db, appt, appointment_in)

@router.post('/{appointment_id}/cancel', response_model=AppointmentOut, dependencies=[Depends(admin_required)])
def cancel(appointment_id: int, reason: str | None = None, db: Session = Depends(get_db)):
    appt = get_appointment(db, appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail='Kayıt bulunamadı')
    return cancel_appointment(db, appt, reason)

@router.delete('/{appointment_id}', dependencies=[Depends(admin_required)])
def remove(appointment_id: int, db: Session = Depends(get_db)):
    appt = get_appointment(db, appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail='Kayıt bulunamadı')
    delete_appointment(db, appt)
    return {'detail': 'Silindi'}
