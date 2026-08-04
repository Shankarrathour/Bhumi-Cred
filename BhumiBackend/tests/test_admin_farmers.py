"""
Phase 3.1 — Admin Farmer Management unit tests.
All DB calls are mocked via dependency injection; no MongoDB connection required.
"""
from datetime import datetime, timezone

import pytest

from app.core.exceptions import BadRequestException, FarmerNotFoundException
from app.models.family_member import Relationship
from app.models.farmer import FarmerLocale, KYCStatus
from app.models.land_parcel import OwnershipType
from app.schemas.admin_farmer import (
    AdminBankResponse,
    AdminFarmerDetailResponse,
    AdminFarmerListItem,
    AdminIdentityResponse,
    UpdateFarmerStatusResponse,
)
from app.schemas.common import PaginatedResponse, PaginationMeta
from app.schemas.family import FamilyMemberResponse
from app.schemas.land import LandParcelResponse, LandSummaryResponse

BASE_URL = "/v1/admin/farmers"
FARMER_ID = "65f1234567890abcdef12345"
_NOW = datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc)


# ── Sample data helpers ───────────────────────────────────────────────────────

def _list_item() -> AdminFarmerListItem:
    return AdminFarmerListItem(
        id=FARMER_ID,
        mobile="9876543210",
        full_name="Test Farmer",
        state="Maharashtra",
        district="Pune",
        kyc_status=KYCStatus.UNVERIFIED,
        is_active=True,
        onboarding_completed=False,
        total_acreage=5.0,
        sustainability_score=60,
        created_at=_NOW,
    )


def _paginated() -> PaginatedResponse[AdminFarmerListItem]:
    return PaginatedResponse[AdminFarmerListItem](
        data=[_list_item()],
        meta=PaginationMeta(total=1, page=1, limit=20, total_pages=1),
    )


def _detail() -> AdminFarmerDetailResponse:
    return AdminFarmerDetailResponse(
        id=FARMER_ID,
        mobile="9876543210",
        full_name="Test Farmer",
        kyc_status=KYCStatus.UNVERIFIED,
        sustainability_score=0,
        total_acreage=0.0,
        total_trees=0,
        carbon_credits_generated=0.0,
        wallet_balance=0.0,
        locale=FarmerLocale.EN,
        is_active=True,
        onboarding_completed=False,
        created_at=_NOW,
        updated_at=_NOW,
    )


def _family() -> list[FamilyMemberResponse]:
    return [
        FamilyMemberResponse(
            id="65f0000000000000000000a1",
            name="Test Spouse",
            relationship=Relationship.SPOUSE,
            age=35,
            created_at=_NOW,
            updated_at=_NOW,
        )
    ]


def _land() -> LandSummaryResponse:
    parcel = LandParcelResponse(
        id="65f0000000000000000000b1",
        area_acres=5.0,
        ownership_type=OwnershipType.OWN,
        is_irrigated=True,
        created_at=_NOW,
        updated_at=_NOW,
    )
    return LandSummaryResponse(
        parcels=[parcel],
        total_area_acres=5.0,
        irrigated_area_acres=5.0,
        non_irrigated_area_acres=0.0,
    )


def _bank() -> AdminBankResponse:
    return AdminBankResponse(
        bank_name="State Bank of India",
        ifsc_code="SBIN0000123",
        account_number="1234567890123",
        account_holder_name="Test Farmer",
        is_verified=True,
        added_at=_NOW,
    )


def _identity() -> AdminIdentityResponse:
    return AdminIdentityResponse(
        aadhaar_number="123456789012",
        pan_number="ABCDE1234F",
        submitted_at=_NOW,
    )


def _status_resp(is_active: bool, kyc: KYCStatus, msg: str) -> UpdateFarmerStatusResponse:
    return UpdateFarmerStatusResponse(
        id=FARMER_ID,
        is_active=is_active,
        kyc_status=kyc,
        message=msg,
    )


# ── List Farmers ──────────────────────────────────────────────────────────────

def test_list_farmers_success(client, mock_farmer_service):
    mock_farmer_service.list_farmers.return_value = _paginated()
    r = client.get(BASE_URL)
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True
    assert body["meta"]["total"] == 1
    assert body["meta"]["page"] == 1
    assert body["data"][0]["mobile"] == "9876543210"
    assert body["data"][0]["id"] == FARMER_ID


def test_list_farmers_with_filters(client, mock_farmer_service):
    mock_farmer_service.list_farmers.return_value = _paginated()
    r = client.get(
        BASE_URL,
        params={
            "page": 2,
            "limit": 10,
            "kyc_status": "unverified",
            "is_active": True,
            "state": "Maharashtra",
            "district": "Pune",
            "search": "Test",
        },
    )
    assert r.status_code == 200
    _, kwargs = mock_farmer_service.list_farmers.call_args
    assert kwargs["page"] == 2
    assert kwargs["limit"] == 10
    assert kwargs["state"] == "Maharashtra"
    assert kwargs["search"] == "Test"


