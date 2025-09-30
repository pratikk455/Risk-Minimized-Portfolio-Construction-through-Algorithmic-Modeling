from datetime import datetime, timedelta
from typing import NamedTuple
import logging
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

class RateLimitResult(NamedTuple):
    allowed: bool
    retry_after: int = 0

class SimpleRateLimiter:
    """
    Simple in-memory rate limiter for development
    For production, use Redis-based rate limiting
    """

    def __init__(self):
        self._counters = {}  # Simple in-memory storage

    def check_rate_limit(
        self,
        db: Session,
        key: str,
        identifier: str,
        limit: int,
        window_minutes: int
    ) -> RateLimitResult:
        """Simple rate limiting check"""
        try:
            now = datetime.utcnow()
            limit_key = f"{key}:{identifier}"

            # Clean old entries
            if limit_key in self._counters:
                self._counters[limit_key] = [
                    timestamp for timestamp in self._counters[limit_key]
                    if timestamp > now - timedelta(minutes=window_minutes)
                ]
            else:
                self._counters[limit_key] = []

            # Check if limit exceeded
            if len(self._counters[limit_key]) >= limit:
                # Calculate retry time
                oldest_time = min(self._counters[limit_key])
                retry_time = oldest_time + timedelta(minutes=window_minutes)
                retry_after = max(0, int((retry_time - now).total_seconds()))
                return RateLimitResult(allowed=False, retry_after=retry_after)

            # Add current request
            self._counters[limit_key].append(now)
            return RateLimitResult(allowed=True, retry_after=0)

        except Exception as e:
            logger.error(f"Rate limit check failed: {e}")
            # On error, allow the request
            return RateLimitResult(allowed=True, retry_after=0)

    def reset_rate_limit(self, db: Session, key: str, identifier: str) -> bool:
        """Reset rate limit for a key"""
        try:
            limit_key = f"{key}:{identifier}"
            if limit_key in self._counters:
                del self._counters[limit_key]
            return True
        except Exception as e:
            logger.error(f"Failed to reset rate limit: {e}")
            return False

# Use simple rate limiter for now
rate_limiter = SimpleRateLimiter()