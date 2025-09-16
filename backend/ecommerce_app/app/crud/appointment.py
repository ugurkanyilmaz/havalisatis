from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime, timezone
from ..models.appointment import Appointment, AppointmentStatus, AppointmentOrigin
from ..schemas.appointment import AppointmentCreate, AppointmentUpdate, UserAppointmentCreate


def list_appointments(db: Session, skip: int = 0, limit: int = 50):
    return db.scalars(select(Appointment).offset(skip).limit(limit)).all()


def get_appointment(db: Session, appointment_id: int) -> Appointment | None:
    return db.get(Appointment, appointment_id)


def create_appointment(db: Session, appointment_in: AppointmentCreate, origin: AppointmentOrigin = AppointmentOrigin.admin) -> Appointment:
    data = appointment_in.dict(exclude_unset=True)
    data["origin"] = origin
    appointment = Appointment(**data)
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


def create_user_booking(db: Session, user_id: int, user_email: str, user_phone: str | None, user_name: str | None, booking_in: UserAppointmentCreate) -> Appointment:
    data = booking_in.dict(exclude_unset=True)
    # Kullanıcı basit bir talep oluşturur -> status pending, origin user
    payload = {
        "user_id": user_id,
        "customer_email": user_email,
        "customer_phone": user_phone,
        "customer_name": user_name or user_email.split("@")[0],
        "item_name": data["item_name"],
        "note": data.get("note"),
        "scheduled_at": data.get("scheduled_at"),
        "origin": AppointmentOrigin.user,
        "status": AppointmentStatus.pending,
    }
    appt = Appointment(**payload)
    db.add(appt)
    db.commit()
    db.refresh(appt)
    return appt


def update_appointment(db: Session, appointment: Appointment, appointment_in: AppointmentUpdate) -> Appointment:
    data = appointment_in.dict(exclude_unset=True)
    new_status = data.get("status")
    now = datetime.now(timezone.utc)

    if new_status:
        if new_status not in [s.value for s in AppointmentStatus]:
            data.pop("status", None)
        else:
            # Status transition side effects
            if new_status == AppointmentStatus.in_progress.value and appointment.status == AppointmentStatus.pending:
                pass  # future: log transition
            if new_status == AppointmentStatus.completed.value:
                data.setdefault("completed_at", now)
            if new_status == AppointmentStatus.cancelled.value:
                data.setdefault("cancelled_at", now)

    for k, v in data.items():
        setattr(appointment, k, v)

    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


def cancel_appointment(db: Session, appointment: Appointment, reason: str | None = None) -> Appointment:
    now = datetime.now(timezone.utc)
    appointment.status = AppointmentStatus.cancelled
    appointment.cancelled_at = now
    appointment.cancel_reason = reason
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


def delete_appointment(db: Session, appointment: Appointment) -> None:
    db.delete(appointment)
    db.commit()


def link_appointments_to_user(db: Session, user_email: str | None = None, user_phone: str | None = None, user_id: int | None = None) -> int:
    """Bulk update: eşleşen email veya telefon ile user_id boş olan kayıtları kullanıcıya bağla.
    Returns updated row count (approx)."""
    if not user_id:
        return 0
    filters = []
    if user_email:
        filters.append(Appointment.customer_email == user_email)
    if user_phone:
        filters.append(Appointment.customer_phone == user_phone)
    if not filters:
        return 0
    stmt = select(Appointment).where(Appointment.user_id.is_(None), (filters[0] if len(filters)==1 else (filters[0] | filters[1])))
    matched = db.scalars(stmt).all()
    for appt in matched:
        appt.user_id = user_id
        db.add(appt)
    db.commit()
    return len(matched)
