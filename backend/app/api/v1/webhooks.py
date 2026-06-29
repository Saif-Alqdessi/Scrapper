import logging
from fastapi import APIRouter, BackgroundTasks, Depends, Request

from app.services.pipeline_runner import process_apify_dataset

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/webhooks")

@router.post("/apify")
async def apify_webhook(
    campaign_id: str, 
    request: Request, 
    background_tasks: BackgroundTasks, 
    payload: dict
):
    dataset_id = payload.get("resource", {}).get("defaultDatasetId")
    
    if not dataset_id:
        return {"status": "ignored", "message": "No dataset ID"}
        
    background_tasks.add_task(process_apify_dataset, dataset_id, campaign_id)
    return {"status": "ok", "message": "Dataset processing started in background"}
