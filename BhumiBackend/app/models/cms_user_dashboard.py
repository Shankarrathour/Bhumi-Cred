from pydantic import BaseModel, Field

class UserDashboardCMS(BaseModel):
    solar_energy: int = Field(..., ge=0, le=100, description="Solar Energy Percentage")
    plantation_health: int = Field(..., ge=0, le=100, description="Plantation Health Percentage")
    nitrogen_retention_rate: int = Field(..., ge=0, le=100, description="Nitrogen Retention Rate Percentage")
    soil_organic_carbon: float = Field(..., ge=0, description="Soil Organic Carbon (SOC) Percentage")
    boundary_tree_cover: int = Field(..., ge=0, le=100, description="Boundary Tree Cover Percentage")

# Default seed data
DEFAULT_DASHBOARD_CMS = UserDashboardCMS(
    solar_energy=74,
    plantation_health=92,
    nitrogen_retention_rate=82,
    soil_organic_carbon=0.65,
    boundary_tree_cover=48
)