def test_list_farmers_no_auth(no_auth_client):
    r = no_auth_client.get(BASE_URL)
    assert r.status_code == 401


def test_list_farmers_invalid_page(client, mock_farmer_service):
    r = client.get(BASE_URL, params={"page": 0})
    assert r.status_code == 422
    assert r.json()["error_code"] == "VALIDATION_ERROR"


def test_list_farmers_invalid_limit(client, mock_farmer_service):
    r = client.get(BASE_URL, params={"limit": 101})
    assert r.status_code == 422
    assert r.json()["error_code"] == "VALIDATION_ERROR"


# ── Get Farmer Detail ─────────────────────────────────────────────────────────

def test_get_farmer_detail_success(client, mock_farmer_service):
    mock_farmer_service.get_farmer_detail.return_value = _detail()
    r = client.get(f"{BASE_URL}/{FARMER_ID}")
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True
    assert body["data"]["id"] == FARMER_ID
    assert body["data"]["mobile"] == "9876543210"


def test_get_farmer_detail_no_auth(no_auth_client):
    r = no_auth_client.get(f"{BASE_URL}/{FARMER_ID}")
    assert r.status_code == 401


def test_get_farmer_detail_not_found(client, mock_farmer_service):
    mock_farmer_service.get_farmer_detail.side_effect = FarmerNotFoundException()
    r = client.get(f"{BASE_URL}/{FARMER_ID}")
    assert r.status_code == 404
    assert r.json()["error_code"] == "FARMER_NOT_FOUND"


# ── Get Farmer Family ─────────────────────────────────────────────────────────

def test_get_farmer_family_success(client, mock_farmer_service):
    mock_farmer_service.get_farmer_family.return_value = _family()
    r = client.get(f"{BASE_URL}/{FARMER_ID}/family")
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True
    assert len(body["data"]) == 1
    assert body["data"][0]["name"] == "Test Spouse"
    assert body["data"][0]["relationship"] == "spouse"


def test_get_farmer_family_no_auth(no_auth_client):
    r = no_auth_client.get(f"{BASE_URL}/{FARMER_ID}/family")
    assert r.status_code == 401


def test_get_farmer_family_not_found(client, mock_farmer_service):
    mock_farmer_service.get_farmer_family.side_effect = FarmerNotFoundException()
    r = client.get(f"{BASE_URL}/{FARMER_ID}/family")
    assert r.status_code == 404
    assert r.json()["error_code"] == "FARMER_NOT_FOUND"


# ── Get Farmer Land ───────────────────────────────────────────────────────────

def test_get_farmer_land_success(client, mock_farmer_service):
    mock_farmer_service.get_farmer_land.return_value = _land()
    r = client.get(f"{BASE_URL}/{FARMER_ID}/land")
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True
    assert body["data"]["total_area_acres"] == 5.0
    assert body["data"]["irrigated_area_acres"] == 5.0
    assert len(body["data"]["parcels"]) == 1


def test_get_farmer_land_no_auth(no_auth_client):
    r = no_auth_client.get(f"{BASE_URL}/{FARMER_ID}/land")
    assert r.status_code == 401


def test_get_farmer_land_not_found(client, mock_farmer_service):
    mock_farmer_service.get_farmer_land.side_effect = FarmerNotFoundException()
    r = client.get(f"{BASE_URL}/{FARMER_ID}/land")
    assert r.status_code == 404
    assert r.json()["error_code"] == "FARMER_NOT_FOUND"


# ── Get Farmer Bank ───────────────────────────────────────────────────────────

def test_get_farmer_bank_success_super_admin(client, mock_farmer_service):
    mock_farmer_service.get_farmer_bank.return_value = _bank()
    r = client.get(f"{BASE_URL}/{FARMER_ID}/bank")
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True
    assert body["data"]["account_number"] == "1234567890123"
    assert body["data"]["ifsc_code"] == "SBIN0000123"


def test_get_farmer_bank_success_finance_manager(finance_client, mock_farmer_service):
    mock_farmer_service.get_farmer_bank.return_value = _bank()
    r = finance_client.get(f"{BASE_URL}/{FARMER_ID}/bank")
    assert r.status_code == 200
    assert r.json()["data"]["bank_name"] == "State Bank of India"


def test_get_farmer_bank_no_auth(no_auth_client):
    r = no_auth_client.get(f"{BASE_URL}/{FARMER_ID}/bank")
    assert r.status_code == 401


def test_get_farmer_bank_forbidden(support_client, mock_farmer_service):
    r = support_client.get(f"{BASE_URL}/{FARMER_ID}/bank")
    assert r.status_code == 403
    assert r.json()["error_code"] == "INSUFFICIENT_PERMISSIONS"


def test_get_farmer_bank_not_found(client, mock_farmer_service):
    mock_farmer_service.get_farmer_bank.side_effect = FarmerNotFoundException()
    r = client.get(f"{BASE_URL}/{FARMER_ID}/bank")
    assert r.status_code == 404
    assert r.json()["error_code"] == "FARMER_NOT_FOUND"


# ── Get Farmer Identity ───────────────────────────────────────────────────────

