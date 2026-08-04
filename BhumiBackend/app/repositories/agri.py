from typing import List, Optional
from beanie import PydanticObjectId
from app.models.agri_category import AgriCategory
from app.models.agri_scheme import AgriScheme

class AgriRepository:
    """
    Repository for Agri Financial Hub.
    """
    
    async def get_active_categories(self):
        return await AgriCategory.find(
            AgriCategory.is_active == True
        ).to_list()

    async def get_active_schemes(self) -> List[AgriScheme]:
        """Fetch all active agri schemes."""
        return await AgriScheme.find(AgriScheme.is_active == True).to_list()

    async def get_scheme_by_id(self, scheme_id: str) -> Optional[AgriScheme]:
        """Fetch a specific scheme by its ID."""
        try:
            return await AgriScheme.get(PydanticObjectId(scheme_id))
        except Exception:
            return None

    async def get_questionnaire(self, scheme_id: str):
        """Fetch active questions for a scheme, sorted by display_order."""
        from app.models.agri_questionnaire import AgriQuestionnaire
        return await AgriQuestionnaire.find(
            AgriQuestionnaire.scheme_id == scheme_id,
            AgriQuestionnaire.is_active == True
        ).sort("display_order").to_list()

    async def create_application(self, user_id: str, scheme_id: str):
        """Create a new scheme application draft."""
        from app.models.agri_application import AgriApplication
        application = AgriApplication(
            user_id=user_id,
            scheme_id=scheme_id
        )
        return await application.insert()

    async def get_application_by_id(self, application_id: str):
        """Fetch an application by ID."""
        from app.models.agri_application import AgriApplication
        try:
            return await AgriApplication.get(PydanticObjectId(application_id))
        except Exception:
            return None

    async def create_assessment(self, application_id: str, answers: dict):
        """Store submitted assessment answers linked to application."""
        from app.models.agri_assessment import AgriAssessment
        assessment = AgriAssessment(
            application_id=application_id,
            submitted_answers=answers
        )
        return await assessment.insert()

    async def update_application_step(self, application_id: str, step: str):
        """Update application current step."""
        from app.models.agri_application import AgriApplication
        application = await self.get_application_by_id(application_id)
        if application:
            application.current_step = step
            from datetime import datetime, timezone
            application.updated_at = datetime.now(timezone.utc)
            await application.save()
            return application
        return None

    async def get_assessment_by_application(self, application_id: str):
        """Fetch assessment by application ID."""
        from app.models.agri_assessment import AgriAssessment
        return await AgriAssessment.find_one(AgriAssessment.application_id == application_id)

    async def create_document(self, data: dict):
        """Store application document metadata."""
        from app.models.agri_application_document import AgriApplicationDocument
        document = AgriApplicationDocument(**data)
        return await document.insert()

    async def get_documents_by_application(self, application_id: str):
        """Fetch all documents for an application."""
        from app.models.agri_application_document import AgriApplicationDocument
        return await AgriApplicationDocument.find(
            AgriApplicationDocument.application_id == application_id
        ).to_list()

    async def get_document_by_id(self, document_id: str):
        """Fetch a document by ID."""
        from app.models.agri_application_document import AgriApplicationDocument
        try:
            return await AgriApplicationDocument.get(PydanticObjectId(document_id))
        except Exception:
            return None

    async def delete_document(self, document_id: str):
        """Delete an application document."""
        from app.models.agri_application_document import AgriApplicationDocument
        document = await AgriApplicationDocument.get(document_id)
        if document:
            await document.delete()
            return True
        return False

    async def create_timeline_event(self, application_id: str, status: str, step: str, title: str, description: str, performed_by: str, metadata: dict = None):
        """Create a timeline event."""
        from app.models.agri_application_timeline import AgriApplicationTimeline
        event = AgriApplicationTimeline(
            application_id=application_id,
            status=status,
            step=step,
            title=title,
            description=description,
            performed_by=performed_by,
            metadata=metadata
        )
        return await event.insert()

    async def get_timeline_by_application(self, application_id: str):
        """Get timeline events sorted by newest first."""
        from app.models.agri_application_timeline import AgriApplicationTimeline
        from pymongo import DESCENDING
        return await AgriApplicationTimeline.find(AgriApplicationTimeline.application_id == application_id).sort([("timestamp", DESCENDING)]).to_list()

    async def get_admin_applications(self, skip: int = 0, limit: int = 20, status: str = None, current_step: str = None, scheme_id: str = None, search: str = None):
        """Fetch applications for admin, excluding DRAFT. Resolves farmer and scheme details."""
        from app.models.agri_application import AgriApplication
        from app.models.farmer import Farmer
        from app.models.agri_scheme import AgriScheme
        from beanie.operators import In, NotIn, RegEx, Or
        
        # Base query to exclude DRAFT
        query = {"status": {"$ne": "DRAFT"}}
        
        if status:
            query["status"] = status
            
        if current_step:
            query["current_step"] = current_step
            
        if scheme_id:
            query["scheme_id"] = scheme_id
            
        # Optional: search by farmer name/mobile
        farmer_ids = []
        if search:
            search_regex = {"$regex": search, "$options": "i"}
            matching_farmers = await Farmer.find(
                Or(
                    Farmer.full_name == search_regex,
                    Farmer.mobile == search_regex
                )
            ).to_list()
            farmer_ids = [str(f.id) for f in matching_farmers]
            if not farmer_ids:
                return {"total": 0, "items": []} # No farmers matched, return empty
            query["user_id"] = {"$in": farmer_ids}

        # Fetch applications
        total = await AgriApplication.find(query).count()
        applications = await AgriApplication.find(query).sort("-submitted_at").skip(skip).limit(limit).to_list()
        
        # Pre-fetch related schemes and farmers for efficiency
        app_scheme_ids = list(set([app.scheme_id for app in applications]))
        app_user_ids = list(set([app.user_id for app in applications]))
        
        from beanie import PydanticObjectId
        schemes = await AgriScheme.find({"_id": {"$in": [PydanticObjectId(sid) for sid in app_scheme_ids]}}).to_list()
        farmers = await Farmer.find({"_id": {"$in": [PydanticObjectId(uid) for uid in app_user_ids]}}).to_list()
        
        scheme_map = {str(s.id): s for s in schemes}
        farmer_map = {str(f.id): f for f in farmers}
        
        items = []
        for app in applications:
            scheme = scheme_map.get(app.scheme_id)
            farmer = farmer_map.get(app.user_id)
            
            items.append({
                "application_id": str(app.id),
                "application_reference": app.application_reference,
                "farmer_name": farmer.full_name if farmer else "Unknown",
                "mobile": farmer.mobile if farmer else "Unknown",
                "scheme_name": scheme.title if scheme else "Unknown Scheme",
                "submitted_at": app.submitted_at,
                "status": app.status,
                "current_step": app.current_step
            })
            
        return {"total": total, "items": items}

    async def get_admin_application_details(self, application_id: str):
        from app.models.agri_application import AgriApplication
        from app.models.farmer import Farmer
        from app.models.agri_scheme import AgriScheme
        from app.models.agri_assessment import AgriAssessment
        from app.models.agri_application_document import AgriApplicationDocument
        from app.models.agri_application_timeline import AgriApplicationTimeline
        from beanie import PydanticObjectId
        app_id = PydanticObjectId(application_id)
        
        application = await AgriApplication.get(app_id)
        if not application:
            return None
            
        farmer = await Farmer.get(PydanticObjectId(application.user_id))
        scheme = await AgriScheme.get(PydanticObjectId(application.scheme_id))
        answers = await AgriAssessment.find({"application_id": application_id}).to_list()
        documents = await AgriApplicationDocument.find({"application_id": application_id}).to_list()
        timeline = await AgriApplicationTimeline.find({"application_id": application_id}).sort("timestamp").to_list()
        
        return {
            "application": application,
            "farmer": farmer,
            "scheme": scheme,
            "answers": answers,
            "documents": documents,
            "timeline": timeline,
            "status": application.status,
            "current_step": application.current_step
        }

    async def action_application(self, application_id: str, action: str, remarks: str, admin_id: str, admin_name: str):
        from app.models.agri_application import AgriApplication
        from app.models.agri_application_timeline import AgriApplicationTimeline
        from app.models.audit_log import AuditLog
        from beanie import PydanticObjectId
        app_id = PydanticObjectId(application_id)
        
        application = await AgriApplication.get(app_id)
        if not application:
            return None
            
        old_status = application.status
        old_step = application.current_step
        
        # State transitions
        title = ""
        description = remarks or "Status updated by admin."
        
        if action == "APPROVE":
            application.status = "APPROVED"
            application.current_step = "APPROVED"
            title = "Application Approved"
        elif action == "REJECT":
            application.status = "REJECTED"
            application.current_step = "REJECTED"
            title = "Application Rejected"
        elif action == "REQUEST_CLARIFICATION":
            application.status = "CLARIFICATION_REQUIRED"
            application.current_step = "WAITING_FOR_FARMER"
            title = "Clarification Requested"
        else:
            raise ValueError(f"Unsupported action: {action}")
            
        await application.save()
        
        # Append timeline event
        timeline_event = AgriApplicationTimeline(
            application_id=application_id,
            title=title,
            description=description,
            user_type="ADMIN"
        )
        await timeline_event.save()
        
        # Create audit log
        audit = AuditLog(
            action=action,
            entity_type="AgriApplication",
            entity_id=application_id,
            admin_id=admin_id,
            admin_name=admin_name,
            remarks=remarks
        )
        await audit.save()
        
        await audit.save()
        
        return application

    async def get_application_clarification(self, application_id: str):
        from app.models.agri_application import AgriApplication
        from app.models.audit_log import AuditLog
        from beanie import PydanticObjectId
        
        application = await AgriApplication.get(PydanticObjectId(application_id))
        if not application:
            return None
            
        # Get the latest clarification audit log
        audit = await AuditLog.find(
            {"entity_id": application_id, "action": "REQUEST_CLARIFICATION"}
        ).sort("-timestamp").limit(1).to_list()
        
        clarification_log = audit[0] if audit else None
        
        return {
            "remarks": clarification_log.remarks if clarification_log else "",
            "requested_by": clarification_log.admin_name if clarification_log else "System",
            "requested_at": clarification_log.timestamp if clarification_log else None,
            "editable_sections": ["questionnaire", "documents"], # Default mock for now
            "current_status": application.status,
            "current_step": application.current_step
        }

    async def resubmit_application(self, application_id: str, user_id: str):
        from app.models.agri_application import AgriApplication
        from app.models.agri_application_timeline import AgriApplicationTimeline
        from app.models.audit_log import AuditLog
        from beanie import PydanticObjectId
        
        application = await AgriApplication.get(PydanticObjectId(application_id))
        if not application or str(application.user_id) != user_id:
            return None
            
        if application.status != "CLARIFICATION_REQUIRED":
            raise ValueError("Application is not in a state to be resubmitted.")
            
        # Update status
        application.status = "RESUBMITTED"
        application.current_step = "UNDER_REVIEW"
        await application.save()
        
        # Append timeline
        timeline_event = AgriApplicationTimeline(
            application_id=application_id,
            title="Application Resubmitted",
            description="Farmer has provided clarifications and resubmitted the application.",
            user_type="FARMER"
        )
        await timeline_event.save()
        
        # Audit log
        audit = AuditLog(
            action="RESUBMIT",
            entity_type="AgriApplication",
            entity_id=application_id,
            admin_id=user_id,
            admin_name="Farmer",
            remarks="Resubmitted after clarification"
        )
        await audit.save()
        
        return application

    async def get_home_schemes_with_status(self, user_id: str):
        from app.models.agri_scheme import AgriScheme
        from app.models.agri_application import AgriApplication
        
        # Fetch active schemes
        schemes = await AgriScheme.find(AgriScheme.is_active == True).to_list()
        
        # Fetch applications for the user
        applications = await AgriApplication.find(
            AgriApplication.user_id == user_id
        ).sort("-created_at").to_list()
        
        # Map scheme_id to latest status
        app_map = {}
        for app in applications:
            if app.scheme_id not in app_map:
                app_map[app.scheme_id] = {
                    "status": app.status,
                    "application_id": str(app.id),
                    "current_step": app.current_step
                }
                
        result = []
        for scheme in schemes:
            app_data = app_map.get(str(scheme.id), None)
            status = app_data["status"] if app_data else "NOT_APPLIED"
            application_id = app_data["application_id"] if app_data else None
            current_step = app_data["current_step"] if app_data else None
            
            result.append({
                "scheme_id": str(scheme.id),
                "scheme_name": scheme.title,
                "short_description": scheme.short_description,
                "thumbnail": scheme.thumbnail,
                "status": status,
                "application_id": application_id,
                "current_step": current_step
            })
            
        return result

    async def get_farmer_profile(self, user_id: str):
        from app.models.farmer import Farmer
        from beanie import PydanticObjectId
        try:
            return await Farmer.get(PydanticObjectId(user_id))
        except Exception:
            return None

    async def get_farmer_applications(self, user_id: str):
        from app.models.agri_application import AgriApplication
        return await AgriApplication.find(
            AgriApplication.user_id == user_id
        ).to_list()

    async def search_schemes(self, query_string: str = None):
        """Search active schemes based on query string."""
        from app.models.agri_scheme import AgriScheme
        from beanie.operators import Or
        
        base_query = {"is_active": True}
        
        if query_string:
            search_regex = {"$regex": query_string, "$options": "i"}
            return await AgriScheme.find(
                base_query,
                Or(
                    AgriScheme.title == search_regex,
                    AgriScheme.short_description == search_regex,
                    AgriScheme.ministry == search_regex,
                    AgriScheme.category_name == search_regex
                )
            ).to_list()
        
        return await AgriScheme.find(base_query).to_list()
