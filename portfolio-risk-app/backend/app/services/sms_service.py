import phonenumbers
from phonenumbers import carrier, geocoder
import httpx
import logging
from typing import Optional, Dict, List
from enum import Enum
import asyncio
from twilio.rest import Client as TwilioClient
from twilio.base.exceptions import TwilioException

from app.core.config import settings
from app.services.email_service import email_service

logger = logging.getLogger(__name__)

class SMSProvider(str, Enum):
    EMAIL_TO_SMS = "email_to_sms"
    TWILIO_TRIAL = "twilio_trial"
    TEXTBELT = "textbelt"
    FALLBACK_EMAIL = "fallback_email"

class CarrierEmailGateways:
    """
    Email-to-SMS gateways for major carriers (completely free)
    """
    GATEWAYS = {
        # US Carriers
        'verizon': ['@vtext.com', '@vzwpix.com'],
        'att': ['@txt.att.net', '@mms.att.net'],
        'tmobile': ['@tmomail.net'],
        'sprint': ['@messaging.sprintpcs.com', '@pm.sprint.com'],
        'boost': ['@myboostmobile.com'],
        'cricket': ['@sms.cricketwireless.net'],
        'metropcs': ['@mymetropcs.com'],
        'tracfone': ['@mmst5.tracfone.com'],
        'uscellular': ['@email.uscc.net'],
        'virgin': ['@vmobl.com'],

        # International carriers can be added here
        'rogers': ['@pcs.rogers.com'],  # Canada
        'bell': ['@txt.bell.ca'],  # Canada
        'telus': ['@msg.telus.com'],  # Canada
    }

    @classmethod
    def get_email_address(cls, phone_number: str, carrier_name: str = None) -> Optional[str]:
        """
        Convert phone number to email address for SMS gateway
        """
        try:
            # Clean phone number
            phone_digits = ''.join(filter(str.isdigit, phone_number))

            if carrier_name and carrier_name.lower() in cls.GATEWAYS:
                gateway = cls.GATEWAYS[carrier_name.lower()][0]
                return f"{phone_digits}{gateway}"

            # Try to detect carrier automatically
            parsed_number = phonenumbers.parse(phone_number, "US")
            if phonenumbers.is_valid_number(parsed_number):
                carrier_name = carrier.name_for_number(parsed_number, "en")

                # Map carrier names to our gateways
                carrier_mapping = {
                    'verizon': 'verizon',
                    'at&t': 'att',
                    't-mobile': 'tmobile',
                    'sprint': 'sprint',
                    'boost': 'boost',
                    'cricket': 'cricket'
                }

                for key, value in carrier_mapping.items():
                    if key in carrier_name.lower():
                        gateway = cls.GATEWAYS[value][0]
                        return f"{phone_digits}{gateway}"

            # Default to Verizon (most common)
            return f"{phone_digits}@vtext.com"

        except Exception as e:
            logger.error(f"Failed to convert phone to email: {e}")
            return None

