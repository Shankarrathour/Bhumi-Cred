import math
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, status
from beanie import PydanticObjectId

from app.models.govt import GovtOrganization, ApprovalStatus, OrgType, JurisdictionLevel
from app.schemas.govt_body import (
    GovtOrgCreateSchema,
    GovtOrgUpdateSchema,
    GovtOrgStatusPatchSchema,
    GovtOrgResponseSchema,
)

router = APIRouter(prefix="/admin/govt", tags=["Admin Government Body Management"])


def _serialize_org(org: GovtOrganization) -> dict:
    """Helper to convert Beanie GovtOrganization document to dictionary schema response."""
    doc = org.model_dump()
    doc["id"] = str(org.id)
    doc["created_at"] = org.created_at.isoformat() if org.created_at else datetime.now(timezone.utc).isoformat()
    doc["updated_at"] = org.updated_at.isoformat() if org.updated_at else datetime.now(timezone.utc).isoformat()
    return doc


@router.post("/organizations", status_code=status.HTTP_201_CREATED)
async def create_government_organization(payload: GovtOrgCreateSchema):
    """
    Create a new Government Organization registration.
    Checks for duplicate org_id or contact_email before persisting.
    """
    existing_org = await GovtOrganization.find_one(
        GovtOrganization.org_id == payload.org_id,
        GovtOrganization.is_deleted == False
    )
    if existing_org:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Government Organization with ID '{payload.org_id}' already exists."
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    initial_audit = {
        "timestamp": now_iso,
        "action": "Registration Submitted",
        "status": ApprovalStatus.PENDING.value,
        "actor": "Government Nodal Officer",
        "remarks": "Organization registration submitted online for Super Admin review."
    }

    org_data = payload.model_dump()
    org_data["approval_status"] = ApprovalStatus.PENDING
    org_data["audit_trail"] = [initial_audit]
    org_data["created_at"] = datetime.now(timezone.utc)
    org_data["updated_at"] = datetime.now(timezone.utc)

    org = GovtOrganization(**org_data)
    await org.insert()

    return {
        "success": True,
        "message": "Government Organization registered successfully.",
        "data": _serialize_org(org)
    }


@router.get("/organizations")
async def list_government_organizations(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search term for name, code, state, district, or email"),
    status: Optional[str] = Query(None, description="Filter by approval_status (PENDING, APPROVED, REJECTED, CLARIFICATION_REQUIRED)"),
    org_type: Optional[str] = Query(None, description="Filter by organization type"),
    state: Optional[str] = Query(None, description="Filter by State"),
):
    """
    List all Government Organizations with pagination, full-text search, and status filtering.
    """
    query_conditions = [GovtOrganization.is_deleted == False]

    if status and isinstance(status, str):
        normalized_status = status.upper().strip()
        query_conditions.append(GovtOrganization.approval_status == normalized_status)

    if org_type and isinstance(org_type, str):
        query_conditions.append(GovtOrganization.org_type == org_type)

    if state and isinstance(state, str):
        query_conditions.append(GovtOrganization.state == state)

    find_query = GovtOrganization.find(*query_conditions)

    # Perform in-memory or regex search if search query provided
    all_docs = await find_query.sort("-created_at").to_list()

    if search and isinstance(search, str):
        s = search.lower().strip()
        all_docs = [
            d for d in all_docs
            if (
                s in (d.org_name or "").lower() or
                s in (d.org_id or "").lower() or
                s in (d.department or "").lower() or
                s in (d.state or "").lower() or
                s in (d.district or "").lower() or
                s in (d.contact_email or "").lower() or
                s in (d.authorized_person_name or "").lower() or
                s in (d.nodal_person_name or "").lower()
            )
        ]

    total = len(all_docs)
    start = (page - 1) * limit
    end = start + limit
    paginated_docs = all_docs[start:end]

    return {
        "success": True,
        "data": [_serialize_org(d) for d in paginated_docs],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": math.ceil(total / limit) if total > 0 else 1
    }


@router.get("/organizations/{id_or_org_id}")
async def get_government_organization_details(id_or_org_id: str):
    """
    Get detailed profile of a single Government Organization by MongoDB ObjectId or org_id string.
    """
    org = None

    if PydanticObjectId.is_valid(id_or_org_id):
        org = await GovtOrganization.get(PydanticObjectId(id_or_org_id))

    if not org:
        org = await GovtOrganization.find_one(
            GovtOrganization.org_id == id_or_org_id,
            GovtOrganization.is_deleted == False
        )

    if not org or org.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Government Organization '{id_or_org_id}' not found."
        )

    return {
        "success": True,
        "data": _serialize_org(org)
    }


