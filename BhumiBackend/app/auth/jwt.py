from datetime import datetime, timedelta, timezone
from typing import Any
from jose import JWTError, jwt

from app.config.settings import settings
from app.core.exceptions import InvalidTokenException

# Token type constants
TOKEN_TYPE_FARMER = "farmer"
TOKEN_TYPE_ADMIN = "admin"
TOKEN_TYPE_GOVT = "govt_body"
TOKEN_TYPE_PARTNER = "partner"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(
    subject: str,
    token_type: str,
    extra_claims: dict[str, Any] | None = None,
) -> tuple[str, int]:
    """
    Create a signed JWT access token.

    Returns:
        (encoded_jwt, expires_in_seconds)
    """
    expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
    expires_at = _now() + timedelta(minutes=expire_minutes)

    claims: dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "iat": _now(),
        "exp": expires_at,
    }
    if extra_claims:
        claims.update(extra_claims)

    token = jwt.encode(claims, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token, expire_minutes * 60


def decode_access_token(token: str) -> dict[str, Any]:
    """
    Decode and validate a JWT access token.

    Raises:
        InvalidTokenException: on any validation failure.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError as exc:
        raise InvalidTokenException(f"Token validation failed: {exc}") from exc


