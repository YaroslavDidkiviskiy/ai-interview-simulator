"""Users API tests."""

import pytest

from tests.factories import VALID_PASSWORD


@pytest.mark.asyncio
class TestMe:
    async def test_me_authenticated(self, client, registered_user, auth_headers):
        response = await client.get("/api/users/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == registered_user.email
        assert data["has_password"] is True

    async def test_me_unauthorized(self, client):
        response = await client.get("/api/users/me")
        assert response.status_code == 401


@pytest.mark.asyncio
class TestPassword:
    async def test_change_password_success(self, client, registered_user, auth_headers):
        response = await client.put(
            "/api/users/me/password",
            headers=auth_headers,
            json={"current_password": VALID_PASSWORD, "new_password": "NewPass2@"},
        )
        assert response.status_code == 200
        assert response.json()["ok"] is True

        login = await client.post(
            "/auth/login",
            data={"username": registered_user.email, "password": "NewPass2@"},
        )
        assert login.status_code == 200

    async def test_change_password_wrong_current(self, client, auth_headers):
        response = await client.put(
            "/api/users/me/password",
            headers=auth_headers,
            json={"current_password": "WrongPass1!", "new_password": "NewPass2@"},
        )
        assert response.status_code == 400

    async def test_change_password_same_as_current(self, client, auth_headers):
        response = await client.put(
            "/api/users/me/password",
            headers=auth_headers,
            json={"current_password": VALID_PASSWORD, "new_password": VALID_PASSWORD},
        )
        assert response.status_code == 400


@pytest.mark.asyncio
class TestSessionsList:
    async def test_my_sessions_empty(self, client, auth_headers):
        response = await client.get("/api/users/me/sessions", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []

    async def test_my_sessions_pagination(self, client, auth_headers, seeded_questions):
        for _ in range(2):
            await client.post(
                "/api/sessions/",
                headers=auth_headers,
                json={
                    "role": "backend",
                    "level": "junior",
                    "interview_type": "technical",
                    "total_questions": 1,
                },
            )
        response = await client.get(
            "/api/users/me/sessions?page=1&limit=1",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert len(response.json()) == 1


@pytest.mark.asyncio
class TestStats:
    async def test_my_stats_initial(self, client, auth_headers):
        response = await client.get("/api/users/me/stats", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total_sessions"] == 0
        assert data["completed_sessions"] == 0
        assert "achievements" in data
        assert len(data["achievements"]) == 6
