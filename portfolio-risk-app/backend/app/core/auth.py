from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
import logging
from datetime import datetime
from enum import Enum

from app.core.database import get_db
from app.core.security import decode_access_token, TokenData
from app.models.user import User
from app.models.auth import AuthAttempt, UserAuthMethod
from app.core.config import settings

logger = logging.getLogger(__name__)

class AuthLevel(str, Enum):
    """Authentication levels for different endpoint requirements"""
    NONE = "none"                    # No authentication required
    BASIC = "basic"                  # Basic authentication (valid token)
    VERIFIED = "verified"            # User must be verified (email + phone)
    TWO_FACTOR = "two_factor"        # Must have 2FA enabled
    ADMIN = "admin"                  # Admin privileges required

class SecurityContext:
    """Security context for the current request"""

    def __init__(
        self,
        user: Optional[User] = None,
        token_data: Optional[TokenData] = None,
        ip_address: str = "unknown",
        user_agent: str = "unknown",
        request_id: str = "unknown"
    ):
        self.user = user
        self.token_data = token_data
        self.ip_address = ip_address
        self.user_agent = user_agent
        self.request_id = request_id
        self.authenticated = user is not None
        self.auth_level = self._determine_auth_level()

    def _determine_auth_level(self) -> AuthLevel:
        """Determine the authentication level based on user status"""
        if not self.user:
            return AuthLevel.NONE

        if not self.user.is_active:
            return AuthLevel.NONE

        if not (self.user.is_email_verified and self.user.is_phone_verified):
            return AuthLevel.BASIC

        if not self.user.two_factor_enabled:
            return AuthLevel.VERIFIED

        return AuthLevel.TWO_FACTOR

    def require_auth_level(self, required_level: AuthLevel):
        """Ensure user meets required authentication level"""
        level_hierarchy = {
            AuthLevel.NONE: 0,
            AuthLevel.BASIC: 1,
            AuthLevel.VERIFIED: 2,
            AuthLevel.TWO_FACTOR: 3,
            AuthLevel.ADMIN: 4
        }

        current_level_value = level_hierarchy.get(self.auth_level, 0)
        required_level_value = level_hierarchy.get(required_level, 0)

        if current_level_value < required_level_value:
            if not self.user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            elif not self.user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Account is not active"
                )
            elif required_level == AuthLevel.VERIFIED and not (self.user.is_email_verified and self.user.is_phone_verified):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Email and phone verification required"
                )
            elif required_level == AuthLevel.TWO_FACTOR and not self.user.two_factor_enabled:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Two-factor authentication required"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Insufficient permissions"
                )

class EnhancedHTTPBearer(HTTPBearer):
    """Enhanced HTTP Bearer authentication with better error handling"""

    def __init__(self, auto_error: bool = True):
        super().__init__(auto_error=auto_error)

    async def __call__(self, request: Request) -> Optional[HTTPAuthorizationCredentials]:
        try:
            return await super().__call__(request)
        except HTTPException as e:
            if e.status_code == status.HTTP_403_FORBIDDEN:
                # Convert 403 to 401 for missing/invalid tokens
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            raise

