# 🧹 Cleanup Checklist - After Phone Auth API Migration

## 📊 Analysis Summary

Sau khi implement API mới `/customer/phone-auth/step1-2`, các file và code sau đây **có thể xóa bỏ** sau khi frontend đã migrate hoàn toàn.

---

## ❌ Files Cần Xóa

### 1. DTO Request Files (2 files)

#### ✅ `CustomerRequest.java` - CÓ THỂ XÓA
**Location:** `backend/src/main/java/com/example/backend/dto/request/CustomerRequest.java`

**Lý do:** 
- Được dùng cho old API `POST /register/customer/step1`
- API này đã deprecated, thay thế bằng `PhoneAuthStep1Request`
- Cấu trúc tương tự nhưng validation khác (old: `^0[0-9]{9}$`, new: `^(0|\\+84)(3|5|7|8|9)[0-9]{8}$`)

**Usage hiện tại:**
```java
// CustomerService.java line 69
RegisterResponse registerStep1(CustomerRequest request);

// CustomerServiceImpl.java line 144
public RegisterResponse registerStep1(CustomerRequest request) { ... }

// CustomerController.java line 4-5 (imports but NOT USED in endpoints)
```

**Action:** ✅ **XÓA sau khi xóa `registerStep1()` method**

---

#### ✅ `CustomerVerifyOtpRequest.java` - CÓ THỂ XÓA
**Location:** `backend/src/main/java/com/example/backend/dto/request/CustomerVerifyOtpRequest.java`

**Lý do:**
- Dùng cho old API `POST /register/customer/step2`
- API này đã deprecated, thay thế bằng `PhoneAuthStep2Request`
- Cấu trúc tương tự nhưng có tên field khác

**Usage hiện tại:**
```java
// CustomerController.java line 5 (import only, NOT USED)
```

**Action:** ✅ **XÓA NGAY - không có method nào dùng**

---

## 🔧 Methods Cần Xóa trong CustomerService & CustomerServiceImpl

### 2. Interface Methods (CustomerService.java)

#### ✅ `sendLoginOtp()` - CÓ THỂ XÓA
```java
// Line 50
void sendLoginOtp(String phoneNumber);
```
**Thay thế bằng:** `phoneAuthStep1()` (auto-send OTP)

---

#### ✅ `verifyLoginOtpAndLogin()` - CÓ THỂ XÓA
```java
// Line 58
LoginResponse verifyLoginOtpAndLogin(String phoneNumber, String otp);
```
**Thay thế bằng:** `phoneAuthStep2()`

---

#### ✅ `registerStep1()` - CÓ THỂ XÓA
```java
// Line 69
RegisterResponse registerStep1(CustomerRequest request);
```
**Thay thế bằng:** `phoneAuthStep1()` (auto-create nếu phone chưa tồn tại)

---

#### ✅ `verifyOtpStep2()` - CÓ THỂ XÓA
```java
// Line ~80 (estimate)
RegisterResponse verifyOtpStep2(String phoneNumber, String otp);
```
**Thay thế bằng:** `phoneAuthStep2()`

---

#### ⚠️ `resendOtp()` - CẦN REFACTOR
```java
// Line ~90 (estimate)
String resendOtp(String phoneNumber);
```
**Status:** ⚠️ **KEEP but REFACTOR**

**Lý do giữ lại:**
- Vẫn cần feature resend OTP
- Có thể dùng chung cho cả customer và supplier

**Action:** Refactor thành generic method:
```java
String resendOtp(String phoneNumber, OtpType type);
```

---

### 3. Implementation Methods (CustomerServiceImpl.java)

#### ✅ Lines 144-186: `registerStep1()` implementation - XÓA
```java
@Override
@Transactional
public RegisterResponse registerStep1(CustomerRequest request) {
    // 43 lines of code
    // Logic đã được integrate vào phoneAuthStep1()
}
```

---

#### ✅ Lines 188-230: `verifyOtpStep2()` implementation - XÓA
```java
@Override
@Transactional
public RegisterResponse verifyOtpStep2(String phoneNumber, String otp) {
    // 43 lines of code
    // Logic đã được integrate vào phoneAuthStep2()
}
```

---

#### ✅ Lines 232-270: `resendOtp()` implementation - REFACTOR
```java
@Override
public String resendOtp(String phoneNumber) {
    // Can be generic for both customer/supplier
}
```

---

#### ✅ Lines 288-291: `sendLoginOtp()` implementation - XÓA
```java
@Override
public void sendLoginOtp(String phoneNumber) {
    // Simple OTP send - now handled by phoneAuthStep1()
}
```

---

#### ✅ Lines 293-298: `verifyLoginOtpAndLogin()` implementation - XÓA
```java
@Override
public LoginResponse verifyLoginOtpAndLogin(String phoneNumber, String otp) {
    // OTP verification + token generation - now phoneAuthStep2()
}
```

---

## 📝 Endpoints Đã Deprecated trong AuthController

### ⚠️ Customer Registration Endpoints (MARKED @Deprecated)

```java
// ❌ REMOVED completely:
// POST /api/auth/login/customer/step1
// POST /api/auth/login/customer/step2

// ⚠️ DEPRECATED (keep for backwards compatibility):
// POST /api/auth/register/customer/step1
// POST /api/auth/register/customer/step2
// POST /api/auth/register/customer/resend-otp
```

