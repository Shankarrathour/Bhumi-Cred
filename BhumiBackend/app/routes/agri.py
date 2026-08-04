from fastapi import APIRouter, Depends
from app.dependencies.auth import CurrentFarmer, VerifiedFarmer
from app.integrations.cloudinary_service import CloudinaryService
from app.services.agri import AgriService
from app.repositories.agri import AgriRepository

router = APIRouter(prefix="/agri", tags=["Agri Financial Hub"])

def get_agri_service() -> AgriService:
    agri_repo = AgriRepository()
    return AgriService(agri_repo, cloudinary_svc=CloudinaryService())

@router.get("/health")
async def health_check(
    farmer: CurrentFarmer,
    service: AgriService = Depends(get_agri_service)
):
    """
    Health check endpoint for the Agri Financial Hub module.
    """
    return await service.get_health_status()

@router.get("/dashboard")
async def get_dashboard(
    farmer: CurrentFarmer,
    service: AgriService = Depends(get_agri_service)
):
    """
    Get dashboard data for the Agri Financial Hub.
    """
    return await service.get_dashboard(str(farmer.id))

@router.get("/home-schemes")
async def get_home_schemes(
    farmer: CurrentFarmer,
    service: AgriService = Depends(get_agri_service)
):
    """
    Get schemes shown on the Home screen with the logged-in farmer's application status.
    """
    return await service.get_home_schemes(str(farmer.id))

from fastapi import Query

@router.get("/search")
async def search_schemes(
    q: str = Query(None),
    farmer: CurrentFarmer = None,
    service: AgriService = Depends(get_agri_service)
):
    """
    Search active schemes.
    """
    return await service.search_schemes(q)

@router.get("/schemes/{scheme_id}")
async def get_scheme_details(
    scheme_id: str,
    farmer: CurrentFarmer,
    service: AgriService = Depends(get_agri_service)
):
    """
    Get detailed information for a specific scheme.
    """
    return await service.get_scheme_details(scheme_id)

@router.get("/schemes/{scheme_id}/questionnaire")
async def get_scheme_questionnaire(
    scheme_id: str,
    farmer: CurrentFarmer,
    service: AgriService = Depends(get_agri_service)
):
    """
    Get the eligibility questionnaire for a specific scheme.
    """
    return await service.get_scheme_questionnaire(scheme_id)

from pydantic import BaseModel
from typing import Dict, Any

@router.post("/schemes/{scheme_id}/application")
async def start_scheme_application(
    scheme_id: str,
    farmer: VerifiedFarmer,
    service: AgriService = Depends(get_agri_service)
):
    """
    Start a new application for a scheme.
    """
    return await service.start_application(scheme_id, str(farmer.id))

class AssessmentRequest(BaseModel):
    application_id: str
    answers: Dict[str, Any]

@router.post("/schemes/{scheme_id}/assessment")
async def submit_scheme_assessment(
    scheme_id: str,
    request: AssessmentRequest,
    farmer: CurrentFarmer,
    service: AgriService = Depends(get_agri_service)
):
    """
    Submit questionnaire answers for assessment.
    """
    return await service.submit_assessment(scheme_id, request.application_id, request.answers)

class LoanCalculateRequest(BaseModel):
    loan_amount: float
    interest_rate: float
    tenure_years: int

@router.post("/loan/calculate")
async def calculate_loan(
    request: LoanCalculateRequest,
    farmer: CurrentFarmer,
    service: AgriService = Depends(get_agri_service)
):
    """
    Calculate EMI for a loan.
    """
    if request.loan_amount <= 0 or request.interest_rate <= 0 or request.tenure_years <= 0:
        return {
            "success": False,
            "message": "Loan amount, interest rate, and tenure must be greater than 0"
        }
    return await service.calculate_loan(
        request.loan_amount,
        request.interest_rate,
        request.tenure_years
    )

from fastapi import File, UploadFile, Form

@router.post("/applications/{application_id}/documents")
async def upload_application_document(
    application_id: str,
    document_type: str = Form(...),
    file: UploadFile = File(...),
    farmer: CurrentFarmer = None, # Using None here but the type is Annotated so it works or just leave out default
    service: AgriService = Depends(get_agri_service)
):
    """
    Upload a document for an application.
    """
    return await service.upload_document(application_id, str(farmer.id), document_type, file)

@router.get("/applications/{application_id}/documents")
async def list_application_documents(
    application_id: str,
    farmer: CurrentFarmer = None,
    service: AgriService = Depends(get_agri_service)
):
    """
    List all uploaded documents for an application.
    """
    return await service.list_documents(application_id, str(farmer.id))

@router.delete("/applications/{application_id}/documents/{document_id}")
async def delete_application_document(
    application_id: str,
    document_id: str,
    farmer: CurrentFarmer = None,
    service: AgriService = Depends(get_agri_service)
):
    """
    Delete an uploaded document.
    """
    return await service.delete_document(application_id, str(farmer.id), document_id)

@router.get("/applications/{application_id}/review")
async def get_application_review(
    application_id: str,
    farmer: CurrentFarmer = None,
    service: AgriService = Depends(get_agri_service)
):
    """
    Get aggregated data for reviewing an application.
    """
    return await service.get_application_review(application_id, str(farmer.id))

@router.post("/applications/{application_id}/submit")
async def submit_application(
    application_id: str,
    farmer: VerifiedFarmer = None,
    service: AgriService = Depends(get_agri_service)
):
    """
    Submit an application.
    """
    return await service.submit_application(application_id, str(farmer.id))

@router.get("/applications/{application_id}/timeline")
async def get_application_timeline(
    application_id: str,
    farmer: CurrentFarmer = None,
    service: AgriService = Depends(get_agri_service)
):
    """
    Get application timeline.
    """
    return await service.get_application_timeline(application_id, str(farmer.id))

@router.get("/applications/{application_id}/clarification")
async def get_application_clarification(
    application_id: str,
    farmer: CurrentFarmer = None,
    service: AgriService = Depends(get_agri_service)
):
    """
    Get clarification request details for an application.
    """
    return await service.get_application_clarification(application_id)

@router.post("/applications/{application_id}/resubmit")
async def resubmit_application(
    application_id: str,
    farmer: VerifiedFarmer = None,
    service: AgriService = Depends(get_agri_service)
):
    """
    Resubmit a returned application after adding clarifications.
    """
    if not farmer:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    return await service.resubmit_application(application_id, str(farmer.id))
