import os
import re

UNICODE_SCRIPTS = {
    "Devanagari": (0x0900, 0x097F),
    "Bengali": (0x0980, 0x09FF),
    "Gurmukhi": (0x0A00, 0x0A7F),
    "Gujarati": (0x0A80, 0x0AFF),
    "Oriya": (0x0B00, 0x0B7F),
    "Tamil": (0x0B80, 0x0BFF),
    "Telugu": (0x0C00, 0x0C7F),
    "Kannada": (0x0C80, 0x0CFF),
    "Malayalam": (0x0D00, 0x0D7F),
    "Sinhala": (0x0D80, 0x0DFF),
}

def detect_script(text: str) -> dict:
    """
    Detects the Unicode script of the provided text.
    Returns structured metadata about the script.
    """
    if not text or not text.strip():
        return {"script": "Latin", "is_latin": True}

    for ch in text:
        cp = ord(ch)
        for script, (start, end) in UNICODE_SCRIPTS.items():
            if start <= cp <= end:
                return {"script": script, "is_latin": False}
                
    return {"script": "Latin", "is_latin": True}


def detect_category(filename: str, text: str = "") -> str:
    """
    Classifies the document into a specific category based on filename and text content.
    Supported categories: crop, fertilizer, soil, government_scheme, disease, weather, carbon_credit, general
    """
    (filename + " " + text).lower()

    categories = {
        "crop": [
            "crop",
            "wheat",
            "rice",
            "cotton",
            "sugarcane",
            "maize",
            "cultivation",
            "harvest",
            "seed",
            "yield",
        ],
        "fertilizer": [
            "fertilizer",
            "urea",
            "npk",
            "compost",
            "manure",
            "pesticide",
            "herbicide",
            "insecticide",
        ],
        "soil": [
            "soil",
            "ph",
            "nitrogen",
            "phosphorus",
            "potassium",
            "loam",
            "clay",
            "sand",
            "moisture",
        ],
        "government_scheme": [
            "scheme",
            "pm_kisan",
            "subsidy",
            "yojana",
            "portal",
            "government",
            "fund",
            "insurance",
        ],
        "disease": [
            "disease",
            "pest",
            "blight",
            "rust",
            "rot",
            "infection",
            "fungus",
            "virus",
            "symptom",
        ],
        "weather": [
            "weather",
            "climate",
            "rain",
            "monsoon",
            "drought",
            "temperature",
            "humidity",
            "forecast",
        ],
        "carbon_credit": [
            "carbon",
            "credit",
            "emission",
            "sustainability",
            "offset",
            "ghg",
        ],
    }

    # Check for hits
    best_category = "general"
    max_hits = 0

    # Fast check just on filename first
    filename_lower = filename.lower()
    for category, keywords in categories.items():
        if any(kw in filename_lower for kw in keywords):
            return category

    # Deeper check on text if filename is ambiguous
    # We only check the first 500 characters to keep it fast
    text_sample = text[:500].lower()
    for category, keywords in categories.items():
        hits = sum(1 for kw in keywords if kw in text_sample)
        if hits > max_hits:
            max_hits = hits
            best_category = category

    return best_category


def extract_title(filename: str, text: str = "") -> str:
    """
    Attempts to extract a meaningful title from the text (e.g., # Heading).
    Falls back to the filename without extension.
    """
    if text:
        # Look for Markdown style heading
        match = re.search(r"^\s*#\s+(.+)$", text, re.MULTILINE)
        if match:
            return match.group(1).strip()

        # Look for first non-empty line if it's reasonably short
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        if lines and len(lines[0]) < 100:
            return lines[0]

    # Fallback to filename without extension
    base = os.path.splitext(filename)[0]
    # Replace underscores and hyphens with spaces, capitalize
    title = base.replace("_", " ").replace("-", " ").title()
    return title
