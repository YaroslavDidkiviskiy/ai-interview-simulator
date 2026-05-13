import string

from pydantic import Field, BaseModel, EmailStr, field_validator

from app.schemas.user import validate_password_complexity


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=20)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        return validate_password_complexity(v)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"