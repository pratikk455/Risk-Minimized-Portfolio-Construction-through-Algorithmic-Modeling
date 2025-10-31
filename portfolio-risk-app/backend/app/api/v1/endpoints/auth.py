from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
import logging
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token, verify_password, get_password_hash
from app.models.user import User
from app.models.auth import VerificationCode, VerificationCodeType, UserAuthMethod, AuthMethodType, AuthAttempt, RateLimitEntry
from app.schemas.auth import (
    RegistrationStep1, RegistrationResponse, VerificationRequest, VerificationSubmit,
    VerificationResponse, TOTPSetupRequest, TOTPSetupResponse, TOTPVerifyRequest,
    LoginRequest, LoginOTPRequest, LoginResponse, UserStatusResponse,
    PasswordResetRequest, PasswordResetSubmit, RateLimitResponse
)
from app.services.otp_service import otp_service
from app.services.totp_service import two_factor_auth_service
from app.services.simple_rate_limiter import rate_limiter
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()

def get_client_ip(request: Request) -> str:
    """Extract client IP address from request"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host

def log_auth_attempt(db: Session, user_id: Optional[int], ip_address: str,
                    action: str, success: bool, details: str = ""):
    """Log authentication attempt for security monitoring"""
    try:
        attempt = AuthAttempt(
            user_id=user_id,
            ip_address=ip_address,
            attempt_type=action,  # Map 'action' to 'attempt_type'
            success=success,
            failure_reason=details if not success else None,  # Map 'details' to 'failure_reason'
            attempted_at=datetime.utcnow()  # Use 'attempted_at' instead of 'timestamp'
        )
        db.add(attempt)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to log auth attempt: {e}")
        db.rollback()

@router.post("/register-step1", response_model=RegistrationResponse)
async def register_step1(
    registration_data: RegistrationStep1,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Step 1: Initial user registration with basic information
    Creates user account and triggers email verification
    """
    try:
        ip_address = get_client_ip(request)

        # Rate limiting check
        rate_check = rate_limiter.check_rate_limit(
            db, "registration", ip_address,
            settings.RATE_LIMIT_REGISTRATION_PER_DAY, 24 * 60
        )
        if not rate_check.allowed:
            return RegistrationResponse(
                success=False,
                message=f"Too many registration attempts. Try again in {rate_check.retry_after} seconds.",
                data={"rate_limited": True, "retry_after": rate_check.retry_after}
            )

        # Check if username already exists
        existing_user = db.query(User).filter(User.username == registration_data.username.lower()).first()
        if existing_user:
            log_auth_attempt(db, None, ip_address, "register_step1", False, "Username exists")
            return RegistrationResponse(
                success=False,
                message="Username already exists. Please choose a different username."
            )

        # Check if email already exists
        existing_email = db.query(User).filter(User.email == registration_data.email).first()
        if existing_email:
            log_auth_attempt(db, None, ip_address, "register_step1", False, "Email exists")
            return RegistrationResponse(
                success=False,
                message="Email already registered. Please use a different email or try logging in."
            )

        # Create new user
        logger.info(f"Hashing password of length: {len(registration_data.password)}")
        hashed_password = get_password_hash(registration_data.password)
        logger.info(f"Password hashed successfully")

        # Check if verification is required
        skip_verification = not settings.REQUIRE_EMAIL_VERIFICATION and not settings.REQUIRE_PHONE_VERIFICATION and not settings.REQUIRE_2FA_SETUP

        new_user = User(
            username=registration_data.username.lower(),
            email=registration_data.email,
            full_name=registration_data.full_name,
            phone_number=registration_data.phone_number,
            hashed_password=hashed_password,
            registration_status="completed" if skip_verification else "pending_email",
            is_active=True if skip_verification else False,
            is_email_verified=True if skip_verification else False,
            is_phone_verified=True if skip_verification else False,
            email_verified_at=datetime.utcnow() if skip_verification else None,
            phone_verified_at=datetime.utcnow() if skip_verification else None,
            created_at=datetime.utcnow()
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # If verification is skipped, user can login immediately
        if skip_verification:
            log_auth_attempt(db, new_user.id, ip_address, "register_step1", True, "User created (dev mode - no verification)")
            return RegistrationResponse(
                success=True,
                message="Registration successful! You can now login.",
                user_id=new_user.id,
                next_step="login",
                data={
                    "ready_to_login": True,
                    "email": new_user.email
                }
            )

        # Send email verification
        try:
            email_sent = await otp_service.send_email_verification(db, new_user)
            if email_sent:
                log_auth_attempt(db, new_user.id, ip_address, "register_step1", True, "User created and email sent")
                message = "Registration successful! Please check your email for a verification code."
            else:
                log_auth_attempt(db, new_user.id, ip_address, "register_step1", True, "User created but email failed")
                message = "Registration successful! However, we couldn't send the verification email. You can request a new one."
        except Exception as email_error:
            logger.error(f"Email sending failed: {email_error}")
            log_auth_attempt(db, new_user.id, ip_address, "register_step1", True, "User created but email failed")
            message = "Registration successful! However, we couldn't send the verification email. You can request a new one."

        return RegistrationResponse(
            success=True,
            message=message,
            user_id=new_user.id,
            next_step="email_verification",
            data={
                "email": new_user.email,
                "verification_method": "email"
            }
        )

    except Exception as e:
        logger.error(f"Registration step 1 failed: {e}")
        db.rollback()
        return RegistrationResponse(
            success=False,
            message="Registration failed due to a server error. Please try again."
        )

@router.post("/verify-email", response_model=VerificationResponse)
async def verify_email(
    verification_data: VerificationSubmit,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Step 2: Verify email with the code sent during registration
    """
    try:
        ip_address = get_client_ip(request)

        # Rate limiting
        rate_check = rate_limiter.check_rate_limit(
            db, f"email_verification_{verification_data.user_id}", ip_address,
            settings.MAX_OTP_ATTEMPTS * 2, 60
        )
        if not rate_check.allowed:
            return VerificationResponse(
                success=False,
                message="Too many verification attempts. Please wait before trying again.",
                resend_cooldown=rate_check.retry_after
            )

        # Get user
        user = db.query(User).filter(User.id == verification_data.user_id).first()
        if not user:
            log_auth_attempt(db, verification_data.user_id, ip_address, "verify_email", False, "User not found")
            raise HTTPException(status_code=404, detail="User not found")

        # Verify the code
        success, message = otp_service.verify_verification_code(
            db, verification_data.user_id, verification_data.code,
            VerificationCodeType.EMAIL_VERIFICATION
        )

        if success:
            # Update user status
            user.is_email_verified = True
            user.registration_status = "phone_verification_pending"
            db.commit()

            # Send phone verification
            phone_sent = await otp_service.send_phone_verification(db, user)

            log_auth_attempt(db, user.id, ip_address, "verify_email", True, "Email verified")

            if phone_sent:
                return VerificationResponse(
                    success=True,
                    message="Email verified successfully! Please check your phone for SMS verification code.",
                    next_step="phone_verification"
                )
            else:
                return VerificationResponse(
                    success=True,
                    message="Email verified! Phone verification will be sent shortly.",
                    next_step="phone_verification"
                )
        else:
            log_auth_attempt(db, user.id, ip_address, "verify_email", False, f"Invalid code: {message}")

            # Get remaining attempts
            status = otp_service.get_verification_status(
                db, verification_data.user_id, VerificationCodeType.EMAIL_VERIFICATION
            )

            return VerificationResponse(
                success=False,
                message=message,
                attempts_remaining=status.get("attempts_remaining", 0)
            )

    except Exception as e:
        logger.error(f"Email verification failed: {e}")
        return VerificationResponse(
            success=False,
            message="Verification failed due to a server error."
        )

@router.post("/verify-phone", response_model=VerificationResponse)
async def verify_phone(
    verification_data: VerificationSubmit,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Step 3: Verify phone number with SMS code
    """
    try:
        ip_address = get_client_ip(request)

        # Rate limiting
        rate_check = rate_limiter.check_rate_limit(
            db, f"phone_verification_{verification_data.user_id}", ip_address,
            settings.MAX_OTP_ATTEMPTS * 2, 60
        )
        if not rate_check.allowed:
            return VerificationResponse(
                success=False,
                message="Too many verification attempts. Please wait before trying again.",
                resend_cooldown=rate_check.retry_after
            )

        # Get user
        user = db.query(User).filter(User.id == verification_data.user_id).first()
        if not user:
            log_auth_attempt(db, verification_data.user_id, ip_address, "verify_phone", False, "User not found")
            raise HTTPException(status_code=404, detail="User not found")

        # Verify the code
        success, message = otp_service.verify_verification_code(
            db, verification_data.user_id, verification_data.code,
            VerificationCodeType.PHONE_VERIFICATION
        )

        if success:
            # Update user status
            user.is_phone_verified = True
            user.registration_status = "totp_setup_required"
            db.commit()

            log_auth_attempt(db, user.id, ip_address, "verify_phone", True, "Phone verified")

            return VerificationResponse(
                success=True,
                message="Phone verified successfully! Please set up two-factor authentication.",
                next_step="totp_setup"
            )
        else:
            log_auth_attempt(db, user.id, ip_address, "verify_phone", False, f"Invalid code: {message}")

            # Get remaining attempts
            status = otp_service.get_verification_status(
                db, verification_data.user_id, VerificationCodeType.PHONE_VERIFICATION
            )

            return VerificationResponse(
                success=False,
                message=message,
                attempts_remaining=status.get("attempts_remaining", 0)
            )

    except Exception as e:
        logger.error(f"Phone verification failed: {e}")
        return VerificationResponse(
            success=False,
            message="Verification failed due to a server error."
        )

@router.post("/setup-totp", response_model=TOTPSetupResponse)
async def setup_totp(
    totp_request: TOTPSetupRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Step 4: Generate TOTP secret and QR code for authenticator app setup
    """
    try:
        ip_address = get_client_ip(request)

        # Get user
        user = db.query(User).filter(User.id == totp_request.user_id).first()
        if not user:
            log_auth_attempt(db, totp_request.user_id, ip_address, "setup_totp", False, "User not found")
            raise HTTPException(status_code=404, detail="User not found")

        # Check if user is eligible for TOTP setup
        if not user.is_email_verified or not user.is_phone_verified:
            return TOTPSetupResponse(
                success=False,
                message="Please complete email and phone verification first."
            )

        # Generate TOTP setup data
        totp_data = two_factor_auth_service.setup_2fa_for_user(
            user.email, user.full_name or user.username
        )

        if not totp_data:
            return TOTPSetupResponse(
                success=False,
                message="Failed to generate TOTP setup. Please try again."
            )

        # Store TOTP secret temporarily (will be confirmed after verification)
        existing_method = db.query(UserAuthMethod).filter(
            UserAuthMethod.user_id == user.id,
            UserAuthMethod.method_type == AuthMethodType.TOTP
        ).first()

        if existing_method:
            # Update existing method with new secret
            existing_method.method_data = {
                'secret': totp_data['secret'],
                'backup_codes': totp_data['hashed_backup_codes'],
                'is_verified': False
            }
            existing_method.updated_at = datetime.utcnow()
        else:
            # Create new auth method
            auth_method = UserAuthMethod(
                user_id=user.id,
                method_type=AuthMethodType.TOTP,
                method_data={
                    'secret': totp_data['secret'],
                    'backup_codes': totp_data['hashed_backup_codes'],
                    'is_verified': False
                },
                is_active=False,
                created_at=datetime.utcnow()
            )
            db.add(auth_method)

        db.commit()

        log_auth_attempt(db, user.id, ip_address, "setup_totp", True, "TOTP setup initiated")

        return TOTPSetupResponse(
            success=True,
            message="TOTP setup ready. Please scan the QR code with your authenticator app and verify.",
            qr_code=totp_data['qr_code'],
            backup_codes=totp_data['backup_codes'],
            secret=totp_data['secret']  # For manual entry if QR fails
        )

    except Exception as e:
        logger.error(f"TOTP setup failed: {e}")
        return TOTPSetupResponse(
            success=False,
            message="TOTP setup failed due to a server error."
        )

@router.post("/verify-totp", response_model=VerificationResponse)
async def verify_totp(
    totp_request: TOTPVerifyRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Step 5: Verify TOTP code to complete registration
    """
    try:
        ip_address = get_client_ip(request)

        # Rate limiting
        rate_check = rate_limiter.check_rate_limit(
            db, f"totp_verification_{totp_request.user_id}", ip_address,
            settings.MAX_OTP_ATTEMPTS * 2, 60
        )
        if not rate_check.allowed:
            return VerificationResponse(
                success=False,
                message="Too many verification attempts. Please wait before trying again.",
                resend_cooldown=rate_check.retry_after
            )

        # Get user and auth method
        user = db.query(User).filter(User.id == totp_request.user_id).first()
        if not user:
            log_auth_attempt(db, totp_request.user_id, ip_address, "verify_totp", False, "User not found")
            raise HTTPException(status_code=404, detail="User not found")

        auth_method = db.query(UserAuthMethod).filter(
            UserAuthMethod.user_id == user.id,
            UserAuthMethod.method_type == AuthMethodType.TOTP
        ).first()

        if not auth_method:
            return VerificationResponse(
                success=False,
                message="TOTP not set up. Please set up TOTP first."
            )

        # Verify TOTP code
        secret = auth_method.method_data.get('secret')
        backup_codes = auth_method.method_data.get('backup_codes', [])

        is_valid, method_used = two_factor_auth_service.verify_2fa_token(
            secret, totp_request.totp_code, backup_codes
        )

        if is_valid:
            # Mark TOTP as verified and activate
            auth_method.method_data['is_verified'] = True
            auth_method.is_active = True
            auth_method.verified_at = datetime.utcnow()

            # Complete user registration
            user.registration_status = "completed"
            user.is_active = True
            user.two_factor_enabled = True
            user.last_activity = datetime.utcnow()

            db.commit()

            log_auth_attempt(db, user.id, ip_address, "verify_totp", True, f"TOTP verified via {method_used}")

            return VerificationResponse(
                success=True,
                message="Two-factor authentication verified successfully! Registration complete.",
                next_step="login"
            )
        else:
            log_auth_attempt(db, user.id, ip_address, "verify_totp", False, "Invalid TOTP code")

            return VerificationResponse(
                success=False,
                message="Invalid verification code. Please try again.",
                attempts_remaining=2  # TOTP doesn't have strict attempt limits
            )

    except Exception as e:
        logger.error(f"TOTP verification failed: {e}")
        return VerificationResponse(
            success=False,
            message="Verification failed due to a server error."
        )

@router.post("/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Enhanced login with 2FA support
    """
    try:
        ip_address = get_client_ip(request)

        # Rate limiting
        rate_check = rate_limiter.check_rate_limit(
            db, f"login_{login_data.username}", ip_address,
            settings.RATE_LIMIT_LOGIN_PER_HOUR, 60
        )
        if not rate_check.allowed:
            return LoginResponse(
                success=False,
                message=f"Too many login attempts. Try again in {rate_check.retry_after} seconds."
            )

        # Find user
        user = db.query(User).filter(
            (User.username == login_data.username.lower()) |
            (User.email == login_data.username)
        ).first()

        if not user or not verify_password(login_data.password, user.hashed_password):
            log_auth_attempt(db, user.id if user else None, ip_address, "login", False, "Invalid credentials")
            return LoginResponse(
                success=False,
                message="Invalid username or password."
            )

        # Check if user account is active
        if not user.is_active:
            log_auth_attempt(db, user.id, ip_address, "login", False, "Account inactive")
            return LoginResponse(
                success=False,
                message="Account not activated. Please complete registration."
            )

        # Update last activity
        user.last_activity = datetime.utcnow()

        # Check if 2FA is required
        if user.two_factor_enabled:
            # Get available 2FA methods
            auth_methods = db.query(UserAuthMethod).filter(
                UserAuthMethod.user_id == user.id,
                UserAuthMethod.is_active == True
            ).all()

            available_methods = []
            for method in auth_methods:
                if method.method_type == AuthMethodType.TOTP:
                    available_methods.append("totp")
                # Add other method types here

            # Add email/SMS OTP as backup methods
            if user.is_email_verified:
                available_methods.append("email")
            if user.is_phone_verified:
                available_methods.append("sms")

            db.commit()
            log_auth_attempt(db, user.id, ip_address, "login", True, "Password verified, 2FA required")

            return LoginResponse(
                success=True,
                message="Password verified. Please complete two-factor authentication.",
                user_id=user.id,
                requires_2fa=True,
                available_methods=available_methods
            )
        else:
            # 2FA not enabled, create tokens
            access_token = create_access_token(data={"sub": str(user.id)})
            refresh_token = create_refresh_token(data={"sub": str(user.id)})

            db.commit()
            log_auth_attempt(db, user.id, ip_address, "login", True, "Login successful without 2FA")

            return LoginResponse(
                success=True,
                message="Login successful!",
                user_id=user.id,
                requires_2fa=False,
                access_token=access_token,
                refresh_token=refresh_token
            )

    except Exception as e:
        logger.error(f"Login failed: {e}")
        return LoginResponse(
            success=False,
            message="Login failed due to a server error."
        )

@router.post("/login-otp", response_model=LoginResponse)
async def login_otp(
    otp_data: LoginOTPRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Complete login with OTP/2FA verification
    """
    try:
        ip_address = get_client_ip(request)

        # Get user
        user = db.query(User).filter(User.id == otp_data.user_id).first()
        if not user:
            log_auth_attempt(db, otp_data.user_id, ip_address, "login_otp", False, "User not found")
            raise HTTPException(status_code=404, detail="User not found")

        success = False
        verification_method = otp_data.method

        if otp_data.method == "totp":
            # Verify TOTP
            auth_method = db.query(UserAuthMethod).filter(
                UserAuthMethod.user_id == user.id,
                UserAuthMethod.method_type == AuthMethodType.TOTP,
                UserAuthMethod.is_active == True
            ).first()

            if auth_method:
                secret = auth_method.method_data.get('secret')
                backup_codes = auth_method.method_data.get('backup_codes', [])
                is_valid, method_used = two_factor_auth_service.verify_2fa_token(
                    secret, otp_data.otp_code, backup_codes
                )
                success = is_valid
                if method_used == "backup_code":
                    verification_method = "backup_code"

        elif otp_data.method in ["email", "sms"]:
            # Verify email/SMS OTP
            success, message = otp_service.verify_verification_code(
                db, user.id, otp_data.otp_code, VerificationCodeType.LOGIN_OTP
            )

        if success:
            # Create tokens
            access_token = create_access_token(data={"sub": str(user.id)})
            refresh_token = create_refresh_token(data={"sub": str(user.id)})

            # Update user activity
            user.last_login = datetime.utcnow()
            user.last_activity = datetime.utcnow()

            db.commit()
            log_auth_attempt(db, user.id, ip_address, "login_otp", True, f"2FA verified via {verification_method}")

            return LoginResponse(
                success=True,
                message="Login successful!",
                user_id=user.id,
                requires_2fa=False,
                access_token=access_token,
                refresh_token=refresh_token
            )
        else:
            log_auth_attempt(db, user.id, ip_address, "login_otp", False, f"Invalid 2FA code via {otp_data.method}")

            return LoginResponse(
                success=False,
                message="Invalid verification code. Please try again."
            )

    except Exception as e:
        logger.error(f"Login OTP verification failed: {e}")
        return LoginResponse(
            success=False,
            message="Verification failed due to a server error."
        )

@router.post("/request-otp", response_model=VerificationResponse)
async def request_otp(
    otp_request: VerificationRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Request OTP for login (email or SMS)
    """
    try:
        ip_address = get_client_ip(request)

        # Rate limiting
        limit_key = f"otp_{otp_request.method}_{otp_request.user_id}"
        rate_limit = settings.RATE_LIMIT_OTP_EMAIL_PER_HOUR if otp_request.method == "email" else settings.RATE_LIMIT_OTP_SMS_PER_HOUR

        rate_check = rate_limiter.check_rate_limit(db, limit_key, ip_address, rate_limit, 60)
        if not rate_check.allowed:
            return VerificationResponse(
                success=False,
                message=f"Too many OTP requests. Try again in {rate_check.retry_after} seconds.",
                resend_cooldown=rate_check.retry_after
            )

        # Get user
        user = db.query(User).filter(User.id == otp_request.user_id).first()
        if not user:
            log_auth_attempt(db, otp_request.user_id, ip_address, "request_otp", False, "User not found")
            raise HTTPException(status_code=404, detail="User not found")

        # Send OTP
        success = await otp_service.send_login_otp(db, user, otp_request.method, ip_address)

        if success:
            log_auth_attempt(db, user.id, ip_address, "request_otp", True, f"OTP sent via {otp_request.method}")

            return VerificationResponse(
                success=True,
                message=f"Verification code sent via {otp_request.method}.",
                can_resend=True,
                resend_cooldown=60
            )
        else:
            log_auth_attempt(db, user.id, ip_address, "request_otp", False, f"Failed to send OTP via {otp_request.method}")

            return VerificationResponse(
                success=False,
                message=f"Failed to send verification code via {otp_request.method}. Please try again."
            )

    except Exception as e:
        logger.error(f"OTP request failed: {e}")
        return VerificationResponse(
            success=False,
            message="Failed to send verification code due to a server error."
        )

@router.get("/user-status/{user_id}", response_model=UserStatusResponse)
async def get_user_status(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Get user registration and verification status
    """
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get available auth methods
        auth_methods = db.query(UserAuthMethod).filter(
            UserAuthMethod.user_id == user.id,
            UserAuthMethod.is_active == True
        ).all()

        available_methods = []
        for method in auth_methods:
            if method.method_type == AuthMethodType.TOTP:
                available_methods.append("totp")

        # Add backup methods
        if user.is_email_verified:
            available_methods.append("email")
        if user.is_phone_verified:
            available_methods.append("sms")

        # Determine next required step
        next_step = None
        if user.registration_status == "email_verification_pending":
            next_step = "email_verification"
        elif user.registration_status == "phone_verification_pending":
            next_step = "phone_verification"
        elif user.registration_status == "totp_setup_required":
            next_step = "totp_setup"
        elif user.registration_status == "completed" and user.is_active:
            next_step = "login"

        return UserStatusResponse(
            user_id=user.id,
            username=user.username,
            email=user.email,
            phone_number=user.phone_number,
            registration_status=user.registration_status,
            is_email_verified=user.is_email_verified,
            is_phone_verified=user.is_phone_verified,
            two_factor_enabled=user.two_factor_enabled,
            available_auth_methods=available_methods,
            next_required_step=next_step
        )

    except Exception as e:
        logger.error(f"Get user status failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user status")