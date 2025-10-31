import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Template
from premailer import transform
from typing import Optional
import logging
from datetime import datetime, timedelta
import asyncio
import aiosmtplib

from app.core.config import settings

logger = logging.getLogger(__name__)

class EmailService:
    """
    Scalable email service supporting multiple providers
    Free tier: Gmail SMTP
    Production: AWS SES, SendGrid, etc.
    """

    def __init__(self):
        self.smtp_server = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_username = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.EMAIL_FROM
        self.is_development = settings.ENVIRONMENT == "development"

    async def send_email_async(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        Send email asynchronously for better performance
        """
        try:
            # Check if we should use development mode (log emails instead of sending)
            use_development_mode = (
                self.is_development or
                not self.smtp_username or
                not self.smtp_password or
                self.smtp_username == "" or
                self.smtp_password == ""
            )

            if use_development_mode:
                if not text_content:
                    text_content = self._html_to_text(html_content)

                # Extract verification code from content if present
                import re
                code_match = re.search(r'\b\d{6}\b', text_content)
                verification_code = code_match.group(0) if code_match else "N/A"

                logger.warning(f"""
╔═══════════════════════════════════════════════════════════════╗
║              📧 DEVELOPMENT MODE - EMAIL LOG                  ║
╠═══════════════════════════════════════════════════════════════╣
║ To: {to_email:<56} ║
║ Subject: {subject:<53} ║
║                                                               ║
║ 🔑 VERIFICATION CODE: {verification_code:<40} ║
║                                                               ║
║ Full Content:                                                 ║
║ {text_content[:100]:<61} ║
╚═══════════════════════════════════════════════════════════════╝
                """)

                # Also print to console for visibility
                print(f"\n⚡ VERIFICATION CODE for {to_email}: {verification_code}\n")

                return True

            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.from_email
            message["To"] = to_email

            # Create text part if not provided
            if not text_content:
                text_content = self._html_to_text(html_content)

            # Add both text and HTML parts
            text_part = MIMEText(text_content, "plain")
            html_part = MIMEText(html_content, "html")

            message.attach(text_part)
            message.attach(html_part)

            # Send via async SMTP
            await aiosmtplib.send(
                message,
                hostname=self.smtp_server,
                port=self.smtp_port,
                username=self.smtp_username,
                password=self.smtp_password,
                use_tls=True
            )

            logger.info(f"Email sent successfully to {to_email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False

    def send_email_sync(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        Synchronous email sending (fallback)
        """
        try:
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.from_email
            message["To"] = to_email

            if not text_content:
                text_content = self._html_to_text(html_content)

            text_part = MIMEText(text_content, "plain")
            html_part = MIMEText(html_content, "html")

            message.attach(text_part)
            message.attach(html_part)

            # Create secure SSL context
            context = ssl.create_default_context()

            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(message)

            logger.info(f"Email sent successfully to {to_email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False

    def _html_to_text(self, html_content: str) -> str:
        """
        Convert HTML to plain text (simple fallback)
        """
        import re
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '', html_content)
        # Clean up whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        return text

class EmailTemplateService:
    """
    Beautiful HTML email templates for authentication
    """

    def __init__(self):
        self.base_template = self._get_base_template()

    def render_verification_email(
        self,
        user_name: str,
        verification_code: str,
        expires_in_minutes: int = 5
    ) -> tuple[str, str]:
        """
        Render email verification template
        Returns: (html_content, subject)
        """
        template_vars = {
            'user_name': user_name,
            'verification_code': verification_code,
            'expires_in_minutes': expires_in_minutes,
            'app_name': 'PortfolioRisk',
            'support_email': settings.EMAIL_FROM,
            'current_year': datetime.now().year
        }

        html_content = self._render_template(
            self._get_verification_template(),
            template_vars
        )

        subject = f"Verify your PortfolioRisk account - Code: {verification_code}"

        return self._optimize_html(html_content), subject

    def render_login_otp_email(
        self,
        user_name: str,
        otp_code: str,
        ip_address: str,
        location: str = "Unknown location"
    ) -> tuple[str, str]:
        """
        Render login OTP email template
        """
        template_vars = {
            'user_name': user_name,
            'otp_code': otp_code,
            'ip_address': ip_address,
            'location': location,
            'app_name': 'PortfolioRisk',
            'support_email': settings.EMAIL_FROM,
            'current_year': datetime.now().year,
            'timestamp': datetime.now().strftime('%B %d, %Y at %I:%M %p')
        }

        html_content = self._render_template(
            self._get_login_otp_template(),
            template_vars
        )

        subject = f"Your PortfolioRisk login code: {otp_code}"

        return self._optimize_html(html_content), subject

    def render_password_reset_email(
        self,
        user_name: str,
        reset_code: str,
        expires_in_minutes: int = 15
    ) -> tuple[str, str]:
        """
        Render password reset email template
        """
        template_vars = {
            'user_name': user_name,
            'reset_code': reset_code,
            'expires_in_minutes': expires_in_minutes,
            'app_name': 'PortfolioRisk',
            'support_email': settings.EMAIL_FROM,
            'current_year': datetime.now().year
        }

        html_content = self._render_template(
            self._get_password_reset_template(),
            template_vars
        )

        subject = f"Reset your PortfolioRisk password - Code: {reset_code}"

        return self._optimize_html(html_content), subject

    def _render_template(self, template_str: str, variables: dict) -> str:
        """
        Render Jinja2 template with variables
        """
        template = Template(template_str)
        return template.render(**variables)

    def _optimize_html(self, html_content: str) -> str:
        """
        Optimize HTML for email clients using premailer
        """
        try:
            # Inline CSS and optimize for email clients
            return transform(html_content)
        except Exception as e:
            logger.warning(f"Failed to optimize HTML: {e}")
            return html_content

    def _get_base_template(self) -> str:
        """
        Base email template with modern design
        """
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{{ subject }}</title>
            <style>
                /* Modern email styles */
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
                    margin: 0;
                    padding: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 40px 20px;
                }
                .card {
                    background: #ffffff;
                    border-radius: 16px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                    overflow: hidden;
                }
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 40px 30px;
                    text-align: center;
                }
                .header h1 {
                    color: #ffffff;
                    margin: 0;
                    font-size: 28px;
                    font-weight: 700;
                }
                .content {
                    padding: 40px 30px;
                }
                .code-box {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: #ffffff;
                    text-align: center;
                    padding: 30px;
                    margin: 30px 0;
                    border-radius: 12px;
                    font-size: 32px;
                    font-weight: bold;
                    letter-spacing: 8px;
                    font-family: 'Courier New', monospace;
                }
                .button {
                    display: inline-block;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: #ffffff;
                    text-decoration: none;
                    padding: 16px 32px;
                    border-radius: 8px;
                    font-weight: 600;
                    margin: 20px 0;
                }
                .footer {
                    background: #f8fafc;
                    padding: 30px;
                    text-align: center;
                    color: #64748b;
                    font-size: 14px;
                    border-top: 1px solid #e2e8f0;
                }
                .security-info {
                    background: #fef3cd;
                    border: 1px solid #fbbf24;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                    color: #92400e;
                }
                .warning {
                    background: #fee2e2;
                    border: 1px solid #f87171;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                    color: #dc2626;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="card">
                    {{ content }}
                </div>
            </div>
        </body>
        </html>
        """

    def _get_verification_template(self) -> str:
        """
        Email verification template
        """
        return """
        <div class="header">
            <h1>🔐 {{ app_name }}</h1>
        </div>

        <div class="content">
            <h2>Welcome {{ user_name }}! 🎉</h2>

            <p>Thank you for joining PortfolioRisk! To complete your registration, please verify your email address using the code below:</p>

            <div class="code-box">
                {{ verification_code }}
            </div>

            <div class="security-info">
                <strong>⏱️ This code expires in {{ expires_in_minutes }} minutes</strong><br>
                If you didn't create an account, you can safely ignore this email.
            </div>

            <p>After verification, you'll be able to:</p>
            <ul>
                <li>✅ Complete your risk assessment</li>
                <li>📊 Get personalized portfolio recommendations</li>
                <li>🔍 Access advanced analytics</li>
                <li>📱 Set up two-factor authentication</li>
            </ul>

            <p>Need help? Reply to this email or contact our support team.</p>
        </div>

        <div class="footer">
            <p>© {{ current_year }} {{ app_name }}. All rights reserved.</p>
            <p>This email was sent to verify your account. If you need assistance, contact {{ support_email }}</p>
        </div>
        """

    def _get_login_otp_template(self) -> str:
        """
        Login OTP template
        """
        return """
        <div class="header">
            <h1>🔐 {{ app_name }}</h1>
        </div>

        <div class="content">
            <h2>Login Verification Code</h2>

            <p>Hi {{ user_name }},</p>

            <p>We received a login attempt for your account. Use the code below to complete your sign-in:</p>

            <div class="code-box">
                {{ otp_code }}
            </div>

            <div class="security-info">
                <strong>🕐 Login attempt details:</strong><br>
                <strong>Time:</strong> {{ timestamp }}<br>
                <strong>IP Address:</strong> {{ ip_address }}<br>
                <strong>Location:</strong> {{ location }}
            </div>

            <div class="warning">
                <strong>⚠️ Security Alert</strong><br>
                If this wasn't you, please secure your account immediately:
                <ul>
                    <li>Change your password</li>
                    <li>Review your account activity</li>
                    <li>Contact our support team</li>
                </ul>
            </div>

            <p>This code will expire in 5 minutes for your security.</p>
        </div>

        <div class="footer">
            <p>© {{ current_year }} {{ app_name }}. All rights reserved.</p>
            <p>For security questions, contact {{ support_email }}</p>
        </div>
        """

    def _get_password_reset_template(self) -> str:
        """
        Password reset template
        """
        return """
        <div class="header">
            <h1>🔐 {{ app_name }}</h1>
        </div>

        <div class="content">
            <h2>Password Reset Request</h2>

            <p>Hi {{ user_name }},</p>

            <p>We received a request to reset your password. Use the code below to set a new password:</p>

            <div class="code-box">
                {{ reset_code }}
            </div>

            <div class="security-info">
                <strong>⏱️ This code expires in {{ expires_in_minutes }} minutes</strong><br>
                For your security, this code can only be used once.
            </div>

            <div class="warning">
                <strong>⚠️ Didn't request a password reset?</strong><br>
                If you didn't request this, someone may be trying to access your account.
                Please contact our support team immediately.
            </div>

            <p>After resetting your password, we recommend:</p>
            <ul>
                <li>🔒 Using a strong, unique password</li>
                <li>📱 Enabling two-factor authentication</li>
                <li>🔍 Reviewing your account activity</li>
            </ul>
        </div>

        <div class="footer">
            <p>© {{ current_year }} {{ app_name }}. All rights reserved.</p>
            <p>Security questions? Contact {{ support_email }}</p>
        </div>
        """

# Singleton instances
email_service = EmailService()
email_template_service = EmailTemplateService()