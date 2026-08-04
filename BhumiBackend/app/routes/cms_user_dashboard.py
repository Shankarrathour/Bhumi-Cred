from fastapi import APIRouter, HTTPException
from app.models.cms_user_dashboard import UserDashboardCMS, DEFAULT_DASHBOARD_CMS
from app.database.connection import get_db
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/cms", tags=["CMS Configuration"])

@router.get("", response_model=UserDashboardCMS)
@router.get("/", response_model=UserDashboardCMS)
@router.get("/user-dashboard", response_model=UserDashboardCMS)
async def get_user_dashboard_cms():
    """
    Fetch the User Dashboard CMS configuration. 
    If not found, seed with default values and return.
    """
    try:
        db = get_db()
        cms_config = await db.cms_user_dashboard.find_one({"_id": "dashboard_config"})
        if not cms_config:
            # Seed if empty
            await db.cms_user_dashboard.insert_one({"_id": "dashboard_config", **DEFAULT_DASHBOARD_CMS.dict()})
            return DEFAULT_DASHBOARD_CMS
        return UserDashboardCMS(**cms_config)
    except Exception as e:
        logger.error(f"Error fetching User Dashboard CMS: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.post("", response_model=UserDashboardCMS)
@router.post("/", response_model=UserDashboardCMS)
@router.post("/user-dashboard", response_model=UserDashboardCMS)
async def update_user_dashboard_cms(config: UserDashboardCMS):
    """
    Update the User Dashboard CMS configuration.
    """
    try:
        db = get_db()
        await db.cms_user_dashboard.update_one(
            {"_id": "dashboard_config"},
            {"$set": config.dict()},
            upsert=True
        )
        return config
    except Exception as e:
        logger.error(f"Error updating User Dashboard CMS: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
