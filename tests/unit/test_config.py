"""Settings tests."""

from app.config import Settings, get_settings


def test_settings_defaults(monkeypatch):
    monkeypatch.delenv("APP_NAME", raising=False)
    get_settings.cache_clear()
    s = Settings(_env_file=None)
    assert s.app_name == "AI Interview Simulator"
    assert s.access_expire_min == 30
    assert s.refresh_expire_days == 7


def test_get_settings_cached():
    get_settings.cache_clear()
    a = get_settings()
    b = get_settings()
    assert a is b
