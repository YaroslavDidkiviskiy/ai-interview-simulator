from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.logging import get_logger
from app.logging.config import setup_logging
from app.config import get_settings
from app.auth.router import router as auth_router
from app.auth.oauth import router as oauth_router
from app.routers import sessions_router, answers_router, health_router, users_router, stats_router
from app.rate_limiter import get_redis


settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging(debug=settings.debug)
    logger = get_logger(__name__)

    redis = get_redis()
    await redis.ping()
    logger.info("redis_connected", url=settings.redis_url)

    yield
    await redis.aclose()
    logger.info("redis_disconnected")


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    version="0.2.0",
    redirect_slashes=False,
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger = get_logger(__name__)
    logger.error(
        "unhandled_exception",
        method=request.method,
        path=request.url.path,
        error=str(exc),
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


app.include_router(sessions_router)
app.include_router(answers_router)
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(oauth_router)
app.include_router(users_router)
app.include_router(stats_router)
