# BÁO CÁO PHÂN TÍCH VẤN ĐỀ HỆ THỐNG SAVEFOOD

 

**Ngày phân tích:** 07/11/2025

**Phạm vi:** Backend (Admin, Supplier, Customer) + Frontend (Supplier, Customer portals)

 

---

 

## 📊 TỔNG QUAN

 

### Thống kê tổng hợp

 

| Module | Vấn đề CRITICAL | Vấn đề HIGH | Vấn đề MEDIUM | Vấn đề LOW | Tổng |

|--------|----------------|-------------|---------------|-----------|------|

| **Backend Admin** | 4 | 4 | 13 | 7 | **28** |

| **Backend Supplier** | 1 | 3 | 4 | 2 | **10** |

| **Backend Customer** | 7 | 8 | 5+ | - | **20+** |

| **Frontend Supplier** | 5 | 5 | 5 | 5 | **20+** |

| **Frontend Customer** | **KHÔNG TỒN TẠI** | - | - | - | **N/A** |

 

### Phát hiện quan trọng nhất

 

🚨 **CRITICAL:** Không có frontend cho Customer - khách hàng không thể sử dụng hệ thống!

 

---

 

## 🔴 VẤN ĐỀ CRITICAL (CẦN KHẮC PHỤC NGAY)

 

### 1. KHÔNG CÓ FRONTEND CHO CUSTOMER ⚠️

 

**Mô tả:** Hệ thống có đầy đủ Backend API cho khách hàng nhưng hoàn toàn thiếu giao diện người dùng.

 

**Tác động:**

- Khách hàng không thể đăng ký tài khoản

- Không thể duyệt sản phẩm

- Không thể đặt hàng

- Toàn bộ business flow bị gián đoạn

 

**Backend APIs đã sẵn sàng nhưng chưa dùng:**

- Authentication & OTP registration (2 bước)

- Product browsing & search

- Multi-store cart management

- Checkout & payment integration (VNPay, Momo, ZaloPay)

- Order tracking

- Reviews & ratings

- Promotions & customer tiers

- Address management

- Favorite stores

 

**Khuyến nghị:**

- Xây dựng `website/fe_customer` (React web app) HOẶC

- Xây dựng mobile app (React Native/Flutter)

- Hoặc cả hai (khuyến nghị cho nền tảng food delivery)

 

---

 

### 2. Backend Customer: Race Conditions trong Cart & Order Operations

 

#### 2.1 Stock Deduction Không Có Pessimistic Lock

 

**File:** `backend/src/main/java/com/example/backend/service/impl/OrderServiceImpl.java:168-169`

 

```java

// ❌ CRITICAL: Không có lock

storeProduct.setStockQuantity(storeProduct.getStockQuantity() - cartDetail.getQuantity());

storeProductRepository.save(storeProduct);

```

 

**Vấn đề:** Nhiều checkout đồng thời có thể bán quá số lượng tồn kho (overselling)

 

**Khuyến nghị:** Thêm `@Lock(PESSIMISTIC_WRITE)` trong repository query

 

#### 2.2 Cart Validation Race Condition

 

**File:** `backend/src/main/java/com/example/backend/service/impl/CartServiceImpl.java:263`

 

```java

// validateAndSyncCart() kiểm tra tồn kho nhưng không lock

// Giữa validate và checkout, stock có thể thay đổi

```

 

**Khuyến nghị:** Sử dụng `SERIALIZABLE` isolation level cho `addToCart()` và `checkout()`

 

#### 2.3 Wallet Balance Race Condition

 

**File:** `backend/src/main/java/com/example/backend/service/impl/WalletServiceImpl.java:96-98`

 

```java

wallet.addPendingBalance(netAmount);  // ← Multiple concurrent calls

wallet.addEarnings(netAmount);         // ← Race condition

wallet = walletRepository.save(wallet);

```

 

**Khuyến nghị:** Thêm pessimistic lock cho wallet operations

 

---

 

### 3. Backend Supplier: Wallet Creation Có Thể Fail Silently

 

**File:** `backend/src/main/java/com/example/backend/service/impl/SupplierServiceImpl.java:569-575`

 

```java

supplier = supplierRepository.save(supplier);  // Approved

 

try {

    walletService.createWallet(supplier);

} catch (Exception e) {

    log.error("Failed to create wallet...");

    // ❌ CRITICAL: Supplier được approve nhưng không có wallet

}

```

 

**Tác động:** Supplier được duyệt nhưng không thể nhận thanh toán vì thiếu ví

 

