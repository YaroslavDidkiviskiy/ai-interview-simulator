import secrets
import hashlib
from datetime import datetime, timedelta, timezone

from jose import jwt, JWTError
from passlib.context import CryptContext

from app.config import get_settings

settings = get_settings()
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    prehashed = hashlib.sha256(password.encode()).hexdigest()
    return pwd_ctx.hash(prehashed)


def verify_password(password: str, hashed_password: str) -> bool:
    prehashed = hashlib.sha256(password.encode()).hexdigest()
    return pwd_ctx.verify(prehashed, hashed_password)


def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload.update({
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.access_expire_min),
        "iat": datetime.now(timezone.utc),
        "type": "access",
    })
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def create_refresh_token() -> str:
    return secrets.token_urlsafe(32)


def decode_access_token(token: str) -> dict:
    payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    if payload.get("type") != "access":
        raise JWTError("Invalid token type")
    return payload
