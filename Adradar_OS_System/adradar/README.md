# AdRadar — Multi-Tenant Lead Intelligence Platform

A production-grade SaaS platform for paid media consultants. Admin manually uploads curated lead batches; clients log in to see their own leads, pipeline metrics, AI-generated outreach emails, and export tools.

---

## Setup in 5 commands

```bash
# 1. Clone and enter directory
cd adradar

# 2. Copy and fill environment variables
cp .env.example .env
# Edit .env — set POSTGRES_PASSWORD, SECRET_KEY, ANTHROPIC_API_KEY, NEXTAUTH_SECRET

# 3. Start all services
docker-compose up --build

# 4. Run database migrations (in a new terminal)
docker-compose exec api alembic upgrade head

# 5. Seed demo data
docker-compose exec api python seed.py
```

That's it. Visit:
- **Frontend**: http://localhost:3000
- **API docs**: http://localhost:8000/docs

---

## Default credentials (after seeding)

| Role   | Email                       | Password     |
|--------|-----------------------------|--------------|
| Admin  | admin@adradar.io            | Admin@1234   |
| Client | robin@facestagram.io        | Client@1234  |

---

## Architecture

```
adradar/
├── frontend/           Next.js 14 (App Router, TypeScript, Tailwind, shadcn/ui)
├── backend/            FastAPI (Python 3.11, SQLAlchemy 2.0 async, Alembic)
├── docker-compose.yml  Local dev stack (postgres, redis, api, worker, beat, frontend)
└── .env.example        Environment variable template
```

### Services

| Service  | Port  | Description                           |
|----------|-------|---------------------------------------|
| frontend | 3000  | Next.js client application            |
| api      | 8000  | FastAPI REST API                      |
| postgres | 5432  | PostgreSQL 15 (via Docker)            |
| redis    | 6379  | Redis 7 (Celery broker + cache)       |
| worker   | —     | Celery worker (stub tasks only)       |
| beat     | —     | Celery Beat scheduler (stub)          |

---

## Key Features

- **Multi-tenant isolation**: every DB query is scoped by `tenant_id`
- **Admin panel**: create tenants, manage logins, upload CSV batches
- **5-step batch upload**: metadata → CSV → column mapping → validation → publish
- **AI email generation**: Claude Sonnet generates subject + body per lead at upload time (stored in DB, not regenerated on load)
- **Lead scoring**: 0-100 score + tier (hot/warm/review) calculated at upload
- **Client dashboard**: pipeline metrics, outreach funnel, niche distribution, batch timeline
- **Lead table**: server-side pagination, filters (niche, tier, status, batch, verified), global search
- **Lead detail drawer**: pain signals, hiring triggers, AI email with copy buttons, inline status + notes
- **Outreach tracker**: Kanban-style board by status
- **Export**: streaming CSV + email text downloads scoped to tenant/batch
- **Pipeline stubs**: Celery + Redis wired up, tasks raise `NotImplementedError` until automation is ready

---

## API Endpoints

See full interactive docs at `http://localhost:8000/docs`

| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/token | Login, get JWT |
| GET | /auth/me | Current user |
| GET | /tenants | List tenants (admin) |
| POST | /tenants | Create tenant (admin) |
| GET | /batches | List batches |
| POST | /batches | Upload CSV batch (multipart) |
| POST | /batches/{id}/publish | Publish batch |
| GET | /leads | Paginated leads with filters |
| PATCH | /leads/{id} | Update outreach status / notes |
| GET | /export/csv | Stream CSV download |
| GET | /export/emails | Stream email text download |
| POST | /pipeline/run | Stub → 200 queued message |

---

## Adding real automation later

1. Implement `backend/app/pipeline/tasks/scrape.py` — replace `raise NotImplementedError`
2. Uncomment the `beat_schedule` in `pipeline/celery_app.py`
3. In `services/batch_service.py`, swap `asyncio.create_task(...)` → `celery_task.delay(...)`

No schema changes required — `batch.source` already supports `"auto"` and all hooks are in place.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| POSTGRES_PASSWORD | Yes | PostgreSQL password |
| SECRET_KEY | Yes | JWT signing key (min 32 chars) |
| ANTHROPIC_API_KEY | Yes | Claude API key for email generation |
| NEXTAUTH_SECRET | Yes | NextAuth.js secret |
| NEXTAUTH_URL | Yes | Frontend URL (http://localhost:3000) |
| NEXT_PUBLIC_API_URL | Yes | API URL (http://localhost:8000) |
| SUPABASE_URL | No | For file storage (optional) |
| SUPABASE_SERVICE_KEY | No | For file storage (optional) |