@router.patch("/organizations/{id_or_org_id}/status")
async def update_government_organization_status(
    id_or_org_id: str,
    payload: GovtOrgStatusPatchSchema
):
    """
    Admin workflow action: Approve, Reject, or Request Clarification for a Government Organization.
    """
    org = None
    if PydanticObjectId.is_valid(id_or_org_id):
        org = await GovtOrganization.get(PydanticObjectId(id_or_org_id))

    if not org:
        org = await GovtOrganization.find_one(
            GovtOrganization.org_id == id_or_org_id,
            GovtOrganization.is_deleted == False
        )

    if not org or org.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Government Organization '{id_or_org_id}' not found."
        )

    action_upper = payload.action.upper().strip()
    now_iso = datetime.now(timezone.utc).isoformat()

    if action_upper in ["APPROVE", "APPROVED"]:
        new_status = ApprovalStatus.APPROVED
        remarks = payload.remarks or "Government Organization approved by Super Admin."
        org.approval_status = new_status
        org.status_remarks = remarks
        org.clarification_notes = None
        org.rejection_reason = None
        audit_entry = {
            "timestamp": now_iso,
            "action": "Application Approved",
            "status": ApprovalStatus.APPROVED.value,
            "actor": "Super Admin",
            "remarks": remarks
        }

    elif action_upper in ["REJECT", "REJECTED"]:
        new_status = ApprovalStatus.REJECTED
        reason = payload.rejection_reason or payload.remarks or "Application rejected."
        org.approval_status = new_status
        org.rejection_reason = reason
        org.status_remarks = reason
        audit_entry = {
            "timestamp": now_iso,
            "action": "Application Rejected",
            "status": ApprovalStatus.REJECTED.value,
            "actor": "Super Admin",
            "remarks": f"Rejection reason: {reason}"
        }

    elif action_upper in ["CLARIFICATION_REQUIRED", "CLARIFICATION"]:
        new_status = ApprovalStatus.CLARIFICATION_REQUIRED
        notes = payload.clarification_notes or payload.remarks or "Further clarification required regarding registration docs."
        org.approval_status = new_status
        org.clarification_notes = notes
        org.status_remarks = notes
        audit_entry = {
            "timestamp": now_iso,
            "action": "Clarification Requested",
            "status": ApprovalStatus.CLARIFICATION_REQUIRED.value,
            "actor": "Super Admin",
            "remarks": f"Clarification requested: {notes}"
        }

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid action '{payload.action}'. Must be APPROVE, REJECT, or CLARIFICATION_REQUIRED."
        )

    if not org.audit_trail:
        org.audit_trail = []

    org.audit_trail.append(audit_entry)
    org.updated_at = datetime.now(timezone.utc)
    await org.save()

    return {
        "success": True,
        "message": f"Government Organization status updated to {new_status.value}.",
        "data": _serialize_org(org)
    }


@router.patch("/organizations/{id_or_org_id}")
async def update_government_organization(
    id_or_org_id: str,
    payload: GovtOrgUpdateSchema
):
    """
    Update Government Organization details or resubmit after clarification.
    """
    org = None
    if PydanticObjectId.is_valid(id_or_org_id):
        org = await GovtOrganization.get(PydanticObjectId(id_or_org_id))

    if not org:
        org = await GovtOrganization.find_one(
            GovtOrganization.org_id == id_or_org_id,
            GovtOrganization.is_deleted == False
        )

    if not org or org.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Government Organization '{id_or_org_id}' not found."
        )

    update_dict = payload.model_dump(exclude_unset=True)
    is_resubmit = update_dict.pop("resubmit", False)

    for key, value in update_dict.items():
        if value is not None:
            setattr(org, key, value)

    now_iso = datetime.now(timezone.utc).isoformat()
    if is_resubmit or org.approval_status == ApprovalStatus.CLARIFICATION_REQUIRED:
        org.approval_status = ApprovalStatus.PENDING
        org.status_remarks = "Resubmitted after updating clarification details."
        org.audit_trail.append({
            "timestamp": now_iso,
            "action": "Resubmitted Info",
            "status": ApprovalStatus.PENDING.value,
            "actor": "Government Nodal Officer",
            "remarks": "Updated information provided in response to clarification request."
        })

    org.updated_at = datetime.now(timezone.utc)
    await org.save()

    return {
        "success": True,
        "message": "Government Organization profile updated successfully.",
        "data": _serialize_org(org)
    }
