import logging
import httpx
from app.config.settings import settings

logger = logging.getLogger(__name__)


async def send_otp_sms(mobile: str, otp: str) -> bool:
    """
    Send OTP via configured SMS provider.
    Returns True on success, False on failure.
    """
    if settings.SMS_PROVIDER == "console":
        logger.info("------------------------------------------")
        logger.info("  [DEV] OTP for %s:  %s", mobile, otp)
        logger.info("------------------------------------------")
        return True

    if settings.SMS_PROVIDER == "msg91":
        return await _send_via_msg91(mobile, otp)

    logger.warning("Unknown SMS_PROVIDER: %s. OTP not sent.", settings.SMS_PROVIDER)
    return False


async def _send_via_msg91(mobile: str, otp: str) -> bool:
    url = "https://api.msg91.com/api/v5/otp"
    payload = {
        "template_id": settings.MSG91_TEMPLATE_ID,
        "mobile": f"91{mobile}",
        "authkey": settings.MSG91_API_KEY,
        "otp": otp,
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(url, json=payload)
            data = resp.json()
            if data.get("type") == "success":
                logger.info("OTP sent via MSG91 to %s", mobile)
                return True
            logger.error("MSG91 error for %s: %s", mobile, data)
            return False
    except Exception as exc:
        logger.error("Failed to send OTP via MSG91: %s", exc)
        return False
