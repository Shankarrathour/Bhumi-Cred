from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, Dict, Any
from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field
from pymongo import IndexModel, ASCENDING, DESCENDING


# ── Enums ──────────────────────────────────────────────────────────────────────

class FlightStatus(str, Enum):
    SCHEDULED = "scheduled"
    IN_FLIGHT = "in_flight"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class VerificationStatus(str, Enum):
    PENDING = "pending"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    REJECTED = "rejected"

class PriorityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class MediaType(str, Enum):
    PHOTO = "photo"
    VIDEO = "video"
    GPX = "gpx"


# ── Embedded GeoJSON Schemas ──────────────────────────────────────────────────

class GeoJSONPoint(BaseModel):
    type: str = "Point"
    coordinates: List[float]  # [longitude, latitude]

class SpeciesDetection(BaseModel):
    species: str
    count: int = Field(..., ge=0)
    confidence_percent: float = Field(..., ge=0.0, le=100.0)


# ── Top-Level Beanie Document Collections ───────────────────────────────────

class MRVIOTTelemetry(Document):
    telemetry_id: str = Field(..., description="Unique Telemetry ID, e.g., TEL-IOT-0089")
    land_id: PydanticObjectId
    sensor_device_id: str
    soil_moisture_percent: float = Field(..., ge=0.0, le=100.0)
    ambient_temp_celsius: float = Field(..., ge=-10.0, le=60.0)
    humidity_percent: float = Field(..., ge=0.0, le=100.0)
    solar_radiation_wm2: Optional[float] = None
    battery_level_percent: float = Field(default=100.0, ge=0.0, le=100.0)
    recorded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "mrv_iot_telemetry"
        indexes = [
            IndexModel([("telemetry_id", ASCENDING)], unique=True),
            IndexModel([("land_id", ASCENDING), ("recorded_at", DESCENDING)])
        ]


class MRVLidarScan(Document):
    scan_id: str = Field(..., description="Unique LiDAR Scan Ref, e.g., LIDAR-3D-0089")
    land_id: PydanticObjectId
    flight_id: Optional[PydanticObjectId] = None
    point_density_pts_per_sqm: float = Field(..., gt=0)
    agb_tonnes_per_hectare: float = Field(..., ge=0.0)
    las_file_url: str
    scanned_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "mrv_lidar_scans"
        indexes = [
            IndexModel([("scan_id", ASCENDING)], unique=True),
            IndexModel([("land_id", ASCENDING), ("scanned_at", DESCENDING)])
        ]


class MRVAuditTrail(Document):
    audit_trail_id: str = Field(..., description="Unique Audit Trail Ref, e.g., AUD-MRV-VERRA-01")
    land_id: PydanticObjectId
    mrv_cycle_id: str
    ai_model_version: str = "TreeNet-v2.1"
    auditor_id: PydanticObjectId
    is_verra_compliant: bool = True
    is_gold_standard_compliant: bool = True
    verification_hash: str = Field(..., description="Cryptographic SHA-256 Hash")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "mrv_audit_trail"
        indexes = [
            IndexModel([("audit_trail_id", ASCENDING)], unique=True),
            IndexModel([("verification_hash", ASCENDING)], unique=True),
            IndexModel([("land_id", ASCENDING), ("timestamp", DESCENDING)])
        ]


class MRVDroneFlight(Document):
    flight_id: str = Field(..., description="Unique Flight ID, e.g., FLT-DRONE-2026-0089")
    land_id: PydanticObjectId
    pilot_id: PydanticObjectId
    pilot_license_number: str
    drone_model: str = "DJI Mavic 3 Enterprise"
    flight_date: datetime
    gpx_path_url: Optional[str] = None
    flight_duration_mins: float = Field(..., gt=0)
    altitude_meters: float = Field(default=100.0, gt=0)
    coverage_acres: float = Field(..., gt=0)
    flight_status: FlightStatus = FlightStatus.COMPLETED

    class Settings:
        name = "mrv_drone_flights"
        indexes = [
            IndexModel([("flight_id", ASCENDING)], unique=True),
            IndexModel([("land_id", ASCENDING), ("flight_date", DESCENDING)])
        ]


