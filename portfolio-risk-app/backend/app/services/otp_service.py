import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Tuple
import logging
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.auth import VerificationCode, VerificationCodeType
from app.models.user import User
from app.services.email_service import email_service, email_template_service
from app.services.sms_service import sms_service, sms_template_service
from app.core.security import get_password_hash, verify_password

logger = logging.getLogger(__name__)

class OTPService:
    """
    One-Time Password service for email and SMS verification
    Handles generation, sending, and verification of OTP codes
    """

    def __init__(self):
        self.code_length = settings.OTP_LENGTH
        self.expiry_minutes = settings.OTP_EXPIRY_MINUTES
        self.max_attempts = settings.MAX_OTP_ATTEMPTS

    def generate_code(self) -> str:
        """
        Generate cryptographically secure OTP code
        """
        # Generate random digits
        code = ''.join([str(secrets.randbelow(10)) for _ in range(self.code_length)])
        return code

    def hash_code(self, code: str) -> str:
        """
        Hash OTP code for secure storage
        """
        return get_password_hash(code)

    def verify_code(self, code: str, hashed_code: str) -> bool:
        """
        Verify OTP code against hash
        """
        return verify_password(code, hashed_code)

    async def send_email_verification(
        self,
        db: Session,
        user: User
    ) -> bool:
        """
        Send email verification code
        """
        try:
            # Generate new verification code
            code = self.generate_code()
            hashed_code = self.hash_code(code)

            # Create verification record
            verification = VerificationCode(
                user_id=user.id,
                code_hash=hashed_code,
                code_type=VerificationCodeType.EMAIL_VERIFICATION,
                recipient=user.email,
                expires_at=datetime.utcnow() + timedelta(minutes=self.expiry_minutes)
            )

            db.add(verification)
            db.commit()

            # Send email
            html_content, subject = email_template_service.render_verification_email(
                user_name=user.full_name or user.username,
                verification_code=code,
                expires_in_minutes=self.expiry_minutes
            )

            success = await email_service.send_email_async(
                to_email=user.email,
                subject=subject,
                html_content=html_content
            )

            if success:
                logger.info(f"Email verification sent to {user.email}")
            else:
                # Remove verification record if email failed
                db.delete(verification)
                db.commit()

            return success

        except Exception as e:
            logger.error(f"Failed to send email verification: {e}")
            db.rollback()
            return False

    async def send_phone_verification(
        self,
        db: Session,
        user: User
    ) -> bool:
        """
        Send SMS verification code
        """
        try:
            if not user.phone_number:
                logger.error(f"No phone number for user {user.id}")
                return False

            # Generate new verification code
            code = self.generate_code()
            hashed_code = self.hash_code(code)

            # Create verification record
            verification = VerificationCode(
                user_id=user.id,
                code_hash=hashed_code,
                code_type=VerificationCodeType.PHONE_VERIFICATION,
                recipient=user.phone_number,
                expires_at=datetime.utcnow() + timedelta(minutes=self.expiry_minutes)
            )

            db.add(verification)
            db.commit()

            # Send SMS
            message = sms_template_service.format_verification_code(code)

            success = await sms_service.send_sms(
                phone_number=user.phone_number,
                message=message
            )

            if success:
                logger.info(f"SMS verification sent to {user.phone_number}")
            else:
                # Remove verification record if SMS failed
                db.delete(verification)
                db.commit()

            return success

        except Exception as e:
            logger.error(f"Failed to send SMS verification: {e}")
            db.rollback()
            return False

    async def send_login_otp(
        self,
        db: Session,
        user: User,
        method: str = "email",
        ip_address: str = "Unknown"
    ) -> bool:
        """
        Send login OTP via email or SMS
        """
        try:
            # Generate new OTP code
            code = self.generate_code()
            hashed_code = self.hash_code(code)

            # Determine recipient and method
            if method == "sms" and user.phone_number:
                recipient = user.phone_number
                code_type = VerificationCodeType.LOGIN_OTP
            else:
                recipient = user.email
                code_type = VerificationCodeType.LOGIN_OTP
                method = "email"

            # Create verification record
            verification = VerificationCode(
                user_id=user.id,
                code_hash=hashed_code,
                code_type=code_type,
                recipient=recipient,
                expires_at=datetime.utcnow() + timedelta(minutes=self.expiry_minutes)
            )

            db.add(verification)
            db.commit()

            # Send based on method
            if method == "email":
                html_content, subject = email_template_service.render_login_otp_email(
                    user_name=user.full_name or user.username,
                    otp_code=code,
                    ip_address=ip_address
                )

                success = await email_service.send_email_async(
                    to_email=user.email,
                    subject=subject,
                    html_content=html_content
                )
            else:
                message = sms_template_service.format_login_code(code)
                success = await sms_service.send_sms(
                    phone_number=user.phone_number,
                    message=message
                )

            if success:
                logger.info(f"Login OTP sent via {method} to user {user.id}")
            else:
                db.delete(verification)
                db.commit()

            return success

        except Exception as e:
            logger.error(f"Failed to send login OTP: {e}")
            db.rollback()
            return False

    def verify_verification_code(
        self,
        db: Session,
        user_id: int,
        code: str,
        code_type: VerificationCodeType
    ) -> Tuple[bool, str]:
        """
        Verify a verification code
        Returns: (success, message)
        """
        try:
            # Find the most recent valid code
            verification = (
                db.query(VerificationCode)
                .filter(
                    VerificationCode.user_id == user_id,
                    VerificationCode.code_type == code_type,
                    VerificationCode.is_used == False,
                    VerificationCode.is_expired == False,
                    VerificationCode.expires_at > datetime.utcnow()
                )
                .order_by(VerificationCode.created_at.desc())
                .first()
            )

            if not verification:
                return False, "No valid verification code found"

            # Check if too many attempts
            if verification.attempts >= verification.max_attempts:
                verification.is_expired = True
                db.commit()
                return False, "Too many failed attempts"

            # Increment attempt count
            verification.attempts += 1

            # Verify the code
            if self.verify_code(code, verification.code_hash):
                # Mark as used
                verification.is_used = True
                verification.verified_at = datetime.utcnow()
                db.commit()

                logger.info(f"Code verified successfully for user {user_id}")
                return True, "Code verified successfully"
            else:
                db.commit()
                attempts_left = verification.max_attempts - verification.attempts
                if attempts_left > 0:
                    return False, f"Invalid code. {attempts_left} attempts remaining"
                else:
                    verification.is_expired = True
                    db.commit()
                    return False, "Invalid code. No attempts remaining"

        except Exception as e:
            logger.error(f"Error verifying code: {e}")
            db.rollback()
            return False, "Verification failed"

    def cleanup_expired_codes(self, db: Session) -> int:
        """
        Clean up expired verification codes
        Returns number of codes cleaned up
        """
        try:
            expired_codes = (
                db.query(VerificationCode)
                .filter(
                    VerificationCode.expires_at < datetime.utcnow()
                )
            )

            count = expired_codes.count()
            expired_codes.update({VerificationCode.is_expired: True})
            db.commit()

            logger.info(f"Cleaned up {count} expired verification codes")
            return count

        except Exception as e:
            logger.error(f"Error cleaning up codes: {e}")
            db.rollback()
            return 0

    def get_verification_status(
        self,
        db: Session,
        user_id: int,
        code_type: VerificationCodeType
    ) -> dict:
        """
        Get verification status for a user
        """
        try:
            verification = (
                db.query(VerificationCode)
                .filter(
                    VerificationCode.user_id == user_id,
                    VerificationCode.code_type == code_type
                )
                .order_by(VerificationCode.created_at.desc())
                .first()
            )

            if not verification:
                return {
                    "has_code": False,
                    "is_expired": True,
                    "attempts_remaining": 0,
                    "time_remaining": 0
                }

            time_remaining = 0
            if verification.expires_at > datetime.utcnow():
                time_remaining = int((verification.expires_at - datetime.utcnow()).total_seconds())

            return {
                "has_code": True,
                "is_expired": verification.is_expired or verification.expires_at <= datetime.utcnow(),
                "is_used": verification.is_used,
                "attempts_remaining": max(0, verification.max_attempts - verification.attempts),
                "time_remaining": time_remaining,
                "recipient": verification.recipient
            }

        except Exception as e:
            logger.error(f"Error getting verification status: {e}")
            return {
                "has_code": False,
                "is_expired": True,
                "attempts_remaining": 0,
                "time_remaining": 0
            }

    def can_request_new_code(
        self,
        db: Session,
        user_id: int,
        code_type: VerificationCodeType,
        cooldown_minutes: int = 1
    ) -> Tuple[bool, int]:
        """
        Check if user can request a new verification code
        Returns: (can_request, seconds_to_wait)
        """
        try:
            last_verification = (
                db.query(VerificationCode)
                .filter(
                    VerificationCode.user_id == user_id,
                    VerificationCode.code_type == code_type
                )
                .order_by(VerificationCode.created_at.desc())
                .first()
            )

            if not last_verification:
                return True, 0

            time_since_last = datetime.utcnow() - last_verification.created_at
            cooldown_time = timedelta(minutes=cooldown_minutes)

            if time_since_last >= cooldown_time:
                return True, 0
            else:
                seconds_to_wait = int((cooldown_time - time_since_last).total_seconds())
                return False, seconds_to_wait

        except Exception as e:
            logger.error(f"Error checking code request cooldown: {e}")
            return False, 60  # Default 1 minute cooldown on error

# Singleton instance
otp_service = OTPService()