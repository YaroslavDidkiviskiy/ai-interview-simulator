from fastapi import FastAPI

from app.config import get_settings
from app.auth.router import router as auth_router
from app.routers import sessions_router, answers_router, health_router

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    version="0.2.0",
    redirect_slashes=False
)

app.include_router(sessions_router)
app.include_router(answers_router)
app.include_router(health_router)
app.include_router(auth_router)
