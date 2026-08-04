from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, Dict, Any
from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field, field_validator
from pymongo import IndexModel, ASCENDING, DESCENDING


# ── Enums ──────────────────────────────────────────────────────────────────────

class OwnershipType(str, Enum):
    OWN = "own"
    LEASED = "leased"
    SHARED = "shared"

class GISStatus(str, Enum):
    PENDING_SURVEY = "pending_survey"
    POLYGON_MAPPED = "polygon_mapped"
    NDVI_ANALYZED = "ndvi_analyzed"
    GEO_FENCED = "geo_fenced"
    VERIFIED = "verified"
    OVERLAP_FLAGGED = "overlap_flagged"

class MRVStage(str, Enum):
    REGISTERED = "registered"
    UNDER_REVIEW = "under_review"
    ACTIVE_MONITORING = "active_monitoring"
    MRV_STAGE = "mrv_stage"
    CARBON_ESTIMATION = "carbon_estimation"
    COMPLETED = "completed"

class AlertSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class SoilType(str, Enum):
    BLACK = "black"
    RED = "red"
    ALLUVIAL = "alluvial"
    LATERITE = "laterite"
    CLAY = "clay"
    SANDY = "sandy"
    LOAM = "loam"
    UNKNOWN = "unknown"

class SatelliteSource(str, Enum):
    SENTINEL_2 = "Sentinel-2"
    LANDSAT_8 = "Landsat-8"
    PLANETSCOPE = "PlanetScope"
    MODIS = "MODIS"

class ConflictStatus(str, Enum):
    UNRESOLVED = "unresolved"
    INVESTIGATING = "investigating"
    RESOLVED_VALID = "resolved_valid"
    RESOLVED_DUPLICATE = "resolved_duplicate"

class PhotoType(str, Enum):
    CROP_HEALTH = "crop_health"
    BOUNDARY_MARKER = "boundary_marker"
    SOIL_SAMPLE = "soil_sample"
    DAMAGE_EVIDENCE = "damage_evidence"


# ── Embedded GeoJSON & Sub-Document Schemas ─────────────────────────────────

class GeoJSONPoint(BaseModel):
    type: str = "Point"
    coordinates: List[float]  # [longitude, latitude]

    @field_validator("coordinates")
    @classmethod
    def validate_coordinates(cls, v):
        if len(v) != 2:
            raise ValueError("Point coordinates must be [longitude, latitude]")
        if not (-180 <= v[0] <= 180):
            raise ValueError("Longitude must be between -180 and 180")
        if not (-90 <= v[1] <= 90):
            raise ValueError("Latitude must be between -90 and 90")
        return v

class GeoJSONPolygon(BaseModel):
    type: str = "Polygon"
    coordinates: List[List[List[float]]]  # [[[lng, lat], ...]]

class NPKValues(BaseModel):
    nitrogen_ppm: float = Field(default=0.0, ge=0.0)
    phosphorus_ppm: float = Field(default=0.0, ge=0.0)
    potassium_ppm: float = Field(default=0.0, ge=0.0)


# ── Top-Level Beanie Document Collections ───────────────────────────────────

class GISLandParcel(Document):
    land_id: str = Field(..., description="Unique Business ID, e.g., LND-MP-SEH-0089")
    farmer_id: PydanticObjectId
    title: str
    survey_number: str
    khata_number: Optional[str] = None
    area_acres: float = Field(..., gt=0)
    area_hectares: float = Field(..., gt=0)
    ownership_type: OwnershipType = OwnershipType.OWN
    is_irrigated: bool = False

    # BRD Agroforestry & Green Family Calculation
    crop_type: Optional[str] = None
    tree_stock_count: int = 0
    trees_registered: int = 0
    trees_insured: int = 0
    green_family_count: int = 0  # 5 trees = 1 Green Family
    carbon_impact_tons: float = 0.0
    agroforestry_species: Optional[str] = None

    # Spatial GeoJSON Boundaries
    center_coordinates: GeoJSONPoint
    boundary_polygon: Optional[GeoJSONPolygon] = None

    # Location Hierarchy
    state: str
    district: str
    tehsil: Optional[str] = None
    village: str
    pincode: str = Field(..., pattern=r"^\d{6}$")

    gis_status: GISStatus = GISStatus.PENDING_SURVEY
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "gis_land_parcels"
        indexes = [
            IndexModel([("land_id", ASCENDING)], unique=True),
            IndexModel([("farmer_id", ASCENDING), ("is_active", ASCENDING)]),
            IndexModel([("center_coordinates", "2dsphere")]),
            IndexModel([("boundary_polygon", "2dsphere")]),
            IndexModel([("state", ASCENDING), ("district", ASCENDING), ("village", ASCENDING)])
        ]


class MRVLandVerification(Document):
    land_id: PydanticObjectId
    project_id: str
    mrv_stage: MRVStage = MRVStage.REGISTERED
    carbon_impact_tons: float = Field(default=0.0, ge=0.0)
    tree_canopy_cover_percent: float = Field(default=0.0, ge=0.0, le=100.0)
    mrv_verified_by: Optional[PydanticObjectId] = None
    mrv_report_url: Optional[str] = None
    verified_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "mrv_land_verifications"
        indexes = [
            IndexModel([("land_id", ASCENDING), ("project_id", ASCENDING)]),
            IndexModel([("mrv_stage", ASCENDING), ("created_at", DESCENDING)])
        ]


