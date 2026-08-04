from datetime import datetime, timezone
from typing import Optional

from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING

from app.models.cloudinary import CloudinaryAsset

class AgriApplicationDocument(Document):
    application_id: str
    document_type: str
    original_file_name: str
    stored_file_name: str
    file_url: str
    cloudinary_asset: Optional[CloudinaryAsset] = None
    mime_type: str
    file_size: int
    upload_status: str = "UPLOADED"
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "agri_application_documents"
        indexes = [
            IndexModel([("application_id", ASCENDING)]),
            IndexModel([("application_id", ASCENDING), ("document_type", ASCENDING)]),
        ]
