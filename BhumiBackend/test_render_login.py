import requests

def main():
    # Login
    login_res = requests.post("https://zenvora-bhumi.onrender.com/v1/admin/auth/login", json={
        "email": "superadmin@bhumicred.com",
        "password": "Superadmin@1234"
    })
    
    print("Login Status:", login_res.status_code)
    print("Login Response:", login_res.text)

if __name__ == "__main__":
    main()
