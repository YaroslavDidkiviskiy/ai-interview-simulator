"""Session API routes (placeholder)."""

from fastapi import APIRouter


router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.get("/")
async def list_sessions():
    return []

