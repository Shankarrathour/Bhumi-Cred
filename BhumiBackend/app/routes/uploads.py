from fastapi import APIRouter, UploadFile, File, Query, Depends
from pydantic import BaseModel
from typing import Optional

from app.utils.upload import upload_file, ALLOWED_IMAGE_TYPES, ALLOWED_DOCUMENT_TYPES, MAX_PHOTO_BYTES, MAX_DOCUMENT_BYTES
from app.integrations.cloudinary_service import CloudinaryService
from app.dependencies.services import get_cloudinary_service
from app.config.settings import settings

router = APIRouter(prefix="/uploads", tags=["Uploads"])

class UploadResponse(BaseModel):
    image_url: str

class DocumentUploadResponse(BaseModel):
    document_url: str
    file_name: Optional[str] = None

@router.post("/image", response_model=UploadResponse)
async def upload_image(
    folder: str = Query("general", description="Folder name to store the image (e.g. banners, avatars)"),
    file: UploadFile = File(...),
    cloudinary_svc: CloudinaryService = Depends(get_cloudinary_service),
):
    """
    Generic endpoint for uploading images.
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


@router.post("/document", response_model=DocumentUploadResponse)
async def upload_document(
    folder: str = Query("mou_documents", description="Folder name for documents (e.g. mou_documents, authority_letters)"),
    file: UploadFile = File(...),
    cloudinary_svc: CloudinaryService = Depends(get_cloudinary_service),
):
    """
    Endpoint for uploading PDF, DOC, and image official documents (e.g. MoU PDF, authorization letters).
    """
    if cloudinary_svc.is_enabled:
        asset = await cloudinary_svc.upload(
            file,
            folder=f"bhumi/{settings.cloudinary_env}/{folder}",
            allowed_types=ALLOWED_DOCUMENT_TYPES,
            max_bytes=MAX_DOCUMENT_BYTES,
        )
        return DocumentUploadResponse(document_url=asset.secure_url, file_name=file.filename)

    url = await upload_file(
        file=file,
        folder=folder,
        allowed_types=ALLOWED_DOCUMENT_TYPES,
        max_bytes=MAX_DOCUMENT_BYTES
    )
    return DocumentUploadResponse(document_url=url, file_name=file.filename)

