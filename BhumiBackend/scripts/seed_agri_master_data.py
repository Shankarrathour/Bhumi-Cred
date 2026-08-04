import asyncio
import sys
import os
from datetime import datetime, timezone

# Add the parent directory to sys.path so we can import 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.connection import connect_db, disconnect_db
from app.models.agri_category import AgriCategory
from app.models.agri_scheme import AgriScheme

CATEGORIES = [
    {
        "name": "Government Schemes",
        "slug": "government-schemes",
        "icon": "bank",
        "description": "Government financial assistance schemes.",
        "display_order": 1
    },
    {
        "name": "Agri Loans",
        "slug": "agri-loans",
        "icon": "wallet",
        "description": "Agricultural loans and rural banking.",
        "display_order": 2
    },
    {
        "name": "Crop Insurance",
        "slug": "crop-insurance",
        "icon": "shield",
        "description": "Insurance schemes for crops.",
        "display_order": 3
    },
    {
        "name": "Subsidies",
        "slug": "subsidies",
        "icon": "gift",
        "description": "Government subsidy programs.",
        "display_order": 4
    },
    {
        "name": "Equipment Finance",
        "slug": "equipment-finance",
        "icon": "tractor",
        "description": "Farm equipment financing.",
        "display_order": 5
    }
]

SCHEMES = [
    {
        "title": "PM-KISAN (Government Schemes)",
        "slug": "pm-kisan",
        "category_slug": "government-schemes",
        "ministry": "Ministry of Agriculture & Farmers Welfare",
        "short_description": "Income support to all landholding farmer families.",
        "description": "Direct income support of ₹6,000 per year paid in three equal installments of ₹2,000 directly to verified landholding farmer families bank accounts.",
        "benefits": ["₹6,000 / Year", "Direct Bank Transfer"],
        "eligibility_summary": ["Cultivable landholders", "Not institutional landholders"],
        "required_documents": ["Aadhaar", "Land Records", "Bank Account Details"],
        "benefit_type": "Direct Transfer",
        "benefit_amount": "₹6,000/year",
        "interest_rate": None,
        "deadline": datetime(2026, 12, 31, tzinfo=timezone.utc),
        "thumbnail": "pm_kisan.png",
        "status": "Active",
        "display_order": 1,
        "is_active": True
    },
    {
        "title": "PM-KUSUM (Subsidies)",
        "slug": "pm-kusum",
        "category_slug": "subsidies",
        "ministry": "Ministry of New and Renewable Energy",
        "short_description": "Subsidy on solar pumps.",
        "description": "Provides subsidies for setting up solar pumps and other renewable power plants.",
        "benefits": ["Up to 60% Subsidy"],
        "eligibility_summary": ["Farmers", "Panchayats", "Cooperatives"],
        "required_documents": ["Aadhaar", "Land Document"],
        "benefit_type": "Subsidy",
        "benefit_amount": "Up to 60%",
        "interest_rate": None,
        "deadline": datetime(2026, 12, 31, tzinfo=timezone.utc),
        "thumbnail": "pm_kusum.png",
        "status": "Active",
        "display_order": 2,
        "is_active": True
    },
    {
        "title": "PMFBY (Crop Insurance)",
        "slug": "pmfby",
        "category_slug": "crop-insurance",
        "ministry": "Ministry of Agriculture & Farmers Welfare",
        "short_description": "Comprehensive crop insurance.",
        "description": "Provides insurance cover and financial support to the farmers in the event of failure of any of the notified crop.",
        "benefits": ["Insurance Cover"],
        "eligibility_summary": ["All farmers growing notified crops"],
        "required_documents": ["Aadhaar", "Land Records", "Crop Sowing Certificate"],
        "benefit_type": "Insurance",
        "benefit_amount": "Crop Insurance",
        "interest_rate": None,
        "deadline": datetime(2026, 12, 31, tzinfo=timezone.utc),
        "thumbnail": "pmfby.png",
        "status": "Active",
        "display_order": 3,
        "is_active": True
    },
    {
        "title": "Kisan Credit Card (Agri Loans)",
        "slug": "kisan-credit-card",
        "category_slug": "agri-loans",
        "ministry": "Ministry of Agriculture & Farmers Welfare",
        "short_description": "Credit support for agricultural needs.",
        "description": "Provides adequate and timely credit support from the banking system under a single window.",
        "benefits": ["Timely Credit"],
        "eligibility_summary": ["Farmers", "Tenant Farmers"],
        "required_documents": ["Aadhaar", "Land Records", "Passport size photo"],
        "benefit_type": "Loan",
        "benefit_amount": "Up to ₹3,00,000",
        "interest_rate": "7%",
        "deadline": None,
        "thumbnail": "kcc.png",
        "status": "Active",
        "display_order": 4,
        "is_active": True
    },
    {
        "title": "Agri Infrastructure Fund (Agri Loans)",
        "slug": "agri-infrastructure-fund",
        "category_slug": "agri-loans",
        "ministry": "Ministry of Agriculture & Farmers Welfare",
        "short_description": "Financing facility for post-harvest management infrastructure.",
        "description": "Medium - long term debt financing facility for investment in viable projects for post-harvest management infrastructure and community farming assets.",
        "benefits": ["Interest Subvention", "Credit Guarantee"],
        "eligibility_summary": ["FPOs", "PACS", "Agri-entrepreneurs"],
        "required_documents": ["Project Report", "KYC Documents"],
        "benefit_type": "Loan/Guarantee",
        "benefit_amount": "Credit Guarantee",
        "interest_rate": "3%",
        "deadline": None,
        "thumbnail": "aif.png",
        "status": "Active",
        "display_order": 5,
        "is_active": True
    },
    {
        "title": "Organic Farming Promotion (Subsidies)",
        "slug": "organic-farming-promotion",
        "category_slug": "subsidies",
        "ministry": "Ministry of Agriculture & Farmers Welfare",
        "short_description": "Promotes organic farming practices.",
        "description": "Financial assistance provided for cluster formation, capacity building, and incentive for inputs.",
        "benefits": ["Financial Assistance", "Capacity Building"],
        "eligibility_summary": ["Farmers groups"],
        "required_documents": ["Aadhaar", "Land Records"],
        "benefit_type": "Financial Assistance",
        "benefit_amount": "₹50,000",
        "interest_rate": None,
        "deadline": None,
        "thumbnail": "organic.png",
        "status": "Active",
        "display_order": 6,
        "is_active": True
    },
    {
        "title": "Farm Mechanization Scheme (Equipment Finance)",
        "slug": "farm-mechanization-scheme",
        "category_slug": "equipment-finance",
        "ministry": "Ministry of Agriculture & Farmers Welfare",
        "short_description": "Subsidy on agricultural machinery.",
        "description": "Promotes inclusive growth of farm mechanization to boost productivity.",
        "benefits": ["Subsidy on Machinery"],
        "eligibility_summary": ["All Farmers"],
        "required_documents": ["Aadhaar", "Land Records", "Machinery Quotation"],
        "benefit_type": "Subsidy",
        "benefit_amount": "40% Subsidy",
        "interest_rate": None,
        "deadline": None,
        "thumbnail": "tractor.png",
        "status": "Active",
        "display_order": 7,
        "is_active": True
    },
    {
        "title": "NABARD Dairy Scheme (Agri Loans)",
        "slug": "nabard-dairy-scheme",
        "category_slug": "agri-loans",
        "ministry": "Department of Animal Husbandry & Dairying",
        "short_description": "Support for setting up modern dairy farms.",
        "description": "Assistance to promote setting up of modern dairy farms for production of clean milk.",
        "benefits": ["Capital Subsidy"],
        "eligibility_summary": ["Farmers", "Individual Entrepreneurs", "NGOs"],
        "required_documents": ["Aadhaar", "Land Records", "Project Report"],
        "benefit_type": "Loan Assistance",
        "benefit_amount": "Loan Assistance",
        "interest_rate": None,
        "deadline": None,
        "thumbnail": "dairy.png",
        "status": "Active",
        "display_order": 8,
        "is_active": True
    }
]

