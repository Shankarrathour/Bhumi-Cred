from passlib.context import CryptContext

_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return _ctx.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return _ctx.verify(plain, hashed)


def hash_otp(otp: str) -> str:
    """Hash OTP using bcrypt (same as passwords)."""
    return _ctx.hash(otp)


def verify_otp(otp: str, hashed: str) -> bool:
    return _ctx.verify(otp, hashed)
