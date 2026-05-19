"""Interview sessions API tests."""

import pytest

from tests.factories import VALID_PASSWORD


@pytest.mark.asyncio
class TestCreateSession:
    async def test_create_session_success(self, client, auth_headers, seeded_questions):
        response = await client.post(
            "/api/sessions/",
            headers=auth_headers,
            json={
                "role": "backend",
                "level": "junior",
                "interview_type": "technical",
                "total_questions": 2,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "active"
        assert data["total_questions"] == 2

    async def test_create_session_unauthorized(self, client, seeded_questions):
        response = await client.post(
            "/api/sessions/",
            json={
                "role": "backend",
                "level": "junior",
                "interview_type": "technical",
                "total_questions": 1,
            },
        )
        assert response.status_code == 401

    async def test_create_session_not_enough_questions(self, client, auth_headers):
        response = await client.post(
            "/api/sessions/",
            headers=auth_headers,
            json={
                "role": "backend",
                "level": "junior",
                "interview_type": "technical",
                "total_questions": 10,
            },
        )
        assert response.status_code == 400
        assert "Not enough questions" in response.json()["detail"]


@pytest.mark.asyncio
class TestSessionDetail:
    async def test_get_session_detail(self, client, auth_headers, seeded_questions):
        created = await client.post(
            "/api/sessions/",
            headers=auth_headers,
            json={
                "role": "backend",
                "level": "junior",
                "interview_type": "technical",
                "total_questions": 2,
            },
        )
        session_id = created.json()["id"]

        response = await client.get(f"/api/sessions/{session_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == session_id
        assert len(data["questions"]) == 2
        assert data["current_question"] is not None

    async def test_get_session_not_found(self, client, auth_headers):
        response = await client.get("/api/sessions/99999", headers=auth_headers)
        assert response.status_code == 404

    async def test_get_other_users_session_forbidden(
        self, client, registered_user, seeded_questions
    ):
        from app.auth.security import create_access_token

        owner_headers = {
            "Authorization": f"Bearer {create_access_token({'sub': registered_user.id, 'role': 'user'})}"
        }
        created = await client.post(
            "/api/sessions/",
            headers=owner_headers,
            json={
                "role": "backend",
                "level": "junior",
                "interview_type": "technical",
                "total_questions": 1,
            },
        )
        session_id = created.json()["id"]

        await client.post(
            "/auth/register",
            json={"email": "other@example.com", "password": VALID_PASSWORD},
        )
        other_login = await client.post(
            "/auth/login",
            data={"username": "other@example.com", "password": VALID_PASSWORD},
        )
        other_headers = {
            "Authorization": f"Bearer {other_login.json()['access_token']}"
        }

        response = await client.get(
            f"/api/sessions/{session_id}",
            headers=other_headers,
        )
        assert response.status_code == 403


@pytest.mark.asyncio
class TestQuestionFeedback:
    async def test_feedback_not_found_before_answer(
        self, client, auth_headers, seeded_questions
    ):
        created = await client.post(
            "/api/sessions/",
            headers=auth_headers,
            json={
                "role": "backend",
                "level": "junior",
                "interview_type": "technical",
                "total_questions": 1,
            },
        )
        session_id = created.json()["id"]
        detail = await client.get(f"/api/sessions/{session_id}", headers=auth_headers)
        question_id = detail.json()["questions"][0]["id"]

        response = await client.get(
            f"/api/sessions/{session_id}/questions/{question_id}/feedback",
            headers=auth_headers,
        )
        assert response.status_code == 404
