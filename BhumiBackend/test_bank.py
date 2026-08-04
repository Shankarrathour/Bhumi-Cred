import httpx
import asyncio

async def test_add_bank():
    # 1. Get OTP
    mobile = "9999999999"
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000") as client:
        res = await client.post("/v1/auth/login/send-otp", json={"mobile": mobile})
        if res.status_code != 200:
            print("Failed to send OTP:", res.text)
            return
            
        # 2. Verify OTP
        res = await client.post("/v1/auth/login/verify-otp", json={"mobile": mobile, "otp": "123456"})
        if res.status_code != 200:
            print("Failed to verify OTP:", res.text)
            return
            
        token = res.json()["data"]["access_token"]
        
        # 3. Add Bank Account
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "bank_name": "State Bank of India",
            "account_number": "******1234",
            "ifsc_code": "SBIN0001234",
            "account_holder_name": "Divya"
        }
        res = await client.post("/v1/farmer/wallet/bank-account", json=payload, headers=headers)
        print("Status:", res.status_code)
        print("Response:", res.text)

asyncio.run(test_add_bank())
