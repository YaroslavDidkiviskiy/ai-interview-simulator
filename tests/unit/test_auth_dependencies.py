"""Auth dependency tests."""

import pytest
from fastapi import HTTPException
from jose import jwt

from app.auth.dependencies import get_current_user, require_role
from app.auth.models import Role, User
from app.auth.security import ALGORITHM, create_access_token
from app.config import get_settings

settings = get_settings()


@pytest.mark.asyncio
class TestGetCurrentUser:
    async def test_valid_token_returns_user(self, db_session, registered_user):
        token = create_access_token({"sub": registered_user.id, "role": registered_user.role.value})
        user = await get_current_user(token=token, db=db_session)
        assert user.id == registered_user.id

    async def test_invalid_token_raises_401(self, db_session):
        with pytest.raises(HTTPException) as exc:
            await get_current_user(token="invalid.token.here", db=db_session)
        assert exc.value.status_code == 401

    async def test_missing_user_raises_401(self, db_session):
        token = create_access_token({"sub": "nonexistent-id", "role": "user"})
        with pytest.raises(HTTPException) as exc:
            await get_current_user(token=token, db=db_session)
        assert exc.value.status_code == 401

    async def test_inactive_user_raises_401(self, db_session):
        from tests.factories import make_user

        inactive = make_user(email="inactive@example.com", is_active=False)
        db_session.add(inactive)
        await db_session.commit()
        await db_session.refresh(inactive)

        token = create_access_token({"sub": inactive.id, "role": inactive.role.value})
        with pytest.raises(HTTPException) as exc:
            await get_current_user(token=token, db=db_session)
        assert exc.value.status_code == 401


@pytest.mark.asyncio
class TestRequireRole:
    async def test_allowed_role_passes(self, registered_user):
        checker = require_role(Role.user)
        result = await checker(current_user=registered_user)
        assert result.id == registered_user.id

    async def test_forbidden_role_raises_403(self, registered_user):
        checker = require_role(Role.admin)
        with pytest.raises(HTTPException) as exc:
            await checker(current_user=registered_user)
        assert exc.value.status_code == 403
