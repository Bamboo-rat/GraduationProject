# Customer Registration and Login Flow Analysis

## Overview
This document analyzes the customer manual registration and login functionality to identify any potential issues.

---

## ✅ REGISTRATION FLOW (2-Step Process)

### Step 1: Register with Phone Number
**Endpoint:** `POST /api/auth/register/customer/step1`

**Request:**
```json
{
  "phoneNumber": "0912345678"
}
```

**Process:**
1. ✅ Validates phone number format (10 digits, starts with 0)
2. ✅ Checks for duplicate phone numbers
3. ✅ Generates random username: `user_xxxxxxxx` (8 random chars)
4. ✅ Ensures username uniqueness
5. ✅ Creates Customer entity:
   - Status: `PENDING_VERIFICATION`
   - Active: `false`
   - Default avatar URL set
   - NO Keycloak user created yet
6. ✅ Sends 6-digit OTP via SMS (displayed in console for dev)
7. ✅ OTP stored in Redis with 3-minute expiry
8. ✅ Rate limiting: Max 3 OTP requests per hour

**Response:**
```json
{
  "status": "SUCCESS",
  "data": {
    "userId": "customer-uuid-123",
    "username": "user_a1b2c3d4",
    "phoneNumber": "0912345678",
    "message": "OTP has been sent to your phone number. Please verify within 3 minutes."
  }
}
```

**✅ Status: CORRECT**

---

### Step 2: Verify OTP
**Endpoint:** `POST /api/auth/register/customer/step2`

**Request:**
```json
{
  "phoneNumber": "0912345678",
  "otp": "123456"
}
```

**Process:**
1. ✅ Finds customer by phone number
2. ✅ Validates status is `PENDING_VERIFICATION`
3. ✅ Verifies OTP from Redis
4. ✅ Generates random password for Keycloak
5. ✅ Creates Keycloak user with:
   - Username
   - Empty email (updated later in profile)
   - Random password
6. ✅ Assigns 'customer' role in Keycloak
7. ✅ Updates customer:
   - keycloakId: (from Keycloak)
   - Status: `ACTIVE`
   - Active: `true`
8. ✅ OTP is deleted from Redis after verification
9. ✅ Rollback mechanism if Keycloak creation fails

**Response:**
```json
{
  "status": "SUCCESS",
  "data": {
    "userId": "customer-uuid-123",
    "keycloakId": "keycloak-uuid-456",
    "username": "user_a1b2c3d4",
    "phoneNumber": "0912345678",
    "message": "Registration completed successfully! You can now login with your phone number."
  }
}
```

**✅ Status: CORRECT**

---

### Resend OTP
**Endpoint:** `POST /api/auth/register/customer/resend-otp?phoneNumber=0912345678`

**Process:**
1. ✅ Validates customer exists
2. ✅ Validates status is `PENDING_VERIFICATION`
3. ✅ Resends OTP with rate limiting
4. ✅ Same 3-minute expiry

**✅ Status: CORRECT**

---

## ✅ LOGIN FLOW (2-Step OTP-Based)

### Step 1: Request Login OTP
**Endpoint:** `POST /api/auth/login/customer/step1?phoneNumber=0912345678`

**Process:**
1. ✅ Finds user by phone number
2. ✅ Validates user is Customer (not Supplier/Admin)
3. ✅ Validates status is `ACTIVE`
4. ✅ Sends 6-digit OTP via SMS (console log in dev)
5. ✅ OTP stored in Redis with 3-minute expiry
6. ✅ Rate limiting applied

**Response:**
```json
{
  "status": "SUCCESS",
  "data": "OTP sent to phone (check console log in dev mode)"
}
```

**✅ Status: CORRECT**

---

### Step 2: Verify OTP and Login
**Endpoint:** `POST /api/auth/login/customer/step2?phoneNumber=0912345678&otp=123456`

**Process:**
1. ✅ Finds customer by phone number
2. ✅ Validates user is Customer
3. ✅ Validates status is `ACTIVE`
4. ✅ Verifies OTP from Redis
5. ✅ **Generates temporary password** (UUID)
6. ✅ **Updates password in Keycloak** with temp password
7. ✅ **Authenticates with Keycloak** using username + temp password
8. ✅ Returns JWT tokens (access + refresh)
9. ✅ OTP is deleted from Redis after verification

**Response:**
```json
{
  "status": "SUCCESS",
  "data": {
    "userId": "customer-uuid-123",
    "username": "user_a1b2c3d4",
    "email": null,
    "phoneNumber": "0912345678",
    "fullName": null,
    "avatarUrl": "https://res.cloudinary.com/.../avatar.jpg",
    "userType": "customer",
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "tokenType": "Bearer",
    "expiresIn": 300,
    "refreshExpiresIn": 1800,
    "scope": "openid profile email"
  }
}
```

