from fastapi import FastAPI, Depends
from fastapi.testclient import TestClient
from typing import List
from typing_extensions import Annotated
from pydantic import BaseModel

app = FastAPI()

class User(BaseModel):
    name: str

class VendorResponse(BaseModel):
    id: str

def get_user():
    return User(name="admin")

CurrentAdmin = Annotated[User, Depends(get_user)]

@app.get("/vendors", response_model=List[VendorResponse])
def get_vendors(current_admin: CurrentAdmin):
    return [{"invalid_field": "1"}]

client = TestClient(app)
res = client.get("/vendors")
print(res.status_code, res.json())
