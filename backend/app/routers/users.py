import uuid
import logging
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.user import User
from app.routers.auth import hash_password
from app.schemas.user import UserCreate, UserRead, UserUpdate

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("", response_model=list[UserRead])
async def list_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    tenant_id: uuid.UUID | None = None,
    _admin=Depends(require_admin),
):
    q = select(User)
    if tenant_id:
        q = q.where(User.tenant_id == tenant_id)
    result = await db.execute(q.order_by(User.created_at.desc()))
    return result.scalars().all()


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin=Depends(require_admin),
):
    existing = await db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        name=payload.name,
        role=payload.role,
        tenant_id=payload.tenant_id,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    logger.info("Created user %s (role=%s, tenant=%s)", user.email, user.role, user.tenant_id)
    return user


@router.patch("/{user_id}", response_model=UserRead)
async def update_user(
    user_id: uuid.UUID,
    payload: UserUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin=Depends(require_admin),
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    update_data = payload.model_dump(exclude_none=True)
    if "password" in update_data:
        update_data["hashed_password"] = hash_password(update_data.pop("password"))
    for field, value in update_data.items():
        setattr(user, field, value)
    await db.flush()
    await db.refresh(user)
    return user