**Khuyến nghị:** Fail toàn bộ transaction nếu tạo wallet thất bại

 

---

 

### 4. Backend Admin: Suspended Admins Vẫn Có Thể Đăng Nhập

 

**File:** `backend/src/main/java/com/example/backend/service/impl/AdminServiceImpl.java:204-218`

 

**Vấn đề:** Khi admin bị suspend (status=INACTIVE), không disable account trong Keycloak

 

**Tác động:** Admin bị đình chỉ vẫn có thể đăng nhập và truy cập hệ thống

 

**Khuyến nghị:** Sync trạng thái suspend với Keycloak (disable user)

 

---

 

### 5. Backend Admin: Có Thể Downgrade SUPER_ADMIN Cuối Cùng

 

**File:** `backend/src/main/java/com/example/backend/service/impl/AdminServiceImpl.java:245-278`

 

**Vấn đề:** Không kiểm tra việc hạ cấp SUPER_ADMIN cuối cùng thành MODERATOR/STAFF

 

**Tác động:** Có thể khóa toàn bộ quyền SUPER_ADMIN, không ai quản lý được hệ thống

 

**Khuyến nghị:** Kiểm tra số lượng SUPER_ADMIN còn lại trước khi downgrade

 

---

 

## 🟠 VẤN ĐỀ HIGH PRIORITY

 

### Backend Customer: Business Logic Errors

 

#### 6. Promotion Tier Eligibility Sai Logic

 

**File:** `backend/src/main/java/com/example/backend/service/impl/CartServiceImpl.java:590`

 

```java

case BRONZE_PLUS -> true;  // ❌ SAI: Cho phép TẤT CẢ khách hàng

```

 

**Đúng:** Phải kiểm tra `customerTier.ordinal() >= BRONZE.ordinal()`

 

#### 7. FIRST_TIME Promotion Tính Cả Cancelled Orders

 

**File:** `backend/src/main/java/com/example/backend/service/impl/CartServiceImpl.java:612-621`

 

```java

long orderCount = orderRepository.countByCustomer(customer); // ← Đếm tất cả

```

 

**Đúng:** Chỉ đếm `countByCustomerAndStatus(customer, OrderStatus.DELIVERED)`

 

#### 8. Wallet Manual Deposit Tính Vào Earnings

 

**File:** `backend/src/main/java/com/example/backend/service/impl/WalletServiceImpl.java:647`

 

```java

case ADMIN_DEPOSIT:

    wallet.setMonthlyEarnings(wallet.getMonthlyEarnings().add(amount)); // ❌ SAI

```

 

**Vấn đề:** Admin nạp tiền thủ công không phải là "doanh thu kiếm được"

 

#### 9. Customer Có Thể Ở Trạng Thái BANNED + active=true

 

**File:** `backend/src/main/java/com/example/backend/service/impl/CustomerServiceImpl.java:204`

 

```java

if (currentStatus == CustomerStatus.BANNED) {

    log.warn("Cannot auto-activate BANNED customer...");

    // Keep as BANNED, but set active=true ← ❌ MÂU THUẪN

}

```

 

---

 

### Backend Supplier: Transaction & External API Issues

 

#### 10. OTP Sending Trong Transaction Boundary

 

**File:** `backend/src/main/java/com/example/backend/service/impl/SupplierServiceImpl.java:120`

 

```java

@Transactional

public RegisterResponse registerStep1(...) {

    supplier = supplierRepository.save(supplier);

    otpService.sendOtpToEmail(request.getEmail());  // ← External API call

}

```

 

**Vấn đề:** Nếu SendGrid fail, user đã được tạo nhưng không nhận được OTP

 

**Khuyến nghị:** Tách OTP sending ra ngoài transaction

 

#### 11. Keycloak Sync Failure Không Rollback

 

**File:** `backend/src/main/java/com/example/backend/service/impl/SupplierServiceImpl.java:434-448`

 

```java

supplier = supplierRepository.save(supplier);  // DB saved

 

try {

    keycloakService.updateKeycloakUser(...);

} catch (Exception e) {

    log.error("Failed to update Keycloak...");  // ← Chỉ log, không throw

}

```

 

**Tác động:** Local DB và Keycloak mất đồng bộ

 

---

 

### Backend Admin: Data Inconsistency Issues

 

#### 12. Keycloak Update Failures Không Được Xử Lý

 

**File:** `backend/src/main/java/com/example/backend/service/impl/AdminServiceImpl.java:194-197`

 

