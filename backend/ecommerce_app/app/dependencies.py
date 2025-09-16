from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from .config import get_settings
from .database import get_db
from .models.user import User
from sqlalchemy import select

settings = get_settings()
security_scheme = HTTPBearer(auto_error=False)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token gerekli")
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        subject: str | None = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Geçersiz token")
    if subject is None:
        raise HTTPException(status_code=401, detail="Kimlik doğrulama başarısız")
    user = db.scalar(select(User).where(User.email == subject))
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    return user

def admin_required(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Yetkisiz")
    return current_user