class GeoFenceAlert(Document):
    land_id: PydanticObjectId
    alert_type: str
    severity: AlertSeverity = AlertSeverity.MEDIUM
    location_geojson: Optional[GeoJSONPoint] = None
    description: str
    alert_status: str = "open"
    detection_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "geo_fence_alerts"
        indexes = [
            IndexModel([("land_id", ASCENDING), ("detection_date", DESCENDING)]),
            IndexModel([("location_geojson", "2dsphere")]),
            IndexModel([("severity", ASCENDING), ("alert_status", ASCENDING)])
        ]


class GISFieldSurvey(Document):
    survey_id: str = Field(..., description="Unique Survey ID, e.g., SRV-2026-0912")
    land_id: PydanticObjectId
    inspector_id: PydanticObjectId
    survey_date: datetime
    boundary_gpx_url: Optional[str] = None
    tree_counts_by_species: Dict[str, int] = Field(default_factory=dict)
    survey_status: str = "completed"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "gis_field_surveys"
        indexes = [
            IndexModel([("survey_id", ASCENDING)], unique=True),
            IndexModel([("land_id", ASCENDING), ("survey_date", DESCENDING)])
        ]


class SatelliteScan(Document):
    land_id: PydanticObjectId
    satellite_name: SatelliteSource
    scene_id: str
    acquisition_date: datetime
    cloud_cover_percent: float = Field(..., ge=0.0, le=100.0)
    true_color_url: Optional[str] = None
    false_color_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "satellite_scans"
        indexes = [
            IndexModel([("land_id", ASCENDING), ("acquisition_date", DESCENDING)]),
            IndexModel([("satellite_name", ASCENDING), ("acquisition_date", DESCENDING)])
        ]


class NDVITimeSeries(Document):
    land_id: PydanticObjectId
    scan_date: datetime
    ndvi_mean: float = Field(..., ge=-1.0, le=1.0)
    ndvi_min: float = Field(..., ge=-1.0, le=1.0)
    ndvi_max: float = Field(..., ge=-1.0, le=1.0)
    health_label: str
    ndvi_map_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "ndvi_time_series"
        indexes = [
            IndexModel([("land_id", ASCENDING), ("scan_date", DESCENDING)], unique=True),
            IndexModel([("health_label", ASCENDING)])
        ]


class SoilLayer(Document):
    land_id: PydanticObjectId
    soil_type: SoilType = SoilType.UNKNOWN
    soil_organic_carbon_percent: float = Field(default=0.0, ge=0.0)
    ph_level: float = Field(default=7.0, ge=0.0, le=14.0)
    npk_values: Optional[NPKValues] = None
    soil_health_card_url: Optional[str] = None
    tested_at: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "soil_layers"
        indexes = [
            IndexModel([("land_id", ASCENDING)], unique=True),
            IndexModel([("soil_type", ASCENDING)])
        ]


class GISDuplicateCheck(Document):
    land_id: PydanticObjectId
    conflicting_land_id: PydanticObjectId
    overlap_percentage: float = Field(..., ge=0.0, le=100.0)
    intersection_area_sqm: float = Field(..., ge=0.0)
    distance_meters: float = 0.0
    conflict_status: ConflictStatus = ConflictStatus.UNRESOLVED
    resolution_notes: Optional[str] = None
    checked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "gis_duplicate_checks"
        indexes = [
            IndexModel([("land_id", ASCENDING), ("conflicting_land_id", ASCENDING)], unique=True),
            IndexModel([("conflict_status", ASCENDING)])
        ]


class MapboxLayer(Document):
    land_id: PydanticObjectId
    mapbox_feature_id: Optional[str] = None
    vector_tile_url: Optional[str] = None
    bounding_box: List[float] = Field(..., min_items=4, max_items=4)
    min_zoom: int = 10
    max_zoom: int = 22
    style_json: Optional[Dict[str, Any]] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "mapbox_layers"
        indexes = [
            IndexModel([("land_id", ASCENDING)], unique=True),
            IndexModel([("mapbox_feature_id", ASCENDING)], unique=True, sparse=True)
        ]


class LandPhoto(Document):
    land_id: PydanticObjectId
    photo_url: str
    photo_type: PhotoType = PhotoType.CROP_HEALTH
    geo_coordinates: GeoJSONPoint
    caption: Optional[str] = None
    captured_at: datetime
    uploaded_by: PydanticObjectId

    class Settings:
        name = "land_photos"
        indexes = [
            IndexModel([("land_id", ASCENDING), ("captured_at", DESCENDING)]),
            IndexModel([("geo_coordinates", "2dsphere")])
        ]


class LandHistory(Document):
    land_id: PydanticObjectId
    event_type: str
    changes: Dict[str, Any] = Field(default_factory=dict)
    performed_by: PydanticObjectId
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "land_histories"
        indexes = [
            IndexModel([("land_id", ASCENDING), ("timestamp", DESCENDING)])
        ]
