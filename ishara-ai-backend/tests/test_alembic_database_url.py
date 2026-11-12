import pytest

import migrations.database_url as database_url


def test_online_url_uses_database_url_after_dotenv_loader(monkeypatch):
    configured_url = "postgresql://db.invalid/ishara_ai"
    monkeypatch.delenv("DATABASE_URL", raising=False)
    loader_calls = []

    def load_test_configuration():
        loader_calls.append(True)
        monkeypatch.setenv("DATABASE_URL", configured_url)

    monkeypatch.setattr(database_url, "load_dotenv", load_test_configuration)

    assert database_url.get_online_database_url() == configured_url
    assert loader_calls == [True]


def test_online_url_missing_error_is_safe_and_does_not_expose_credentials(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setattr(database_url, "load_dotenv", lambda: None)

    with pytest.raises(RuntimeError) as error:
        database_url.get_online_database_url()

    assert str(error.value) == "DATABASE_URL is required for online Alembic operations."
