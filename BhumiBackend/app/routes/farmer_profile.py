from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.dependencies.auth import CurrentFarmer, VerifiedFarmer
from app.dependencies.services import get_farmer_profile_service
from app.schemas.common import SuccessResponse, MessageResponse
from app.schemas.farmer_profile import UpdateProfileRequest, FarmerProfileResponse, PhotoUploadResponse
from app.schemas.address import UpdateAddressRequest, AddressResponse
from app.schemas.family import CreateFamilyMemberRequest, UpdateFamilyMemberRequest, FamilyMemberResponse
from app.schemas.land import CreateLandParcelRequest, UpdateLandParcelRequest, LandSummaryResponse, LandParcelResponse
from app.schemas.bank import UpdateBankRequest, BankResponse
from app.schemas.identity import UpdateIdentityRequest, IdentityResponse, KYCStatusResponse
from app.services.farmer_profile_service import FarmerProfileService

router = APIRouter(prefix="/farmer", tags=["Farmer Profile"])


# ── Profile ───────────────────────────────────────────────────────────────────

@router.get(
    "/profile",
    response_model=SuccessResponse[FarmerProfileResponse],
    summary="Get farmer profile",
)
async def get_profile(
    current_farmer: CurrentFarmer,
    svc: FarmerProfileService = Depends(get_farmer_profile_service),
) -> SuccessResponse[FarmerProfileResponse]:
    data = await svc.get_profile(str(current_farmer.id))
    return SuccessResponse(message="Profile retrieved successfully.", data=data)


@router.put(
    "/profile",
    response_model=SuccessResponse[FarmerProfileResponse],
    summary="Update farmer profile",
)
async def update_profile(
    payload: UpdateProfileRequest,
    current_farmer: CurrentFarmer,
    svc: FarmerProfileService = Depends(get_farmer_profile_service),
) -> SuccessResponse[FarmerProfileResponse]:
    data = await svc.update_profile(str(current_farmer.id), payload)
    return SuccessResponse(message="Profile updated successfully.", data=data)


@router.post(
    "/profile/photo",
    response_model=SuccessResponse[PhotoUploadResponse],
    summary="Upload profile photo",
)
async def upload_photo(
    current_farmer: CurrentFarmer,
    file: UploadFile = File(...),
    svc: FarmerProfileService = Depends(get_farmer_profile_service),
) -> SuccessResponse[PhotoUploadResponse]:
    url = await svc.upload_photo(str(current_farmer.id), file)
    return SuccessResponse(
        message="Photo uploaded successfully.",
        data=PhotoUploadResponse(url=url, message="Photo uploaded successfully."),
    )


# ── Address ───────────────────────────────────────────────────────────────────

@router.get(
    "/address",
    response_model=SuccessResponse[AddressResponse],
    summary="Get farmer address",
)
async def get_address(
    current_farmer: CurrentFarmer,
    svc: FarmerProfileService = Depends(get_farmer_profile_service),
) -> SuccessResponse[AddressResponse]:
    data = await svc.get_address(str(current_farmer.id))
    return SuccessResponse(message="Address retrieved successfully.", data=data)


@router.put(
    "/address",
    response_model=SuccessResponse[AddressResponse],
    summary="Update farmer address",
)
async def update_address(
    payload: UpdateAddressRequest,
    current_farmer: CurrentFarmer,
    svc: FarmerProfileService = Depends(get_farmer_profile_service),
) -> SuccessResponse[AddressResponse]:
    data = await svc.update_address(str(current_farmer.id), payload)
    return SuccessResponse(message="Address updated successfully.", data=data)


# ── Family ────────────────────────────────────────────────────────────────────

@router.get(
    "/family",
    response_model=SuccessResponse[list[FamilyMemberResponse]],
    summary="Get farmer family members",
)
async def get_family(
    current_farmer: CurrentFarmer,
    svc: FarmerProfileService = Depends(get_farmer_profile_service),
) -> SuccessResponse[list[FamilyMemberResponse]]:
    data = await svc.get_family(str(current_farmer.id))
    return SuccessResponse(message="Family members retrieved successfully.", data=data)