class MRVDroneSurvey(Document):
    survey_id: str = Field(..., description="Unique Survey Ref, e.g., SRV-ORTHO-0089")
    flight_id: PydanticObjectId
    land_id: PydanticObjectId
    orthomosaic_map_url: str
    point_cloud_url: Optional[str] = None
    dsm_dem_url: Optional[str] = None
    canopy_height_model_chm_url: Optional[str] = None
    resolution_cm_per_pixel: float = Field(default=2.5, gt=0)
    captured_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "mrv_drone_surveys"
        indexes = [
            IndexModel([("survey_id", ASCENDING)], unique=True),
            IndexModel([("flight_id", ASCENDING)], unique=True)
        ]


class MRVSatelliteImage(Document):
    image_id: str = Field(..., description="Unique Image Ref, e.g., SAT-S2A-2026-089")
    land_id: PydanticObjectId
    satellite_name: str = "Sentinel-2"
    scene_id: str
    acquisition_date: datetime
    cloud_cover_percent: float = Field(..., ge=0.0, le=100.0)
    true_color_url: str
    false_color_url: Optional[str] = None
    nir_band_url: Optional[str] = None
    red_edge_band_url: Optional[str] = None
    swir_band_url: Optional[str] = None

    class Settings:
        name = "mrv_satellite_images"
        indexes = [
            IndexModel([("image_id", ASCENDING)], unique=True),
            IndexModel([("land_id", ASCENDING), ("acquisition_date", DESCENDING)])
        ]


class MRVSatelliteMonitoring(Document):
    monitoring_id: str = Field(..., description="Unique Monitoring Ref, e.g., MON-NDVI-0089")
    image_id: PydanticObjectId
    land_id: PydanticObjectId
    scan_date: datetime
    ndvi_mean: float = Field(..., ge=-1.0, le=1.0)
    evi_mean: float = Field(..., ge=-1.0, le=1.0)
    canopy_cover_percent: float = Field(..., ge=0.0, le=100.0)
    health_category: str = "Healthy Dense Vegetation"
    ndvi_map_url: str

    class Settings:
        name = "mrv_satellite_monitoring"
        indexes = [
            IndexModel([("monitoring_id", ASCENDING)], unique=True),
            IndexModel([("image_id", ASCENDING)], unique=True),
            IndexModel([("land_id", ASCENDING), ("scan_date", DESCENDING)])
        ]


class MRVTreeMonitoring(Document):
    tree_monitoring_id: str = Field(..., description="Unique Ref, e.g., TRM-2026-0042")
    land_id: PydanticObjectId
    tree_id: str = Field(..., description="Tree Tag/QR Code ID")
    species: str
    height_meters: float = Field(..., gt=0)
    trunk_girth_cm: float = Field(..., gt=0)
    canopy_diameter_meters: float = Field(..., gt=0)
    estimated_carbon_sequestration_kg: float = Field(..., ge=0)
    health_status: str = "healthy"
    gps_location: GeoJSONPoint
    captured_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "mrv_tree_monitorings"
        indexes = [
            IndexModel([("tree_monitoring_id", ASCENDING)], unique=True),
            IndexModel([("land_id", ASCENDING)]),
            IndexModel([("gps_location", "2dsphere")])
        ]


class MRVSoilReport(Document):
    report_id: str = Field(..., description="Unique Lab Report Ref, e.g., SOIL-LAB-2026-0089")
    land_id: PydanticObjectId
    sample_id: str
    lab_name: str = "NABL Accredited Soil Testing Lab"
    soil_type: str = "Black Cotton Soil"
    soil_organic_carbon_percent: float = Field(..., ge=0.0)
    nitrogen_ppm: float = Field(default=0.0, ge=0)
    phosphorus_ppm: float = Field(default=0.0, ge=0)
    potassium_ppm: float = Field(default=0.0, ge=0)
    ph_level: float = Field(default=7.2, ge=0.0, le=14.0)
    soil_health_card_url: str
    tested_at: datetime

    class Settings:
        name = "mrv_soil_reports"
        indexes = [
            IndexModel([("report_id", ASCENDING)], unique=True),
            IndexModel([("land_id", ASCENDING), ("tested_at", DESCENDING)])
        ]


