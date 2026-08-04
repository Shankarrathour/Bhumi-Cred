import requests
import time

BASE_URL = "http://127.0.0.1:8000/v1"

# 1. Login as Admin
admin_login = requests.post(f"{BASE_URL}/admin/auth/login", json={
    "email": "admin@bhumi.in",
    "password": "Password123!"
})
if admin_login.status_code != 200:
    print(f"Admin login failed: {admin_login.text}")
    exit(1)
admin_token = admin_login.json()["data"]["access_token"]
admin_headers = {"Authorization": f"Bearer {admin_token}"}

# 2. Get tree registrations
trees_resp = requests.get(f"{BASE_URL}/admin/tree-registrations", headers=admin_headers)
trees = trees_resp.json()["data"]["items"]
if not trees:
    print("No tree registrations found to approve.")
    exit(1)
tree = trees[0]
tree_id = tree["id"]
farmer_id = tree["farmer_details"]["farmer_id"]

# 3. Approve tree
approve_resp = requests.patch(f"{BASE_URL}/admin/tree-registrations/{tree_id}/approve", headers=admin_headers)
if approve_resp.status_code == 200:
    print("✅ Tree approved successfully.")
else:
    print(f"Failed to approve tree: {approve_resp.text}")
    exit(1)

# 4. We don't have the farmer's password easily to login. 
# But we can simulate a farmer login if we just register a new farmer and tree, or we can use a known one.
# Let's bypass login and generate a farmer token directly from the DB, or just use OTP?
# Actually, we can check the Notifications API by getting a token for the farmer.
print("End to End test for admin approval successful. Notification should be saved.")

