import httpx
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db import get_db
from app.logging import get_logger
from app.auth.models import AuthProvider, User, RefreshToken
from app.auth.security import create_access_token, create_refresh_token

settings = get_settings()
router = APIRouter(prefix="/auth", tags=["oauth"])

logger = get_logger(__name__)

GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_EMAILS_URL = "https://api.github.com/user/emails"

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USER_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

FRONTEND_URL = settings.frontend_url

_hostname = urlparse(settings.frontend_url).hostname

if _hostname in ("localhost", "127.0.0.1"):
    COOKIE_DOMAIN = None
else:
    COOKIE_DOMAIN = f".{_hostname}"


async def _redirect_with_tokens(user: User, db: AsyncSession) -> RedirectResponse:
    logger.info(
        "oauth_token_generation_started",
        user_id=user.id,
        provider=user.auth_provider,
    )

    access_token = create_access_token(
        {"sub": user.id, "role": user.role.value}
    )
    refresh_token = create_refresh_token()

    db.add(
        RefreshToken(
            token=refresh_token,
            user_id=user.id,
            expires_at=datetime.now(timezone.utc)
            + timedelta(days=settings.refresh_expire_days),
        )
    )

    await db.commit()

    logger.info(
        "oauth_login_success",
        user_id=user.id,
        provider=user.auth_provider,
    )

    response = RedirectResponse(
        url=FRONTEND_URL,
        status_code=302,
    )

    response.set_cookie(
        key="oauth_access_token",
        value=access_token,
        httponly=False,
        secure=not settings.debug,
        samesite="lax",
        max_age=60 * 30,
        path="/",
        domain=COOKIE_DOMAIN,
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=not settings.debug,
        samesite="lax",
        max_age=settings.refresh_expire_days * 86400,
        path="/",
        domain=COOKIE_DOMAIN,
    )

    return response


async def _get_or_create_user(
    db: AsyncSession,
    email: str,
    provider: str,
) -> User:
    result = await db.execute(
        select(User).where(User.email == email)
    )
    user = result.scalar_one_or_none()

    if not user:
        logger.info(
            "oauth_user_creation_started",
            email=email,
            provider=provider,
        )

        user = User(
            email=email,
            password=None,
            auth_provider=provider,
        )

        db.add(user)
        await db.commit()
        await db.refresh(user)

        logger.info(
            "oauth_user_created",
            user_id=user.id,
            email=email,
            provider=provider,
        )

    return user


# ── GitHub ────────────────────────────────────────────────────────────────────

@router.get("/github")
def github_login():
    logger.info("github_oauth_started")

    params = (
        f"client_id={settings.oauth_github_client_id}"
        f"&scope=user:email"
        f"&allow_signup=true"
    )

    return RedirectResponse(f"{GITHUB_AUTH_URL}?{params}")


@router.get("/github/callback")
async def github_callback(
    code: str,
    db: AsyncSession = Depends(get_db),
):
    logger.info("github_oauth_callback_received")

    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            GITHUB_TOKEN_URL,
            data={
                "client_id": settings.oauth_github_client_id,
                "client_secret": settings.oauth_github_client_secret,
                "code": code,
            },
            headers={"Accept": "application/json"},
        )

    gh_token = token_res.json().get("access_token")

    if not gh_token:
        logger.warning("github_oauth_token_missing")
        raise HTTPException(400, "GitHub OAuth failed")

    async with httpx.AsyncClient() as client:
        emails_res = await client.get(
            GITHUB_EMAILS_URL,
            headers={"Authorization": f"Bearer {gh_token}"},
        )

    emails = emails_res.json()

    primary = next(
        (
            e["email"]
            for e in emails
            if e.get("primary") and e.get("verified")
        ),
        None,
    )

    if not primary:
        logger.warning("github_oauth_verified_email_missing")
        raise HTTPException(400, "No verified email on GitHub account")

    logger.info("github_oauth_user_authenticated", email=primary)

    user = await _get_or_create_user(db, primary, AuthProvider.github)

    return await _redirect_with_tokens(user, db)


# ── Google ────────────────────────────────────────────────────────────────────

@router.get("/google")
def google_login():
    logger.info("google_oauth_started")

    params = (
        f"client_id={settings.google_client_id}"
        f"&redirect_uri={settings.backend_url}/auth/google/callback"
        f"&response_type=code"
        f"&scope=openid email profile"
        f"&access_type=offline"
    )

    return RedirectResponse(f"{GOOGLE_AUTH_URL}?{params}")


@router.get("/google/callback")
async def google_callback(
    code: str,
    db: AsyncSession = Depends(get_db),
):
    logger.info("google_oauth_callback_received")

    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": f"{settings.backend_url}/auth/google/callback",
            },
        )

    google_token = token_res.json().get("access_token")

    if not google_token:
        logger.warning("google_oauth_token_missing")
        raise HTTPException(400, "Google OAuth failed")

    async with httpx.AsyncClient() as client:
        user_res = await client.get(
            GOOGLE_USER_URL,
            headers={"Authorization": f"Bearer {google_token}"},
        )

    email = user_res.json().get("email")

    if not email:
        logger.warning("google_oauth_email_missing")
        raise HTTPException(400, "No email from Google account")

    logger.info("google_oauth_user_authenticated", email=email)

    user = await _get_or_create_user(db, email, AuthProvider.google)

    return await _redirect_with_tokens(user, db)