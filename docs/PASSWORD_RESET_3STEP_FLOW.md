# Password Reset 3-Step OTP Flow

## Overview

The password reset system uses a secure 3-step flow that combines Redis-based OTP verification with database-backed temporary tokens for audit trail and security.

This flow works for both **Admin** and **Supplier** user types.

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│ Step 1: Request Password Reset (Send OTP)                          │
├─────────────────────────────────────────────────────────────────────┤
│ Frontend: POST /api/auth/forgot-password                           │
│ Request Body:                                                       │
│   {                                                                 │
│     "email": "user@example.com",                                   │
│     "userType": "ADMIN" or "SUPPLIER"                              │
│   }                                                                 │
│                                                                     │
│ Backend Process:                                                    │
│   1. Validate user exists and is ACTIVE (or PAUSE for Supplier)   │
│   2. Generate 6-digit OTP                                          │
│   3. Store OTP in Redis with key: "reset-otp:email:{email}"       │
│   4. Set OTP expiry to 10 minutes                                  │
│   5. Send OTP via email (SendGrid)                                 │
│   6. Enforce rate limit: max 3 OTP requests per hour per email     │
│                                                                     │
│ Response:                                                           │
│   {                                                                 │
│     "success": true,                                               │
│     "message": "A 6-digit OTP has been sent to your email...",    │
│     "email": "user@example.com",                                   │
│     "userType": "ADMIN"                                            │
│   }                                                                 │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Step 2: Verify OTP (Get Temporary Reset Token)                     │
├─────────────────────────────────────────────────────────────────────┤
│ Frontend: POST /api/auth/verify-reset-otp                          │
│ Request Body:                                                       │
│   {                                                                 │
│     "email": "user@example.com",                                   │
│     "otp": "123456"                                                │
│   }                                                                 │
│                                                                     │
│ Backend Process:                                                    │
│   1. Retrieve OTP from Redis: "reset-otp:email:{email}"           │
│   2. Verify OTP matches                                            │
│   3. Look up user by email to get keycloakId and userType         │
│   4. Delete OTP from Redis (consume it)                            │
│   5. Invalidate any existing DB tokens for the user                │
│   6. Generate temporary UUID reset token                           │
│   7. Save PasswordResetToken to database with:                     │
│      - token: UUID                                                 │
│      - keycloakId: user's Keycloak ID                              │
│      - email: user's email                                         │
│      - userType: "ADMIN" or "SUPPLIER"                             │
│      - expiryDate: now + 10 minutes                                │
│      - used: false                                                 │
│                                                                     │
│ Response:                                                           │
│   {                                                                 │
│     "success": true,                                               │
│     "message": "OTP verified successfully. Use the reset token...",│
│     "resetToken": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",         │
│     "email": "user@example.com",                                   │
│     "expiryDate": "2025-01-24T10:40:00",                          │
│     "userType": "ADMIN"                                            │
│   }                                                                 │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Step 3: Reset Password (Using Temporary Token)                     │
├─────────────────────────────────────────────────────────────────────┤
│ Frontend: POST /api/auth/reset-password                            │
│ Request Body:                                                       │
│   {                                                                 │
│     "token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",              │
│     "newPassword": "NewSecurePass123!",                            │
│     "confirmPassword": "NewSecurePass123!"                         │
│   }                                                                 │
│                                                                     │
│ Backend Process:                                                    │
│   1. Validate passwords match                                      │
│   2. Find PasswordResetToken in database by token UUID             │
│   3. Validate token is not expired and not used                    │
│   4. Update password in Keycloak using keycloakId                  │
│   5. Mark token as used in database (used=true, usedAt=now)       │
│                                                                     │
│ Response:                                                           │
│   {                                                                 │
│     "success": true,                                               │
│     "message": "Password has been reset successfully...",          │
│     "email": "user@example.com",                                   │
│     "userType": "ADMIN"                                            │
│   }                                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Step 1: Request Password Reset

