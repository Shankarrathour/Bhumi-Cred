import os
from pymongo import MongoClient

try:
    uri = "mongodb+srv://bhumi:bhumi1234@bhumi.mjsidus.mongodb.net/?appName=bhumi"
    client = MongoClient(uri)
    db = client["bhumi"]
    count = db.tree_registrations.count_documents({})
    print(f"Total tree registrations in DB: {count}")
    
    docs = list(db.tree_registrations.find().sort("created_at", -1).limit(5))
    for d in docs:
        print(f"ID: {d['_id']}, Farmer: {d.get('farmer_id')}, Status: {d.get('status')}, Trees: {d.get('tree_count')}")
except Exception as e:
    print("Error:", e)