async def run_seed():
    print("Connecting to database...")
    await connect_db()
    
    categories_inserted = 0
    schemes_inserted = 0
    skipped = 0

    print("\n--- Seeding Categories ---")
    category_map = {}
    for cat_data in CATEGORIES:
        existing = await AgriCategory.find_one(AgriCategory.slug == cat_data["slug"])
        if existing:
            print(f"Skipped existing: {cat_data['name']}")
            skipped += 1
            category_map[cat_data["slug"]] = existing
        else:
            new_cat = AgriCategory(**cat_data)
            await new_cat.insert()
            print(f"Inserted category: {cat_data['name']}")
            categories_inserted += 1
            category_map[cat_data["slug"]] = new_cat

    print("\n--- Seeding Schemes ---")
    for sch_data in SCHEMES:
        existing = await AgriScheme.find_one(AgriScheme.slug == sch_data["slug"])
        if existing:
            print(f"Skipped existing: {sch_data['title']}")
            skipped += 1
        else:
            cat_slug = sch_data.pop("category_slug")
            cat = category_map.get(cat_slug)
            
            if cat:
                sch_data["category_id"] = str(cat.id)
                sch_data["category_name"] = cat.name
            
            new_sch = AgriScheme(**sch_data)
            await new_sch.insert()
            print(f"Inserted scheme: {sch_data['title']}")
            schemes_inserted += 1

    print("\n--- Summary ---")
    print(f"Categories inserted: {categories_inserted}")
    print(f"Schemes inserted: {schemes_inserted}")
    print(f"Skipped: {skipped}")

    print("\nDisconnecting...")
    await disconnect_db()

if __name__ == "__main__":
    asyncio.run(run_seed())