@router.post(
    "/family",
    response_model=SuccessResponse[FamilyMemberResponse],
    status_code=201,
    summary="Add family member",
)
async def add_family_member(
    payload: CreateFamilyMemberRequest,
    current_farmer: CurrentFarmer,
    svc: FarmerProfileService = Depends(get_farmer_profile_service),
) -> SuccessResponse[FamilyMemberResponse]:
    data = await svc.add_family_member(str(current_farmer.id), payload)
    return SuccessResponse(message="Family member added successfully.", data=data)


@router.put(
    "/family/{member_id}",
    response_model=SuccessResponse[FamilyMemberResponse],
    summary="Update family member",
)
async def update_family_member(
    member_id: str,
    payload: UpdateFamilyMemberRequest,
    current_farmer: CurrentFarmer,
    svc: FarmerProfileService = Depends(get_farmer_profile_service),
) -> SuccessResponse[FamilyMemberResponse]:
    data = await svc.update_family_member(str(current_farmer.id), member_id, payload)
    return SuccessResponse(message="Family member updated successfully.", data=data)


@router.delete(
    "/family/{member_id}",
    response_model=MessageResponse,
    summary="Remove family member",
)
async def delete_family_member(
    member_id: str,
    current_farmer: CurrentFarmer,
    svc: FarmerProfileService = Depends(get_farmer_profile_service),
) -> MessageResponse:
    await svc.delete_family_member(str(current_farmer.id), member_id)
    return MessageResponse(message="Family member removed successfully.")


# ── Land ──────────────────────────────────────────────────────────────────────

@router.get(
    "/land",
    response_model=SuccessResponse[LandSummaryResponse],
    summary="Get farmer land parcels",
)
async def get_land(
    current_farmer: CurrentFarmer,
    svc: FarmerProfileService = Depends(get_farmer_profile_service),
) -> SuccessResponse[LandSummaryResponse]:
    data = await svc.get_land(str(current_farmer.id))
    return SuccessResponse(message="Land details retrieved successfully.", data=data)


@router.post(
    "/land",
    response_model=SuccessResponse[LandParcelResponse],
    status_code=201,
    summary="Add land parcel",
)
async def add_land_parcel(
    payload: CreateLandParcelRequest,
    current_farmer: VerifiedFarmer,
    svc: FarmerProfileService = Depends(get_farmer_profile_service),
) -> SuccessResponse[LandParcelResponse]:
    data = await svc.add_land_parcel(str(current_farmer.id), payload)
    return SuccessResponse(message="Land parcel added successfully.", data=data)


@router.put(
    "/land/{parcel_id}",
    response_model=SuccessResponse[LandParcelResponse],
    summary="Update land parcel",
)
async def update_land_parcel(
    parcel_id: str,
    payload: UpdateLandParcelRequest,
    current_farmer: VerifiedFarmer,
    svc: FarmerProfileService = Depends(get_farmer_profile_service),
) -> SuccessResponse[LandParcelResponse]:
    data = await svc.update_land_parcel(str(current_farmer.id), parcel_id, payload)
    return SuccessResponse(message="Land parcel updated successfully.", data=data)


@router.delete(
    "/land/{parcel_id}",
    response_model=MessageResponse,
    summary="Remove land parcel",
)
async def delete_land_parcel(
    parcel_id: str,
    current_farmer: VerifiedFarmer,
    svc: FarmerProfileService = Depends(get_farmer_profile_service),
) -> MessageResponse:
    await svc.delete_land_parcel(str(current_farmer.id), parcel_id)
    return MessageResponse(message="Land parcel removed successfully.")


# ── Bank ──────────────────────────────────────────────────────────────────────

