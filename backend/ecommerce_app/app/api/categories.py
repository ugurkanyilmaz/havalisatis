from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.category import CategoryOut
from ..crud.category import ensure_hierarchy, list_children, get_by_id, get_by_path

router = APIRouter()


@router.get('/', response_model=list[CategoryOut])
def list_root_or_children(parent_id: int | None = None, db: Session = Depends(get_db)):
    return list_children(db, parent_id)


@router.post('/upsert-path', response_model=CategoryOut)
def upsert_by_path(path: str, db: Session = Depends(get_db)):
    if not path or not path.strip():
        raise HTTPException(status_code=400, detail='Path gerekli')
    cat = ensure_hierarchy(db, path)
    return cat


@router.get('/by-id', response_model=CategoryOut | None)
def find_by_id(id: int, db: Session = Depends(get_db)):
    return get_by_id(db, id)


@router.get('/by-path', response_model=CategoryOut | None)
def find_by_path(path: str, db: Session = Depends(get_db)):
    if not path or not path.strip():
        return None
    return get_by_path(db, path)
