from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class PipelineRunRequest(BaseModel):
    tenant_id: str
    niche: str | None = None
    dry_run: bool = False


@router.post("/run")
async def run_pipeline(_payload: PipelineRunRequest):
    return {
        "status": "queued",
        "message": (
            "Automation pipeline not yet enabled. "
            "Use manual batch upload at /admin/batches/new"
        ),
    }


@router.get("/status")
async def pipeline_status():
    return {
        "status": "not_implemented",
        "message": "Pipeline automation is not yet enabled.",
    }
