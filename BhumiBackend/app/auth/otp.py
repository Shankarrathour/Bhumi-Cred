import string
import hashlib
import secrets

from app.config.settings import settings


def generate_otp() -> str:
    """Generate a cryptographically safe numeric OTP."""
    return "".join(secrets.choice(string.digits) for _ in range(settings.OTP_LENGTH))


def hash_refresh_token(raw_token: str) -> str:
    """SHA-256 hash used for refresh-token storage."""
    return hashlib.sha256(raw_token.encode()).hexdigest()


def generate_refresh_token() -> str:
    """Generate a URL-safe random refresh token string."""
    return secrets.token_urlsafe(48)