**Vấn đề:** Tương tự Supplier - Keycloak fail nhưng DB vẫn commit

 

#### 13. Email Uniqueness Race Condition

 

**File:** `backend/src/main/java/com/example/backend/service/impl/AdminServiceImpl.java:168-173`

 

```java

// Check email exists

if (userRepository.existsByEmail(request.getEmail())) {

    throw new ConflictException(...);

}

// ← Timing window: email có thể được sử dụng ở đây

supplier.setEmail(request.getEmail());

```

 

**Khuyến nghị:** Thêm unique constraint ở database level + catch `DataIntegrityViolationException`

 

---

 

### Frontend Supplier: Critical Missing Features

 

#### 14. Dashboard Statistics Hardcoded = "0"

 

**File:** `website/fe_supplier/app/pages/dashboard/DashboardOverview.tsx:1-99`

 

**Vấn đề:** Tất cả metrics hiển thị giá trị hardcode "0":

- Total Revenue: "0 đ"

- Total Orders: "0"

- Total Products: "0"

- Commission Paid: "0 đ"

 

**Backend APIs sẵn sàng:**

- `/api/suppliers/me/performance/overview`

- `/api/suppliers/me/performance/product-summary`

- `/api/suppliers/me/performance/order-summary`

 

**Khuyến nghị:** Tạo `dashboardService.ts` và tích hợp API

 

#### 15. Password Reset Flow Chưa Implement

 

**Files:**

- `website/fe_supplier/app/pages/profile/ForgotPassword.tsx` - Stub/empty

- `website/fe_supplier/app/pages/profile/ResetPassword.tsx` - Stub/empty

 

**Backend endpoints sẵn sàng:**

- `/api/auth/forgot-password`

- `/api/auth/verify-reset-otp`

- `/api/auth/reset-password`

 

**Khuyến nghị:** Thêm methods vào `authService.ts` và implement UI

 

#### 16. No Request Cancellation (Memory Leaks)

 

**File:** Tất cả page components

 

**Vấn đề:** Không sử dụng `AbortController` cho API calls

 

**Tác động:** Memory leak khi user navigate ra trước khi request hoàn thành

 

**Khuyến nghị:**

```typescript

useEffect(() => {

    const controller = new AbortController();

    fetchData({ signal: controller.signal });

    return () => controller.abort();

}, []);

```

 

#### 17. Race Condition Trong Registration Step 3

 

**File:** `website/fe_supplier/app/pages/profile/Registration.tsx:327-352`

 

**Vấn đề:** Upload 3 files tuần tự - nếu user navigate đi, sẽ có orphaned uploads

 

**Khuyến nghị:** Upload song song với `Promise.all()` và cleanup

 

#### 18. Không Xử Lý Suspended/Rejected Suppliers

 

**File:** `website/fe_supplier/app/pages/profile/Login.tsx`

 

**Vấn đề:** Login thành công ngay cả khi supplier status = SUSPENDED/REJECTED

 

**Khuyến nghị:** Kiểm tra status sau login và hiển thị thông báo phù hợp

 

---

 

## 🟡 VẤN ĐỀ MEDIUM PRIORITY

 

### Backend Issues

 

#### 19. Missing Status Transition Validation (Supplier)

 

**File:** `backend/src/main/java/com/example/backend/service/impl/SupplierServiceImpl.java:657-679`

 

**Vấn đề:** `updateStatus()` cho phép transition bất kỳ mà không validate

 

**Ví dụ sai:** REJECTED → PENDING_VERIFICATION, PENDING_DOCUMENTS → ACTIVE (bỏ qua các bước)

 

**Valid transitions:**

```

PENDING_VERIFICATION → PENDING_DOCUMENTS (Step 2)

PENDING_DOCUMENTS → PENDING_STORE_INFO (Step 3)

PENDING_STORE_INFO → PENDING_APPROVAL (Step 4)

PENDING_APPROVAL → ACTIVE/REJECTED (Admin approval)

ACTIVE ↔ SUSPENDED, ACTIVE ↔ PAUSE

```

 

#### 20. Missing Store Field Validation (Supplier Step 4)

 

**File:** `backend/src/main/java/com/example/backend/service/impl/SupplierServiceImpl.java:278-290`

 

**Vấn đề:** Validate business fields nhưng không validate store fields

 

