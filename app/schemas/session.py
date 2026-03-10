"""Session schemas."""

from datetime import datetime

from pydantic import BaseModel


class SessionBase(BaseModel):
    candidate_name: str
    role: str


class SessionCreate(SessionBase):
    pass


class SessionRead(SessionBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True

