"""Application configuration using Pydantic Settings."""

from __future__ import annotations

from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central application settings loaded from environment / .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # ── App ──────────────────────────────────────────────────────────────────
    APP_NAME: str = "Kabadiwala Connect AI"
    DEBUG: bool = False

    # ── Database ─────────────────────────────────────────────────────────────
    DATABASE_URL: str = (
        "postgresql://kabadiwala:password@localhost:5432/kabadiwala_db"
    )

    # ── Security ─────────────────────────────────────────────────────────────
    SECRET_KEY: str = "change-me-in-production-must-be-at-least-32-chars!!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── File Storage ─────────────────────────────────────────────────────────
    UPLOAD_DIR: str = "../storage/uploads"
    ML_MODELS_DIR: str = "../ml/saved_models"
    MAX_FILE_SIZE: int = 10_485_760  # 10 MB
    ALLOWED_EXTENSIONS: List[str] = ["jpg", "jpeg", "png", "webp"]

    # ── ML / AI ──────────────────────────────────────────────────────────────
    CONFIDENCE_THRESHOLD: float = 0.70
    UNCERTAINTY_THRESHOLD: float = 0.45

    # ── CORS ─────────────────────────────────────────────────────────────────
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]

    @field_validator("ALLOWED_EXTENSIONS", mode="before")
    @classmethod
    def _split_extensions(cls, v: object) -> List[str]:
        """Accept comma-separated string or list."""
        if isinstance(v, str):
            return [ext.strip().lower() for ext in v.split(",") if ext.strip()]
        return v  # type: ignore[return-value]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _split_origins(cls, v: object) -> List[str]:
        """Accept comma-separated string or list."""
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v  # type: ignore[return-value]


settings = Settings()
