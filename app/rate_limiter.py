import random
from functools import lru_cache
from time import time
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from redis.asyncio import Redis

from app.config import get_settings


def get_redis() -> Redis:
    settings = get_settings()
    return Redis.from_url(settings.redis_url, decode_responses=True)


class RateLimiter:
    def __init__(self, redis: Redis) -> None:
        self._redis = redis

    async def is_limited(
        self,
        ip_address: str,
        endpoint: str,
        max_requests: int,
        window_seconds: int,
    ) -> bool:
        key = f"rate_limiter:{endpoint}:{ip_address}"
        current_ms = time() * 1000
        window_start = current_ms - window_seconds * 1000
        current_request = f"{current_ms} {random.randint(0, 100_000)}"

        async with self._redis.pipeline() as pipe:
            await pipe.zremrangebyscore(key, 0, window_start)
            await pipe.zcard(key)
            await pipe.zadd(key, {current_request: current_ms})
            await pipe.expire(key, window_seconds)
            results = await pipe.execute()

        _, current_request_count, _, _ = results
        return current_request_count >= max_requests


@lru_cache
def get_rate_limiter() -> RateLimiter:
    return RateLimiter(get_redis())


def rate_limiter_factory(endpoint: str, max_requests: int, window_seconds: int):
    async def dependency(
        request: Request,
        rate_limiter: Annotated[RateLimiter, Depends(get_rate_limiter)],
    ):
        ip = request.client.host if request.client else "unknown"
        if await rate_limiter.is_limited(ip, endpoint, max_requests, window_seconds):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please slow down.",
            )
        return True
    return dependency


# ── pre-configured limits ─────────────────────────────────────────────────────
rate_limit_login = rate_limiter_factory("login",    3, 60)   # 3 req/m
rate_limit_register = rate_limiter_factory("register", 3,  60)   # 3 req/m
rate_limit_answers  = rate_limiter_factory("answers",  4, 60)   # 4 req/m
