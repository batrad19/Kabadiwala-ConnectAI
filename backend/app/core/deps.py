"""FastAPI dependency injectors for auth and RBAC."""

from __future__ import annotations

from typing import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import verify_token
from app.database.session import get_db
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Resolve the JWT bearer token to a User ORM object.

    Raises:
        HTTPException 401 when the token is missing, malformed, or the user
        does not exist.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = verify_token(token, token_type="access")
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user: User | None = db.get(User, user_id)
    if user is None:
        raise credentials_exception
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Ensure the resolved user account is active.

    Raises:
        HTTPException 403 when the user is deactivated.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )
    return current_user


def require_role(*roles: UserRole) -> Callable[..., User]:
    """Return a FastAPI dependency that restricts access to the given roles.

    Usage::

        @router.get("/admin-only")
        def admin_route(user = Depends(require_role(UserRole.admin))):
            ...
    """

    def _dependency(
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Operation requires one of these roles: "
                    f"{[r.value for r in roles]}"
                ),
            )
        return current_user

    return _dependency
