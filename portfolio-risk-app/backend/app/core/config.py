from pydantic_settings import BaseSettings
from typing import List, Optional
import secrets
import json

class Settings(BaseSettings):
    PROJECT_NAME: str = "Portfolio Risk Management"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Security
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str = "postgresql://portfolio_user:portfolio_pass@localhost:5432/portfolio_db"

    # Cache
    REDIS_URL: str = "redis://localhost:6379"

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8000"

    @property
    def cors_origins_list(self) -> List[str]:
        """Convert CORS_ORIGINS string to list"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    # Email Configuration
    EMAIL_ENABLED: bool = True
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""  # Set in environment
    SMTP_PASSWORD: str = ""  # Gmail app password
    EMAIL_FROM: str = "noreply@portfolio-risk.com"

    # SMS Configuration
    SMS_ENABLED: bool = True

    # Twilio (optional - free trial)
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None

    # TextBelt (free tier)
    TEXTBELT_API_KEY: str = "textbelt"  # Free tier key

    # Security Settings
    MIN_PASSWORD_LENGTH: int = 8
    MAX_LOGIN_ATTEMPTS: int = 5
    ACCOUNT_LOCKOUT_DURATION_MINUTES: int = 30

    # OTP Settings
    OTP_EXPIRY_MINUTES: int = 5
    OTP_LENGTH: int = 6
    MAX_OTP_ATTEMPTS: int = 3

    # Rate Limiting
    RATE_LIMIT_LOGIN_PER_HOUR: int = 10
    RATE_LIMIT_OTP_EMAIL_PER_HOUR: int = 6
    RATE_LIMIT_OTP_SMS_PER_HOUR: int = 3
    RATE_LIMIT_REGISTRATION_PER_DAY: int = 5

    # 2FA Settings
    TOTP_ISSUER_NAME: str = "PortfolioRisk"
    BACKUP_CODES_COUNT: int = 10
    TOTP_WINDOW: int = 1  # Allow 1 time step tolerance

    # Security Headers
    SECURE_COOKIES: bool = True
    COOKIE_SAMESITE: str = "lax"
    COOKIE_SECURE: bool = True

    # Registration Flow
    REQUIRE_EMAIL_VERIFICATION: bool = True
    REQUIRE_PHONE_VERIFICATION: bool = True
    REQUIRE_2FA_SETUP: bool = True

    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()