**Endpoint:** `POST /api/auth/forgot-password`

**Request:**
```json
{
  "email": "supplier@example.com",
  "userType": "SUPPLIER"
}
```

**Response (Success):**
```json
{
  "status": "SUCCESS",
  "message": "OTP sent to your email. Please check your inbox.",
  "data": {
    "success": true,
    "message": "A 6-digit OTP has been sent to your email. Please check your inbox.",
    "email": "supplier@example.com",
    "userType": "SUPPLIER"
  },
  "timestamp": "2025-01-24T10:30:00"
}
```

**Errors:**
- `USER_NOT_FOUND` (404): Email not found in system
- `ACCOUNT_INACTIVE` (403): User account is not active
- `OTP_RATE_LIMIT_EXCEEDED` (400): More than 3 OTP requests in 1 hour

---

### Step 2: Verify OTP and Get Reset Token

**Endpoint:** `POST /api/auth/verify-reset-otp`

**Request:**
```json
{
  "email": "supplier@example.com",
  "otp": "123456"
}
```

**Response (Success):**
```json
{
  "status": "SUCCESS",
  "message": "OTP verified successfully. Use the reset token to update your password.",
  "data": {
    "success": true,
    "message": "OTP verified successfully. Use the reset token to update your password.",
    "resetToken": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "supplier@example.com",
    "expiryDate": "2025-01-24T10:40:00",
    "userType": "SUPPLIER"
  },
  "timestamp": "2025-01-24T10:30:15"
}
```

**Important:** The `resetToken` is valid for **10 minutes only**. Frontend must store this token and use it in Step 3.

**Errors:**
- `INVALID_OTP` (400): OTP is incorrect or expired
- `USER_NOT_FOUND` (404): Email not found

---

### Step 3: Reset Password with Token

**Endpoint:** `POST /api/auth/reset-password`

