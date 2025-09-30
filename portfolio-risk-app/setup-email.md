# 📧 Email Setup Instructions

## Step 1: Get Gmail App Password

1. **Go to Google Account Security**: https://myaccount.google.com/security
2. **Enable 2-Factor Authentication** (if not already enabled):
   - Click "2-Step Verification" → "Get Started"
   - Follow the setup process
3. **Generate App Password**:
   - Go back to Security → "2-Step Verification"
   - Scroll down to "App passwords"
   - Click "Select app" → "Mail"
   - Click "Select device" → "Other (Custom name)"
   - Type: "Portfolio Risk App"
   - Click "Generate"
   - **Copy the 16-character password** (like: `abcd efgh ijkl mnop`)

## Step 2: Configure Environment

1. **Edit the `.env` file** in the project root
2. **Replace these values**:
   ```bash
   SMTP_USER=praxthaq@gmail.com
   SMTP_PASSWORD=your-16-character-app-password
   EMAIL_FROM=praxthaq@gmail.com
   ENVIRONMENT=production
   ```

## Step 3: Restart Services

```bash
cd /Users/pratikshrestha/CSC\ 475/portfolio-risk-app
docker-compose down
docker-compose up -d
```

## Step 4: Test Email

```bash
# Test registration to trigger email
curl -X POST http://localhost:8001/api/v1/auth/register-step1 \
  -H "Content-Type: application/json" \
  -d '{
    "username": "emailtest",
    "email": "praxthaq@gmail.com",
    "full_name": "Email Test",
    "phone_number": "2125551234",
    "password": "TestPassword123"
  }'
```

## Troubleshooting

- **"Authentication failed"**: Double-check your App Password
- **"Less secure app access"**: Use App Password, not regular password
- **Still not working**: Check Gmail security settings

## Security Notes

- Never commit real passwords to git
- Use App Passwords, not your regular Gmail password
- The `.env` file is gitignored for security