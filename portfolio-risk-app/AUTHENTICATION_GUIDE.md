# Authentication System Guide

## Overview

The authentication system has been fixed and is now working in **development mode**. Since SMTP credentials are not configured, verification codes are logged to the backend console instead of being sent via email.

## How to Register & Login

### 1. Register a New Account

1. Navigate to http://localhost:3000/register
2. Fill in all required fields:
   - Username (minimum 3 characters)
   - Email address
   - Full name
   - Phone number (minimum 10 digits)
   - Password (minimum 8 characters)
   - Confirm password

3. Click "Create Account"

### 2. Find Your Verification Code

Since we're in development mode, verification codes are **logged to the backend console** instead of being sent via email.

**To view the verification code:**

```bash
# Watch backend logs in real-time
docker logs -f portfolio-backend
```

Look for output like this:

```
╔═══════════════════════════════════════════════════════════════╗
║              📧 DEVELOPMENT MODE - EMAIL LOG                  ║
╠═══════════════════════════════════════════════════════════════╣
║ To: your.email@example.com                                    ║
║ Subject: Verify Your Email                                    ║
║                                                               ║
║ 🔑 VERIFICATION CODE: 123456                                  ║
╚═══════════════════════════════════════════════════════════════╝

⚡ VERIFICATION CODE for your.email@example.com: 123456
```

### 3. Complete Verification

The system requires multi-step verification:
- ✅ Email verification (6-digit code)
- ✅ Phone verification (6-digit code)
- ✅ 2FA setup (TOTP)

Each verification code will appear in the backend logs.

### 4. Login

After completing registration and verification:

1. Navigate to http://localhost:3000/login
2. Enter your username and password
3. If 2FA is enabled, enter the code when prompted
4. You'll be redirected to the dashboard

## Quick Development Bypass (Optional)

If you want to skip email/phone verification for faster development, you can modify the config:

```python
# backend/app/core/config.py

REQUIRE_EMAIL_VERIFICATION: bool = False  # Set to False
REQUIRE_PHONE_VERIFICATION: bool = False  # Set to False
REQUIRE_2FA_SETUP: bool = False  # Set to False
```

## API Endpoints

### Registration
```
POST /api/v1/auth/register-step1
Body: {
  "username": "string",
  "email": "string",
  "full_name": "string",
  "phone_number": "string",
  "password": "string"
}
```

### Email Verification
```
POST /api/v1/auth/verify-email
Body: {
  "user_id": int,
  "code": "string"
}
```

### Login
```
POST /api/v1/auth/login
Body: {
  "username": "string",
  "password": "string"
}
```

## Troubleshooting

### Issue: Not receiving verification codes
- **Solution**: Check backend logs using `docker logs -f portfolio-backend`
- Codes are logged to console in development mode

### Issue: "Failed to log auth attempt" error
- **Solution**: Already fixed! The AuthAttempt model field mapping has been corrected.

### Issue: Cannot login
- **Solution**: Make sure you've completed all verification steps
- Check backend logs for detailed error messages

### Issue: Want to test quickly
- **Solution**: Disable verification requirements in config.py (see Quick Development Bypass above)

## Features

✅ Secure password hashing (bcrypt)
✅ JWT access & refresh tokens
✅ Multi-factor authentication (2FA)
✅ Rate limiting for security
✅ Email verification (dev mode logs to console)
✅ Phone verification (dev mode logs to console)
✅ Account lockout after failed attempts
✅ Comprehensive auth attempt logging

## Next Steps

1. Try registering a new account at http://localhost:3000/register
2. Watch the backend logs to get your verification code
3. Complete the verification process
4. Login and navigate to `/assessment` to start the risk questionnaire!

## Production Setup

For production, configure these environment variables:

```bash
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@your-domain.com

# SMS Configuration (optional)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=your-number
```
