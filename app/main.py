from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.config import get_settings
from app.auth.router import router as auth_router
from app.auth.oauth import router as oauth_router
from app.routers import sessions_router, answers_router, health_router, users_router, stats_router
from app.rate_limiter import get_redis


settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    redis = get_redis()
    await redis.ping()
    print("Redis connected")
    yield
    await redis.aclose()
    print("Redis disconnected")


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    version="0.2.0",
    redirect_slashes=False,
    lifespan=lifespan
)

app.include_router(sessions_router)
app.include_router(answers_router)
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(oauth_router)
app.include_router(users_router)
app.include_router(stats_router)
