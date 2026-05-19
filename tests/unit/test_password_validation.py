"""Tests for password complexity rules."""

import pytest
from pydantic import ValidationError

from app.auth.schemas import RegisterRequest
from app.schemas.user import (
    ChangePasswordRequest,
    SetPasswordRequest,
    validate_password_complexity,
)


class TestValidatePasswordComplexity:
    def test_valid_password(self):
        assert validate_password_complexity("GoodPass1!") == "GoodPass1!"

    def test_missing_uppercase(self):
        with pytest.raises(ValueError, match="uppercase"):
            validate_password_complexity("lowpass1!")

    def test_missing_digit(self):
        with pytest.raises(ValueError, match="number"):
            validate_password_complexity("NoDigits!!")

    def test_missing_punctuation(self):
        with pytest.raises(ValueError, match="punctuation"):
            validate_password_complexity("NoPunct1A")


class TestRegisterRequestSchema:
    def test_valid_register(self):
        req = RegisterRequest(email="a@b.com", password="ValidPass1!")
        assert req.email == "a@b.com"

    def test_invalid_email(self):
        with pytest.raises(ValidationError):
            RegisterRequest(email="not-email", password="ValidPass1!")

    def test_short_password(self):
        with pytest.raises(ValidationError):
            RegisterRequest(email="a@b.com", password="Ab1!")

    def test_weak_password_complexity(self):
        with pytest.raises(ValidationError):
            RegisterRequest(email="a@b.com", password="alllowercase1")


class TestChangePasswordSchema:
    def test_valid_change(self):
        req = ChangePasswordRequest(
            current_password="OldPass1!",
            new_password="NewPass2@",
        )
        assert req.new_password == "NewPass2@"

    def test_weak_new_password(self):
        with pytest.raises(ValidationError):
            ChangePasswordRequest(current_password="OldPass1!", new_password="weak")


class TestSetPasswordSchema:
    def test_valid_set(self):
        req = SetPasswordRequest(password="ValidPass1!")
        assert req.password == "ValidPass1!"
