"""
Aggregate model imports so Alembic can discover all tables during autogenerate.

By importing the submodules, their SQLAlchemy models register with Base.metadata.
"""

# Import modules to register models with SQLAlchemy metadata
from . import product  # noqa: F401
from . import category  # noqa: F401
from . import analytics  # noqa: F401

__all__ = [
    "product",
    "category",
    "analytics",
]
