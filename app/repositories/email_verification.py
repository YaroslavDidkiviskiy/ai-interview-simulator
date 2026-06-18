import secrets
from redis.asyncio import Redis
from functools import lru_cache

from app.config import get_settings


VERIFICATION_TTL = 15 * 60

def get_redis() -> Redis:
    settings = get_settings()
    return Redis.from_url(settings.redis_url, decode_responses=True)


class EmailVerificationRepository:
    def __init__(self, redis: Redis, prefix: str) -> None:
        self._redis = redis
        self._prefix = prefix

    def _key(self, user_id: str) -> str:
        return f"{self._prefix}:{user_id}"

    def generate_code(self) -> str:
        return str(secrets.randbelow(900000) + 100000)  # 100000-999999

    async def save_code(self, user_id: str, code: str) -> None:
        await self._redis.setex(self._key(user_id), VERIFICATION_TTL, code)

    async def get_code(self, user_id: str) -> str | None:
        return await self._redis.get(self._key(user_id))

    async def delete_code(self, user_id: str) -> None:
        await self._redis.delete(self._key(user_id))

@lru_cache
def get_email_verification_repo() -> EmailVerificationRepository:
    return EmailVerificationRepository(get_redis(), "email_verification")

@lru_cache
def get_account_delete_verification_repo() -> EmailVerificationRepository:
    return EmailVerificationRepository(get_redis(), "account_delete_verification")