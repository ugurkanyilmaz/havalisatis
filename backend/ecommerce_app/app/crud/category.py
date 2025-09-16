from sqlalchemy.orm import Session
from sqlalchemy import select
from ..models.category import Category
from ..schemas.category import CategoryCreate


def get_by_path(db: Session, path: str) -> Category | None:
    return db.scalar(select(Category).where(Category.path == path))


def get_by_id(db: Session, category_id: int) -> Category | None:
    return db.get(Category, category_id)


def ensure_hierarchy(db: Session, path: str) -> Category:
    """Ensure categories for a full path exist and return the leaf Category.
    Path format: "Parent > Child > Sub".
    """
    parts = [p.strip() for p in path.split('>') if p.strip()]
    current_parent = None
    current_path_parts: list[str] = []
    leaf: Category | None = None
    for part in parts:
        current_path_parts.append(part)
        current_path = ' > '.join(current_path_parts)
        cat = db.scalar(select(Category).where(Category.path == current_path))
        if not cat:
            cat = Category(name=part, parent_id=current_parent.id if current_parent else None, path=current_path)
            db.add(cat)
            db.flush()
        current_parent = cat
        leaf = cat
    db.commit()
    db.refresh(leaf)
    return leaf


def list_children(db: Session, parent_id: int | None = None) -> list[Category]:
    if parent_id is None:
        return db.scalars(select(Category).where(Category.parent_id == None).order_by(Category.name)).all()  # noqa: E711
    return db.scalars(select(Category).where(Category.parent_id == parent_id).order_by(Category.name)).all()


def collect_descendant_ids(db: Session, parent_id: int, include_self: bool = True) -> list[int]:
    """Return all descendant category IDs (breadth-first), optionally including the parent itself."""
    ids: list[int] = []
    if include_self:
        ids.append(parent_id)
    queue: list[int] = [parent_id]
    while queue:
        pid = queue.pop(0)
        children = db.scalars(select(Category.id).where(Category.parent_id == pid)).all()
        if not children:
            continue
        ids.extend(children)
        queue.extend(children)
    return ids
