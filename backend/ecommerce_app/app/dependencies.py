from fastapi import Header, HTTPException, Query
from .config import get_settings


def require_upload_api_key(x_api_key: str | None = Header(default=None, alias="X-API-Key"), api_key: str | None = Query(default=None)) -> None:
    """Require a valid API key for protected upload endpoints.

    Accepts either the `X-API-Key` header or `api_key` query param. If the configured
    key is missing in settings, deny all attempts (fail-safe). If provided but mismatch,
    return 403.
    """
    settings = get_settings()
    expected = settings.PRODUCT_UPLOAD_API_KEY
    if not expected:
        # No key configured → deny
        raise HTTPException(status_code=403, detail="Upload API key is not configured")
    provided = x_api_key or api_key
    if not provided or provided != expected:
        raise HTTPException(status_code=403, detail="Invalid or missing API key")
    # return None on success; dependency passes