@router.get(
    "/bank",
    response_model=SuccessResponse[BankResponse],
    summary="Get bank details",
)
async def get_bank(
    current_farmer: CurrentFarmer,
    svc: FarmerProfileService = Depends(get_farmer_profile_service),
) -> SuccessResponse[BankResponse]:
    data = await svc.get_bank(str(current_farmer.id))
    return SuccessResponse(message="Bank details retrieved successfully.", data=data)


@router.put(
    "/bank",
    response_model=SuccessResponse[BankResponse],
    summary="Update bank details",
)
async def update_bank(
    payload: UpdateBankRequest,
    current_farmer: CurrentFarmer,
    svc: FarmerProfileService = Depends(get_farmer_profile_service),
) -> SuccessResponse[BankResponse]:
    data = await svc.update_bank(str(current_farmer.id), payload)
    return SuccessResponse(message="Bank details updated successfully.", data=data)


# ── Identity ──────────────────────────────────────────────────────────────────

@router.get(
    "/identity",
    response_model=SuccessResponse[IdentityResponse],
    summary="Get identity details",
)
async def get_identity(
    current_farmer: CurrentFarmer,
    svc: FarmerProfileService = Depends(get_farmer_profile_service),
) -> SuccessResponse[IdentityResponse]:
    data = await svc.get_identity(str(current_farmer.id))
    return SuccessResponse(message="Identity details retrieved successfully.", data=data)


@router.put(
    "/identity",
    response_model=SuccessResponse[IdentityResponse],
    summary="Update identity details",
)
async def update_identity(
    payload: UpdateIdentityRequest,
    current_farmer: CurrentFarmer,
    svc: FarmerProfileService = Depends(get_farmer_profile_service),
) -> SuccessResponse[IdentityResponse]:
    data = await svc.update_identity(str(current_farmer.id), payload)
    return SuccessResponse(message="Identity details updated successfully.", data=data)


@router.post(
    "/identity/document",
    response_model=SuccessResponse[PhotoUploadResponse],
    summary="Upload identity document photo (Aadhaar or PAN)",
)
async def upload_identity_document(
    current_farmer: CurrentFarmer,
    document_type: str = Form(...),
    file: UploadFile = File(...),
    svc: FarmerProfileService = Depends(get_farmer_profile_service),
) -> SuccessResponse[PhotoUploadResponse]:
    url = await svc.upload_identity_document(str(current_farmer.id), document_type, file)
    return SuccessResponse(
        message="Identity document uploaded successfully.",
        data=PhotoUploadResponse(url=url, message="Document uploaded successfully."),
    )


# ── KYC ──────────────────────────────────────────────────────────────────────

@router.get(
    "/kyc",
    response_model=SuccessResponse[KYCStatusResponse],
    summary="Get KYC status",
)
async def get_kyc_status(
    current_farmer: CurrentFarmer,
    svc: FarmerProfileService = Depends(get_farmer_profile_service),
) -> SuccessResponse[KYCStatusResponse]:
    data = await svc.get_kyc_status(str(current_farmer.id))
    return SuccessResponse(message="KYC status retrieved successfully.", data=data)


@router.post(
    "/profile/land/document",
    response_model=SuccessResponse[PhotoUploadResponse],
    summary="Upload land document photo",
)
async def upload_land_document(
    current_farmer: CurrentFarmer,
    file: UploadFile = File(...),
    svc: FarmerProfileService = Depends(get_farmer_profile_service),
) -> SuccessResponse[PhotoUploadResponse]:
    url = await svc.upload_land_document(str(current_farmer.id), file)
    return SuccessResponse(
        message="Land document uploaded successfully.",
        data=PhotoUploadResponse(url=url, message="Document uploaded successfully."),
    )


@router.delete(
    "/account",
    response_model=MessageResponse,
    summary="Delete farmer account",
)
async def delete_account(
    current_farmer: CurrentFarmer,
    svc: FarmerProfileService = Depends(get_farmer_profile_service),
) -> MessageResponse:
    await svc.delete_account(str(current_farmer.id))
    return MessageResponse(message="Account deleted successfully.")

