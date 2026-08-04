from fastapi import APIRouter, UploadFile, File, Query, Depends
from pydantic import BaseModel
from typing import Optional

from app.utils.upload import upload_file, ALLOWED_IMAGE_TYPES, MAX_PHOTO_BYTES
from app.integrations.cloudinary_service import CloudinaryService
from app.dependencies.services import get_cloudinary_service
from app.config.settings import settings

router = APIRouter(prefix="/uploads", tags=["Uploads"])

class UploadResponse(BaseModel):
    image_url: str

@router.post("/image", response_model=UploadResponse)
async def upload_image(
    folder: str = Query("general", description="Folder name to store the image (e.g. banners, avatars)"),
    file: UploadFile = File(...),
    cloudinary_svc: CloudinaryService = Depends(get_cloudinary_service),
):
    """
    Generic endpoint for uploading images.
    Uploads to Cloudinary when STORAGE_BACKEND=cloudinary is active, falling back
    to the configured local/S3 storage backend otherwise (mirrors the pattern used
    by every other upload endpoint in the app).
    """
    if cloudinary_svc.is_enabled:
        asset = await cloudinary_svc.upload(
            file,
            folder=f"bhumi/{settings.cloudinary_env}/{folder}",
            allowed_types=ALLOWED_IMAGE_TYPES,
            max_bytes=MAX_PHOTO_BYTES,
        )
        return UploadResponse(image_url=asset.secure_url)

    url = await upload_file(
        file=file,
        folder=folder,
        allowed_types=ALLOWED_IMAGE_TYPES,
        max_bytes=MAX_PHOTO_BYTES
    )
    return UploadResponse(image_url=url)
