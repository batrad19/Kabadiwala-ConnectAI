"""FastAPI application entry point for Kabadiwala Connect AI."""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.core.config import settings

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger("kabadiwala")

# ── Rate limiter ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    logger.info("🌱 Kabadiwala Connect AI backend starting …")

    # Ensure upload dir exists
    upload_path = Path(settings.UPLOAD_DIR)
    upload_path.mkdir(parents=True, exist_ok=True)

    # Attempt to load ML models
    try:
        from app.services.ml_service import ml_service
        ml_service.load_models()
    except Exception as exc:  # noqa: BLE001
        logger.warning("ML models not loaded at startup: %s", exc)

    logger.info("✅ Startup complete.")
    yield
    logger.info("👋 Kabadiwala Connect AI backend shutting down.")


# ── App factory ───────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "AI-Powered E-Waste Intelligence, Classification, Valuation & "
        "Recycling Ecosystem — SIH 2026"
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── Middleware ────────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def audit_log_middleware(request: Request, call_next):
    """Log every request for audit purposes."""
    logger.info("%s %s", request.method, request.url.path)
    response = await call_next(request)
    return response


# ── Static files ──────────────────────────────────────────────────────────────
upload_path = Path(settings.UPLOAD_DIR)
upload_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(upload_path)), name="uploads")

# ── Routers ───────────────────────────────────────────────────────────────────
from app.api import (  # noqa: E402
    auth,
    users,
    ai,
    products,
    condition,
    valuation,
    recyclers,
    marketplace,
    transactions,
    analytics,
    admin,
    notifications,
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI Engine"])
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(condition.router, prefix="/api/condition", tags=["Condition"])
app.include_router(valuation.router, prefix="/api/valuation", tags=["Valuation"])
app.include_router(recyclers.router, prefix="/api/recyclers", tags=["Recyclers"])
app.include_router(marketplace.router, prefix="/api/marketplace", tags=["Marketplace"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["Transactions"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health_check():
    """Simple liveness probe."""
    return {"status": "ok", "app": settings.APP_NAME}
