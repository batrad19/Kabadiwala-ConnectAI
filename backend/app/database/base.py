"""SQLAlchemy declarative base and engine setup."""

from __future__ import annotations
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

logger = logging.getLogger(__name__)

db_url = settings.DATABASE_URL
engine_kwargs = {"echo": settings.DEBUG}

if db_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    try:
        import psycopg2  # noqa: F401
        engine_kwargs.update({
            "pool_pre_ping": True,
            "pool_size": 10,
            "max_overflow": 20,
        })
    except ImportError:
        logger.warning("psycopg2 is not installed. Falling back to local SQLite database (kabadiwala.db).")
        db_url = "sqlite:///./kabadiwala.db"
        engine_kwargs = {"echo": settings.DEBUG, "connect_args": {"check_same_thread": False}}

engine = create_engine(db_url, **engine_kwargs)


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""
    pass