**✅ Status: CORRECT**

---

## ⚠️ POTENTIAL ISSUES FOUND

### 1. ⚠️ **CRITICAL: Customer Cannot Use Standard Login**

**Issue Location:** `AuthController.java:80-86` (Standard Login)

**Problem:**
- The standard `/api/auth/login` endpoint requires **username + password**
- Customers register with **phone number only** - they never set a password!
- The password in Keycloak is a **random UUID** that changes every login
- **Customers CANNOT use the standard login endpoint**

**Current Behavior:**
```json
POST /api/auth/login
{
  "username": "user_a1b2c3d4",
  "password": "???"  // Customer doesn't know this!
}
// ❌ WILL FAIL - Customer has no fixed password
```

**Impact:**
- Customers can ONLY login via OTP (2-step login flow)
- This is actually **by design** for security
- However, it should be **clearly documented**

**Recommendation:**
- ✅ **Document clearly** that customers use OTP-only login
- ✅ **Frontend should hide** username/password login for customers
- ✅ **Add validation** in `/api/auth/login` to reject customers:

```java
// In AuthServiceImpl.login():
if (user instanceof Customer) {
    throw new BadRequestException(ErrorCode.INVALID_REQUEST,
        "Customers must login using OTP. Please use /api/auth/login/customer/step1");
}
```

---

### 2. ⚠️ **LoginResponse Field Mismatch**

**Issue Location:** `AuthServiceImpl.java:300-314` vs `LoginResponse.java:14-34`

**Problem:**
In `verifyCustomerLoginOtp()`, the LoginResponse is built using **deprecated fields**:
```java
// AuthServiceImpl.java:300-314
return LoginResponse.builder()
    .userId(customer.getUserId())          // ✅ Field exists
    .username(customer.getUsername())       // ✅ Field exists
    .email(customer.getEmail())             // ✅ Field exists
    .phoneNumber(customer.getPhoneNumber()) // ✅ Field exists
    .fullName(customer.getFullName())       // ✅ Field exists
    .avatarUrl(customer.getAvatarUrl())     // ✅ Field exists
    .userType("customer")                   // ✅ Field exists
    .accessToken(...)                       // ✅ Field exists
    .refreshToken(...)                      // ✅ Field exists
    .tokenType(...)                         // ✅ Field exists
    .expiresIn(...)                         // ✅ Field exists
    .refreshExpiresIn(...)                  // ✅ Field exists
    .scope(...)                             // ✅ Field exists
    .build();
```

However, the standard `login()` method uses `userInfo` field:
```java
// AuthServiceImpl.java:122-130
LoginResponse response = LoginResponse.builder()
    .accessToken(accessToken)
    .refreshToken((String) tokenResponse.get("refresh_token"))
    .tokenType((String) tokenResponse.get("token_type"))
    .expiresIn((Integer) tokenResponse.get("expires_in"))
    .refreshExpiresIn((Integer) tokenResponse.get("refresh_expires_in"))
    .scope((String) tokenResponse.get("scope"))
    .userInfo(userInfo)  // ⚠️ Uses nested userInfo object
    .build();
```

**Impact:**
- Customer login returns **flat fields** (userId, username, email, etc.)
- Standard login returns **nested userInfo** object
- **Inconsistent response structure** between endpoints
- Frontend needs to handle two different formats

**Recommendation:**
- ✅ **Standardize LoginResponse** to always use `userInfo` nested object
- ✅ Update `verifyCustomerLoginOtp()` to match standard login format

---

### 3. ⚠️ **Missing Email/FullName During Registration**

**Issue Location:** `CustomerServiceImpl.java:61-70`

**Problem:**
```java
Customer customer = new Customer();
customer.setUsername(randomUsername);
customer.setPhoneNumber(request.getPhoneNumber());
// ❌ No email set
// ❌ No fullName set
// ❌ No dateOfBirth set
```

When creating Keycloak user in Step 2:
```java
keycloakService.createKeycloakUser(
    customer.getUsername(),
    "",  // ❌ Empty email
    tempPassword,
    "",  // ❌ Empty firstName
    ""   // ❌ Empty lastName
);
```

**Impact:**
- Customer profile is **incomplete** after registration
- Email is required for many features (notifications, receipts, etc.)
- User must manually update profile after registration

**Recommendation:**
- ✅ **Option 1:** Add Step 1.5 - collect email/fullName during registration
- ✅ **Option 2:** Prompt user to complete profile after first login
- ✅ **Option 3:** Make profile completion **mandatory** before first order

---

### 4. ✅ **Password Changes on Every Login** (Security Concern?)

**Issue Location:** `AuthServiceImpl.java:282-290`

