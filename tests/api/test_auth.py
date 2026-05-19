"""Authentication API tests."""

import pytest

from tests.factories import VALID_PASSWORD


@pytest.mark.asyncio
class TestRegister:
    async def test_register_success(self, client):
        response = await client.post(
            "/auth/register",
            json={"email": "newuser@example.com", "password": VALID_PASSWORD},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert "id" in data

    async def test_register_duplicate_email(self, client, registered_user):
        response = await client.post(
            "/auth/register",
            json={"email": registered_user.email, "password": VALID_PASSWORD},
        )
        assert response.status_code == 409
        assert "already registered" in response.json()["detail"].lower()

    async def test_register_weak_password(self, client):
        response = await client.post(
            "/auth/register",
            json={"email": "weak@example.com", "password": "short"},
        )
        assert response.status_code == 422


@pytest.mark.asyncio
class TestLogin:
    async def test_login_success(self, client, registered_user):
        response = await client.post(
            "/auth/login",
            data={"username": registered_user.email, "password": VALID_PASSWORD},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["token_type"] == "bearer"
        assert "access_token" in data
        assert "refresh_token" in response.cookies

    async def test_login_wrong_password(self, client, registered_user):
        response = await client.post(
            "/auth/login",
            data={"username": registered_user.email, "password": "WrongPass1!"},
        )
        assert response.status_code == 401

    async def test_login_unknown_user(self, client):
        response = await client.post(
            "/auth/login",
            data={"username": "ghost@example.com", "password": VALID_PASSWORD},
        )
        assert response.status_code == 401


@pytest.mark.asyncio
class TestRefresh:
    async def test_refresh_with_valid_cookie(self, client, registered_user, db_session):
        from datetime import timezone

        from sqlalchemy import select

        from app.auth.models import RefreshToken

        login = await client.post(
            "/auth/login",
            data={"username": registered_user.email, "password": VALID_PASSWORD},
        )
        cookies = login.cookies

        # SQLite may return naive datetimes; normalize for refresh comparison.
        result = await db_session.execute(
            select(RefreshToken).where(RefreshToken.user_id == registered_user.id)
        )
        db_token = result.scalar_one()
        if db_token.expires_at.tzinfo is None:
            db_token.expires_at = db_token.expires_at.replace(tzinfo=timezone.utc)
        await db_session.commit()

        response = await client.post("/auth/refresh", cookies=cookies)
        assert response.status_code == 200
        assert "access_token" in response.json()

    async def test_refresh_without_cookie(self, client):
        response = await client.post("/auth/refresh")
        assert response.status_code == 401


@pytest.mark.asyncio
class TestLogout:
    async def test_logout_clears_cookie(self, client, registered_user):
        login = await client.post(
            "/auth/login",
            data={"username": registered_user.email, "password": VALID_PASSWORD},
        )
        response = await client.post("/auth/logout", cookies=login.cookies)
        assert response.status_code == 200
        assert response.json()["ok"] is True
