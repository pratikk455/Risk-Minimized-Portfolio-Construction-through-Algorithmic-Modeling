from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Index, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timedelta
import uuid
import enum
from app.core.database import Base

class VerificationCodeType(str, enum.Enum):
    EMAIL_VERIFICATION = "email_verification"
    PHONE_VERIFICATION = "phone_verification"
    LOGIN_OTP = "login_otp"
    PASSWORD_RESET = "password_reset"

class AuthProvider(str, enum.Enum):
    EMAIL_OTP = "email_otp"
    SMS_OTP = "sms_otp"
    TOTP = "totp"

class AuthMethodType(str, enum.Enum):
    TOTP = "totp"
    BACKUP_CODES = "backup_codes"
    HARDWARE_KEY = "hardware_key"

class VerificationCode(Base):
    """
    Scalable verification code system
    Partitioned by created_at for performance at scale
    """
    __tablename__ = "verification_codes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Code and verification
    code_hash = Column(String(255), nullable=False)  # Hashed for security
    code_type = Column(String(50), nullable=False)  # VerificationCodeType enum

    # Metadata
    recipient = Column(String(255), nullable=False)  # email or phone
    attempts = Column(Integer, default=0)
    max_attempts = Column(Integer, default=3)

    # Timing (critical for rate limiting)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    verified_at = Column(DateTime, nullable=True)

    # Status
    is_used = Column(Boolean, default=False)
    is_expired = Column(Boolean, default=False)

    # Relationships
    user = relationship("User", back_populates="verification_codes")

    # Indexes for performance at scale
    __table_args__ = (
        Index('idx_verification_user_type', 'user_id', 'code_type'),
        Index('idx_verification_created', 'created_at'),
        Index('idx_verification_expires', 'expires_at'),
        Index('idx_verification_recipient', 'recipient'),
    )

    def is_valid(self):
        """Check if code is still valid"""
        return (
            not self.is_used and
            not self.is_expired and
            self.expires_at > datetime.utcnow() and
            self.attempts < self.max_attempts
        )

class UserAuthMethod(Base):
    """
    Track user's enabled authentication methods
    Allows multiple 2FA methods per user
    """
    __tablename__ = "user_auth_methods"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Auth method details
    method_type = Column(String(50), nullable=False)  # AuthProvider enum
    is_enabled = Column(Boolean, default=True)
    is_primary = Column(Boolean, default=False)

    # Method-specific data
    method_data = Column(Text, nullable=True)  # JSON for TOTP secrets, etc.
    backup_codes = Column(Text, nullable=True)  # JSON array of backup codes

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="auth_methods")

    # Indexes
    __table_args__ = (
        Index('idx_user_auth_method', 'user_id', 'method_type'),
        Index('idx_user_auth_primary', 'user_id', 'is_primary'),
    )

class AuthAttempt(Base):
    """
    Audit log for all authentication attempts
    Critical for security monitoring at scale
    """
    __tablename__ = "auth_attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # User info (nullable for failed username attempts)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    username_attempted = Column(String(255), nullable=True)

    # Attempt details
    attempt_type = Column(String(50), nullable=False)  # login, 2fa, password_reset
    method_used = Column(String(50), nullable=True)  # email_otp, sms_otp, totp
    success = Column(Boolean, nullable=False)
    failure_reason = Column(String(255), nullable=True)

    # Security info
    ip_address = Column(String(45), nullable=True)  # IPv6 compatible
    user_agent = Column(Text, nullable=True)
    geolocation = Column(String(255), nullable=True)  # Country/City

    # Timing
    attempted_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="auth_attempts")

    # Indexes for security queries
    __table_args__ = (
        Index('idx_auth_attempts_user', 'user_id'),
        Index('idx_auth_attempts_ip', 'ip_address'),
        Index('idx_auth_attempts_time', 'attempted_at'),
        Index('idx_auth_attempts_success', 'success'),
    )

class RateLimitEntry(Base):
    """
    Rate limiting system for various operations
    In-memory cache in production (Redis), DB for persistence
    """
    __tablename__ = "rate_limits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Rate limit key (IP, user_id, email, phone, etc.)
    limit_key = Column(String(255), nullable=False, unique=True)
    limit_type = Column(String(50), nullable=False)  # login, otp_email, otp_sms

    # Counters
    attempts = Column(Integer, default=0)
    max_attempts = Column(Integer, nullable=False)

    # Timing
    window_start = Column(DateTime, default=datetime.utcnow)
    window_duration = Column(Integer, nullable=False)  # seconds
    blocked_until = Column(DateTime, nullable=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Indexes for fast lookups
    __table_args__ = (
        Index('idx_rate_limit_key', 'limit_key'),
        Index('idx_rate_limit_type', 'limit_type'),
        Index('idx_rate_limit_blocked', 'blocked_until'),
    )

    def is_blocked(self):
        """Check if currently rate limited"""
        if self.blocked_until and self.blocked_until > datetime.utcnow():
            return True
        return False

    def reset_if_expired(self):
        """Reset counter if window expired"""
        if datetime.utcnow() - self.window_start > timedelta(seconds=self.window_duration):
            self.attempts = 0
            self.window_start = datetime.utcnow()
            self.blocked_until = None