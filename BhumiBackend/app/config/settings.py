from functools import lru_cache
from typing import List, Optional
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import json


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Application
    APP_NAME: str = "Bhumi API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"
    API_PREFIX: str = "/v1"

    # MongoDB Atlas — required, no default; app fails immediately if missing
    MONGODB_URI: str
    DATABASE_NAME: str = "bhumi"

    # JWT — required, no default; app fails immediately if missing
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # OTP
    OTP_EXPIRE_MINUTES: int = 10
    OTP_MAX_ATTEMPTS: int = 3
    OTP_LENGTH: int = 6

    # SMS
    SMS_PROVIDER: str = "console"  # "console" | "msg91"
    MSG91_API_KEY: str = ""
    MSG91_TEMPLATE_ID: str = ""
    MSG91_SENDER_ID: str = "BHUMI"

    # Server base URL — used to build absolute URLs for locally-stored uploads.
    # Must match the host:port that BhumiAPP and BhumiAdmin reach the backend on.
    BACKEND_BASE_URL: str = "http://localhost:8000"

    # Storage
    STORAGE_BACKEND: str = "local"  # "local" | "s3" | "cloudinary"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "ap-south-1"
    S3_BUCKET_NAME: str = "bhumi-uploads"
    S3_ENDPOINT_URL: str = ""
    LOCAL_UPLOAD_DIR: str = "uploads"

    # Cloudinary — required when STORAGE_BACKEND=cloudinary
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8081", "http://localhost:5173", "http://127.0.0.1:5173"]
    CORS_ALLOW_ALL: bool = False

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "text"  # "text" | "json"

    # Business Configuration
    DELIVERY_CHARGE: float = 50.0
    FREE_DELIVERY_THRESHOLD: float = 1000.0
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 1000
    DEFAULT_ORDER_STATUS: str = "PENDING"

    # Seed admin — development only, all optional
    SEED_ADMIN_NAME: str = "Super Admin"
    SEED_ADMIN_EMAIL: Optional[str] = None
    SEED_ADMIN_PASSWORD: Optional[str] = None

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [o.strip() for o in v.split(",")]
        return v

    @model_validator(mode="after")
    def validate_secrets(self) -> "Settings":
        if not self.JWT_SECRET_KEY or len(self.JWT_SECRET_KEY) < 16:
            raise ValueError(
                "JWT_SECRET_KEY must be set and at least 16 characters long. "
                "Set it in your .env file."
            )
        if self.STORAGE_BACKEND == "cloudinary":
            missing = [
                name
                for name, val in {
                    "CLOUDINARY_CLOUD_NAME": self.CLOUDINARY_CLOUD_NAME,
                    "CLOUDINARY_API_KEY": self.CLOUDINARY_API_KEY,
                    "CLOUDINARY_API_SECRET": self.CLOUDINARY_API_SECRET,
                }.items()
                if not val
            ]
            if missing:
                raise ValueError(
                    f"STORAGE_BACKEND=cloudinary requires these env vars to be set: "
                    f"{', '.join(missing)}. Add them to your .env file."
                )
        return self

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def cloudinary_env(self) -> str:
        """Short environment label used as a Cloudinary folder prefix."""
        return {
            "development": "dev",
            "staging": "staging",
            "production": "prod",
        }.get(self.ENVIRONMENT, self.ENVIRONMENT)


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
