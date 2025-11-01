# Customer Phone Authentication API

## 🎯 Overview
Unified API for customer login and registration using phone number + OTP authentication.

## 🔄 Migration from Old APIs

### Old Flow (DEPRECATED)
```
Login:    POST /api/auth/login/customer/step1 → step2
Register: POST /api/auth/register/customer/step1 → step2
```

### New Flow (CURRENT)
```
Both:     POST /api/auth/customer/phone-auth/step1 → step2
```

## 📱 API Endpoints

### Step 1: Send OTP
**POST** `/api/auth/customer/phone-auth/step1`

Automatically detects if phone number exists:
- ✅ **Existing customer**: Send OTP for login
- ✅ **New customer**: Create account + Send OTP

**Request Body:**
```json
{
  "phoneNumber": "0987654321"
}
```

**Response:**
```json
{
  "code": "200",
  "message": "OTP sent successfully",
  "data": {
    "phoneNumber": "0987654321",
    "accountStatus": "EXISTING",  // or "NEW"
    "message": "Mã OTP đã được gửi đến số điện thoại của bạn",
    "expirySeconds": 300
  }
}
```

**Validation:**
- Phone format: `^(0|\+84)(3|5|7|8|9)[0-9]{8}$`
- Supports: `0987654321` or `+84987654321`

---

### Step 2: Verify OTP & Login
**POST** `/api/auth/customer/phone-auth/step2`

Verifies OTP and returns JWT tokens for authentication.

**Request Body:**
```json
{
  "phoneNumber": "0987654321",
  "otp": "123456"
}
```

**Response:**
```json
{
  "code": "200",
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
    "expiresIn": 3600,
    "refreshExpiresIn": 86400,
    "tokenType": "Bearer",
    "userInfo": {
      "userId": "uuid",
      "keycloakId": "keycloak-uuid",
      "username": "user_abc12345",
      "phoneNumber": "0987654321",
      "email": null,
      "fullName": null,
      "avatarUrl": "https://res.cloudinary.com/.../avatar.jpg",
      "roles": ["customer"],
      "status": "ACTIVE",
      "userType": "CUSTOMER",
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-15T10:35:00Z"
    }
  }
}
```

**Validation:**
- Phone format: `^(0|\+84)(3|5|7|8|9)[0-9]{8}$`
- OTP format: `^[0-9]{6}$` (6 digits)

---

## 🔐 Authentication Flow

### New Customer Registration
```
1. User enters phone: 0987654321
2. POST /customer/phone-auth/step1
   → Backend checks: Phone not found
   → Auto-create customer account (PENDING_VERIFICATION)
   → Generate random username: user_abc12345
   → Send OTP via SMS
   → Return: { accountStatus: "NEW" }

3. User enters OTP: 123456
4. POST /customer/phone-auth/step2
   → Verify OTP
   → Activate account (status = ACTIVE)
   → Create Keycloak user with role "customer"
   → Generate JWT tokens
   → Return tokens + user info
```

### Existing Customer Login
```
1. User enters phone: 0987654321
2. POST /customer/phone-auth/step1
   → Backend checks: Phone exists
   → Send OTP via SMS
   → Return: { accountStatus: "EXISTING" }

3. User enters OTP: 123456
4. POST /customer/phone-auth/step2
   → Verify OTP
   → Generate JWT tokens
   → Return tokens + user info
```

---

## ⚠️ Error Codes

| Code | Vietnamese Message | Description |
|------|-------------------|-------------|
| `1007` | Định dạng số điện thoại không hợp lệ | Invalid phone format |
| `2013` | Mã OTP không hợp lệ hoặc đã hết hạn | Invalid/expired OTP |
| `2014` | Gửi tin nhắn SMS thất bại | SMS send failed |
| `2015` | Bạn đã yêu cầu quá nhiều mã OTP | OTP rate limit exceeded |
| `3001` | Không tìm thấy người dùng | User not found |
| `3004` | Số điện thoại này đã được sử dụng | Phone already registered |

---

## 🔥 Benefits

✅ **Simpler UX**: One flow for both login and registration
✅ **Less code**: Eliminates duplicate logic
✅ **Better security**: Automatic account creation prevents enumeration
✅ **Familiar pattern**: Like WhatsApp, Telegram, etc.

---

## 🚀 Frontend Integration Example

```typescript
// Step 1: Send OTP
async function sendOTP(phoneNumber: string) {
  const response = await fetch('/api/auth/customer/phone-auth/step1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber })
  });
  
  const data = await response.json();
  
  if (data.data.accountStatus === 'NEW') {
    console.log('New customer! Account created.');
  } else {
    console.log('Welcome back!');
  }
  
  return data;
}

// Step 2: Verify OTP
async function verifyOTP(phoneNumber: string, otp: string) {
  const response = await fetch('/api/auth/customer/phone-auth/step2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber, otp })
  });
  
  const data = await response.json();
  
  // Save tokens
  localStorage.setItem('access_token', data.data.accessToken);
  localStorage.setItem('refresh_token', data.data.refreshToken);
  localStorage.setItem('user_info', JSON.stringify(data.data.userInfo));
  
  return data;
}
```

---

## 📝 Notes

- OTP expires after **5 minutes** (300 seconds)
- OTP is **6 digits** numeric code
- New customers get auto-generated username: `user_xxxxxxxx`
- Default avatar is set automatically
- Customer status: `PENDING_VERIFICATION` → `ACTIVE` after OTP
- Old APIs marked as `@Deprecated` but still functional

---

## 🧪 Testing

**Postman Collection:**
1. Import collection from `docs/postman/customer-phone-auth.json`
2. Test Step 1 with various phone numbers
3. Check console for OTP (dev mode)
4. Test Step 2 with OTP from console

**Manual Test:**
```bash
# Step 1: Send OTP
curl -X POST http://localhost:8080/api/auth/customer/phone-auth/step1 \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"0987654321"}'

# Check console for OTP code

# Step 2: Verify OTP
curl -X POST http://localhost:8080/api/auth/customer/phone-auth/step2 \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"0987654321","otp":"123456"}'
```

---

## 📚 Related Documentation

- [Authentication Overview](./AUTHENTICATION_OVERVIEW.md)
- [OTP Service Implementation](./OTP_SERVICE.md)
- [Customer Service API](./CUSTOMER_SERVICE_API.md)
- [Error Handling Guide](./ERROR_HANDLING.md)
