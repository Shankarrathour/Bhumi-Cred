"""
One-off backfill migration — assigns the new human-readable public IDs
(farmer_id: "FAR-000001", vendor_id: "VEN-000001") to Farmer and Vendor
documents that predate this feature and therefore have no such field yet.

Existing documents are processed oldest-first (by created_at) so the public
ID sequence reads chronologically for pre-existing data, exactly as it will
for new registrations going forward. Both this script and the live
registration path (FarmerRepository.find_or_create, VendorRepository.
find_or_create, VendorAuthService.register_vendor) draw from the same
MongoDB-backed atomic counters ("farmer_id" / "vendor_id"), so IDs assigned
here and IDs assigned to brand-new registrations can never collide, no
matter which runs first or how many times this script is re-run.

Safe to re-run: only documents where farmer_id/vendor_id is missing or null
are touched; documents that already have a public ID are left untouched.

Does NOT modify _id, does NOT touch any other field, does NOT affect any
existing API, workflow, or relationship — this only adds the new field to
records that don't have it.

    python -m scripts.backfill_public_ids
"""
import asyncio

from app.database.connection import connect_db, disconnect_db
from app.models.farmer import Farmer
from app.models.vendor import Vendor
from app.utils.id_generator import generate_public_id


async def backfill_farmers() -> None:
    missing = await Farmer.find(
        {"$or": [{"farmer_id": {"$exists": False}}, {"farmer_id": None}]}
    ).sort("+created_at").to_list()

    print(f"Farmers missing farmer_id: {len(missing)}")
    for farmer in missing:
        farmer.farmer_id = await generate_public_id("FAR", "farmer_id")
        await farmer.save()
        print(f"  {farmer.id} -> {farmer.farmer_id}")

    print(f"Backfilled {len(missing)} farmer(s).\n")


async def backfill_vendors() -> None:
    missing = await Vendor.find(
        {"$or": [{"vendor_id": {"$exists": False}}, {"vendor_id": None}]}
    ).sort("+created_at").to_list()

    print(f"Vendors missing vendor_id: {len(missing)}")
    for vendor in missing:
        vendor.vendor_id = await generate_public_id("VEN", "vendor_id")
        await vendor.save()
        print(f"  {vendor.id} -> {vendor.vendor_id}")

    print(f"Backfilled {len(missing)} vendor(s).\n")


async def main():
    await connect_db()
    try:
        await backfill_farmers()
        await backfill_vendors()
    finally:
        await disconnect_db()


asyncio.run(main())
