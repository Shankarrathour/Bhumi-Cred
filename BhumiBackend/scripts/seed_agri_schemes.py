import asyncio
import os
import sys

# Add the project root to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.agri_scheme import AgriScheme
from app.database.connection import connect_db, disconnect_db
from datetime import datetime, timezone, timedelta

DUMMY_SCHEMES = [
    {
        "title": "PM-Kisan Samman Nidhi",
        "slug": "pm-kisan-samman-nidhi",
        "ministry": "Ministry of Agriculture & Farmers Welfare",
        "short_description": "Direct income support of ₹6,000 per year to all landholding farmer families.",
        "description": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN) is a Central Sector scheme with 100% funding from Government of India. Under the scheme an income support of 6,000/- per year in three equal installments will be provided to all land holding farmer families.",
        "benefits": ["₹6,000 per year in 3 equal installments", "Direct Benefit Transfer (DBT)", "Support for agricultural expenses"],
        "eligibility_summary": ["Must be a landholding farmer family", "Not applicable for institutional land holders", "Excludes high-income earners and govt employees"],
        "required_documents": ["Aadhaar Card", "Bank Account Details", "Land Ownership Proof"],
        "benefit_type": "Subsidy",
        "benefit_amount": "₹6,000 / year",
        "interest_rate": None,
        "is_active": True,
        "display_order": 1,
    },
    {
        "title": "Kisan Credit Card (KCC)",
        "slug": "kisan-credit-card",
        "ministry": "Department of Financial Services",
        "short_description": "Provides farmers with timely access to credit for agricultural expenses at concessional rates.",
        "description": "The Kisan Credit Card scheme aims to provide adequate and timely credit support from the banking system under a single window with flexible and simplified procedure to the farmers for their cultivation and other needs.",
        "benefits": ["Short term credit limit", "Interest subvention up to 3%", "Rupay Debit Card for farmers"],
        "eligibility_summary": ["All farmers-individuals/Joint borrowers", "Tenant farmers, oral lessees and share croppers", "SHGs or Joint Liability Groups of farmers"],
        "required_documents": ["Identity Proof", "Address Proof", "Land Holding Details"],
        "benefit_type": "Loan",
        "benefit_amount": "Up to ₹3 Lakh",
        "interest_rate": "4% (after subvention)",
        "is_active": True,
        "display_order": 2,
    },
    {
        "title": "Pradhan Mantri Fasal Bima Yojana",
        "slug": "pm-fasal-bima-yojana",
        "ministry": "Ministry of Agriculture",
        "short_description": "Comprehensive crop insurance scheme from pre-sowing to post-harvest losses.",
        "description": "PMFBY provides comprehensive crop insurance from pre-sowing to post-harvest losses against non-preventable natural risks, at a highly subsidized premium rate for farmers.",
        "benefits": ["Risk coverage for crop yield losses", "Low premium rates for farmers", "Use of technology for quick claim settlement"],
        "eligibility_summary": ["All farmers growing notified crops", "Compulsory for loanee farmers", "Voluntary for non-loanee farmers"],
        "required_documents": ["Aadhaar Card", "Bank Passbook", "Sowing Certificate / Land Details"],
        "benefit_type": "Insurance",
        "benefit_amount": "Varies by crop",
        "interest_rate": None,
        "is_active": True,
        "display_order": 3,
    },
    {
        "title": "Soil Health Card Scheme",
        "slug": "soil-health-card",
        "ministry": "Department of Agriculture",
        "short_description": "Promotes soil testing and provides recommendations on nutrient management.",
        "description": "Soil Health Card scheme helps farmers to know the nutrient status of their soil along with the recommendation on appropriate dosage of nutrients to be applied for improving soil health and its fertility.",
        "benefits": ["Free soil testing", "Customized crop recommendations", "Reduction in fertilizer cost"],
        "eligibility_summary": ["All farmers are eligible", "Testing done once every 2 years"],
        "required_documents": ["Aadhaar Card", "Land Details"],
        "benefit_type": "Service",
        "benefit_amount": "Free Service",
        "interest_rate": None,
        "is_active": True,
        "display_order": 4,
    }
]

async def seed_schemes():
    await connect_db()
    
    try:
        inserted_count = 0
        for scheme_data in DUMMY_SCHEMES:
            existing = await AgriScheme.find_one(AgriScheme.slug == scheme_data["slug"])
            if not existing:
                scheme = AgriScheme(**scheme_data)
                await scheme.insert()
                inserted_count += 1
                print(f"Inserted: {scheme.title}")
            else:
                print(f"Skipped existing: {scheme_data['title']}")
        
        print(f"\nSuccessfully inserted {inserted_count} new dummy schemes.")
        
    except Exception as e:
        print(f"Error seeding schemes: {e}")
    finally:
        await disconnect_db()

if __name__ == "__main__":
    asyncio.run(seed_schemes())
