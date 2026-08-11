import requests

def main():
    base_url = "http://localhost:8000/v1"
    
    # 1. Login
    login_payload = {
        "email": "superadmin@bhumicred.com",
        "password": "Superadmin@1234"
    }
    
    print("Logging in...")
    try:
        r = requests.post(f"{base_url}/admin/auth/login", json=login_payload)
        print(f"Login response code: {r.status_code}")
        if r.status_code != 200:
            print(r.text)
            return
        
        data = r.json()
        print(f"Login Response JSON: {data}")
        token = data.get("tokens", {}).get("access_token")
        if not token:
            print("Access token not found in response!")
            return
        print(f"Token acquired: {token[:20]}...")
    except Exception as e:
        print(f"Login failed: {e}")
        return

    # 2. Get Farmer profile
    farmer_id = "6a7ae5a3ae04a55a414b64b0"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    endpoints = [
        "/admin/farmers",
        f"/admin/farmers/{farmer_id}",
        f"/admin/farmers/{farmer_id}/identity",
        f"/admin/farmers/{farmer_id}/bank",
        f"/admin/farmers/{farmer_id}/activity",
        f"/admin/farmers/{farmer_id}/family",
        f"/admin/farmers/{farmer_id}/land"
    ]
    
    for ep in endpoints:
        print(f"\nRequesting {ep}...")
        try:
            r = requests.get(f"{base_url}{ep}", headers=headers)
            print(f"Response code: {r.status_code}")
            print(r.text[:500])
        except Exception as e:
            print(f"Request failed: {e}")

if __name__ == "__main__":
    main()