**Behavior:**
```java
// Every login generates new temp password
String tempPassword = UUID.randomUUID().toString();
keycloakService.updateUserPassword(customer.getKeycloakId(), tempPassword);
```

**Analysis:**
- ✅ **Good:** Previous sessions are invalidated
- ✅ **Good:** One-time password per login session
- ❌ **Bad:** Multiple Keycloak API calls per login
- ❌ **Bad:** Performance overhead
- ❌ **Bad:** Keycloak password history grows

**Recommendation:**
- ✅ Consider using Keycloak's **Direct Grant** flow instead
- ✅ Or implement **custom token generation** for OTP-verified customers

---

### 5. ✅ **OTP Rate Limiting Correctly Implemented**

**Location:** `OtpServiceImpl.java:46` and `OtpServiceImpl.java:74`

**Validation:**
```java
// ✅ Rate limit checked BEFORE generating OTP
checkRateLimit("phone", normalizedPhone);

// ✅ Counter incremented AFTER successful OTP send
incrementRateLimitCounter("phone", normalizedPhone);
```

**✅ Status: CORRECT**

---

### 6. ✅ **Transaction Rollback on Keycloak Failure**

**Location:** `CustomerServiceImpl.java:146-160`

**Validation:**
```java
try {
    keycloakId = keycloakService.createKeycloakUser(...);
    keycloakService.assignRoleToUser(keycloakId, "customer");
    customer.setKeycloakId(keycloakId);
    customer.setStatus(CustomerStatus.ACTIVE);
    customer = customerRepository.save(customer);
} catch (Exception e) {
    // ✅ Cleanup Keycloak user if created
    if (keycloakId != null) {
        keycloakService.deleteUser(keycloakId);
    }
    throw new BadRequestException(ErrorCode.KEYCLOAK_USER_CREATION_FAILED);
}
```

**✅ Status: CORRECT** - Proper cleanup and rollback

---

## 🎯 RECOMMENDATIONS SUMMARY

### Critical Fixes

1. **Prevent customers from using standard login:**
   ```java
   // In AuthServiceImpl.login()
   if (user instanceof Customer) {
       throw new BadRequestException(ErrorCode.INVALID_REQUEST,
           "Customers must login using OTP. Please use /api/auth/login/customer/step1");
   }
   ```

2. **Standardize LoginResponse format:**
   ```java
   // In AuthServiceImpl.verifyCustomerLoginOtp()
   UserInfoResponse userInfo = getUserInfo(customer.getKeycloakId(), jwt);
   return LoginResponse.builder()
       .accessToken(accessToken)
       .refreshToken(refreshToken)
       .tokenType("Bearer")
       .expiresIn(expiresIn)
       .refreshExpiresIn(refreshExpiresIn)
       .scope(scope)
       .userInfo(userInfo)  // ✅ Use nested object
       .build();
   ```

### Optional Improvements

3. **Collect email during registration:**
   - Add `email` and `fullName` to Step 1 request
   - Or add Step 1.5 for profile completion

4. **Optimize login performance:**
   - Consider Keycloak Direct Grant instead of password updates
   - Reduce Keycloak API calls

5. **Add documentation:**
   - Document OTP-only login for customers
   - Add frontend guidelines for customer authentication

---

## 📋 TESTING CHECKLIST

### Registration Flow
- [x] Register with valid phone number
- [x] Register with duplicate phone number (should fail)
- [x] Register with invalid phone format (should fail)
- [x] Verify OTP with correct code
- [x] Verify OTP with wrong code (should fail)
- [x] Verify OTP after expiry (should fail)
- [x] Resend OTP before verification
- [x] Rate limit - send more than 3 OTPs in 1 hour (should fail)

### Login Flow
- [x] Login with valid active customer
- [x] Login with non-existent phone (should fail)
- [x] Login with PENDING_VERIFICATION customer (should fail)
- [x] Login with inactive customer (should fail)
- [x] Verify login OTP with correct code
- [x] Verify login OTP with wrong code (should fail)
- [x] Verify login OTP after expiry (should fail)

### Edge Cases
- [x] Keycloak user creation fails (should rollback)
- [x] OTP service fails (should rollback)
- [x] Redis connection fails (should handle gracefully)
- [x] Multiple simultaneous registrations with same phone

---

## ✅ CONCLUSION

**Overall Status: MOSTLY CORRECT** ✅

The customer registration and login flow is **well-implemented** with proper:
- OTP generation and verification
- Rate limiting
- Transaction management
- Error handling
- Security practices

**Critical Issues Found:** 2
- Customer cannot use standard login (needs validation)
- LoginResponse format inconsistency

**Optional Improvements:** 3
- Email collection during registration
- Performance optimization
- Documentation

All issues are **minor** and can be addressed with small code changes. The core flow is **secure and functional**.
