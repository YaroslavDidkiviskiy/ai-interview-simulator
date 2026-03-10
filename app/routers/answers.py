"""Answer API routes (placeholder)."""

from fastapi import APIRouter


router = APIRouter(prefix="/answers", tags=["answers"])


@router.get("/")
async def list_answers():
    return []

