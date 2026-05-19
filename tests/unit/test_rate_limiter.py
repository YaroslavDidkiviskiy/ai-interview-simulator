"""Rate limiter tests."""

import pytest
from fakeredis import aioredis as fakeredis_aioredis

from app.rate_limiter import RateLimiter


@pytest.mark.asyncio
class TestRateLimiter:
    async def test_not_limited_under_threshold(self):
        redis = fakeredis_aioredis.FakeRedis(decode_responses=True)
        limiter = RateLimiter(redis)
        for _ in range(2):
            limited = await limiter.is_limited("1.2.3.4", "test-endpoint", 3, 60)
            assert limited is False

    async def test_limited_at_threshold(self):
        redis = fakeredis_aioredis.FakeRedis(decode_responses=True)
        limiter = RateLimiter(redis)
        results = []
        for _ in range(4):
            results.append(
                await limiter.is_limited("9.9.9.9", "strict-endpoint", 3, 60)
            )
        assert results[:3] == [False, False, False]
        assert results[3] is True

    async def test_different_ips_are_independent(self):
        redis = fakeredis_aioredis.FakeRedis(decode_responses=True)
        limiter = RateLimiter(redis)
        for _ in range(3):
            await limiter.is_limited("10.0.0.1", "shared", 3, 60)
        limited_other = await limiter.is_limited("10.0.0.2", "shared", 3, 60)
        assert limited_other is False

        await redis.aclose()
