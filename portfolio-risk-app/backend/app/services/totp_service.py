import pyotp
import qrcode
import io
import base64
import secrets
import json
from typing import Optional, List, Tuple
import logging
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont

from app.core.config import settings

logger = logging.getLogger(__name__)

class TOTPService:
    """
    Time-based One-Time Password service
    Compatible with Google Authenticator, Authy, Microsoft Authenticator, etc.
    """

    def __init__(self):
        self.issuer_name = "PortfolioRisk"
        self.digits = 6
        self.interval = 30  # 30-second intervals (standard)

    def generate_secret(self) -> str:
        """
        Generate a new TOTP secret (base32 encoded)
        """
        return pyotp.random_base32()

    def generate_provisioning_uri(
        self,
        user_email: str,
        secret: str,
        user_name: Optional[str] = None
    ) -> str:
        """
        Generate provisioning URI for QR code
        """
        totp = pyotp.TOTP(secret)

        account_name = user_name or user_email

        return totp.provisioning_uri(
            name=account_name,
            issuer_name=self.issuer_name
        )

    def generate_qr_code(
        self,
        user_email: str,
        secret: str,
        user_name: Optional[str] = None
    ) -> str:
        """
        Generate QR code as base64 string for easy frontend display
        """
        try:
            provisioning_uri = self.generate_provisioning_uri(
                user_email, secret, user_name
            )

            # Create QR code with custom styling
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )

            qr.add_data(provisioning_uri)
            qr.make(fit=True)

            # Create QR code image with custom colors
            img = qr.make_image(
                fill_color="#1e40af",  # Primary blue
                back_color="white"
            )

            # Add logo/branding to center (optional)
            img = self._add_branding_to_qr(img)

            # Convert to base64
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            buffer.seek(0)

            qr_base64 = base64.b64encode(buffer.getvalue()).decode()
            return f"data:image/png;base64,{qr_base64}"

        except Exception as e:
            logger.error(f"Failed to generate QR code: {e}")
            return None

    def _add_branding_to_qr(self, qr_img: Image.Image) -> Image.Image:
        """
        Add subtle branding to QR code center
        """
        try:
            # Calculate center position
            width, height = qr_img.size
            center_x, center_y = width // 2, height // 2

            # Create small logo area (about 10% of QR size)
            logo_size = min(width, height) // 10

            # Draw simple circle logo
            draw = ImageDraw.Draw(qr_img)
            left = center_x - logo_size // 2
            top = center_y - logo_size // 2
            right = center_x + logo_size // 2
            bottom = center_y + logo_size // 2

            # White circle background
            draw.ellipse([left-2, top-2, right+2, bottom+2], fill="white")
            # Blue circle
            draw.ellipse([left, top, right, bottom], fill="#1e40af")

            return qr_img

        except Exception as e:
            logger.warning(f"Failed to add branding to QR: {e}")
            return qr_img

    def verify_token(self, secret: str, token: str, window: int = 1) -> bool:
        """
        Verify TOTP token
        window: number of time periods to check (allows for clock drift)
        """
        try:
            totp = pyotp.TOTP(secret)
            return totp.verify(token, valid_window=window)
        except Exception as e:
            logger.error(f"TOTP verification failed: {e}")
            return False

    def get_current_token(self, secret: str) -> str:
        """
        Get current token (for testing purposes)
        """
        try:
            totp = pyotp.TOTP(secret)
            return totp.now()
        except Exception as e:
            logger.error(f"Failed to get current token: {e}")
            return None

    def get_time_remaining(self) -> int:
        """
        Get seconds remaining until next token change
        """
        import time
        return self.interval - int(time.time()) % self.interval