def test_get_farmer_identity_success_super_admin(client, mock_farmer_service):
    mock_farmer_service.get_farmer_identity.return_value = _identity()
    r = client.get(f"{BASE_URL}/{FARMER_ID}/identity")
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True
    assert body["data"]["aadhaar_number"] == "123456789012"
    assert body["data"]["pan_number"] == "ABCDE1234F"


def test_get_farmer_identity_success_operations_admin(operations_client, mock_farmer_service):
    mock_farmer_service.get_farmer_identity.return_value = _identity()
    r = operations_client.get(f"{BASE_URL}/{FARMER_ID}/identity")
    assert r.status_code == 200


def test_get_farmer_identity_no_auth(no_auth_client):
    r = no_auth_client.get(f"{BASE_URL}/{FARMER_ID}/identity")
    assert r.status_code == 401


def test_get_farmer_identity_forbidden_finance_manager(finance_client, mock_farmer_service):
    r = finance_client.get(f"{BASE_URL}/{FARMER_ID}/identity")
    assert r.status_code == 403
    assert r.json()["error_code"] == "INSUFFICIENT_PERMISSIONS"


def test_get_farmer_identity_not_found(client, mock_farmer_service):
    mock_farmer_service.get_farmer_identity.side_effect = FarmerNotFoundException()
    r = client.get(f"{BASE_URL}/{FARMER_ID}/identity")
    assert r.status_code == 404
    assert r.json()["error_code"] == "FARMER_NOT_FOUND"


# ── Update Farmer Status ──────────────────────────────────────────────────────

def test_update_status_activate(client, mock_farmer_service):
    mock_farmer_service.update_farmer_status.return_value = _status_resp(
        is_active=True,
        kyc=KYCStatus.UNVERIFIED,
        msg="Farmer account activated successfully.",
    )
    r = client.patch(
        f"{BASE_URL}/{FARMER_ID}/status",
        json={"status": "active"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True
    assert body["data"]["is_active"] is True
    assert body["data"]["kyc_status"] == "unverified"


def test_update_status_deactivate(client, mock_farmer_service):
    mock_farmer_service.update_farmer_status.return_value = _status_resp(
        is_active=False,
        kyc=KYCStatus.UNVERIFIED,
        msg="Farmer account deactivated successfully.",
    )
    r = client.patch(
        f"{BASE_URL}/{FARMER_ID}/status",
        json={"status": "inactive"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["data"]["is_active"] is False


def test_update_status_block(client, mock_farmer_service):
    mock_farmer_service.update_farmer_status.return_value = _status_resp(
        is_active=False,
        kyc=KYCStatus.BLOCKED,
        msg="Farmer account blocked successfully.",
    )
    r = client.patch(
        f"{BASE_URL}/{FARMER_ID}/status",
        json={"status": "blocked", "reason": "Suspected fraud"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["data"]["is_active"] is False
    assert body["data"]["kyc_status"] == "blocked"


def test_update_status_no_auth(no_auth_client):
    r = no_auth_client.patch(
        f"{BASE_URL}/{FARMER_ID}/status",
        json={"status": "active"},
    )
    assert r.status_code == 401


def test_update_status_forbidden(support_client, mock_farmer_service):
    r = support_client.patch(
        f"{BASE_URL}/{FARMER_ID}/status",
        json={"status": "active"},
    )
    assert r.status_code == 403
    assert r.json()["error_code"] == "INSUFFICIENT_PERMISSIONS"


def test_update_status_not_found(client, mock_farmer_service):
    mock_farmer_service.update_farmer_status.side_effect = FarmerNotFoundException()
    r = client.patch(
        f"{BASE_URL}/{FARMER_ID}/status",
        json={"status": "active"},
    )
    assert r.status_code == 404
    assert r.json()["error_code"] == "FARMER_NOT_FOUND"


def test_update_status_block_no_reason(client, mock_farmer_service):
    r = client.patch(
        f"{BASE_URL}/{FARMER_ID}/status",
        json={"status": "blocked"},
    )
    assert r.status_code == 422
    assert r.json()["error_code"] == "VALIDATION_ERROR"


def test_update_status_already_active(client, mock_farmer_service):
    mock_farmer_service.update_farmer_status.side_effect = BadRequestException(
        "Farmer account is already active.", "FARMER_ALREADY_ACTIVE"
    )
    r = client.patch(
        f"{BASE_URL}/{FARMER_ID}/status",
        json={"status": "active"},
    )
    assert r.status_code == 400
    assert r.json()["error_code"] == "FARMER_ALREADY_ACTIVE"


def test_update_status_already_blocked(client, mock_farmer_service):
    mock_farmer_service.update_farmer_status.side_effect = BadRequestException(
        "Farmer account is already blocked.", "FARMER_ALREADY_BLOCKED"
    )
    r = client.patch(
        f"{BASE_URL}/{FARMER_ID}/status",
        json={"status": "blocked", "reason": "Suspected fraud"},
    )
    assert r.status_code == 400
    assert r.json()["error_code"] == "FARMER_ALREADY_BLOCKED"