**Request:**
```json
{
  "token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "newPassword": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character (@$!%*?&)

**Response (Success):**
```json
{
  "status": "SUCCESS",
  "message": "Password reset successfully. You can now login with your new password.",
  "data": {
    "success": true,
    "message": "Password has been reset successfully. You can now login with your new password.",
    "email": "supplier@example.com",
    "userType": "SUPPLIER"
  },
  "timestamp": "2025-01-24T10:35:00"
}
```

**Errors:**
- `PASSWORD_MISMATCH` (400): Passwords don't match
- `INVALID_TOKEN` (404): Token not found
- `TOKEN_ALREADY_USED` (400): Token has already been used
- `TOKEN_EXPIRED` (400): Token expired (>10 minutes old)
- `KEYCLOAK_PASSWORD_UPDATE_FAILED` (500): Failed to update password in Keycloak

---

## Database Schema

### PasswordResetToken Entity

```sql
CREATE TABLE password_reset_tokens (
    reset_token_id VARCHAR(36) PRIMARY KEY,    -- UUID
    token VARCHAR(255) NOT NULL UNIQUE,        -- Temporary reset token (UUID)
    keycloak_id VARCHAR(255) NOT NULL UNIQUE,  -- User's Keycloak ID
    user_type VARCHAR(50) NOT NULL,            -- "ADMIN" or "SUPPLIER"
    email VARCHAR(255) NOT NULL,               -- User's email
    expiry_date TIMESTAMP NOT NULL,            -- Token expiry (10 minutes)
    created_at TIMESTAMP NOT NULL,             -- Creation timestamp
    used_at TIMESTAMP,                         -- When token was used
    used BOOLEAN NOT NULL DEFAULT FALSE        -- Whether token has been used
);
```

---

## Redis Keys

### OTP Storage
- **Key:** `reset-otp:email:{email}`
- **Value:** 6-digit OTP code (e.g., "123456")
- **TTL:** 10 minutes
- **Example:** `reset-otp:email:supplier@example.com` → `"123456"`

### Rate Limiting
- **Key:** `otp:ratelimit:reset:{email}`
- **Value:** Request count (e.g., "1", "2", "3")
- **TTL:** 1 hour
- **Max:** 3 requests per hour
- **Example:** `otp:ratelimit:reset:supplier@example.com` → `"2"`

---

## Security Features

### 1. OTP Security
- **6-digit random code**: 1 in 1,000,000 chance of guessing
- **Short expiry**: 10 minutes prevents brute force attacks
- **Single use**: OTP deleted from Redis after successful verification
- **Rate limiting**: Max 3 OTP requests per hour per email

### 2. Token Security
- **UUID format**: Impossible to guess (128-bit random)
- **Short-lived**: 10 minutes prevents token reuse attacks
- **Single use**: Marked as used in database after password reset
- **Invalidation**: All existing tokens invalidated when new OTP is verified

### 3. Database Audit Trail
- All password reset attempts logged in `password_reset_tokens` table
- Tracks: who requested reset, when token was created, when it was used
- Useful for security audits and fraud detection

### 4. User Status Validation
- Only ACTIVE admins can reset password
- Only ACTIVE or PAUSE suppliers can reset password
- PENDING, REJECTED, SUSPENDED accounts cannot reset password

---

## Cleanup & Maintenance

### Automatic Cleanup
- **Scheduler:** `PasswordResetTokenCleanupScheduler`
- **Frequency:** Daily at 2:00 AM
- **Action:** Deletes expired tokens from database (expiryDate < now)

### Manual Cleanup (if needed)
```sql
DELETE FROM password_reset_tokens WHERE expiry_date < NOW();
```

---

## Frontend Implementation Guide

### Step 1: Request OTP
```typescript
const requestPasswordReset = async (email: string, userType: 'ADMIN' | 'SUPPLIER') => {
  const response = await axios.post('/api/auth/forgot-password', { email, userType });

  if (response.data.status === 'SUCCESS') {
    // Show success message: "OTP sent to your email"
    // Navigate to OTP verification page
    return response.data.data;
  }
};
```

### Step 2: Verify OTP
```typescript
const verifyResetOtp = async (email: string, otp: string) => {
  const response = await axios.post('/api/auth/verify-reset-otp', { email, otp });

  if (response.data.status === 'SUCCESS') {
    // Store resetToken in state/localStorage
    const { resetToken, expiryDate } = response.data.data;

    // Navigate to password reset form
    // Pass resetToken to next step
    return { resetToken, expiryDate };
  }
};
```

### Step 3: Reset Password
```typescript
const resetPassword = async (token: string, newPassword: string, confirmPassword: string) => {
  const response = await axios.post('/api/auth/reset-password', {
    token,
    newPassword,
    confirmPassword
  });

  if (response.data.status === 'SUCCESS') {
    // Show success message: "Password reset successful"
    // Navigate to login page
    return response.data.data;
  }
};
```

### Complete Flow Example
```typescript
// Page 1: Forgot Password Form
const handleForgotPassword = async () => {
  try {
    setLoading(true);
    await requestPasswordReset(email, userType);

    // Navigate to OTP verification page
    navigate('/verify-reset-otp', { state: { email } });
  } catch (error) {
    showError(error.response?.data?.message);
  } finally {
    setLoading(false);
  }
};

// Page 2: OTP Verification Form
const handleVerifyOtp = async () => {
  try {
    setLoading(true);
    const { resetToken, expiryDate } = await verifyResetOtp(email, otp);

    // Navigate to reset password page with token
    navigate('/reset-password', { state: { resetToken, email, expiryDate } });
  } catch (error) {
    showError(error.response?.data?.message);
  } finally {
    setLoading(false);
  }
};