class BackupCodesService:
    """
    Generate and manage backup codes for account recovery
    """

    def __init__(self):
        self.code_length = 8
        self.num_codes = 10

    def generate_backup_codes(self) -> List[str]:
        """
        Generate backup codes for account recovery
        """
        codes = []
        for _ in range(self.num_codes):
            # Generate readable codes (4-4 format)
            part1 = secrets.token_hex(2).upper()
            part2 = secrets.token_hex(2).upper()
            code = f"{part1}-{part2}"
            codes.append(code)

        return codes

    def hash_backup_codes(self, codes: List[str]) -> List[str]:
        """
        Hash backup codes for secure storage
        """
        from app.core.security import get_password_hash
        return [get_password_hash(code) for code in codes]

    def verify_backup_code(self, code: str, hashed_codes: List[str]) -> bool:
        """
        Verify backup code against hashed codes
        """
        from app.core.security import verify_password

        for hashed_code in hashed_codes:
            if verify_password(code, hashed_code):
                return True
        return False

    def format_codes_for_display(self, codes: List[str]) -> str:
        """
        Format backup codes for user display
        """
        formatted = []
        for i, code in enumerate(codes, 1):
            formatted.append(f"{i:2d}. {code}")

        return "\n".join(formatted)

class TwoFactorAuthService:
    """
    Complete 2FA service combining TOTP and backup codes
    """

    def __init__(self):
        self.totp_service = TOTPService()
        self.backup_service = BackupCodesService()

    def setup_2fa_for_user(
        self,
        user_email: str,
        user_name: Optional[str] = None
    ) -> dict:
        """
        Setup 2FA for a user - generate secret, QR code, and backup codes
        """
        try:
            # Generate TOTP secret
            secret = self.totp_service.generate_secret()

            # Generate QR code
            qr_code = self.totp_service.generate_qr_code(
                user_email, secret, user_name
            )

            # Generate backup codes
            backup_codes = self.backup_service.generate_backup_codes()
            hashed_backup_codes = self.backup_service.hash_backup_codes(backup_codes)

            return {
                'secret': secret,
                'qr_code': qr_code,
                'backup_codes': backup_codes,
                'hashed_backup_codes': hashed_backup_codes,
                'provisioning_uri': self.totp_service.generate_provisioning_uri(
                    user_email, secret, user_name
                )
            }

        except Exception as e:
            logger.error(f"Failed to setup 2FA: {e}")
            return None

    def verify_2fa_token(
        self,
        secret: str,
        token: str,
        backup_codes: Optional[List[str]] = None
    ) -> Tuple[bool, str]:
        """
        Verify 2FA token (TOTP or backup code)
        Returns: (is_valid, method_used)
        """
        # First try TOTP
        if self.totp_service.verify_token(secret, token):
            return True, "totp"

        # If TOTP fails, try backup codes
        if backup_codes and self.backup_service.verify_backup_code(token, backup_codes):
            return True, "backup_code"

        return False, "none"

    def get_2fa_status(self, secret: str) -> dict:
        """
        Get current 2FA status and time remaining
        """
        return {
            'time_remaining': self.totp_service.get_time_remaining(),
            'current_token': self.totp_service.get_current_token(secret),  # Only for testing
            'is_setup': bool(secret)
        }

class AuthMethodManager:
    """
    Manage multiple authentication methods for a user
    """

    def __init__(self):
        self.tfa_service = TwoFactorAuthService()

    def create_auth_method_data(
        self,
        method_type: str,
        user_email: str,
        user_name: Optional[str] = None,
        **kwargs
    ) -> dict:
        """
        Create auth method data based on type
        """
        if method_type == "totp":
            return self.tfa_service.setup_2fa_for_user(user_email, user_name)

        # Add other method types here (hardware keys, etc.)
        return {}

    def verify_auth_method(
        self,
        method_type: str,
        method_data: dict,
        provided_token: str
    ) -> Tuple[bool, str]:
        """
        Verify authentication method
        """
        if method_type == "totp":
            secret = method_data.get('secret')
            backup_codes = method_data.get('hashed_backup_codes', [])
            return self.tfa_service.verify_2fa_token(
                secret, provided_token, backup_codes
            )

        return False, "unsupported_method"

    def get_method_status(self, method_type: str, method_data: dict) -> dict:
        """
        Get status for authentication method
        """
        if method_type == "totp":
            secret = method_data.get('secret')
            if secret:
                return self.tfa_service.get_2fa_status(secret)

        return {'is_setup': False}

# Singleton instances
totp_service = TOTPService()
backup_codes_service = BackupCodesService()
two_factor_auth_service = TwoFactorAuthService()
auth_method_manager = AuthMethodManager()