from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from jose import jwt

from ..schemas.user import (
    UserCreate, UserLogin, UserOut, UserAddressUpdate,
    TokenPair, RefreshRequest, LogoutRequest
)
from ..crud.user import (
    create_user, authenticate, get_user_by_email, update_user_address,
    create_refresh_token, verify_refresh_token, revoke_refresh_token, revoke_all_refresh_tokens_for_user,
    register_login_attempt, is_login_rate_limited
)
from ..crud.appointment import link_appointments_to_user
from ..database import get_db
from ..dependencies import get_current_user
from ..config import get_settings

router = APIRouter()
settings = get_settings()

@router.post('/register', response_model=UserOut)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Email uniqueness
    if get_user_by_email(db, user_in.email):
        raise HTTPException(status_code=400, detail='Email zaten kayıtlı')
    # Create
    user = create_user(db, user_in)
    # Link previous appointments if exist
    try:
        link_appointments_to_user(db, user_email=user.email, user_phone=user.phone, user_id=user.id)
    except Exception:
        pass
    return user

@router.post('/login', response_model=TokenPair)
def login(login_in: UserLogin, request: Request, db: Session = Depends(get_db)):
    identifier = login_in.email.lower()
    if is_login_rate_limited(identifier):
        raise HTTPException(status_code=429, detail='Çok fazla deneme. Lütfen birkaç dakika sonra tekrar deneyin.')
    user = authenticate(db, login_in.email, login_in.password)
    if not user:
        register_login_attempt(identifier)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Hatalı giriş')
    # Başarılı girişte attempts sıfırlama (basitçe dict den sil)
    if identifier in globals().get('_login_attempts', {}):
        try:
            globals()['_login_attempts'].pop(identifier, None)
        except Exception:
            pass
    access_exp = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = jwt.encode({'sub': user.email, 'exp': access_exp}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    refresh = create_refresh_token(db, user_id=user.id, user_agent=request.headers.get('user-agent'), ip=request.client.host if request.client else None)
    return TokenPair(
        access_token=access_token,
        refresh_token=refresh.token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

@router.post('/refresh', response_model=TokenPair)
def refresh_token(data: RefreshRequest, db: Session = Depends(get_db)):
    rt = verify_refresh_token(db, data.refresh_token)
    if not rt:
        raise HTTPException(status_code=401, detail='Geçersiz veya süresi dolmuş refresh token')
    user = rt.user
    access_exp = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = jwt.encode({'sub': user.email, 'exp': access_exp}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    # Opsiyonel: Rotation – eski refresh revoke edip yeni üret
    revoke_refresh_token(db, rt.token)
    new_rt = create_refresh_token(db, user_id=user.id, user_agent=None, ip=None)
    return TokenPair(access_token=access_token, refresh_token=new_rt.token, expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)

@router.post('/logout')
def logout(data: LogoutRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if data.refresh_token:
        revoke_refresh_token(db, data.refresh_token)
    else:
        revoke_all_refresh_tokens_for_user(db, current_user.id)
    return { 'detail': 'Çıkış yapıldı' }

@router.put('/address', response_model=UserOut)
def set_address(address_in: UserAddressUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    updated = update_user_address(db, current_user, address_in)
    return updated

@router.get('/me', response_model=UserOut)
def me(current_user=Depends(get_current_user)):
    return current_user
