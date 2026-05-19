"""Answers API tests."""

import pytest


@pytest.mark.asyncio
class TestSubmitAnswer:
    async def test_submit_answer_success(self, client, auth_headers, seeded_questions):
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
        detail = await client.get(f"/api/sessions/{session_id}", headers=auth_headers)
        question_id = detail.json()["questions"][0]["id"]

        response = await client.post(
            f"/api/sessions/{session_id}/answers/",
            headers=auth_headers,
            json={"question_id": question_id, "text": "A thoughtful answer."},
        )
        assert response.status_code == 201
        data = response.json()
        assert "feedback" in data
        assert data["feedback"]["score"] == 8
        assert data["session_status"] == "active"

    async def test_submit_answer_completes_session(
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

        response = await client.post(
            f"/api/sessions/{session_id}/answers/",
            headers=auth_headers,
            json={"question_id": question_id, "text": "Final answer."},
        )
        assert response.status_code == 201
        assert response.json()["session_status"] == "completed"

        feedback_resp = await client.get(
            f"/api/sessions/{session_id}/questions/{question_id}/feedback",
            headers=auth_headers,
        )
        assert feedback_resp.status_code == 200
        assert feedback_resp.json()["question_id"] == question_id

    async def test_submit_duplicate_answer(self, client, auth_headers, seeded_questions):
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
        payload = {"question_id": question_id, "text": "First."}

        await client.post(
            f"/api/sessions/{session_id}/answers/",
            headers=auth_headers,
            json=payload,
        )
        again = await client.post(
            f"/api/sessions/{session_id}/answers/",
            headers=auth_headers,
            json=payload,
        )
        assert again.status_code == 400

    async def test_submit_answer_session_not_found(self, client, auth_headers):
        response = await client.post(
            "/api/sessions/99999/answers/",
            headers=auth_headers,
            json={"question_id": 1, "text": "answer"},
        )
        assert response.status_code == 404
