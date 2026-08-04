import uuid
import asyncio
import logging
from pathlib import Path
from fastapi import UploadFile

from app.config.settings import settings
from app.core.exceptions import BadRequestException

logger = logging.getLogger(__name__)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_DOCUMENT_TYPES = {"image/jpeg", "image/png", "application/pdf"}
MAX_PHOTO_BYTES = 5 * 1024 * 1024       # 5 MB
MAX_DOCUMENT_BYTES = 10 * 1024 * 1024  # 10 MB

_MIME_TO_EXT: dict[str, str] = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
}


def validate_upload(
    content_type: str,
    content_size: int,
    allowed_types: set[str],
    max_bytes: int,
) -> str:
    """Validate MIME type and file size.

    Returns the normalised content_type string (charset suffix stripped).
    Raises BadRequestException on validation failure.

    Used by both upload_file() and CloudinaryService.upload() so validation
    logic is never duplicated across storage backends.
    """
    ct = (content_type or "").split(";")[0].strip()
    if ct not in allowed_types:
        raise BadRequestException(
            f"Invalid file type '{ct}'. Allowed: {', '.join(sorted(allowed_types))}.",
            "INVALID_FILE_TYPE",
        )
    if content_size > max_bytes:
        mb = max_bytes // (1024 * 1024)
        raise BadRequestException(
            f"File exceeds the maximum allowed size of {mb} MB.",
            "FILE_TOO_LARGE",
        )
    return ct


async def upload_file(
    file: UploadFile,
    folder: str,
    allowed_types: set[str],
    max_bytes: int,
) -> str:
    content = await file.read()
    content_type = validate_upload(
        file.content_type or "",
        len(content),
        allowed_types,
        max_bytes,
    )

    ext = _MIME_TO_EXT.get(content_type, "bin")
    key = f"{folder}/{uuid.uuid4()}.{ext}"

    if settings.STORAGE_BACKEND == "s3":
        return await _upload_to_s3(key, content, content_type)
    return await _save_locally(key, content)


async def _upload_to_s3(key: str, content: bytes, content_type: str) -> str:
    import boto3

    def _sync_upload() -> None:
        kwargs: dict = {
            "region_name": settings.AWS_REGION,
            "aws_access_key_id": settings.AWS_ACCESS_KEY_ID,
            "aws_secret_access_key": settings.AWS_SECRET_ACCESS_KEY,
        }
        if settings.S3_ENDPOINT_URL:
            kwargs["endpoint_url"] = settings.S3_ENDPOINT_URL

        client = boto3.client("s3", **kwargs)
        client.put_object(
            Bucket=settings.S3_BUCKET_NAME,
            Key=key,
            Body=content,
            ContentType=content_type,
        )

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _sync_upload)

    base = settings.S3_ENDPOINT_URL or f"https://s3.{settings.AWS_REGION}.amazonaws.com"
    return f"{base.rstrip('/')}/{settings.S3_BUCKET_NAME}/{key}"


async def _save_locally(key: str, content: bytes) -> str:
    dest = Path(settings.LOCAL_UPLOAD_DIR) / key
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(content)
    logger.debug("Saved upload to %s", dest)
    return f"{settings.BACKEND_BASE_URL}/uploads/{key}"
