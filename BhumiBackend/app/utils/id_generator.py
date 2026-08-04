from datetime import datetime, timezone

from pymongo import ReturnDocument

from app.models.counter import Counter


async def next_sequence_value(name: str) -> int:
    """
    Atomically increments and returns the next value for a named sequence,
    creating the counter document on first use. Safe under concurrent calls —
    backed by MongoDB's atomic findOneAndUpdate with upsert.
    """
    collection = Counter.get_motor_collection()
    doc = await collection.find_one_and_update(
        {"name": name},
        {
            "$inc": {"value": 1},
            "$set": {"updated_at": datetime.now(timezone.utc)},
        },
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return doc["value"]


async def generate_public_id(prefix: str, sequence_name: str, width: int = 6) -> str:
    """Generates a sequential, human-readable public ID, e.g. FAR-000001."""
    seq = await next_sequence_value(sequence_name)
    return f"{prefix}-{str(seq).zfill(width)}"
