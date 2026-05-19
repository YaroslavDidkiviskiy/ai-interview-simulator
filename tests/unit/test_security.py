"""Tests for JWT and password helpers."""

from datetime import datetime, timedelta, timezone

import pytest
from jose import JWTError, jwt

from app.auth.security import (
    ALGORITHM,
    create_access_token,
    create_refresh_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.config import get_settings

settings = get_settings()


class TestPasswordHashing:
    def test_hash_and_verify_success(self):
        hashed = hash_password("SecretPass1!")
        assert hashed != "SecretPass1!"
        assert verify_password("SecretPass1!", hashed)

    def test_verify_wrong_password(self):
        hashed = hash_password("SecretPass1!")
        assert not verify_password("WrongPass1!", hashed)

    def test_verify_invalid_hash_returns_false(self):
        assert not verify_password("any", "not-a-valid-argon2-hash")

    def test_same_password_produces_different_hashes(self):
        h1 = hash_password("SamePass1!")
        h2 = hash_password("SamePass1!")
        assert h1 != h2


class TestAccessToken:
    def test_create_and_decode_roundtrip(self):
        token = create_access_token({"sub": "user-123", "role": "user"})
        payload = decode_access_token(token)
        assert payload["sub"] == "user-123"
        assert payload["role"] == "user"
        assert payload["type"] == "access"
        assert "exp" in payload
        assert "iat" in payload

    def test_decode_rejects_wrong_token_type(self):
        payload = {
            "sub": "user-123",
            "type": "refresh",
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        }
        token = jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)
        with pytest.raises(JWTError):
            decode_access_token(token)

    def test_decode_rejects_expired_token(self):
        token = create_access_token({"sub": "user-123", "role": "user"})
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        payload["exp"] = datetime.now(timezone.utc) - timedelta(seconds=1)
        expired = jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)
        with pytest.raises(JWTError):
            decode_access_token(expired)


class TestRefreshToken:
    def test_create_refresh_token_is_unique(self):
        t1 = create_refresh_token()
        t2 = create_refresh_token()
        assert t1 != t2
        assert len(t1) > 20
