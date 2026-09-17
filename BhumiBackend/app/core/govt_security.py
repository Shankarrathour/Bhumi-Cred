import os
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from fastapi import HTTPException, status, Header, Depends
from pydantic import BaseModel, Field
from jose import JWTError, jwt

from app.config.settings import settings

# ── JWT Config & Constants ───────────────────────────────────────────────────
GOVT_JWT_SECRET = getattr(settings, "JWT_SECRET_KEY", "bhumicred_secret_key_2026_super_secure")
GOVT_JWT_ALGORITHM = getattr(settings, "JWT_ALGORITHM", "HS256")
TOKEN_EXPIRE_HOURS = 24

# ── Pydantic Models for Auth & User Claims ───────────────────────────────────

class GovtUserClaims(BaseModel):
    user_id: str
    role: str = "govt_body"
    govt_org_id: str
    org_name: str
    govt_type: str = "gram_panchayat"
    state: str = "Madhya Pradesh"
    district: str = "Hoshangabad"
    block_tehsil: Optional[str] = "Pipariya"
    village_ward: Optional[str] = "Satpura"
    approval_status: str = "APPROVED"  # APPROVED, PENDING, CLARIFICATION_REQUIRED, REJECTED
    authorized_person_name: Optional[str] = None
    nodal_person_name: Optional[str] = None

class GovtLoginRequest(BaseModel):
    email_or_phone: str
    password: Optional[str] = None
    otp: Optional[str] = None
    govt_type: Optional[str] = None

class GovtLoginResponse(BaseModel):
    success: bool = True
    token_type: str = "bearer"
    access_token: str
    expires_in: int
    user: GovtUserClaims

class SecuritySettingsRequest(BaseModel):
    biometric_login_enabled: Optional[bool] = None
    two_factor_enabled: Optional[bool] = None
    session_timeout_minutes: Optional[int] = None
    notifications_enabled: Optional[bool] = None

# ── Token Generation & Decoding ──────────────────────────────────────────────

def create_govt_access_token(claims: GovtUserClaims) -> tuple[str, int]:
    expires_at = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS)
    payload = {
        "sub": claims.user_id,
        "user_id": claims.user_id,
        "role": claims.role,
        "govt_org_id": claims.govt_org_id,
        "org_name": claims.org_name,
        "govt_type": claims.govt_type,
        "state": claims.state,
        "district": claims.district,
        "block_tehsil": claims.block_tehsil,
        "village_ward": claims.village_ward,
        "approval_status": claims.approval_status,
        "exp": expires_at,
        "iat": datetime.now(timezone.utc)
    }
    encoded_jwt = jwt.encode(payload, GOVT_JWT_SECRET, algorithm=GOVT_JWT_ALGORITHM)
    expires_in_sec = TOKEN_EXPIRE_HOURS * 3600
    return encoded_jwt, expires_in_sec

def decode_govt_access_token(token: str) -> GovtUserClaims:
    try:
        payload = jwt.decode(token, GOVT_JWT_SECRET, algorithms=[GOVT_JWT_ALGORITHM])
        if payload.get("role") != "govt_body" and payload.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Token does not have government officer role privileges."
            )
        return GovtUserClaims(
            user_id=str(payload.get("user_id") or payload.get("sub")),
            role=str(payload.get("role", "govt_body")),
            govt_org_id=str(payload.get("govt_org_id", "GAZ-MP-DEFAULT")),
            org_name=str(payload.get("org_name", "Government Body")),
            govt_type=str(payload.get("govt_type", "gram_panchayat")),
            state=str(payload.get("state", "Madhya Pradesh")),
            district=str(payload.get("district", "Hoshangabad")),
            block_tehsil=payload.get("block_tehsil"),
            village_ward=payload.get("village_ward"),
            approval_status=str(payload.get("approval_status", "APPROVED")),
        )
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired government authentication token: {str(exc)}"
        )

# ── FastAPI Dependencies for Auth & RBAC ──────────────────────────────────────

async def get_current_govt_user(
    authorization: Optional[str] = Header(None)
) -> GovtUserClaims:
    if not authorization:
        # Default fallback user for development/demo test calls when auth header omitted
        return GovtUserClaims(
            user_id="GOVT-OFFICER-001",
            role="govt_body",
            govt_org_id="GAZ-MP-2026-HORTI",
            org_name="MP Horticulture & Silviculture Department",
            govt_type="state_department",
            state="Madhya Pradesh",
            district="Hoshangabad",
            block_tehsil="Pipariya",
            village_ward="Satpura",
            approval_status="APPROVED"
        )
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Expected 'Bearer <token>'."
        )
    
    return decode_govt_access_token(parts[1])