// Page 3: Reset Password Form
const handleResetPassword = async () => {
  try {
    setLoading(true);
    await resetPassword(resetToken, newPassword, confirmPassword);

    showSuccess("Password reset successfully!");

    // Navigate to login page
    navigate('/login');
  } catch (error) {
    showError(error.response?.data?.message);
  } finally {
    setLoading(false);
  }
};
```

---

## Email Templates

### Password Reset OTP Email (Red Theme)

**Subject:** Password Reset Request - SaveFood

**Content:**
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
        .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background-color: #ffffff; }
        .otp-code {
            font-size: 32px;
            font-weight: bold;
            color: #f44336;
            background-color: #ffebee;
            padding: 15px;
            text-align: center;
            border-radius: 8px;
            letter-spacing: 5px;
        }
        .warning { color: #f44336; font-weight: bold; }
        .footer { background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <h2>Your Password Reset Code</h2>
            <p>You have requested to reset your password. Please use the following OTP code:</p>

            <div class="otp-code">123456</div>

            <p class="warning">This code will expire in 10 minutes.</p>

            <p>If you did not request this password reset, please ignore this email or contact support.</p>

            <p>For security reasons, never share this code with anyone.</p>
        </div>
        <div class="footer">
            <p>&copy; 2025 SaveFood. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
```

---

## Testing Checklist

### Unit Tests
- [ ] OtpService: sendPasswordResetOtp with rate limiting
- [ ] OtpService: verifyPasswordResetOtp success and failure cases
- [ ] AuthService: requestPasswordReset validates user status
- [ ] AuthService: verifyResetOtp validates OTP and generates token
- [ ] AuthService: resetPassword validates token and updates Keycloak

### Integration Tests
- [ ] Complete 3-step flow with valid data
- [ ] OTP expiry after 10 minutes
- [ ] Token expiry after 10 minutes
- [ ] Rate limiting (4th request in 1 hour should fail)
- [ ] Token reuse should fail (already used)
- [ ] Invalid OTP should fail
- [ ] Password mismatch should fail
- [ ] Inactive user should fail at Step 1

### Manual Testing (Swagger UI)
1. POST `/api/auth/forgot-password` with valid email
2. Check email inbox for OTP (or console logs in dev)
3. POST `/api/auth/verify-reset-otp` with email + OTP
4. Copy resetToken from response
5. POST `/api/auth/reset-password` with token + new password
6. POST `/api/auth/login` with new password (should succeed)

---

## Troubleshooting

### Problem: OTP not received
- Check email spam folder
- Check SendGrid API key configuration
- Check console logs (dev environment prints OTP)
- Verify email exists in database

### Problem: OTP expired
- Request new OTP (Step 1 again)
- Check system time synchronization

### Problem: Token expired
- Complete Steps 2 and 3 within 10 minutes
- If expired, restart from Step 1

### Problem: Rate limit exceeded
- Wait 1 hour before requesting new OTP
- Check Redis for rate limit key: `otp:ratelimit:reset:{email}`
- Contact support if legitimate user locked out

---

## Migration Notes

### Changes from Old Flow
**Old Flow (Single-Step):**
- POST `/api/auth/forgot-password` → sends reset link via email
- POST `/api/auth/validate-reset-token` → validates token
- POST `/api/auth/reset-password` → resets password

**New Flow (3-Step OTP):**
- POST `/api/auth/forgot-password` → sends OTP via email
- POST `/api/auth/verify-reset-otp` → verifies OTP, returns temp token
- POST `/api/auth/reset-password` → resets password with temp token

### Breaking Changes
- Removed `/validate-reset-token` endpoint
- Removed `ValidateResetTokenRequest` DTO
- `ResetPasswordResponse` now includes `resetToken` field
- `PasswordResetToken.id` changed from Long to String (UUID)

### Backward Compatibility
- None - this is a complete redesign
- Existing reset tokens in database will not work with new flow
- Run database cleanup before deploying new version

---

## Production Deployment Checklist

- [ ] Update frontend to use new 3-step flow
- [ ] Configure SendGrid API key in production
- [ ] Configure Redis connection in production
- [ ] Test email delivery in production
- [ ] Clear existing password reset tokens from database
- [ ] Monitor error rates and OTP delivery success
- [ ] Set up alerts for rate limit violations
- [ ] Document new flow for customer support team
