from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from app.schemas.vendor_auth import (
    VendorRegisterRequest,
    VendorLoginRequest,
    VendorAuthResponse,
    VendorProfileResponse,
    VendorWizardUpdateRequest,
    PhotoUploadResponse,
)
from app.services.vendor_auth import VendorAuthService
from app.dependencies.auth import CurrentVendor
from app.dependencies.services import get_vendor_auth_service

router = APIRouter(prefix="/vendor/auth", tags=["Vendor Authentication"])

@router.post("/register", response_model=VendorAuthResponse, status_code=status.HTTP_201_CREATED)
async def register_vendor(
    data: VendorRegisterRequest,
    service: VendorAuthService = Depends(get_vendor_auth_service)
):
    """
    Register a new vendor account.
    """
    return await service.register_vendor(data)

@router.post("/login", response_model=VendorAuthResponse)
async def login_vendor(
    data: VendorLoginRequest,
    service: VendorAuthService = Depends(get_vendor_auth_service)
):
    """
    Login to a vendor account and receive a JWT access token.
    """
    return await service.login_vendor(data)

@router.get("/me", response_model=VendorProfileResponse)
async def get_current_vendor_profile(
    vendor: CurrentVendor,
    service: VendorAuthService = Depends(get_vendor_auth_service)
):
    """
    Get the currently authenticated vendor's profile.
    """
    return await service.get_current_vendor_profile(vendor)


@router.put("/me", response_model=VendorProfileResponse)
async def update_current_vendor_profile(
    data: VendorWizardUpdateRequest,
    vendor: CurrentVendor,
    service: VendorAuthService = Depends(get_vendor_auth_service)
):
    """
    Submit/resubmit the multi-step vendor registration wizard. Called once
    from the Review step. Resubmitting after a rejection resets status to
    Pending for re-review.
    """
    return await service.update_vendor_profile(vendor, data)


@router.post("/photo", response_model=PhotoUploadResponse)
async def upload_vendor_photo(
    vendor: CurrentVendor,
    file: UploadFile = File(...),
    service: VendorAuthService = Depends(get_vendor_auth_service),
):
    """
    Upload the vendor's profile photo (wizard Step 1). Used as the vendor's
    profile picture throughout the app.
    """
    url = await service.upload_photo(vendor, file)
    return PhotoUploadResponse(url=url, message="Photo uploaded successfully.")


@router.post("/kyc-document", response_model=PhotoUploadResponse)
async def upload_vendor_kyc_document(
    vendor: CurrentVendor,
    slot: str = Form(...),
    file: UploadFile = File(...),
    service: VendorAuthService = Depends(get_vendor_auth_service),
):
    """
    Upload a KYC identity document image (wizard Step 4). slot is 'front' or
    'back' — 'back' is only used for Aadhaar.
    """
    url = await service.upload_kyc_document(vendor, slot, file)
    return PhotoUploadResponse(url=url, message="Document uploaded successfully.")
