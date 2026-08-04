import requests

def test_api():
    login_res = requests.post("http://localhost:8000/v1/admin/auth/login", json={
        "email": "anand.verma@bhumicred.com",
        "password": "securepassword"
    })
    print("LOGIN:", login_res.status_code, login_res.text)
    
    token = login_res.json().get("access_token")
    if not token:
        print("No token received")
        return
        
    vendors_res = requests.get("http://localhost:8000/v1/admin/vendors", headers={
        "Authorization": f"Bearer {token}"
    })
    print("VENDORS:", vendors_res.status_code, vendors_res.text)

test_api()