async def require_approved_govt_org(
    user: GovtUserClaims = Depends(get_current_govt_user)
) -> GovtUserClaims:
    if user.approval_status and user.approval_status.upper() not in ("APPROVED", "ACTIVE"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Government Organization account is {user.approval_status}. Access restricted to onboarding workspace until admin approval.",
        )
    return user

async def require_govt_role_only(
    user: GovtUserClaims = Depends(get_current_govt_user)
) -> GovtUserClaims:
    """Guard: Prevents government users from invoking admin-only APIs."""
    if user.role != "govt_body":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Role guard violation: Only registered Government Officers can perform this action."
        )
    return user

# ── Backend DB Query Level Jurisdiction Filtering ────────────────────────────

def apply_jurisdiction_filter(items: List[Dict[str, Any]], user: GovtUserClaims) -> List[Dict[str, Any]]:
    """Enforces jurisdiction filtering at database/backend query layer."""
    if user.role == "admin":
        return items  # Admin has global oversight

    filtered = []
    for item in items:
        # Match State
        item_state = item.get("state") or (item.get("jurisdiction", {}) if isinstance(item.get("jurisdiction"), dict) else {}).get("state")
        if item_state and item_state.lower().strip() != user.state.lower().strip():
            continue

        # Match District
        item_district = item.get("district") or (item.get("jurisdiction", {}) if isinstance(item.get("jurisdiction"), dict) else {}).get("district")
        if item_district and item_district.lower().strip() != user.district.lower().strip():
            continue

        # Match Block/Tehsil if officer has sub-district assignment
        if user.block_tehsil:
            item_block = item.get("block_tehsil") or item.get("tehsil") or item.get("block") or (item.get("jurisdiction", {}) if isinstance(item.get("jurisdiction"), dict) else {}).get("block_tehsil")
            if item_block and item_block.lower().strip() != user.block_tehsil.lower().strip():
                continue

        filtered.append(item)
    return filtered

def verify_single_item_jurisdiction(item: Dict[str, Any], user: GovtUserClaims):
    """Raises HTTP 403 if target resource falls outside assigned officer jurisdiction."""
    if user.role == "admin":
        return

    item_state = item.get("state") or (item.get("jurisdiction", {}) if isinstance(item.get("jurisdiction"), dict) else {}).get("state")
    if item_state and item_state.lower().strip() != user.state.lower().strip():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: Target resource is located in state '{item_state}', outside your assigned state '{user.state}'."
        )

    item_district = item.get("district") or (item.get("jurisdiction", {}) if isinstance(item.get("jurisdiction"), dict) else {}).get("district")
    if item_district and item_district.lower().strip() != user.district.lower().strip():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: Target resource is located in district '{item_district}', outside your assigned district '{user.district}'."
        )

# ── PII Data Masking ─────────────────────────────────────────────────────────

def mask_sensitive_pii(data: Any) -> Any:
    """Masks bank account numbers, IFSC codes, Aadhaar, and officer national IDs."""
    if isinstance(data, list):
        return [mask_sensitive_pii(item) for item in data]
    
    if isinstance(data, dict):
        masked_dict = {}
        for k, v in data.items():
            if isinstance(v, (dict, list)):
                masked_dict[k] = mask_sensitive_pii(v)
            elif isinstance(v, str):
                lower_k = k.lower()
                if "bank_account" in lower_k or "account_number" in lower_k or "acc_no" in lower_k:
                    masked_dict[k] = f"XXXXXX{v[-4:]}" if len(v) >= 4 else "XXXXXX1234"
                elif "ifsc" in lower_k:
                    masked_dict[k] = f"{v[:4]}0***{v[-3:]}" if len(v) >= 7 else "SBIN0***123"
                elif "aadhaar" in lower_k:
                    masked_dict[k] = f"XXXX-XXXX-{v[-4:]}" if len(v) >= 4 else "XXXX-XXXX-9012"
                elif "employee_id" in lower_k or "officer_id" in lower_k:
                    masked_dict[k] = f"OFF-***-{v[-3:]}" if len(v) >= 3 else "OFF-***-101"
                else:
                    masked_dict[k] = v
            else:
                masked_dict[k] = v
        return masked_dict

    return data
