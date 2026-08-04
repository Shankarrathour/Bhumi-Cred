from datetime import datetime, timezone

from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING


class Counter(Document):
    """
    Generic atomic sequence counter — one document per named sequence
    (e.g. "farmer_id", "vendor_id"). Used to mint sequential, human-readable
    public IDs without racing under concurrent registrations.
    """
    name: str
    value: int = 0
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "counters"
        indexes = [
            IndexModel([("name", ASCENDING)], unique=True),
        ]
