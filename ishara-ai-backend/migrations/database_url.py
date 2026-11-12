import os

from dotenv import load_dotenv


def get_online_database_url() -> str:
    """Load backend environment configuration and require its database URL."""
    load_dotenv()
    database_url = os.environ.get("DATABASE_URL")
    if not database_url or not database_url.strip():
        raise RuntimeError(
            "DATABASE_URL is required for online Alembic operations."
        )
    return database_url
