from datetime import datetime, timedelta
from typing import Optional, NamedTuple
import logging
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.auth import RateLimitEntry
from app.core.config import settings

logger = logging.getLogger(__name__)

class RateLimitResult(NamedTuple):
    allowed: bool
    retry_after: int = 0

class RateLimiterService:
    """
    Database-backed rate limiting service for authentication endpoints
    Provides sliding window rate limiting with automatic cleanup
    """

    def __init__(self):
        self.cleanup_interval_minutes = 60  # Cleanup old entries every hour

    def check_rate_limit(
        self,
        db: Session,
        key: str,
        identifier: str,
        limit: int,
        window_minutes: int
    ) -> RateLimitResult:
        """
        Check if the request is within rate limits

        Args:
            db: Database session
            key: Rate limit key (e.g., 'login', 'registration', 'otp_email')
            identifier: Client identifier (IP address, user ID, etc.)
            limit: Maximum number of requests allowed
            window_minutes: Time window in minutes

        Returns:
            RateLimitResult with allowed status and retry_after seconds
        """
        try:
            now = datetime.utcnow()
            window_start = now - timedelta(minutes=window_minutes)

            # Count existing entries within the time window
            count = (
                db.query(RateLimitEntry)
                .filter(
                    and_(
                        RateLimitEntry.key == key,
                        RateLimitEntry.identifier == identifier,
                        RateLimitEntry.timestamp >= window_start
                    )
                )
                .count()
            )

            if count >= limit:
                # Rate limit exceeded - find the oldest entry to calculate retry time
                oldest_entry = (
                    db.query(RateLimitEntry)
                    .filter(
                        and_(
                            RateLimitEntry.key == key,
                            RateLimitEntry.identifier == identifier,
                            RateLimitEntry.timestamp >= window_start
                        )
                    )
                    .order_by(RateLimitEntry.timestamp.asc())
                    .first()
                )

                if oldest_entry:
                    # Calculate when the oldest entry will expire
                    retry_time = oldest_entry.timestamp + timedelta(minutes=window_minutes)
                    retry_after = max(0, int((retry_time - now).total_seconds()))
                else:
                    retry_after = window_minutes * 60  # Default to full window

                logger.warning(f"Rate limit exceeded for {key}:{identifier} ({count}/{limit})")
                return RateLimitResult(allowed=False, retry_after=retry_after)

            # Rate limit check passed - record this request
            rate_entry = RateLimitEntry(
                key=key,
                identifier=identifier,
                timestamp=now
            )

            db.add(rate_entry)
            db.commit()

            # Optionally clean up old entries
            self._cleanup_old_entries(db, now)

            return RateLimitResult(allowed=True, retry_after=0)

        except Exception as e:
            logger.error(f"Rate limit check failed: {e}")
            db.rollback()
            # On error, allow the request but log the issue
            return RateLimitResult(allowed=True, retry_after=0)

    def reset_rate_limit(
        self,
        db: Session,
        key: str,
        identifier: str
    ) -> bool:
        """
        Reset rate limit for a specific key and identifier
        Useful for admin operations or successful authentication
        """
        try:
            deleted_count = (
                db.query(RateLimitEntry)
                .filter(
                    and_(
                        RateLimitEntry.key == key,
                        RateLimitEntry.identifier == identifier
                    )
                )
                .delete()
            )

            db.commit()
            logger.info(f"Reset rate limit for {key}:{identifier} ({deleted_count} entries removed)")
            return True

        except Exception as e:
            logger.error(f"Failed to reset rate limit: {e}")
            db.rollback()
            return False

    def get_rate_limit_status(
        self,
        db: Session,
        key: str,
        identifier: str,
        window_minutes: int
    ) -> dict:
        """
        Get current rate limit status without incrementing
        """
        try:
            now = datetime.utcnow()
            window_start = now - timedelta(minutes=window_minutes)

            entries = (
                db.query(RateLimitEntry)
                .filter(
                    and_(
                        RateLimitEntry.key == key,
                        RateLimitEntry.identifier == identifier,
                        RateLimitEntry.timestamp >= window_start
                    )
                )
                .order_by(RateLimitEntry.timestamp.desc())
                .all()
            )

            count = len(entries)
            last_request = entries[0].timestamp if entries else None

            return {
                "key": key,
                "identifier": identifier,
                "current_count": count,
                "window_minutes": window_minutes,
                "last_request": last_request,
                "window_start": window_start
            }

        except Exception as e:
            logger.error(f"Failed to get rate limit status: {e}")
            return {
                "key": key,
                "identifier": identifier,
                "current_count": 0,
                "window_minutes": window_minutes,
                "last_request": None,
                "window_start": None,
                "error": str(e)
            }

    def _cleanup_old_entries(self, db: Session, current_time: datetime):
        """
        Clean up rate limit entries older than the maximum window
        This is called periodically to prevent the table from growing indefinitely
        """
        try:
            # Only clean up occasionally to avoid overhead
            if current_time.minute % self.cleanup_interval_minutes != 0:
                return

            # Clean up entries older than the longest possible window (24 hours for daily limits)
            cleanup_threshold = current_time - timedelta(hours=25)

            deleted_count = (
                db.query(RateLimitEntry)
                .filter(RateLimitEntry.timestamp < cleanup_threshold)
                .delete()
            )

            if deleted_count > 0:
                db.commit()
                logger.info(f"Cleaned up {deleted_count} old rate limit entries")

        except Exception as e:
            logger.error(f"Rate limit cleanup failed: {e}")
            db.rollback()

    def get_rate_limit_config(self) -> dict:
        """
        Get current rate limiting configuration
        """
        return {
            "login_per_hour": settings.RATE_LIMIT_LOGIN_PER_HOUR,
            "otp_email_per_hour": settings.RATE_LIMIT_OTP_EMAIL_PER_HOUR,
            "otp_sms_per_hour": settings.RATE_LIMIT_OTP_SMS_PER_HOUR,
            "registration_per_day": settings.RATE_LIMIT_REGISTRATION_PER_DAY,
            "max_otp_attempts": settings.MAX_OTP_ATTEMPTS,
            "otp_expiry_minutes": settings.OTP_EXPIRY_MINUTES
        }

