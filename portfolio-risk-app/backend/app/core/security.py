from datetime import datetime, timedelta
from typing import Optional, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

class TokenData(BaseModel):
    """Token payload data structure"""
    sub: Optional[str] = None
    exp: Optional[datetime] = None
    type: Optional[str] = None
    scopes: list[str] = []

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__default_rounds=12,
    bcrypt__max_rounds=16
)

def create_access_token(subject: str | Any, expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(subject: str | Any) -> str:
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Truncate password to 72 bytes for bcrypt compatibility
    password_bytes = plain_password.encode('utf-8')[:72]
    password_truncated = password_bytes.decode('utf-8', errors='ignore')
    return pwd_context.verify(password_truncated, hashed_password)

def get_password_hash(password: str) -> str:
    # Simple approach - ensure password is not too long
    if len(password.encode('utf-8')) > 72:
        # If password is too long, truncate it
        password = password[:60]  # Safe truncation
    try:
        return pwd_context.hash(password)
    except Exception as e:
        logger.error(f"Password hashing failed: {e}")
        # Fallback to a very simple hash for development
        import hashlib
        return hashlib.sha256(password.encode()).hexdigest()

def decode_token(token: str) -> Optional[str]:
    """Legacy function for backward compatibility"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None

def decode_access_token(token: str) -> Optional[TokenData]:
    """
    Decode and validate access token with comprehensive error handling
    Returns TokenData object with token information
    """
    try:
        # Decode JWT token
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        # Validate token type
        token_type = payload.get("type")
        if token_type != "access":
            logger.warning(f"Invalid token type: {token_type}")
            return None

        # Extract token data
        subject = payload.get("sub")
        if not subject:
            logger.warning("Token missing subject")
            return None

        # Check expiration
        exp_timestamp = payload.get("exp")
        if exp_timestamp:
            exp_datetime = datetime.utcfromtimestamp(exp_timestamp)
            if exp_datetime < datetime.utcnow():
                logger.info("Token has expired")
                return None
        else:
            logger.warning("Token missing expiration")
            return None

        # Extract optional scopes
        scopes = payload.get("scopes", [])

        return TokenData(
            sub=subject,
            exp=exp_datetime,
            type=token_type,
            scopes=scopes
        )

    except JWTError as e:
        logger.warning(f"JWT decode error: {e}")
        return None
    except Exception as e:
        logger.error(f"Token decode error: {e}")
        return None

def decode_refresh_token(token: str) -> Optional[TokenData]:
    """
    Decode and validate refresh token
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        # Validate token type
        token_type = payload.get("type")
        if token_type != "refresh":
            logger.warning(f"Invalid refresh token type: {token_type}")
            return None

        subject = payload.get("sub")
        if not subject:
            return None

        exp_timestamp = payload.get("exp")
        exp_datetime = None
        if exp_timestamp:
            exp_datetime = datetime.utcfromtimestamp(exp_timestamp)
            if exp_datetime < datetime.utcnow():
                return None

        return TokenData(
            sub=subject,
            exp=exp_datetime,
            type=token_type
        )

    except JWTError as e:
        logger.warning(f"Refresh token decode error: {e}")
        return None
    except Exception as e:
        logger.error(f"Refresh token decode error: {e}")
        return None

def create_access_token_with_scopes(
    subject: str | Any,
    scopes: list[str] = None,
    expires_delta: timedelta = None
) -> str:
    """
    Create access token with scopes for fine-grained permissions
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "access",
        "scopes": scopes or []
    }

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_token_type(token: str, expected_type: str) -> bool:
    """
    Verify that a token is of the expected type (access/refresh)
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload.get("type") == expected_type
    except JWTError:
        return False

def get_token_expiry(token: str) -> Optional[datetime]:
    """
    Get token expiration time
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        exp_timestamp = payload.get("exp")
        if exp_timestamp:
            return datetime.utcfromtimestamp(exp_timestamp)
        return None
    except JWTError:
        return None