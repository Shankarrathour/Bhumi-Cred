from datetime import datetime, timezone
from pydantic import BaseModel, Field


class CloudinaryAsset(BaseModel):
    """Embedded document storing Cloudinary file metadata.

    Stored alongside every *_url field so the asset can be managed
    (replaced, deleted) throughout its lifecycle without losing the
    public_id or resource_type required by the Cloudinary API.
    """

    secure_url: str
    public_id: str
    resource_type: str = "image"
    original_filename: str = ""
    uploaded_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    storage_provider: str = "cloudinary"
