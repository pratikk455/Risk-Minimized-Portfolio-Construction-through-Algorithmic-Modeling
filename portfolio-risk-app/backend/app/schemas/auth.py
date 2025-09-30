from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime
import phonenumbers
from phonenumbers import NumberParseException

class RegistrationStep1(BaseModel):
    """Step 1: Basic user information"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=255)
    phone_number: str = Field(..., min_length=10)
    password: str = Field(..., min_length=8)

    @validator('username')
    def validate_username(cls, v):
        if not v.replace('_', '').isalnum():
            raise ValueError('Username must contain only letters, numbers, and underscores')
        return v.lower()

    @validator('phone_number')
    def validate_phone_number(cls, v):
        try:
            # Parse phone number (assume US if no country code)
            parsed = phonenumbers.parse(v, "US")
            if not phonenumbers.is_valid_number(parsed):
                raise ValueError('Invalid phone number')
            # Return in international format
            return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
        except NumberParseException:
            raise ValueError('Invalid phone number format')

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        # Truncate to 72 chars for bcrypt compatibility
        return v[:72]

class VerificationRequest(BaseModel):
    """Request to send verification code"""
    user_id: int
    method: str = Field(..., pattern="^(email|sms)$")

class VerificationSubmit(BaseModel):
    """Submit verification code"""
    user_id: int
    code: str = Field(..., min_length=6, max_length=6)
    verification_type: str = Field(..., pattern="^(email|phone)$")

class TOTPSetupRequest(BaseModel):
    """Request to setup TOTP"""
    user_id: int

class TOTPVerifyRequest(BaseModel):
    """Verify TOTP setup"""
    user_id: int
    totp_code: str = Field(..., min_length=6, max_length=6)

class LoginRequest(BaseModel):
    """Enhanced login request"""
    username: str
    password: str
    remember_me: bool = False

class LoginOTPRequest(BaseModel):
    """Submit OTP for login"""
    user_id: int
    otp_code: str = Field(..., min_length=6, max_length=6)
    method: str = Field(..., pattern="^(email|sms|totp|backup)$")

class PasswordResetRequest(BaseModel):
    """Request password reset"""
    email: EmailStr

class PasswordResetSubmit(BaseModel):
    """Submit new password with reset code"""
    email: EmailStr
    reset_code: str = Field(..., min_length=6, max_length=8)
    new_password: str = Field(..., min_length=8)

    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        # Truncate to 72 chars for bcrypt compatibility
        return v[:72]

# Response Models

class RegistrationResponse(BaseModel):
    """Registration step response"""
    success: bool
    message: str
    user_id: Optional[int] = None
    next_step: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

class VerificationResponse(BaseModel):
    """Verification response"""
    success: bool
    message: str
    attempts_remaining: Optional[int] = None
    next_step: Optional[str] = None
    can_resend: bool = False
    resend_cooldown: int = 0

class TOTPSetupResponse(BaseModel):
    """TOTP setup response"""
    success: bool
    message: str
    qr_code: Optional[str] = None
    backup_codes: Optional[list] = None
    secret: Optional[str] = None

class LoginResponse(BaseModel):
    """Login response"""
    success: bool
    message: str
    user_id: Optional[int] = None
    requires_2fa: bool = False
    available_methods: Optional[list] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None

class UserStatusResponse(BaseModel):
    """User registration/verification status"""
    user_id: int
    username: str
    email: str
    phone_number: Optional[str]
    registration_status: str
    is_email_verified: bool
    is_phone_verified: bool
    two_factor_enabled: bool
    available_auth_methods: list
    next_required_step: Optional[str]

class RateLimitResponse(BaseModel):
    """Rate limit information"""
    limited: bool
    message: str
    retry_after: int = 0
    limit_type: str