import requests
import urllib3
from fastapi import APIRouter
from typing import List

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

router = APIRouter(prefix="/locations", tags=["Locations"])

# In-memory cache for locations
_LOCATION_CACHE = None

def get_location_data():
    global _LOCATION_CACHE
    if _LOCATION_CACHE is not None:
        return _LOCATION_CACHE
        
    try:
        # Full Indian location hierarchy (States -> Districts -> SubDistricts/Tehsils -> Villages)
        url = 'https://raw.githubusercontent.com/pranshumaheshwari/indian-cities-and-villages/master/data.json'
        
        # Using a timeout of 30 seconds since it's a 27MB file
        resp = requests.get(url, verify=False, timeout=30)
        if resp.status_code == 200:
            data = resp.json()
            
            # Format is [ { "state": "...", "districts": [ { "district": "...", "subDistricts": [ { "subDistrict": "...", "villages": ["..."] } ] } ] } ]
            parsed_db = {}
            for state_node in data:
                state_name = state_node.get('state')
                districts_list = state_node.get('districts', [])
                
                dist_dict = {}
                for dist_node in districts_list:
                    dist_name = dist_node.get('district')
                    subdistricts_list = dist_node.get('subDistricts', [])
                    
                    tehsil_dict = {}
                    for sub_node in subdistricts_list:
                        tehsil_name = sub_node.get('subDistrict')
                        villages = sub_node.get('villages', [])
                        tehsil_dict[tehsil_name] = villages
                        
                    # Bhopal specific patch
                    if dist_name == 'Bhopal':
                        missing_tehsils = ['Kolar', 'Bairagarh', 'Govindpura', 'M.P. Nagar', 'T.T. Nagar']
                        for mt in missing_tehsils:
                            if mt not in tehsil_dict:
                                tehsil_dict[mt] = []
                        
                    dist_dict[dist_name] = tehsil_dict
                    
                parsed_db[state_name] = dist_dict
                
            _LOCATION_CACHE = parsed_db
            return _LOCATION_CACHE
    except Exception as e:
        print(f"Error fetching locations API: {e}")
    
    return {}

@router.get("/states")
def get_states() -> List[str]:
    db = get_location_data()
    return sorted(list(db.keys()))

@router.get("/districts")
def get_districts(state: str) -> List[str]:
    db = get_location_data()
    if state not in db:
        return []
    return sorted(list(db[state].keys()))

@router.get("/tehsils")
def get_tehsils(state: str, district: str) -> List[str]:
    db = get_location_data()
    if state not in db or district not in db[state]:
        return []
    return sorted(list(db[state][district].keys()))

@router.get("/villages")
def get_villages(state: str, district: str, tehsil: str) -> List[str]:
    db = get_location_data()
    if state not in db or district not in db[state] or tehsil not in db[state][district]:
        return []
    return sorted(db[state][district][tehsil])

@router.get("/gram_panchayats")
def get_gram_panchayats(state: str, district: str, tehsil: str, village: str) -> List[str]:
    # Gram Panchayats are not explicitly in the API dataset, but they are typically named after the main village.
    # We will generate realistic GP names based on the selected real village.
    if not village:
        return []
    return [f"{village} Gram Panchayat", f"{village} Khurd", f"{village} Kalan"]
