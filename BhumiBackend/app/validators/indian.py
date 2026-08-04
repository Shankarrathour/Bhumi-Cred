import re

AADHAAR_RE = re.compile(r"^\d{12}$")
PAN_RE = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]$")
IFSC_RE = re.compile(r"^[A-Z]{4}0[A-Z0-9]{6}$")
PINCODE_RE = re.compile(r"^\d{6}$")
DRIVING_LICENCE_RE = re.compile(r"^[A-Z0-9]{10,16}$")
VOTER_ID_RE = re.compile(r"^[A-Z]{3}[0-9]{7}$")


def validate_aadhaar(v: str) -> str:
    v = v.strip()
    if not AADHAAR_RE.match(v):
        raise ValueError("Aadhaar number must be exactly 12 digits.")
    return v


def validate_pan(v: str) -> str:
    v = v.strip().upper()
    if not PAN_RE.match(v):
        raise ValueError("PAN must be in the format ABCDE1234F.")
    return v


def validate_ifsc(v: str) -> str:
    v = v.strip().upper()
    if not IFSC_RE.match(v):
        raise ValueError("IFSC code must be in the format ABCD0XXXXXX (e.g. SBIN0001234).")
    return v


def validate_pincode(v: str) -> str:
    v = v.strip()
    if not PINCODE_RE.match(v):
        raise ValueError("Pincode must be exactly 6 digits.")
    return v


def validate_driving_licence(v: str) -> str:
    v = v.strip().upper().replace(" ", "").replace("-", "")
    if not DRIVING_LICENCE_RE.match(v):
        raise ValueError("Driving Licence number must be 10-16 alphanumeric characters.")
    return v


def validate_voter_id(v: str) -> str:
    v = v.strip().upper()
    if not VOTER_ID_RE.match(v):
        raise ValueError("Voter ID must be in the format ABC1234567.")
    return v