class AuthenticationService:
    """Enhanced authentication service with comprehensive security features"""

    def __init__(self):
        self.security = EnhancedHTTPBearer(auto_error=False)

    def get_client_info(self, request: Request) -> Dict[str, str]:
        """Extract client information from request"""
        # Get IP address (handle proxies)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            ip_address = forwarded.split(",")[0].strip()
        else:
            ip_address = getattr(request.client, 'host', 'unknown')

        # Get user agent
        user_agent = request.headers.get("User-Agent", "unknown")

        # Generate request ID
        request_id = getattr(request.state, 'request_id', 'unknown')

        return {
            "ip_address": ip_address,
            "user_agent": user_agent,
            "request_id": request_id
        }

    async def get_current_user_optional(
        self,
        request: Request,
        db: Session = Depends(get_db),
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(lambda req: EnhancedHTTPBearer(auto_error=False)(req))
    ) -> SecurityContext:
        """Get current user without requiring authentication"""
        client_info = self.get_client_info(request)

        if not credentials:
            return SecurityContext(**client_info)

        try:
            # Decode token
            token_data = decode_access_token(credentials.credentials)
            if not token_data or not token_data.sub:
                return SecurityContext(**client_info)

            # Get user
            user = db.query(User).filter(User.id == int(token_data.sub)).first()
            if not user:
                logger.warning(f"Token valid but user {token_data.sub} not found")
                return SecurityContext(**client_info)

            # Update last activity
            user.last_activity = datetime.utcnow()
            db.commit()

            return SecurityContext(
                user=user,
                token_data=token_data,
                **client_info
            )

        except Exception as e:
            logger.warning(f"Token validation failed: {e}")
            return SecurityContext(**client_info)

    async def get_current_user(
        self,
        request: Request,
        db: Session = Depends(get_db),
        credentials: HTTPAuthorizationCredentials = Depends(EnhancedHTTPBearer())
    ) -> SecurityContext:
        """Get current authenticated user (required)"""
        client_info = self.get_client_info(request)

        try:
            # Decode token
            token_data = decode_access_token(credentials.credentials)
            if not token_data or not token_data.sub:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication token",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            # Get user
            user = db.query(User).filter(User.id == int(token_data.sub)).first()
            if not user:
                logger.warning(f"Token valid but user {token_data.sub} not found")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            # Check if user is active
            if not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Account is not active"
                )

            # Update last activity
            user.last_activity = datetime.utcnow()
            db.commit()

            # Log successful authentication
            self._log_auth_event(db, user.id, "token_validated", True, client_info["ip_address"])

            return SecurityContext(
                user=user,
                token_data=token_data,
                **client_info
            )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Authentication failed: {e}")
            # Log failed authentication attempt
            self._log_auth_event(db, None, "token_validation_error", False, client_info["ip_address"], str(e))
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication failed",
                headers={"WWW-Authenticate": "Bearer"},
            )

    def _log_auth_event(
        self,
        db: Session,
        user_id: Optional[int],
        action: str,
        success: bool,
        ip_address: str,
        details: str = ""
    ):
        """Log authentication event for security monitoring"""
        try:
            auth_attempt = AuthAttempt(
                user_id=user_id,
                ip_address=ip_address,
                action=action,
                success=success,
                details=details,
                timestamp=datetime.utcnow()
            )
            db.add(auth_attempt)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to log auth event: {e}")
            db.rollback()

# Singleton authentication service
auth_service = AuthenticationService()

# Dependency functions for different authentication levels
async def get_current_user_optional(
    request: Request,
    db: Session = Depends(get_db)
) -> SecurityContext:
    """Optional authentication - user may or may not be logged in"""
    return await auth_service.get_current_user_optional(request, db)

async def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> SecurityContext:
    """Required authentication - user must be logged in"""
    return await auth_service.get_current_user(request, db)

async def get_verified_user(
    request: Request,
    db: Session = Depends(get_db)
) -> SecurityContext:
    """Verified user - must have completed email and phone verification"""
    context = await auth_service.get_current_user(request, db)
    context.require_auth_level(AuthLevel.VERIFIED)
    return context

async def get_2fa_user(
    request: Request,
    db: Session = Depends(get_db)
) -> SecurityContext:
    """2FA user - must have two-factor authentication enabled"""
    context = await auth_service.get_current_user(request, db)
    context.require_auth_level(AuthLevel.TWO_FACTOR)
    return context

async def get_admin_user(
    request: Request,
    db: Session = Depends(get_db)
) -> SecurityContext:
    """Admin user - must have admin privileges"""
    context = await auth_service.get_current_user(request, db)

    # Check if user is admin (you can customize this logic)
    if not context.user or not getattr(context.user, 'is_superuser', False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )

    return context

# Legacy compatibility functions (return User directly for existing code)
async def get_current_user_legacy(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    """Legacy function that returns User directly"""
    context = await get_current_user(request, db)
    return context.user

async def get_verified_user_legacy(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    """Legacy function for verified users"""
    context = await get_verified_user(request, db)
    return context.user

async def get_2fa_user_legacy(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    """Legacy function for 2FA users"""
    context = await get_2fa_user(request, db)
    return context.user