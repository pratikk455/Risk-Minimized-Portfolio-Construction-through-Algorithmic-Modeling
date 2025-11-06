# Authentication Flow Documentation

## Overview

The Portfolio Risk App now includes a complete authentication system that requires users to create an account or login after completing the risk assessment to save their results and generate their personalized portfolio.

---

## User Journey

### 1. **Homepage** (`/`)
- User lands on homepage
- Can start risk assessment without being logged in
- Navigation shows "Login" and "Sign Up" buttons

### 2. **Risk Assessment** (`/assessment`)
- User completes 30-question risk assessment
- All answers stored in localStorage
- **On completion:**
  - If **logged in**: Redirects to `/results`
  - If **NOT logged in**: Redirects to `/auth-required`

### 3. **Authentication Required** (`/auth-required`)
- Shows completed risk profile
- Explains benefits of creating account:
  - Save assessment results
  - Generate optimized portfolio
  - Track portfolio over time
  - Retake assessments
- Two options:
  - **Create Account** → `/signup`
  - **Sign In** → `/login`

### 4A. **Sign Up** (`/signup`)
- User fills registration form:
  - Username (required, min 3 characters)
  - Full Name (required)
  - Email (required, valid format)
  - Phone Number (optional)
  - Password (required, min 8 characters)
  - Confirm Password (must match)
- On success:
  - Account created in database
  - User receives success message
  - Redirected to `/login` after 2 seconds

### 4B. **Login** (`/login`)
- User enters credentials:
  - Username or Email
  - Password
- On success:
  - Access token stored in localStorage
  - Checks for pending assessment
  - If pending: Redirects to `/results`
  - If not: Redirects to `/` (home)

### 5. **Results Page** (`/results`)
- Shows risk profile and score
- **Automatically saves assessment to backend** (if logged in)
- Displays recommendations
- "Generate My Portfolio" button
- On generate: Redirects to `/portfolio`

### 6. **Portfolio Page** (`/portfolio`)
- Displays personalized portfolio with 14 ETFs
- Shows donut chart, asset breakdown, metrics
- Portfolio data saved to backend (future implementation)
- User can logout or retake assessment

---

## Technical Implementation

### Frontend Routes

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/` | Homepage | No |
| `/assessment` | Risk assessment quiz | No |
| `/auth-required` | Prompt to login/signup | No (but shows after assessment) |
| `/signup` | User registration | No |
| `/login` | User authentication | No |
| `/results` | Assessment results | Yes (soft - can view, but won't save) |
| `/portfolio` | Portfolio dashboard | Yes (soft - shows empty state if not generated) |

### Authentication State Management

**Zustand Store** (`src/store/authStore.ts`):
```typescript
interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  login: (accessToken, refreshToken, userId) => void
  logout: () => void
  checkAuth: () => boolean
}
```

**LocalStorage Keys:**
- `access_token` - JWT access token
- `refresh_token` - JWT refresh token
- `user_id` - User ID
- `assessmentResults` - Assessment answers and risk score
- `pendingAssessment` - Flag indicating assessment needs to be saved
- `portfolioGenerated` - Flag indicating portfolio was generated

### Backend API Endpoints Used

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/v1/auth/register-step1` | POST | Create new user account | No |
| `/api/v1/auth/login` | POST | Authenticate user | No |
| `/api/assessment/submit` | POST | Save assessment answers | Yes |
| `/api/portfolio/generate` | POST | Generate optimized portfolio | Yes (future) |

### Components

**Navbar** (`src/components/Navbar.tsx`):
- Shows login/signup buttons when logged out
- Shows logout button when logged in
- Dynamically renders based on auth state
- Clears all data on logout

---

## Data Flow

### Assessment → Authentication → Results

```
1. User completes assessment
   ↓
2. Answers stored in localStorage
   {
     answers: { q1: 7, q2: 5, ... },
     riskScore: "6.5",
     riskProfile: "Moderate",
     completedAt: "2024-..."
   }
   ↓
3. Check if logged in (access_token exists?)
   ├─ YES → Redirect to /results
   └─ NO → Redirect to /auth-required
   ↓
4. User chooses Signup or Login
   ↓
5. After successful auth:
   - Tokens stored in localStorage
   - Redirect to /results
   ↓
6. Results page loads:
   - Reads assessment from localStorage
   - Calls backend API to save assessment
   - User can now generate portfolio
```

### Login Flow

```
POST /api/v1/auth/login
{
  "username": "user@email.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "user_id": 123,
  "requires_2fa": false
}

Frontend:
1. Store tokens in localStorage
2. Update Zustand store
3. Check for pendingAssessment flag
4. Redirect appropriately
```

### Signup Flow

```
POST /api/v1/auth/register-step1
{
  "username": "johndoe",
  "email": "john@email.com",
  "full_name": "John Doe",
  "phone_number": "+1234567890",
  "password": "securepass123"
}

Response:
{
  "success": true,
  "message": "Registration successful! You can now login.",
  "user_id": 123,
  "next_step": "login",
  "data": {
    "ready_to_login": true
  }
}

Frontend:
1. Show success message
2. Wait 2 seconds
3. Redirect to /login
```

