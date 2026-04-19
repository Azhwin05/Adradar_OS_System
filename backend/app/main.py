import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import engine, Base

# Routers — imported after models so Alembic sees everything
from app.routers import auth, tenants, users, batches, leads, outreach, export, pipeline

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("AdRadar API starting up")
    # Tables are managed by Alembic — do NOT call Base.metadata.create_all here in prod.
    # For development convenience only:
    if settings.debug:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    yield
    logger.info("AdRadar API shutting down")
    await engine.dispose()


app = FastAPI(
    title="AdRadar API",
    version="1.0.0",
    description="Multi-tenant lead intelligence platform",
    lifespan=lifespan,
)

import os
_extra = [o.strip() for o in os.getenv("EXTRA_CORS_ORIGINS", "").split(",") if o.strip()]
_cors_origins = settings.cors_origins + _extra

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(tenants.router, prefix="/tenants", tags=["tenants"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(batches.router, prefix="/batches", tags=["batches"])
app.include_router(leads.router, prefix="/leads", tags=["leads"])
app.include_router(outreach.router, prefix="/outreach", tags=["outreach"])
app.include_router(export.router, prefix="/export", tags=["export"])
app.include_router(pipeline.router, prefix="/pipeline", tags=["pipeline"])


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok", "service": "adradar-api"}
