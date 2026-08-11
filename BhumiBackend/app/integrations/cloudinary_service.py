import asyncio
import logging

import cloudinary
import cloudinary.uploader
from fastapi import UploadFile

from app.config.settings import settings
from app.core.exceptions import BadRequestException
from app.models.cloudinary import CloudinaryAsset
from app.utils.upload import validate_upload

logger = logging.getLogger(__name__)


class CloudinaryService:
    """Reusable service for Cloudinary file uploads and deletions.

    Follows the existing service architecture: one instance is created as a
    module-level singleton in app/dependencies/services.py and injected into
    any service that performs file uploads.

    All Cloudinary SDK calls are synchronous and are therefore wrapped in
    asyncio.get_event_loop().run_in_executor() so the FastAPI event loop is
    never blocked.
    """

    def __init__(self) -> None:
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True,
        )

    # ── Public interface ──────────────────────────────────────────────────────

    @property
    def is_enabled(self) -> bool:
        """True when STORAGE_BACKEND=cloudinary is active."""
        return settings.STORAGE_BACKEND == "cloudinary"

    async def upload(
        self,
        file: UploadFile,
        folder: str,
        allowed_types: set[str],
        max_bytes: int,
    ) -> CloudinaryAsset:
        """Upload *file* to Cloudinary under *folder*.

        Validates MIME type and file size using the shared validate_upload()
        function before making any network call.  Each upload creates a new
        unique asset (UUID-based public_id, overwrite=False).

        Returns a CloudinaryAsset containing the secure_url, public_id, and
        the actual resource_type returned by Cloudinary (required for deletion).

        Raises:
            BadRequestException: invalid file type, file too large, or
                Cloudinary API failure.
        """
        content = await file.read()
        validate_upload(
            file.content_type or "",
            len(content),
            allowed_types,
            max_bytes,
        )

        original_filename = file.filename or ""

        content_type = (file.content_type or "").split(";")[0].strip()
        resource_type = "image" if (content_type.startswith("image/") or content_type == "application/pdf") else "raw"

        def _sync_upload() -> dict:
            return cloudinary.uploader.upload(
                content,
                folder=folder,
                resource_type=resource_type,
                use_filename=True,
                unique_filename=True,
                overwrite=False,
            )

        loop = asyncio.get_event_loop()
        try:
            result = await loop.run_in_executor(None, _sync_upload)
        except Exception as exc:
            logger.error(
                "Cloudinary upload failed [folder=%s filename=%s]: %s",
                folder,
                original_filename,
                exc,
            )
            raise BadRequestException(
                "File upload failed. Please try again.",
                "UPLOAD_FAILED",
            ) from exc

        return CloudinaryAsset(
            secure_url=result["secure_url"],
            public_id=result["public_id"],
            resource_type=result.get("resource_type", "image"),
            original_filename=original_filename,
        )

    async def delete(self, asset: CloudinaryAsset) -> None:
        """Delete a Cloudinary asset by its stored public_id and resource_type.

        Deletion failures are logged as warnings and do NOT propagate — a
        failed delete must never cause a user-facing request to fail.
        """
        if not asset or not asset.public_id:
            return

        def _sync_delete() -> None:
            cloudinary.uploader.destroy(
                asset.public_id,
                resource_type=asset.resource_type,
            )

        loop = asyncio.get_event_loop()
        try:
            await loop.run_in_executor(None, _sync_delete)
            logger.debug(
                "Cloudinary asset deleted [public_id=%s resource_type=%s]",
                asset.public_id,
                asset.resource_type,
            )
        except Exception as exc:
            logger.warning(
                "Cloudinary delete failed [public_id=%s resource_type=%s]: %s",
                asset.public_id,
                asset.resource_type,
                exc,
            )
