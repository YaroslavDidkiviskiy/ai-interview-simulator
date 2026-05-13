from pydantic import BaseModel, Field, field_validator
import string

def validate_password_complexity(v: str) -> str:
    if not any(c.isupper() for c in v):
        raise ValueError("Password must contain at least one uppercase letter")
    if not any(c.isdigit() for c in v):
        raise ValueError("Password must contain at least 1 number")
    if not any(c in string.punctuation for c in v):
        raise ValueError("Password must contain at least one punctuation symbol")
    return v

class MeResponse(BaseModel):
    id: str
    email: str
    role: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=20)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        return validate_password_complexity(v)
