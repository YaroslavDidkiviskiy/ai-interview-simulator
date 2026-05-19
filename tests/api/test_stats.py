"""Public stats API tests."""

import pytest


@pytest.mark.asyncio
async def test_public_stats_empty(client):
    response = await client.get("/api/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["total_questions"] == 0
    assert data["total_sessions"] == 0
    assert data["total_answers"] == 0


@pytest.mark.asyncio
async def test_public_stats_after_activity(
    client, auth_headers, seeded_questions
):
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
    response = await client.get("/api/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["total_questions"] >= 5
    assert data["total_sessions"] >= 1