class AdvancedRateLimiter:
    """
    Advanced rate limiter with multiple sliding windows and burst protection
    """

    def __init__(self):
        self.base_limiter = RateLimiterService()

    def check_multi_window_limit(
        self,
        db: Session,
        key: str,
        identifier: str,
        limits: list[tuple[int, int]]  # [(limit, window_minutes), ...]
    ) -> RateLimitResult:
        """
        Check against multiple rate limit windows
        Example: [(5, 1), (20, 60)] = max 5 per minute, 20 per hour
        """
        for limit, window_minutes in limits:
            result = self.base_limiter.check_rate_limit(
                db, f"{key}_{window_minutes}m", identifier, limit, window_minutes
            )
            if not result.allowed:
                return result

        return RateLimitResult(allowed=True, retry_after=0)

    def check_burst_protection(
        self,
        db: Session,
        key: str,
        identifier: str,
        burst_limit: int = 3,
        burst_window_seconds: int = 10
    ) -> RateLimitResult:
        """
        Check for burst protection (very short time windows)
        """
        burst_window_minutes = max(1, burst_window_seconds // 60)
        return self.base_limiter.check_rate_limit(
            db, f"{key}_burst", identifier, burst_limit, burst_window_minutes
        )

    def check_progressive_delay(
        self,
        db: Session,
        key: str,
        identifier: str,
        base_window_minutes: int = 5
    ) -> RateLimitResult:
        """
        Implement progressive delay based on failure count
        Each failure increases the delay exponentially
        """
        now = datetime.utcnow()

        # Count recent failures
        failure_count = (
            db.query(RateLimitEntry)
            .filter(
                and_(
                    RateLimitEntry.key == f"{key}_failure",
                    RateLimitEntry.identifier == identifier,
                    RateLimitEntry.timestamp >= now - timedelta(hours=1)
                )
            )
            .count()
        )

        if failure_count == 0:
            return RateLimitResult(allowed=True, retry_after=0)

        # Progressive delay: 1min, 2min, 4min, 8min, max 30min
        delay_minutes = min(30, base_window_minutes * (2 ** (failure_count - 1)))

        last_failure = (
            db.query(RateLimitEntry)
            .filter(
                and_(
                    RateLimitEntry.key == f"{key}_failure",
                    RateLimitEntry.identifier == identifier
                )
            )
            .order_by(RateLimitEntry.timestamp.desc())
            .first()
        )

        if last_failure:
            time_since_failure = now - last_failure.timestamp
            if time_since_failure < timedelta(minutes=delay_minutes):
                retry_after = int((timedelta(minutes=delay_minutes) - time_since_failure).total_seconds())
                return RateLimitResult(allowed=False, retry_after=retry_after)

        return RateLimitResult(allowed=True, retry_after=0)

    def record_failure(
        self,
        db: Session,
        key: str,
        identifier: str
    ):
        """
        Record a failure for progressive delay calculation
        """
        try:
            failure_entry = RateLimitEntry(
                key=f"{key}_failure",
                identifier=identifier,
                timestamp=datetime.utcnow()
            )
            db.add(failure_entry)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to record failure: {e}")
            db.rollback()

# Singleton instances
rate_limiter = RateLimiterService()
advanced_rate_limiter = AdvancedRateLimiter()