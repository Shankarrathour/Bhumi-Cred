# BhumiCred Projects Hub API

Base prefix: `/v1`

Authentication:
- Farmer APIs require a farmer bearer token.
- Admin review API requires an admin bearer token.

## BRD Flow Sequence

1. Farmer authenticates with mobile OTP.
2. Farmer completes profile, address, KYC, bank, land, and plantation details.
3. Farmer joins a carbon project.
4. Project enrollment becomes `pending_admin_verification`.
5. Admin verifies KYC, land proof, acreage, crop details, plantation photos, and geo-location.
6. Approved project moves through `registered`, `under_review`, `active_monitoring`, `mrv_stage`, `carbon_estimation`, and `completed`.
7. Farmer registers trees for monitoring and insurance.
8. System calculates Green Families using `5 trees = 1 Green Family`.
9. Projects Hub returns active project, contribution metrics, insurance protection, and explore projects.

## Endpoints

### Get Projects Hub

`GET /v1/projects/hub`

Returns the mobile Projects Hub screen data shown in the provided images.

Response data:

```json
{
  "active_project": {
    "enrollment_id": "66f...",
    "project": {
      "id": "mp-agroforestry-carbon-mission",
      "title": "MP AgroForestry Carbon Mission",
      "category": "Sustainability Mission",
      "description": "Establish a high-yield carbon credits model...",
      "district": "Sehore",
      "state": "MP",
      "target_area_acres": 12500,
      "estimated_carbon_impact": 17.7,
      "status_label": "Active Tracking",
      "is_tracking_active": true,
      "roadmap": ["registered", "under_review", "active_monitoring", "mrv_stage", "carbon_estimation", "completed"],
      "eligibility": ["Farmer profile and KYC submitted"],
      "required_documents": ["Aadhaar or PAN", "Land proof", "Plantation photos", "Geo-location"]
    },
    "status": "active",
    "current_stage": "mrv_stage",
    "current_stage_label": "Stage 4: MRV",
    "progress_percent": 82,
    "ngo_partner": "Green Earth NGO",
    "milestones": [{"label": "Land registration submitted", "completed": true}],
    "land_verified": true,
    "trees_verified": true,
    "insurance_active": true
  },
  "contribution": {
    "total_land_added_acres": 5.2,
    "trees_registered": 120,
    "trees_insured": 30,
    "sustainability_score": 92,
    "estimated_carbon_impact": 17.7,
    "green_family_count": 24
  },
  "insurance": {
    "policy": "green_shield",
    "policy_name": "Green Shield",
    "status": "active",
    "protected_trees": 30,
    "claim_eligibility_percent": 100,
    "duration_years": 3,
    "expiry_date": "2028-12-15T00:00:00Z"
  },
  "explore_projects": [],
  "api_flow": []
}
```

### Explore Projects

`GET /v1/projects?search=wheat`

Response: list of real project cards from the MongoDB `projects` collection with category, district, area, carbon impact, and tracking status.

Validation:
- `search` is optional.
- `search` must be 2-80 characters when provided.

### Get Project Roadmap

`GET /v1/projects/{project_id}`

Response: project card plus roadmap, eligibility, and required documents.

### Join Project

`POST /v1/projects/{project_id}/join`

Request:

```json
{
  "land_area_acres": 5.2,
  "tree_count": 120,
  "crop_type": "Wheat",
  "soil_type": "Black soil",
  "irrigation_type": "Drip",
  "geo_latitude": 23.203,
  "geo_longitude": 77.084,
  "plantation_photo_urls": ["/uploads/tree-photo.jpg"],
  "land_proof_url": "/uploads/land-proof.pdf"
}
```

Validations:
- Farmer must have registered land.
- `land_area_acres` must be greater than 0 and cannot exceed registered farmer land.
- `tree_count` must be 0-1,000,000.
- Latitude must be -90 to 90.
- Longitude must be -180 to 180.
- Up to 10 plantation photo URLs are allowed.
- Duplicate enrollment in the same project is rejected.

Response:

```json
{
  "enrollment_id": "66f...",
  "project_id": "mp-agroforestry-carbon-mission",
  "status": "pending_admin_verification",
  "current_stage": "registered",
  "progress_percent": 10,
  "message": "Project join request submitted for admin verification."
}
```

### Register Trees

`POST /v1/projects/{project_id}/trees`

Request:

```json
{
  "tree_count": 50,
  "plantation_photo_urls": ["/uploads/plantation-1.jpg"],
  "geo_latitude": 23.203,
  "geo_longitude": 77.084
}
```

Validations:
- Farmer must already be enrolled in the project.
- `tree_count` must be greater than 0.
- Geo-location is required.
- Up to 10 plantation photo URLs are allowed.

### Admin Create Project

`POST /v1/admin/projects`

Request:

```json
{
  "project_id": "mp-agroforestry-carbon-mission",
  "title": "MP AgroForestry Carbon Mission",
  "category": "Sustainability Mission",
  "description": "Establish a high-yield carbon credits model across Madhya Pradesh districts through border agroforestry.",
  "district": "Sehore",
  "state": "MP",
  "target_area_acres": 12500,
  "estimated_carbon_impact": 17.7,
  "ngo_partner": "Green Earth NGO",
  "status": "active_tracking",
  "eligibility": [
    "Farmer profile and KYC submitted",
    "At least one registered land parcel"
  ],
  "required_documents": [
    "Aadhaar or PAN",
    "Land proof",
    "Plantation photos",
    "Geo-location"
  ],
  "is_public": true
}
```

Validations:
- `project_id` must be a unique lowercase slug such as `mp-agroforestry-carbon-mission`.
- `target_area_acres` must be greater than 0.
- `estimated_carbon_impact` cannot be negative.
- Only super admin, operations admin, and carbon project manager can create projects.

### Admin List Projects

`GET /v1/admin/projects?include_inactive=false`

Returns real projects stored in MongoDB. Use `include_inactive=true` to include archived/inactive projects.

### Admin Update Project

`PATCH /v1/admin/projects/{project_id}`

Request can include any editable project fields:

```json
{
  "status": "active_tracking",
  "is_public": true,
  "is_active": true
}
```

### Admin Review Enrollment

`PATCH /v1/projects/admin/enrollments/{enrollment_id}/review`

Request:

```json
{
  "status": "active",
  "current_stage": "mrv_stage",
  "progress_percent": 82,
  "land_verified": true,
  "trees_verified": true,
  "mrv_verified": false,
  "insured_trees": 30,
  "clarification_note": null,
  "rejection_reason": null
}
```

Validations:
- `status` must be `active`, `rejected`, `clarification_requested`, or `completed`.
- `progress_percent` must be 0-100.
- `insured_trees` cannot exceed registered trees.
- Active verified insurance sets claim eligibility to 100 percent.

## Collections

`projects`

Real project master records shown on the Projects Hub explore list.

Important fields:
- `project_id`
- `title`
- `category`
- `description`
- `district`
- `state`
- `target_area_acres`
- `estimated_carbon_impact`
- `ngo_partner`
- `status`
- `eligibility`
- `required_documents`
- `is_public`
- `is_active`

`project_enrollments`

Important fields:
- `farmer_id`
- `project_id`
- `status`
- `current_stage`
- `progress_percent`
- `land_area_acres`
- `registered_trees`
- `insured_trees`
- `green_family_count`
- `estimated_carbon_impact`
- `insurance`
- `milestones`
