from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db
from app.auth.models import RefreshToken, User
from app.auth.schemas import LoginResponse, RegisterRequest
from app.auth.security import (
    create_access_token, create_refresh_token,
    hash_password, verify_password,
)
from app.auth.dependencies import get_current_user

settings = get_settings()
router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(email=body.email, password=hash_password(body.password))
    db.add(user)
    db.commit()
    return {"id": user.id, "email": user.email}


@router.post("/login", response_model=LoginResponse)
def login(
    response: Response,
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == form.username).first()

    if not user or not verify_password(form.password, user.password):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Inactive user")

    access_token = create_access_token({
        "sub": user.id,
        "role": user.role.value
    })
    refresh_token = create_refresh_token()

    db.add(RefreshToken(
        token=refresh_token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.refresh_expire_days),
        user_id=user.id,
    ))
    db.commit()

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=not settings.debug,
        samesite="lax",
        max_age=settings.refresh_expire_days * 86400,
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/refresh", response_model=LoginResponse)
def refresh(
    response: Response,
    refresh_token: Annotated[str | None, Cookie()] = None,
    db: Session = Depends(get_db)
):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token not found")

    db_token = db.query(RefreshToken).filter(
        RefreshToken.token == refresh_token,
        RefreshToken.revoked == False,
    ).first()

    if not db_token or db_token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = db_token.user

    db_token.revoked = True
    new_refresh_token = create_refresh_token()
    db.add(RefreshToken(
        token=new_refresh_token,
        user_id=user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.refresh_expire_days),
    ))
    db.commit()

    access_token = create_access_token({
        "sub": user.id,
        "role": user.role.value
    })

    response.set_cookie(
        "refresh_token", new_refresh_token,
        httponly=True, secure=not settings.debug,
        samesite="lax", max_age=settings.refresh_expire_days * 86400
    )

    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
def logout(
    response: Response,
    refresh_token: Annotated[str | None, Cookie()] = None,
    db: Session = Depends(get_db),
):
    if refresh_token:
        db_token = db.query(RefreshToken).filter(
            RefreshToken.token == refresh_token
        ).first()

        if db_token:
            db_token.revoked = True
            db.commit()

    response.delete_cookie("refresh_token")
    return {"ok": True}
