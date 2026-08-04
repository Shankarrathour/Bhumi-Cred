import secrets
import string
from datetime import datetime

def generate_order_number() -> str:
    """
    Generates a unique, readable order number.
    Format: AGR-YYYYMMDD-XXXXXX
    
    TODO: For true sequential numbering (AGR-YYYYMMDD-000001), a dedicated Counter collection 
    must be implemented in MongoDB to guarantee thread-safety and prevent race conditions. 
    Until transactions + counters are fully supported, using cryptographic randomness to ensure uniqueness.
    """
    date_str = datetime.now().strftime("%Y%m%d")
    random_str = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))
    return f"AGR-{date_str}-{random_str}"
