from typing import Dict, Any, Optional
from app.repositories.agri import AgriRepository

class AdminAgriService:
    """Service layer for Admin Agri Application management."""
    def __init__(self, agri_repo: AgriRepository):
        self.agri_repo = agri_repo

    async def get_applications(self, skip: int = 0, limit: int = 20, status: Optional[str] = None, 
                             current_step: Optional[str] = None, scheme_id: Optional[str] = None, 
                             search: Optional[str] = None) -> Dict[str, Any]:
        
        result = await self.agri_repo.get_admin_applications(
            skip=skip,
            limit=limit,
            status=status,
            current_step=current_step,
            scheme_id=scheme_id,
            search=search
        )
        
        return {
            "success": True,
            "message": "Applications fetched successfully",
            "data": {
                "total": result["total"],
                "items": result["items"],
                "skip": skip,
                "limit": limit
            }
        }

    async def get_all_schemes(self) -> Dict[str, Any]:
        schemes = await self.agri_repo.get_active_schemes()
        return {
            "success": True,
            "message": "Schemes fetched successfully",
            "data": [s.model_dump() for s in schemes]
        }

    async def get_application_details(self, application_id: str) -> Dict[str, Any]:
        details = await self.agri_repo.get_admin_application_details(application_id)
        if not details:
            return {
                "success": False,
                "message": "Application not found",
                "data": None
            }
            
        return {
            "success": True,
            "message": "Application details fetched successfully",
            "data": details
        }

    async def action_application(self, application_id: str, action: str, remarks: str, admin_id: str, admin_name: str) -> Dict[str, Any]:
        try:
            application = await self.agri_repo.action_application(
                application_id=application_id,
                action=action,
                remarks=remarks,
                admin_id=admin_id,
                admin_name=admin_name
            )
            
            if not application:
                return {
                    "success": False,
                    "message": "Application not found",
                    "data": None
                }
                
            return {
                "success": True,
                "message": f"Application {action.lower()} successfully",
                "data": application.model_dump()
            }
        except ValueError as e:
            return {
                "success": False,
                "message": str(e),
                "data": None
            }
