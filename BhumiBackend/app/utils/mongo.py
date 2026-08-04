from beanie import PydanticObjectId
from app.core.exceptions import BadRequestException


def to_object_id(value: str, field_name: str = "id") -> PydanticObjectId:
    """
    Safely construct a PydanticObjectId from a string.

    Raises a controlled BadRequestException (HTTP 400) instead of letting
    bson.errors.InvalidId propagate as an unhandled 500 — a malformed or
    unexpected id value becomes a normal API error response, not a crash.
    """
    try:
        return PydanticObjectId(value)
    except Exception:
        raise BadRequestException(
            f"Invalid {field_name}: '{value}' is not a valid identifier.",
            "INVALID_OBJECT_ID",
        )
