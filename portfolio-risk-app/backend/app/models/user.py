from sqlalchemy import Boolean, Column, Integer, String, DateTime, Enum as SQLEnum, Index
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base

class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"

class RegistrationStatus(str, enum.Enum):
    PENDING_EMAIL = "pending_email"
    PENDING_PHONE = "pending_phone"
    PENDING_2FA = "pending_2fa"
    COMPLETED = "completed"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    # Basic info
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))

    # Contact info
    phone_number = Column(String(20), nullable=True, index=True)

    # Verification status
    is_active = Column(Boolean, default=True)
    is_email_verified = Column(Boolean, default=False)
    is_phone_verified = Column(Boolean, default=False)
    registration_status = Column(SQLEnum(RegistrationStatus), default=RegistrationStatus.PENDING_EMAIL)

    # Security
    role = Column(SQLEnum(UserRole), default=UserRole.USER)
    two_factor_enabled = Column(Boolean, default=False)
    backup_codes_generated = Column(Boolean, default=False)

    # Timing
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    email_verified_at = Column(DateTime, nullable=True)
    phone_verified_at = Column(DateTime, nullable=True)

    # Security metadata
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)

    # Relationships
    assessments = relationship("Assessment", back_populates="user", cascade="all, delete-orphan")
    portfolios = relationship("Portfolio", back_populates="user", cascade="all, delete-orphan")
    verification_codes = relationship("VerificationCode", back_populates="user", cascade="all, delete-orphan")
    auth_methods = relationship("UserAuthMethod", back_populates="user", cascade="all, delete-orphan")
    auth_attempts = relationship("AuthAttempt", back_populates="user", cascade="all, delete-orphan")

    # Additional indexes for scalability
    __table_args__ = (
        Index('idx_user_phone', 'phone_number'),
        Index('idx_user_verification_status', 'is_email_verified', 'is_phone_verified'),
        Index('idx_user_registration_status', 'registration_status'),
        Index('idx_user_created', 'created_at'),
        Index('idx_user_active', 'is_active'),
    )

    @property
    def is_fully_verified(self):
        """Check if user has completed all verification steps"""
        return (
            self.is_email_verified and
            self.is_phone_verified and
            self.two_factor_enabled and
            self.registration_status == RegistrationStatus.COMPLETED
        )

    @property
    def is_locked(self):
        """Check if account is currently locked"""
        return self.locked_until and self.locked_until > datetime.utcnow()

    def can_attempt_login(self):
        """Check if user can attempt login (not locked, active, etc.)"""
        return (
            self.is_active and
            not self.is_locked and
            self.is_email_verified  # Must have verified email to login
        )