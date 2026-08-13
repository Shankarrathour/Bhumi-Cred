import requests

def main():
    # Login
    login_res = requests.post("https://zenvora-bhumi.onrender.com/v1/admin/auth/login", json={
        "email": "superadmin@bhumicred.com",
        "password": "Superadmin@1234"
    })
    
    if login_res.status_code != 200:
        print("Login failed:", login_res.text)
        return
        
    token = login_res.json()["tokens"]["access_token"]
    print("Token retrieved successfully.")
    
    # GET land-verification
    res = requests.get("https://zenvora-bhumi.onrender.com/v1/admin/farmers/land-verification", headers={
        "Authorization": f"Bearer {token}"
    })
    
    print("GET Status:", res.status_code)
    print("GET Response:", res.text)

if __name__ == "__main__":
    main()
