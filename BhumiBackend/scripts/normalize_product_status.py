"""
One-off data migration — normalizes Product.status values in MongoDB to the
canonical lowercase ProductStatus enum members (pending, approved, rejected,
suspended, archived).

Historically, a legacy admin endpoint (removed) wrote title-case values
("Approved", "Rejected", "Pending") directly to the database, bypassing the
ProductStatus enum. Any document with such a value fails Beanie's schema
validation on read, which crashed the admin marketplace listing endpoint
with a 422.

Safe to re-run: only touches documents whose status isn't already one of the
five canonical values, and only ever maps them to a canonical value via a
case-insensitive match. Any status value that doesn't map to a known member
is reported, not silently guessed.

    python scripts/normalize_product_status.py
"""
import asyncio

from app.database.connection import connect_db, disconnect_db, get_client
from app.config.settings import settings

VALID_STATUSES = {"pending", "approved", "rejected", "suspended", "archived"}


async def main():
    await connect_db()
    try:
        collection = get_client()[settings.DATABASE_NAME].get_collection("products")

        total = await collection.count_documents({})
        print(f"Total product documents: {total}")

        fixed = 0
        unmappable = []

        async for doc in collection.find({}):
            raw_status = doc.get("status")
            if raw_status in VALID_STATUSES:
                continue

            normalized = str(raw_status).strip().lower() if raw_status is not None else None
            if normalized in VALID_STATUSES:
                await collection.update_one(
                    {"_id": doc["_id"]},
                    {"$set": {"status": normalized}},
                )
                print(f"  Fixed {doc['_id']} ({doc.get('name')!r}): {raw_status!r} -> {normalized!r}")
                fixed += 1
            else:
                unmappable.append((doc["_id"], doc.get("name"), raw_status))

        print(f"\nNormalized {fixed} document(s).")
        if unmappable:
            print(f"WARNING: {len(unmappable)} document(s) have a status that could not be "
                  f"mapped to a valid ProductStatus member and were left untouched:")
            for _id, name, raw_status in unmappable:
                print(f"  {_id} ({name!r}): {raw_status!r}")
        else:
            print("No unmappable status values remain.")
    finally:
        await disconnect_db()


asyncio.run(main())
