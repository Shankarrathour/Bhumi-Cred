from fastapi import APIRouter, Depends, File, UploadFile, Request
from typing import List

from app.dependencies.auth import CurrentFarmer, VerifiedFarmer
from app.dependencies.auth import CurrentFarmer
from app.dependencies.services import get_tree_registration_service, get_cloudinary_service
from app.schemas.common import SuccessResponse
from app.schemas.tree_registration import (
    RegisterTreeRequest,
    UpdateTreeRequest,
    TreeRegistrationResponse,
)
from app.services.tree_registration_service import TreeRegistrationService
from app.integrations.cloudinary_service import CloudinaryService
from app.utils.upload import upload_file, ALLOWED_IMAGE_TYPES, MAX_PHOTO_BYTES
from app.config.settings import settings

router = APIRouter(prefix="/tree", tags=["Tree Registration"])


@router.post(
    "/register",
    response_model=SuccessResponse[TreeRegistrationResponse],
    status_code=201,
    summary="Register a new tree for insurance shield",
)
async def register_tree(
    payload: RegisterTreeRequest,
    current_farmer: VerifiedFarmer,
    svc: TreeRegistrationService = Depends(get_tree_registration_service),
) -> SuccessResponse[TreeRegistrationResponse]:
    data = await svc.register_tree(str(current_farmer.id), payload)
    return SuccessResponse(message="Tree registered successfully.", data=data)


@router.get(
    "/my-registrations",
    response_model=SuccessResponse[list[TreeRegistrationResponse]],
    summary="Get all tree registrations for the logged in farmer",
)
async def get_my_registrations(
    current_farmer: CurrentFarmer,
    svc: TreeRegistrationService = Depends(get_tree_registration_service),
) -> SuccessResponse[list[TreeRegistrationResponse]]:
    data = await svc.get_farmer_registrations(str(current_farmer.id))
    return SuccessResponse(message="Tree registrations retrieved successfully.", data=data)


@router.get(
    "/{id}",
    response_model=SuccessResponse[TreeRegistrationResponse],
    summary="Get a specific tree registration details",
)
async def get_registration_details(
    id: str,
    current_farmer: CurrentFarmer,
    svc: TreeRegistrationService = Depends(get_tree_registration_service),
) -> SuccessResponse[TreeRegistrationResponse]:
    data = await svc.get_registration_details(id, str(current_farmer.id))
    return SuccessResponse(message="Tree registration retrieved successfully.", data=data)


@router.put(
    "/{id}",
    response_model=SuccessResponse[TreeRegistrationResponse],
    summary="Update a pending tree registration",
)
async def update_registration(
    id: str,
    payload: UpdateTreeRequest,
    current_farmer: VerifiedFarmer,
    svc: TreeRegistrationService = Depends(get_tree_registration_service),
) -> SuccessResponse[TreeRegistrationResponse]:
    data = await svc.update_registration(id, str(current_farmer.id), payload)
    return SuccessResponse(message="Tree registration updated successfully.", data=data)


@router.post(
    "/{tree_id}/photos",
    response_model=SuccessResponse[TreeRegistrationResponse],
    summary="Upload tree health photos",
)
async def upload_tree_photos(
    tree_id: str,
    request: Request,
    current_farmer: VerifiedFarmer,
    photos: List[UploadFile] = File(...),
    svc: TreeRegistrationService = Depends(get_tree_registration_service),
) -> SuccessResponse[TreeRegistrationResponse]:
    data = await svc.upload_photos(tree_id, str(current_farmer.id), photos, str(request.base_url).rstrip('/'))
    return SuccessResponse(message="Tree photos uploaded successfully.", data=data)

@router.post("/upload-sapling-scan", status_code=200)
async def upload_sapling_scan(
    current_farmer: CurrentFarmer,
    file: UploadFile = File(...),
    cloudinary_svc: CloudinaryService = Depends(get_cloudinary_service),
):
    """
    Uploads a single sapling-scan photo taken during the Green Family
    registration flow (see BhumiAPP app/insurance/register-family.tsx).
    Not yet tied to a specific tree registration, so it doesn't go through
    TreeRegistrationService — but it follows the same Cloudinary-first
    upload convention as every other upload endpoint (see
    app/utils/upload.py / CloudinaryService), instead of writing directly
    to local disk and returning a relative (non-loadable) path.
    """
    folder = f"saplings/{current_farmer.id}"
    if cloudinary_svc.is_enabled:
        asset = await cloudinary_svc.upload(
            file,
            folder=f"bhumi/{settings.cloudinary_env}/{folder}",
            allowed_types=ALLOWED_IMAGE_TYPES,
            max_bytes=MAX_PHOTO_BYTES,
        )
        return {"status": "Success", "url": asset.secure_url}

    url = await upload_file(
        file=file,
        folder=folder,
        allowed_types=ALLOWED_IMAGE_TYPES,
        max_bytes=MAX_PHOTO_BYTES,
    )
    return {"status": "Success", "url": url}