class SMSService:
    """
    Multi-provider SMS service with automatic failover
    Prioritizes free services, falls back to paid if necessary
    """

    def __init__(self):
        self.providers = self._initialize_providers()
        self.provider_order = [
            SMSProvider.EMAIL_TO_SMS,      # Free forever
            SMSProvider.TWILIO_TRIAL,      # Free trial credits
            SMSProvider.TEXTBELT,          # Free but limited
            SMSProvider.FALLBACK_EMAIL,    # Last resort
        ]

    def _initialize_providers(self) -> Dict[SMSProvider, bool]:
        """
        Check which providers are available
        """
        providers = {}

        # Email-to-SMS (always available if email works)
        providers[SMSProvider.EMAIL_TO_SMS] = True

        # Twilio (check if credentials available)
        providers[SMSProvider.TWILIO_TRIAL] = bool(
            getattr(settings, 'TWILIO_ACCOUNT_SID', None) and
            getattr(settings, 'TWILIO_AUTH_TOKEN', None)
        )

        # TextBelt (free tier, no setup required)
        providers[SMSProvider.TEXTBELT] = True

        # Fallback email (always available)
        providers[SMSProvider.FALLBACK_EMAIL] = True

        return providers

    async def send_sms(
        self,
        phone_number: str,
        message: str,
        carrier: Optional[str] = None
    ) -> bool:
        """
        Send SMS using the best available provider with automatic failover
        """
        # Validate phone number
        if not self._validate_phone_number(phone_number):
            logger.error(f"Invalid phone number: {phone_number}")
            return False

        # Try each provider in order
        for provider in self.provider_order:
            if not self.providers.get(provider, False):
                continue

            try:
                success = await self._send_via_provider(
                    provider, phone_number, message, carrier
                )
                if success:
                    logger.info(f"SMS sent via {provider.value} to {phone_number}")
                    return True

            except Exception as e:
                logger.warning(f"Provider {provider.value} failed: {e}")
                continue

        logger.error(f"All SMS providers failed for {phone_number}")
        return False

    async def _send_via_provider(
        self,
        provider: SMSProvider,
        phone_number: str,
        message: str,
        carrier: Optional[str] = None
    ) -> bool:
        """
        Send SMS via specific provider
        """
        if provider == SMSProvider.EMAIL_TO_SMS:
            return await self._send_via_email_to_sms(phone_number, message, carrier)
        elif provider == SMSProvider.TWILIO_TRIAL:
            return await self._send_via_twilio(phone_number, message)
        elif provider == SMSProvider.TEXTBELT:
            return await self._send_via_textbelt(phone_number, message)
        elif provider == SMSProvider.FALLBACK_EMAIL:
            return await self._send_via_fallback_email(phone_number, message)

        return False

    async def _send_via_email_to_sms(
        self,
        phone_number: str,
        message: str,
        carrier: Optional[str] = None
    ) -> bool:
        """
        Send SMS via email-to-SMS gateway (completely free)
        """
        try:
            email_address = CarrierEmailGateways.get_email_address(phone_number, carrier)
            if not email_address:
                return False

            # Create simple HTML for SMS
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif;">
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h3 style="color: #495057; margin: 0 0 15px 0;">🔐 PortfolioRisk</h3>
                    <p style="margin: 0; font-size: 16px; color: #212529;">{message}</p>
                </div>
            </body>
            </html>
            """

            return await email_service.send_email_async(
                to_email=email_address,
                subject="PortfolioRisk Security Code",
                html_content=html_content,
                text_content=message
            )

        except Exception as e:
            logger.error(f"Email-to-SMS failed: {e}")
            return False

    async def _send_via_twilio(self, phone_number: str, message: str) -> bool:
        """
        Send SMS via Twilio (free trial credits)
        """
        try:
            if not hasattr(settings, 'TWILIO_ACCOUNT_SID'):
                return False

            client = TwilioClient(
                settings.TWILIO_ACCOUNT_SID,
                settings.TWILIO_AUTH_TOKEN
            )

            message = client.messages.create(
                body=message,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=phone_number
            )

            return message.status in ['queued', 'sent', 'delivered']

        except TwilioException as e:
            logger.error(f"Twilio SMS failed: {e}")
            return False
        except Exception as e:
            logger.error(f"Twilio SMS error: {e}")
            return False

    async def _send_via_textbelt(self, phone_number: str, message: str) -> bool:
        """
        Send SMS via TextBelt (1 free per day per IP)
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    'https://textbelt.com/text',
                    data={
                        'phone': phone_number,
                        'message': message,
                        'key': 'textbelt'  # Free tier key
                    },
                    timeout=10.0
                )

                if response.status_code == 200:
                    result = response.json()
                    return result.get('success', False)

                return False

        except Exception as e:
            logger.error(f"TextBelt SMS failed: {e}")
            return False

    async def _send_via_fallback_email(self, phone_number: str, message: str) -> bool:
        """
        Fallback: Send code via email if user provided email during registration
        This is a last resort when SMS fails
        """
        try:
            # This would require looking up user's email from phone number
            # For now, we'll skip this implementation as it requires DB access
            logger.info("Fallback email not implemented yet")
            return False

        except Exception as e:
            logger.error(f"Fallback email failed: {e}")
            return False

    def _validate_phone_number(self, phone_number: str) -> bool:
        """
        Validate phone number format
        """
        try:
            parsed_number = phonenumbers.parse(phone_number, "US")
            return phonenumbers.is_valid_number(parsed_number)
        except:
            return False

    def get_phone_info(self, phone_number: str) -> Dict[str, str]:
        """
        Get information about phone number (carrier, location)
        Useful for choosing the right SMS gateway
        """
        try:
            parsed_number = phonenumbers.parse(phone_number, "US")

            if phonenumbers.is_valid_number(parsed_number):
                carrier_name = carrier.name_for_number(parsed_number, "en")
                location = geocoder.description_for_number(parsed_number, "en")

                return {
                    'carrier': carrier_name,
                    'location': location,
                    'country_code': str(parsed_number.country_code),
                    'is_valid': True
                }
        except Exception as e:
            logger.error(f"Failed to get phone info: {e}")

        return {
            'carrier': 'Unknown',
            'location': 'Unknown',
            'country_code': 'Unknown',
            'is_valid': False
        }

class SMSTemplateService:
    """
    SMS message templates optimized for 160 character limit
    """

    @staticmethod
    def format_verification_code(code: str, app_name: str = "PortfolioRisk") -> str:
        """
        Format verification code for SMS (under 160 chars)
        """
        return f"{app_name}: Your verification code is {code}. Expires in 5 min. Don't share this code with anyone."

    @staticmethod
    def format_login_code(code: str, app_name: str = "PortfolioRisk") -> str:
        """
        Format login code for SMS
        """
        return f"{app_name}: Your login code is {code}. If you didn't request this, secure your account immediately."

    @staticmethod
    def format_password_reset_code(code: str, app_name: str = "PortfolioRisk") -> str:
        """
        Format password reset code for SMS
        """
        return f"{app_name}: Password reset code: {code}. Expires in 15 min. If you didn't request this, ignore this message."

    @staticmethod
    def format_security_alert(app_name: str = "PortfolioRisk") -> str:
        """
        Format security alert SMS
        """
        return f"{app_name}: Suspicious login attempt detected. If this wasn't you, secure your account now."

# Singleton instances
sms_service = SMSService()
sms_template_service = SMSTemplateService()