```java

// ✅ Có validation

if (request.getBusinessName() == null || request.getBusinessName().isBlank()) {...}

 

// ❌ Không có validation

store.setStoreName(request.getStoreName());  // Có thể null/blank

store.setAddress(request.getStoreAddress());

store.setPhoneNumber(request.getStorePhoneNumber());

```

 

#### 21. Race Condition in Business Info Update Request (Supplier)

 

**File:** `backend/src/main/java/com/example/backend/service/impl/SupplierServiceImpl.java:994-999`

 

**Vấn đề:** Check pending update không có lock - 2 requests đồng thời có thể tạo duplicate

 

```java

if (pendingUpdateRepository.existsByEntityTypeAndEntityIdAndUpdateStatus(...)) {

    throw new ConflictException("Already pending...");

}

// ← Race condition window

pendingUpdateRepository.save(newRequest);

```

 

**Khuyến nghị:** Thêm unique constraint hoặc pessimistic lock

 

#### 22. Race Condition in Supplier Approval/Rejection

 

**File:** `backend/src/main/java/com/example/backend/service/impl/SupplierServiceImpl.java:531, 606`

 

**Vấn đề:** Status check không có lock - có thể approve và reject đồng thời

 

```java

// approveSupplier

if (supplier.getStatus() != SupplierStatus.PENDING_APPROVAL) {...}

 

// rejectSupplier

if (supplier.getStatus() != SupplierStatus.PENDING_APPROVAL) {...}

// Cả 2 có thể pass check nếu requests đến cùng lúc

```

 

#### 23. Missing Suspension Reason Storage (Admin)

 

**File:** `backend/src/main/java/com/example/backend/controller/AdminController.java:153`

 

```java

@Operation(summary = "Suspend admin", description = "Suspend an admin with a reason")

public ResponseEntity<ApiResponse<AdminResponse>> suspendAdmin(

    @PathVariable String userId,

    @RequestParam(required = false) String reason  // ← Nhận reason

) {

    // TODO: Store suspension reason in a separate table

    return ResponseEntity.ok(adminService.setActive(userId, false));

}

```

 

**Vấn đề:** Nhận `reason` nhưng không lưu - không có audit trail

 

#### 24. No Search Functionality (Admin)

 

**File:** `backend/src/main/java/com/example/backend/service/impl/AdminServiceImpl.java:280-303`

 

**Vấn đề:** `getAllAdmins()` chỉ filter theo role/status, không search theo username/email/fullName

 

**Tác động:** SUPER_ADMIN khó quản lý khi có nhiều admins

 

#### 25. Order Status Transition - No Shipment Validation

 

**File:** `backend/src/main/java/com/example/backend/service/impl/OrderServiceImpl.java:347`

 

```java

public OrderResponse markAsDelivered(String orderId) {

    Order order = orderRepository.findById(orderId)...

    Shipment shipment = order.getShipment();

    return completeDelivery(order, shipment);  // ← Không check shipment.status

}

```

 

**Đúng:** Phải check `shipment.getStatus() == ShipmentStatus.SHIPPING` trước khi DELIVERED

 

#### 26. No Admin Override for Order Cancellation

 

**File:** `backend/src/main/java/com/example/backend/service/impl/OrderServiceImpl.java:383-393`

 

```java

// ✅ Customer: Chỉ PENDING/CONFIRMED

// ✅ Supplier: Cho đến PREPARING

// ❌ Admin: Không có quyền force-cancel

```

 

**Khuyến nghị:** Admin nên có quyền cancel bất kỳ đơn hàng nào (với lý do)

 

---

 

### Frontend Supplier Issues

 

#### 27. Toàn Bộ Reports Pages Chưa Implement

 

**Files chưa implement:**

- `app/pages/reports/RevenueOverTime.tsx`

- `app/pages/reports/TopProducts.tsx`

- `app/pages/reports/DeliveryReport.tsx`

- `app/pages/reports/ReviewsAnalysis.tsx`

 

**Backend APIs sẵn sàng:**

- `/api/suppliers/me/performance/revenue-trend`

- `/api/suppliers/me/performance/product-summary`

- `/api/suppliers/me/performance/order-summary`

- `/api/suppliers/me/performance/export`

 

**Khuyến nghị:** Tạo `partnerPerformanceService.ts` và implement charts

 

#### 28. Delivery Management Chưa Có

 

**Files:**

- `app/pages/delivery/DeliveryAssign.tsx` - Stub

- `app/pages/delivery/DeliveryTracking.tsx` - Stub

 

**Backend có:** Shipment tracking endpoints

 

#### 29. Review Management Chưa Có

 

