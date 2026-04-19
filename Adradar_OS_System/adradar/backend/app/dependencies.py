import logging
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import get_settings
from app.database import get_db

logger = logging.getLogger(__name__)
settings = get_settings()
bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.secret_key,
            algorithms=[settings.algorithm],
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Import here to avoid circular imports
    from app.models.user import User

    result = await db.execute(select(User).where(User.id == user_id, User.is_active == True))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user


async def require_admin(
    current_user=Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


def require_tenant_access(tenant_id_param: str = "tenant_id"):
    """
    Dependency factory — verifies JWT tenant_id matches OR role === 'admin'.
    Usage: Depends(require_tenant_access())
    The router must pass tenant_id as a path/query param.
    """

    async def _check(
        tenant_id: str,
        current_user=Depends(get_current_user),
    ):
        if current_user.role == "admin":
            return current_user
        if str(current_user.tenant_id) != str(tenant_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access to this tenant is not allowed",
            )
        return current_user

    return _check
