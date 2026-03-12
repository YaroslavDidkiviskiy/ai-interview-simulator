from fastapi import FastAPI

from app.config import get_settings
from app.routers import sessions_router

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    version="0.1.0",
)

app.include_router(sessions_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