**File:** `app/pages/feedback/CustomerReviews.tsx`

 

**Backend có:** Review/rating endpoints

 

**Tác động:** Supplier không thể xem và phản hồi đánh giá khách hàng

 

#### 30. No Debouncing for Search Inputs

 

**Files:** Các list pages (Products, Orders)

 

**Vấn đề:** Gọi API mỗi lần nhập ký tự

 

**Khuyến nghị:** Thêm debounce 500ms

 

#### 31. Missing Services

 

Services cần tạo:

1. `dashboardService.ts` - Dashboard statistics

2. `partnerPerformanceService.ts` - Analytics & reports

3. `reviewService.ts` - Review management

4. `deliveryService.ts` - Delivery tracking

5. `settingsService.ts` - User preferences

 

#### 32. API Response Type Inconsistency

 

**Vấn đề:** 3 kiểu pagination khác nhau:

- `productService.ts` dùng `PaginatedResponse<T>`

- `orderService.ts` dùng `Page<T>`

- `storeService.ts` dùng `PageResponse<T>`

 

**Khuyến nghị:** Chuẩn hóa thành 1 kiểu duy nhất

 

---

 

## 🟢 VẤN ĐỀ LOW PRIORITY

 

### Backend

 

#### 33. Entity Default Status Không Khớp Business Rule

 

**Admin:**

- `Admin.java:23` - Default = `PENDING_APPROVAL`

- Business rule: Admins immediately `ACTIVE`

- Service sets đúng nhưng entity default gây nhầm lẫn

 

**Supplier:**

- `Supplier.java:55` - Default = `PENDING_APPROVAL`

- Registration flow: Step 1 set `PENDING_VERIFICATION`

 

**Khuyến nghị:** Sửa entity defaults cho khớp flow

 

#### 34. Phone Validation Inconsistency (Admin)

 

**Registration:**

```java

@Pattern(regexp = "^\\+?[0-9]{10,15}$")  // International

```

 

**Update:**

```java

@Pattern(regexp = "^(\\+84|0)[0-9]{9,10}$")  // Vietnam only

```

 

**Vấn đề:** Có thể register với format không update được

 

#### 35. Missing lastLoginIp Population (Admin)

 

**File:** `backend/src/main/java/com/example/backend/entity/Admin.java:19`

 

**Vấn đề:** Field `lastLoginIp` tồn tại nhưng không bao giờ được set

 

#### 36. Missing Password Management (Admin)

 

Thiếu endpoints:

- Forgot password

- Change password

- Reset password

 

Admin phải dùng Keycloak trực tiếp hoặc liên hệ SUPER_ADMIN

 

#### 37. No Delete Admin Functionality

 

**Vấn đề:** Không có endpoint xóa admin (soft/hard delete)

 

**Tác động:** Không dọn dẹp test accounts, không tuân thủ GDPR deletion requests

 

#### 38. No Audit Log

 

**Vấn đề:** Không có audit trail cho admin actions (role change, status change, suspensions)

 

**Tác động:** Không điều tra được unauthorized changes

 

---

 

### Frontend Supplier

 

#### 39. No Error Boundary

 

**Vấn đề:** App crash hoàn toàn khi component error

 

**Khuyến nghị:** Implement React error boundaries

 

#### 40. Loading State Commented Out

 

**File:** `website/fe_supplier/app/AuthContext.tsx:160`

 

```typescript

// if (isLoading) return <div>Loading...</div>; ← Commented out

```

 

**Tác động:** Flash of unauthenticated content

 

#### 41. No File Upload Progress

 

**Vấn đề:** Upload files lớn không có progress bar

 

**Tác động:** User không biết upload đang diễn ra

 

#### 42. Missing Empty States

 

**Vấn đề:** Một số list pages không xử lý tốt empty state

 

**Ví dụ:** Product list khi chưa có sản phẩm

 

#### 43. No Skeleton Loaders

 

**Vấn đề:** Loading dùng spinner thay vì skeleton UI

 

**Tác động:** Layout shift, poor UX

 

---

 

## 🔄 VẤN ĐỀ VỀ QUY TRÌNH NGHIỆP VỤ

 

### 1. Customer Journey Bị Gián Đoạn Hoàn Toàn ⚠️

 

```

[Không có frontend] → Không thể đăng ký → Không thể mua hàng → Business failed

```

 

**Quy trình đúng phải là:**