### Assessment Save Flow

```
POST /api/assessment/submit
Headers:
  Authorization: Bearer {access_token}

Body:
{
  "q1": 7,
  "q2": 5,
  "q3": 8,
  ... (all 30 questions)
}

Response:
{
  "risk_score": 6.5,
  "risk_profile": "Moderate",
  "assessment_id": 456
}

Frontend:
1. Clear pendingAssessment flag
2. Show success toast
3. Enable portfolio generation
```

---

## Security Features

### Current Implementation

1. **Password Validation**:
   - Minimum 8 characters
   - Frontend validation
   - Backend hashing with bcrypt

2. **Token-Based Authentication**:
   - JWT access tokens (30 min expiry)
   - JWT refresh tokens (7 day expiry)
   - Stored in localStorage
   - Sent in Authorization header

3. **Protected Routes**:
   - Soft protection (degrades gracefully)
   - Hard protection (redirects to login) - future

4. **Input Validation**:
   - Email format validation
   - Username length validation
   - Password matching
   - Required field validation

### Backend Security (Already Implemented)

1. **Password Hashing**: bcrypt with salt
2. **Rate Limiting**: Login attempts, registration, OTP
3. **JWT Tokens**: Secure signing with secret key
4. **CORS**: Configured origins
5. **SQL Injection Prevention**: SQLAlchemy ORM
6. **2FA Support**: TOTP, Email, SMS (optional, disabled for dev)

---

## Configuration

### Backend Settings

File: `backend/app/core/config.py`

```python
# Simplified auth for development
REQUIRE_EMAIL_VERIFICATION: bool = False
REQUIRE_PHONE_VERIFICATION: bool = False
REQUIRE_2FA_SETUP: bool = False

# Users can login immediately after signup
```

### Frontend Environment

File: `frontend/.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:8001
```

For production (Railway):
```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

---

## Future Enhancements

### Planned Features

1. **Hard Protected Routes**:
   - Middleware to check auth before rendering
   - Automatic redirect to login if not authenticated

2. **User Profile Page**:
   - View/edit user information
   - Change password
   - Manage 2FA settings

3. **Password Reset**:
   - Forgot password flow
   - Email verification
   - Secure token generation

4. **Remember Me**:
   - Persistent sessions
   - Automatic token refresh

5. **Social Auth**:
   - Google OAuth
   - GitHub OAuth

6. **Session Management**:
   - Active sessions list
   - Device management
   - Logout from all devices

7. **Enhanced Portfolio Integration**:
   - Save portfolio to database
   - Portfolio history
   - Multiple portfolio versions
   - Portfolio comparison

---

## Testing

### Manual Testing Checklist

#### Signup Flow
- [ ] Visit `/signup`
- [ ] Fill all required fields
- [ ] Submit form
- [ ] Verify success message
- [ ] Redirected to `/login` after 2 seconds

#### Login Flow
- [ ] Visit `/login`
- [ ] Enter credentials
- [ ] Submit form
- [ ] Verify tokens in localStorage
- [ ] Redirected appropriately

#### Assessment + Auth Flow
- [ ] Complete assessment (not logged in)
- [ ] Redirected to `/auth-required`
- [ ] See risk profile displayed
- [ ] Click "Create Account"
- [ ] Complete signup
- [ ] Login with new account
- [ ] Redirected to `/results`
- [ ] Assessment auto-saved to backend
- [ ] Generate portfolio works

#### Logout Flow
- [ ] Click logout in navbar
- [ ] Tokens cleared from localStorage
- [ ] Redirected to home
- [ ] Navbar shows login/signup buttons

---

## Troubleshooting

### Common Issues

**Issue**: "Login failed" error
- **Check**: Backend is running on port 8001
- **Check**: Correct username/password
- **Check**: User account is active in database

**Issue**: Assessment not saving to backend
- **Check**: User is logged in (token exists)
- **Check**: Network tab shows API call
- **Check**: Token is valid (not expired)
- **Check**: Backend logs for errors

**Issue**: Redirect loop after assessment
- **Check**: Clear localStorage
- **Check**: Remove `pendingAssessment` flag
- **Check**: Browser console for errors

**Issue**: Portfolio shows empty state
- **Check**: `portfolioGenerated` flag in localStorage
- **Check**: User clicked "Generate Portfolio"
- **Check**: Not manually navigating to `/portfolio`

---

## API Error Handling

### Status Codes

| Code | Meaning | Frontend Handling |
|------|---------|-------------------|
| 200 | Success | Continue flow |
| 400 | Bad Request | Show error message |
| 401 | Unauthorized | Clear tokens, redirect to login |
| 404 | Not Found | Show error, redirect to home |
| 429 | Rate Limited | Show retry message with countdown |
| 500 | Server Error | Show generic error, log to console |

---

## Conclusion

The authentication system is fully functional and integrates seamlessly with the risk assessment and portfolio generation flow. Users must create an account to save their data, ensuring personalized tracking and portfolio management over time.

**Key Benefits:**
- Secure user data storage
- Personalized portfolio recommendations
- Historical tracking capability
- Professional user experience
- Scalable for future features

---

**Generated with Claude Code** 🚀