**Action:** 
- ✅ Đã remove 2 login endpoints
- ⚠️ Giữ lại 3 register endpoints với @Deprecated annotation
- 🔜 Sau khi frontend migrate → Xóa hoàn toàn

---

## 🎯 Cleanup Roadmap

### Phase 1: Immediate Cleanup (CÓ THỂ LÀM NGAY)
- [x] ✅ Remove old customer login endpoints from AuthController (ĐÃ XONG)
- [x] ✅ Mark old register endpoints as @Deprecated (ĐÃ XONG)
- [ ] ❌ Delete `CustomerVerifyOtpRequest.java` (không có usage)

### Phase 2: After Frontend Migration (SAU KHI FE MIGRATE)
- [ ] ❌ Delete old endpoints in AuthController:
  - `/register/customer/step1`
  - `/register/customer/step2`
  - `/register/customer/resend-otp`

- [ ] ❌ Delete methods in CustomerService.java:
  - `sendLoginOtp()`
  - `verifyLoginOtpAndLogin()`
  - `registerStep1()`
  - `verifyOtpStep2()`

- [ ] ❌ Delete implementations in CustomerServiceImpl.java:
  - `registerStep1()` (lines ~144-186)
  - `verifyOtpStep2()` (lines ~188-230)
  - `sendLoginOtp()` (lines ~288-291)
  - `verifyLoginOtpAndLogin()` (lines ~293-298)

- [ ] 🔧 Refactor `resendOtp()` thành generic method

- [ ] ❌ Delete DTO files:
  - `CustomerRequest.java`
  - `CustomerVerifyOtpRequest.java`

- [ ] ❌ Remove unused imports from CustomerService and CustomerServiceImpl

### Phase 3: Testing & Documentation
- [ ] 🧪 Test all new APIs thoroughly
- [ ] 📝 Update Swagger documentation
- [ ] 🗑️ Remove old API docs
- [ ] ✅ Update CUSTOMER_PHONE_AUTH_API.md if needed

---

## 📊 Impact Analysis

### Files to Delete: 2
1. `CustomerRequest.java`
2. `CustomerVerifyOtpRequest.java`

### Methods to Delete: 5
1. `sendLoginOtp()`
2. `verifyLoginOtpAndLogin()`
3. `registerStep1()`
4. `verifyOtpStep2()`
5. ~~`resendOtp()`~~ (refactor instead)

### Endpoints to Delete: 3
1. `POST /register/customer/step1`
2. `POST /register/customer/step2`
3. `POST /register/customer/resend-otp`

### Lines of Code to Remove: ~200 lines

---

## ⚠️ Important Notes

### ❗ DO NOT Delete Before Frontend Migration
- Giữ nguyên old API endpoints cho đến khi frontend migrate hoàn toàn
- Đánh dấu @Deprecated để developer biết không nên dùng
- Monitor API usage logs để confirm không còn request đến old APIs

### ✅ Safe to Delete Now
- `CustomerVerifyOtpRequest.java` - Không có endpoint nào dùng

### 🔒 Keep Forever
- `RegisterResponse.java` - Vẫn dùng cho supplier registration
- `LoginResponse.java` - Dùng cho tất cả authentication flows
- `PhoneAuthStep1Response.java` - New unified API response
- `PhoneAuthStep1Request.java` - New unified API request
- `PhoneAuthStep2Request.java` - New unified API request

---

## 🚀 Recommended Cleanup Order

```bash
# Step 1: Delete unused DTO (SAFE NOW)
rm backend/src/main/java/com/example/backend/dto/request/CustomerVerifyOtpRequest.java

# Step 2: Wait for frontend migration...
# Monitor logs: grep "register/customer" access.log

# Step 3: After confirmed no usage, remove methods
# Edit CustomerService.java and CustomerServiceImpl.java

# Step 4: Remove deprecated endpoints
# Edit AuthController.java

# Step 5: Delete remaining DTO
rm backend/src/main/java/com/example/backend/dto/request/CustomerRequest.java

# Step 6: Clean imports and rebuild
mvn clean compile
```

---

## 📞 Verification Commands

```bash
# Check if old APIs are still being called
grep -r "register/customer" backend/logs/

# Find all usages of CustomerRequest
grep -r "CustomerRequest" backend/src/

# Find all usages of old methods
grep -r "registerStep1\|verifyOtpStep2\|sendLoginOtp" backend/src/

# Verify new API is working
curl -X POST http://localhost:8080/api/auth/customer/phone-auth/step1 \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"0987654321"}'
```

---

## ✅ Cleanup Completion Checklist

- [ ] Frontend migrated to new API
- [ ] Old API usage = 0 (confirmed via logs)
- [ ] All old methods deleted
- [ ] All old endpoints deleted
- [ ] All unused DTOs deleted
- [ ] All imports cleaned
- [ ] Backend builds successfully
- [ ] All tests pass
- [ ] Swagger docs updated
- [ ] Documentation updated
- [ ] Code review completed
- [ ] Deployed to production

---

**Last Updated:** 2025-10-30
**Created By:** GitHub Copilot
**Status:** 🟡 Waiting for frontend migration