class MRVAIDetection(Document):
    detection_id: str = Field(..., description="Unique AI Ref, e.g., AI-DET-2026-0089")
    land_id: PydanticObjectId
    source_type: str = "drone"
    source_id: PydanticObjectId
    ai_model_name: str = "TreeNet-v2.1"
    detected_trees_count: int = Field(..., ge=0)
    ground_truth_verified_count: Optional[int] = None
    ai_accuracy_score_percent: float = Field(default=96.5, ge=0.0, le=100.0)
    species_breakdown: List[SpeciesDetection] = Field(default_factory=list)
    bounding_boxes_geojson: Optional[Dict[str, Any]] = None

    # Audit & Security Fields
    created_by_id: Optional[PydanticObjectId] = None
    updated_by_id: Optional[PydanticObjectId] = None

    # Soft Delete Support
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    deleted_by_id: Optional[PydanticObjectId] = None

    processed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    async def soft_delete(self, deleted_by: Optional[PydanticObjectId] = None):
        """Soft delete AI detection."""
        self.is_deleted = True
        self.deleted_at = datetime.now(timezone.utc)
        self.deleted_by_id = deleted_by
        self.updated_at = datetime.now(timezone.utc)
        await self.save()

    class Settings:
        name = "mrv_ai_detections"
        indexes = [
            IndexModel([("detection_id", ASCENDING)], unique=True),
            IndexModel([("is_deleted", ASCENDING)]),
            IndexModel([("land_id", ASCENDING), ("processed_at", DESCENDING)])
        ]


class MRVDuplicateDetection(Document):
    duplicate_id: str = Field(..., description="Unique Overlap Ref, e.g., DUP-CHECK-0089")
    land_id: PydanticObjectId
    conflicting_land_id: PydanticObjectId
    overlap_percentage: float = Field(..., ge=0.0, le=100.0)
    intersection_area_sqm: float = Field(..., ge=0.0)
    conflict_status: str = "unresolved"
    checked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "mrv_duplicate_detections"
        indexes = [
            IndexModel([("duplicate_id", ASCENDING)], unique=True),
            IndexModel([("land_id", ASCENDING), ("conflicting_land_id", ASCENDING)], unique=True)
        ]


class MRVVerificationQueue(Document):
    queue_id: str = Field(..., description="Unique Queue Ref, e.g., QUEUE-MRV-2026-0089")
    land_id: PydanticObjectId
    project_id: str
    mrv_stage: str = "mrv_stage"
    priority: PriorityLevel = PriorityLevel.MEDIUM
    assigned_auditor_id: Optional[PydanticObjectId] = None
    assigned_partner_id: Optional[PydanticObjectId] = None
    review_notes: Optional[str] = None
    verification_status: VerificationStatus = VerificationStatus.PENDING

    # Audit & Security Fields
    created_by_id: Optional[PydanticObjectId] = None
    updated_by_id: Optional[PydanticObjectId] = None

    # Soft Delete Support
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    deleted_by_id: Optional[PydanticObjectId] = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    async def soft_delete(self, deleted_by: Optional[PydanticObjectId] = None):
        """Soft delete verification queue item."""
        self.is_deleted = True
        self.verification_status = VerificationStatus.REJECTED
        self.deleted_at = datetime.now(timezone.utc)
        self.deleted_by_id = deleted_by
        self.updated_at = datetime.now(timezone.utc)
        await self.save()

    class Settings:
        name = "mrv_verification_queues"
        indexes = [
            IndexModel([("queue_id", ASCENDING)], unique=True),
            IndexModel([("land_id", ASCENDING), ("mrv_stage", ASCENDING)]),
            IndexModel([("is_deleted", ASCENDING)]),
            IndexModel([("verification_status", ASCENDING), ("priority", ASCENDING)])
        ]


class MRVMediaEvidence(Document):
    media_id: str = Field(..., description="Unique Evidence Ref, e.g., MED-EV-2026-0089")
    land_id: PydanticObjectId
    farmer_id: PydanticObjectId
    media_type: MediaType = MediaType.PHOTO
    media_url: str
    thumbnail_url: Optional[str] = None
    geo_coordinates: GeoJSONPoint
    altitude_meters: Optional[float] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "mrv_media_evidence"
        indexes = [
            IndexModel([("media_id", ASCENDING)], unique=True),
            IndexModel([("land_id", ASCENDING), ("timestamp", DESCENDING)]),
            IndexModel([("geo_coordinates", "2dsphere")])
        ]
