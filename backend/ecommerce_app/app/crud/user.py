from sqlalchemy.orm import Session
from sqlalchemy import select, func, delete, update
from ..models.user import User
from ..models.token import RefreshToken
from ..schemas.user import UserCreate, UserAddressUpdate
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
import secrets
from ..config import get_settings

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email))


def create_user(db: Session, user_in: UserCreate) -> User:
    user = User(
        email=user_in.email,
    phone=user_in.phone,
    full_name=getattr(user_in, 'full_name', None),
        hashed_password=hash_password(user_in.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not pwd_context.verify(password, user.hashed_password):
        return None
    return user


def update_user_address(db: Session, user: User, address_in: UserAddressUpdate) -> User:
    data = address_in.dict(exclude_unset=True)
    for k, v in data.items():
        setattr(user, k, v)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

# ---------------- Refresh Token Management ---------------- #

def create_refresh_token(db: Session, user_id: int, user_agent: str | None, ip: str | None) -> RefreshToken:
    token_plain = secrets.token_urlsafe(48)
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    rt = RefreshToken(user_id=user_id, token=token_plain, user_agent=user_agent, ip=ip, expires_at=expires_at)
    db.add(rt)
    db.commit()
    db.refresh(rt)
    return rt

def verify_refresh_token(db: Session, token: str) -> RefreshToken | None:
    rt = db.scalar(select(RefreshToken).where(RefreshToken.token == token, RefreshToken.is_revoked == False))
    if not rt:
        return None
    if rt.expires_at < datetime.now(timezone.utc):
        return None
    return rt

def revoke_refresh_token(db: Session, token: str):
    db.execute(update(RefreshToken).where(RefreshToken.token == token).values(is_revoked=True))
    db.commit()

def revoke_all_refresh_tokens_for_user(db: Session, user_id: int):
    db.execute(update(RefreshToken).where(RefreshToken.user_id == user_id, RefreshToken.is_revoked == False).values(is_revoked=True))
    db.commit()

# ---------------- Simple Login Rate Limiting (In-Memory Fallback) ---------------- #
_login_attempts: dict[str, list[datetime]] = {}

def register_login_attempt(identifier: str) -> None:
    now = datetime.now(timezone.utc)
    bucket = _login_attempts.setdefault(identifier, [])
    bucket.append(now)
    # Temizle pencere dışındakileri
    window_start = now - timedelta(seconds=settings.RATE_LIMIT_LOGIN_WINDOW_SECONDS)
    _login_attempts[identifier] = [t for t in bucket if t >= window_start]

def is_login_rate_limited(identifier: str) -> bool:
    bucket = _login_attempts.get(identifier, [])
    return len(bucket) >= settings.RATE_LIMIT_LOGIN_MAX_ATTEMPTS

