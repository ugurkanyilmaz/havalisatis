from __future__ import annotations

import time
import threading
from typing import Callable, Iterable

from starlette.types import ASGIApp, Receive, Scope, Send
from starlette.responses import JSONResponse


def _client_ip_from_scope(scope: Scope, trust_proxy: bool = True) -> str:
    """Best-effort client IP extraction.

    If trust_proxy is True, prefer standard proxy headers.
    """
    headers = {k.decode("latin1"): v.decode("latin1") for k, v in scope.get("headers", [])}
    if trust_proxy:
        # Common proxy headers (left-most IP is original client)
        for key in ("cf-connecting-ip", "x-real-ip", "x-forwarded-for"):
            if key in headers and headers[key].strip():
                if key == "x-forwarded-for":
                    return headers[key].split(",")[0].strip()
                return headers[key].strip()
    client = scope.get("client") or (None, 0)
    return (client[0] or "0.0.0.0")


class _FixedWindowStore:
    """Thread-safe in-memory fixed-window counters.

    Keys: (bucket_id) -> { window_start: int, count: int }
    Not suitable for multi-process or multi-instance use.
    """

    def __init__(self) -> None:
        self._data: dict[str, tuple[int, int]] = {}
        self._lock = threading.Lock()

    def incr(self, key: str, limit: int, window_seconds: int) -> tuple[int, int, int]:
        """Increment and return (count, limit, reset_ts).

        If window expired, reset counter and window.
        """
        now = int(time.time())
        win_start = now - (now % window_seconds)
        reset_ts = win_start + window_seconds
        with self._lock:
            cur = self._data.get(key)
            if not cur or cur[0] != win_start:
                self._data[key] = (win_start, 1)
                return 1, limit, reset_ts
            count = cur[1] + 1
            self._data[key] = (win_start, count)
            return count, limit, reset_ts


class RateLimitMiddleware:
    """Simple per-IP rate limiting middleware.

    - Fixed window strategy
    - Path-based policies (first match wins)
    - Adds X-RateLimit-* headers
    - Returns 429 JSON when exceeded

    NOT for production multi-instance without a shared store (e.g. Redis).
    """

    def __init__(
        self,
        app: ASGIApp,
        *,
        default_limit: int = 120,
        default_window_seconds: int = 60,
        trust_proxy_headers: bool = True,
        policies: Iterable[tuple[Callable[[Scope], bool], int, int]] | None = None,
    ) -> None:
        self.app = app
        self.default_limit = max(1, int(default_limit))
        self.default_window = max(1, int(default_window_seconds))
        self.trust_proxy = bool(trust_proxy_headers)
        self.policies = list(policies or [])
        self.store = _FixedWindowStore()

    def _select_policy(self, scope: Scope) -> tuple[int, int, str]:
        # Returns (limit, window_seconds, bucket_name)
        for matcher, limit, window in self.policies:
            try:
                if matcher(scope):
                    return max(1, int(limit)), max(1, int(window)), getattr(matcher, "__name__", "custom")
            except Exception:
                # Ignore matcher errors and continue
                continue
        return self.default_limit, self.default_window, "default"

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "") or ""
        method = scope.get("method", "GET")

        # Skip docs and health
        if path in ("/", "/api/health", "/docs", "/openapi.json", "/redoc"):
            await self.app(scope, receive, send)
            return

        # Determine policy
        limit, window_seconds, bucket_name = self._select_policy(scope)

        # Build bucket key by IP and policy bucket
        ip = _client_ip_from_scope(scope, trust_proxy=self.trust_proxy)
        bucket_key = f"ip:{ip}|bucket:{bucket_name}|m:{method}|p:{path.split('/', 3)[:3]}"

        count, lim, reset_ts = self.store.incr(bucket_key, limit, window_seconds)

        # Helper to inject headers
        def add_headers(headers: list[tuple[bytes, bytes]]) -> list[tuple[bytes, bytes]]:
            headers.append((b"x-ratelimit-limit", str(lim).encode()))
            headers.append((b"x-ratelimit-remaining", str(max(0, lim - count)).encode()))
            headers.append((b"x-ratelimit-reset", str(reset_ts).encode()))
            return headers

        if count > lim:
            # Too many requests
            resp = JSONResponse(
                {"detail": "Too Many Requests"}, status_code=429
            )
            # Manually send start + body to inject headers
            await send(
                {
                    "type": "http.response.start",
                    "status": resp.status_code,
                    "headers": add_headers(list(resp.raw_headers)),
                }
            )
            await send({"type": "http.response.body", "body": await resp.body()})
            return

        # Wrap send to inject headers into successful responses
        async def send_wrapper(message):
            if message.get("type") == "http.response.start":
                headers = list(message.get("headers") or [])
                message["headers"] = add_headers(headers)
            await send(message)

        await self.app(scope, receive, send_wrapper)


# Convenience matchers
def match_prefix(prefix: str) -> Callable[[Scope], bool]:
    def _m(scope: Scope) -> bool:
        return (scope.get("path") or "").startswith(prefix)
    _m.__name__ = f"prefix:{prefix}"
    return _m

def match_path(path: str) -> Callable[[Scope], bool]:
    def _m(scope: Scope) -> bool:
        return (scope.get("path") or "") == path
    _m.__name__ = f"path:{path}"
    return _m