```

Customer browsing (Mobile/Web)

→ Register/Login via OTP

→ Browse stores & products

→ Add to cart (multi-store)

→ Apply promotions

→ Checkout & payment

→ Track order

→ Rate & review

→ Earn tier upgrades

```

 

**Hiện tại:** Toàn bộ quy trình này KHÔNG THỂ thực hiện

 

---

 

### 2. Supplier Registration Flow - Logic Issues

 

**Quy trình 4 bước:**

 

```

Step 1: Account Info + Password → Create Keycloak → Email OTP → PENDING_VERIFICATION

Step 2: Email OTP Verification → PENDING_DOCUMENTS

Step 3: Upload Documents (license, certificate, avatar) → PENDING_STORE_INFO

Step 4: Business + Store Info → PENDING_APPROVAL → Admin approval → ACTIVE + Wallet

```

 

**Vấn đề tìm được:**

 

✅ **Đúng:** Step 4 saves Supplier BEFORE creating Store (Rule #1)

✅ **Đúng:** Documents set in Step 3, NOT updated in Step 4 (Rule #3)

✅ **Đúng:** Default avatar assigned in Step 1 (Rule #4)

✅ **Đúng:** Status & active synchronized (Rule #2)

 

❌ **Sai #1:** OTP sending trong transaction boundary (Step 1) - có thể fail mà không rollback

❌ **Sai #2:** Wallet creation có thể fail nhưng supplier vẫn ACTIVE

❌ **Sai #3:** Keycloak sync failures không rollback local DB

❌ **Sai #4:** Không validate status transitions - admin có thể skip steps

❌ **Sai #5:** Frontend không handle SUSPENDED/REJECTED suppliers sau login

 

---

 

### 3. Admin Management Flow - Security Issues

 

**Quy trình:**

```

SUPER_ADMIN creates admin → Immediately ACTIVE → Assign role (MODERATOR/STAFF)

→ Admin operates → Can be suspended/reactivated → Role can be changed

```

 

**Vấn đề:**

 

❌ **Sai #1:** Suspended admin KHÔNG bị disable trong Keycloak → vẫn login được

❌ **Sai #2:** Có thể downgrade SUPER_ADMIN cuối cùng → lock out toàn bộ

❌ **Sai #3:** Suspension reason không được lưu → no audit trail

❌ **Sai #4:** External Keycloak calls trong transactions → timeout risks

 

---

 

### 4. Cart to Order Flow - Race Condition Risks

 

**Quy trình:**

```

Customer adds items to cart (per store)

→ System validates stock & prices

→ Apply promotions (tier-based)

→ Checkout: Create order + deduct stock + payment

→ Order tracking → Delivery → Complete

```

 

**Vấn đề race conditions:**

 

❌ **Sai #1:** Stock validation và deduction KHÔNG có pessimistic lock → overselling

❌ **Sai #2:** Cart validation có timing window trước checkout → stock có thể thay đổi

❌ **Sai #3:** Promotion usage count không atomic → vượt limit

❌ **Sai #4:** Wallet balance updates không có lock → số dư sai

 

**Scenarios dẫn đến lỗi:**

 

**Scenario 1: Overselling**

```

T1: User A checkout 100 items (stock = 100)

T2: User B checkout 50 items (stock = 100)

→ Both see stock available

→ Both orders created

→ Stock = -50 (VIOLATION)

```

 

**Scenario 2: Promotion Limit Exceeded**

```

T1: User A applies promotion (usage = 99/100)

T2: User B applies promotion (usage = 99/100)

→ Both see 1 slot available

→ Both orders created

→ Usage = 101/100 (VIOLATION)

```

 

**Khắc phục:**

- Add `@Lock(PESSIMISTIC_WRITE)` for StoreProduct queries

- Use `SERIALIZABLE` isolation for checkout

- Use atomic `incrementUsageCountIfAvailable()` for promotions

 

---

 

### 5. Order Cancellation Flow - Permission Issues

 

**Quy trình hiện tại:**

 

```

Customer: Chỉ cancel PENDING/CONFIRMED

Supplier: Cancel đến PREPARING

Admin: KHÔNG CÓ force-cancel capability

```

 

**Vấn đề:**

 

❌ **Sai #1:** Customer không thể REQUEST cancel PREPARING/SHIPPING (phải có OrderCancelRequest workflow)

❌ **Sai #2:** Không có approval flow cho cancel requests

❌ **Sai #3:** Admin không có quyền force-cancel bất kỳ order nào

❌ **Sai #4:** Promotion rollback có thể fail nếu usage count = 0

 

**Quy trình đúng nên là:**

 

```

Status      | Customer Action | Supplier Action | Admin Action

----------- | --------------- | --------------- | -------------

PENDING     | Cancel directly | Cancel directly | Force cancel

CONFIRMED   | Cancel directly | Cancel directly | Force cancel

PREPARING   | Request cancel  | Cancel directly | Force cancel

SHIPPING    | Request cancel  | Request cancel  | Force cancel

DELIVERED   | Return request  | No action       | Force cancel (refund)

```

 

---

 

### 6. Promotion Eligibility Flow - Logic Errors

 

**Promotion tiers:**

```

GENERAL           → All customers

BRONZE_PLUS       → Bronze tier and above

SILVER_PLUS       → Silver tier and above

GOLD_PLUS         → Gold tier and above

PLATINUM_PLUS     → Platinum tier and above

DIAMOND_ONLY      → Diamond tier only

BIRTHDAY          → Current month = birth month

FIRST_TIME        → No previous orders

```

 

**Vấn đề:**

 

❌ **Sai #1:** `BRONZE_PLUS` check returns `true` cho TẤT CẢ customers (CartServiceImpl.java:590)

 

**Code hiện tại:**

```java

case BRONZE_PLUS -> true;  // ❌ SAI

```

 

**Code đúng:**

```java

case BRONZE_PLUS -> customerTier.ordinal() >= CustomerTier.BRONZE.ordinal();

```

 

❌ **Sai #2:** `FIRST_TIME` đếm cả cancelled orders (CartServiceImpl.java:612-621)

 

**Code hiện tại:**

```java

long orderCount = orderRepository.countByCustomer(customer); // Tất cả orders

```

 

**Code đúng:**

```java

long orderCount = orderRepository.countByCustomerAndStatus(

    customer, OrderStatus.DELIVERED

);

```

 

---

 

### 7. Wallet & Commission Flow - Calculation Errors

 

**Quy trình:**

```

Order completed

→ Total amount = Order subtotal

→ Commission = Total × Commission rate (e.g., 15%)

→ Net amount = Total - Commission

→ Add to Supplier wallet pending balance

→ End-of-day: Release pending → available (if eligible)

→ Supplier withdrawal request

```

 

**Vấn đề:**

 

❌ **Sai #1:** Manual deposits (ADMIN_DEPOSIT) tính vào monthlyEarnings (WalletServiceImpl.java:647)

 

```java

case ADMIN_DEPOSIT:

    wallet.setMonthlyEarnings(wallet.getMonthlyEarnings().add(amount)); // ❌

```

 

**Impact:** Sai số liệu báo cáo, supplier "earnings" cao hơn thực tế

 

❌ **Sai #2:** Refund không validate xem order đã refund chưa (WalletServiceImpl.java:132)

 

**Impact:** Có thể refund nhiều lần cho cùng order

 

❌ **Sai #3:** End-of-month release không respect MINIMUM_WITHDRAWAL

 

**Code:** WalletServiceImpl.java:258-276

 

**Impact:** Release balance nhỏ hơn minimum, vi phạm business rule

 

---

 

### 8. Supplier Performance Reporting - Backend Ready, Frontend Missing

 

**Backend APIs hoàn chỉnh:**

 

```

GET /api/suppliers/me/performance/overview

→ Total revenue, orders, avg order value, top product

 

GET /api/suppliers/me/performance/product-summary

→ Revenue, orders, avg rating per product

 

GET /api/suppliers/me/performance/order-summary?period=MONTHLY

→ Order count & revenue by time period

 

GET /api/suppliers/me/performance/revenue-trend?period=WEEKLY

→ Revenue data for charts

 

GET /api/suppliers/me/performance/export?format=PDF

→ Export reports

```

 

**Frontend status:**

- ❌ `dashboardService.ts` - NOT EXIST

- ❌ `partnerPerformanceService.ts` - NOT EXIST

- ❌ Dashboard shows hardcoded "0" values

- ❌ All report pages are stubs

- ❌ No charts implemented

 

**Impact:** Supplier không thấy doanh thu, đơn hàng, performance metrics → không thể đánh giá kinh doanh

 

---

 

## 📋 KHUYẾN NGHỊ ƯU TIÊN

 

### 🔴 CRITICAL - Khắc phục ngay (1-2 tuần)

 

1. **Xây dựng Customer Frontend** (QUAN TRỌNG NHẤT)

   - Quyết định: Web app (fe_customer) vs Mobile app vs Cả 2

   - Implement: Auth + Product browsing + Cart + Checkout

   - Timeline: 2-4 tuần cho MVP

 

2. **Fix Backend Race Conditions**

   - Add pessimistic locks: StoreProduct, Wallet, Promotion

   - Use SERIALIZABLE isolation: Cart, Checkout

   - Timeline: 3-5 ngày

 

3. **Fix Critical Security Issues**

   - Admin suspension → disable Keycloak account

   - Prevent SUPER_ADMIN downgrade

   - Timeline: 2 ngày

 

4. **Fix Supplier Wallet Creation**

   - Fail transaction if wallet creation fails

   - Timeline: 1 ngày

 

5. **Fix Promotion Logic Errors**

   - BRONZE_PLUS eligibility check

   - FIRST_TIME only count delivered orders

   - Timeline: 1 ngày

 

### 🟠 HIGH - Sớm nhất có thể (2-4 tuần)

 

6. **Implement Frontend Supplier Dashboard Stats**

   - Create dashboardService.ts

   - Integrate performance APIs

   - Timeline: 3 ngày

 

7. **Fix Transaction Boundaries**

   - Move OTP/Keycloak calls outside transactions

   - Implement proper rollback

   - Timeline: 5 ngày

 

8. **Add Status Transition Validation**

   - Supplier status transitions

   - Order status transitions

   - Timeline: 2 ngày

 

9. **Implement Password Reset Flow**

   - Frontend: ForgotPassword + ResetPassword pages

   - Service layer integration

   - Timeline: 2 ngày

 

10. **Fix Memory Leaks (Frontend)**

    - Add AbortController to all API calls

    - Cleanup on unmount

    - Timeline: 2 ngày

 

### 🟡 MEDIUM - Có thể đợi (1-2 tháng)

 

11. **Implement Partner Performance Reports**

    - Create partnerPerformanceService

    - Build chart components

    - All report pages

    - Timeline: 1 tuần

 

12. **Add Missing Frontend Features**

    - Delivery management

    - Review management

    - Settings page

    - Timeline: 2 tuần

 

13. **Improve Validation**

    - Store fields in Step 4

    - Email uniqueness at DB level

    - Timeline: 3 ngày

 

14. **Add Audit Logging**

    - Admin action logs

    - Suspension reasons

    - Timeline: 1 tuần

 

15. **Implement OrderCancelRequest Workflow**

    - Entity + Repository + Service + Controller

    - Frontend integration

    - Timeline: 1 tuần

 

### 🟢 LOW - Nice to have (Khi có thời gian)

 

16. **Code Quality Improvements**

    - Standardize pagination types

    - Fix entity default values

    - Add error boundaries

    - Timeline: 1 tuần

 

17. **UX Enhancements**

    - Skeleton loaders

    - Optimistic updates

    - Debounced search

    - Timeline: 1 tuần

 

18. **Missing Admin Features**

    - Search functionality

    - Bulk operations

    - Delete accounts

    - Timeline: 1 tuần

 

---

 

## 📊 TỔNG KẾT

 

### Vấn đề nghiêm trọng nhất

 

1. **KHÔNG CÓ CUSTOMER FRONTEND** - Business không thể vận hành

2. **Race conditions trong stock & wallet** - Mất tiền, overselling

3. **Security holes (admin suspension)** - Rủi ro bảo mật

4. **Promotion logic errors** - Khách hàng dùng sai promotion

 

### Vấn đề cấu trúc

 

1. **Transaction boundaries sai** - External APIs trong transactions

2. **Thiếu pessimistic locks** - Nhiều race conditions

3. **Frontend incomplete** - Nhiều features chưa làm

4. **Keycloak sync issues** - Mất đồng bộ data

 

### Điểm tích cực

 

✅ Backend architecture tốt, RESTful APIs đầy đủ

✅ Security config với JWT + Role-based access

✅ MapStruct + Lombok setup đúng

✅ Service layer pattern rõ ràng

✅ Supplier registration flow đúng logic (trừ async issues)

✅ Cart & Order entities design tốt

✅ Promotion system phức tạp nhưng đầy đủ (chỉ cần fix logic)

 

### Roadmap khuyến nghị

 

**Phase 1 (1 tháng):** Fix critical issues + Build Customer MVP

**Phase 2 (1 tháng):** Complete Supplier dashboard + Reports

**Phase 3 (1 tháng):** Add missing features + Improve UX

**Phase 4 (ongoing):** Monitoring, optimization, new features

 

---
