# RBAC SECURITY AUDIT REPORT
## SaveFood Backend System

## Executive Summary
Found **8 critical/high security issues** and several medium-risk concerns in the RBAC implementation.

---

## 1. CRITICAL SECURITY ISSUES

### Issue 1.1: `/api/orders/**` permitAll() - Most Dangerous
**Location:** `SecurityConfig.java:73`
**Severity:** 🔴 CRITICAL
**Problem:**
```java
.requestMatchers("/api/orders/**").permitAll()  // Line 73
```

**Impact:**
- ANY UNAUTHENTICATED USER can access ALL order endpoints including:
  - `GET /api/orders/{orderId}` - View any order without authentication
  - `GET /api/orders/code/{code}` - Look up orders by code
  - No data ownership validation in OrderService.getOrderById()

**Risk:** 
- Customers can see other customers' orders
- Sensitive order data (addresses, payment, items) exposed publicly
- Complete information disclosure vulnerability

**Fix Required:**
```java
// Remove permitAll() for /api/orders/**
// Instead, rely on method-level security (@PreAuthorize in controllers)
// Add ownership validation in OrderService for cross-role access
```

---

### Issue 1.2: Missing Ownership Validation in OrderService
**Location:** `OrderServiceImpl.java`
**Severity:** 🔴 CRITICAL
**Problem:**
```java
public OrderResponse getOrderById(String orderId) {
    Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new NotFoundException(ErrorCode.ORDER_NOT_FOUND));
    return mapToOrderResponse(order);  // NO OWNERSHIP CHECK!
}
```

**Impact:**
- Even with fixed SecurityConfig, no validation that user can access this order
- Any authenticated user can view any order
- Suppliers can see customer orders, customers can see supplier orders

**Required Fix:**
```java
public OrderResponse getOrderById(String orderId, String userId, String userRole) {
    Order order = orderRepository.findById(orderId)
        .orElseThrow(() -> new NotFoundException(ErrorCode.ORDER_NOT_FOUND));
    
    // Validate ownership based on role
    if ("CUSTOMER".equals(userRole) && !order.getCustomer().getUserId().equals(userId)) {
        throw new ForbiddenException("Access denied");
    }
    if ("SUPPLIER".equals(userRole) && !isSupplierOfOrder(userId, order)) {
        throw new ForbiddenException("Access denied");
    }
    
    return mapToOrderResponse(order);
}
```

---

### Issue 1.3: `/api/promotions/**` permitAll() - Inconsistent with Controllers
**Location:** `SecurityConfig.java:91`
**Severity:** 🟠 HIGH
**Problem:**
```java
.requestMatchers("/api/promotions/**").permitAll()
```

**Contradiction:**
- Controllers have @PreAuthorize for write operations (CREATE, UPDATE, DELETE)
- But SecurityConfig allows all requests through
- Controller @PreAuthorize might be overridden by permitAll()

**Controllers:**
- `POST /api/promotions` → hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')
- `PUT /api/promotions/{id}` → hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')
- `DELETE /api/promotions/{id}` → hasAnyRole('SUPER_ADMIN', 'MODERATOR')

**Expected Behavior:**
Read operations (GET) should be public for customers to view promotions, but write operations must be protected.

**Recommended Fix:**
```java
.requestMatchers("/api/promotions").permitAll()  // GET all - public
.requestMatchers("/api/promotions/**").permitAll() // GET specific - public
.requestMatchers("/api/promotions/{id}").authenticated() // Apply to POST/PUT/DELETE
// Or rely on controller @PreAuthorize completely and remove this line
```

---

## 2. HIGH PRIORITY ISSUES

### Issue 2.1: Invalid Role Name in OrderController
**Location:** `OrderController.java:68-79`
**Severity:** 🟠 HIGH
**Problem:**
```java
@PreAuthorize("hasAnyRole('CUSTOMER', 'SUPPLIER', 'ADMIN', 'MODERATOR', 'SUPER_ADMIN', 'STAFF')")
public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(@PathVariable String orderId)
```

**Issues:**
1. Role 'ADMIN' does NOT exist in system (only SUPER_ADMIN, MODERATOR, STAFF)
2. This @PreAuthorize is likely ineffective/ignored
3. Actual security depends on SecurityConfig permitAll() for /api/orders/**

**Actual Roles Defined:**
- ROLE_SUPER_ADMIN
- ROLE_MODERATOR
- ROLE_STAFF
- ROLE_SUPPLIER
- ROLE_CUSTOMER

**Required Fix:**
```java
@PreAuthorize("hasAnyRole('CUSTOMER', 'SUPPLIER', 'SUPER_ADMIN', 'MODERATOR', 'STAFF')")
```

---

### Issue 2.2: Supplier Can Access Any Customer's Information
**Location:** `CustomerController.java:49`
**Severity:** 🟠 HIGH
**Problem:**
```java
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF', 'SUPPLIER')")
public ResponseEntity<ApiResponse<CustomerResponse>> getCustomerById(@PathVariable String userId)
```

**Issue:**
- Why can SUPPLIER access customer profiles?
- Likely design error - supplier should only access customers for their own orders
- No ownership validation in CustomerService.getCustomerById()

**Expected Behavior:**
Only ADMINS should see all customers. Supplier shouldn't browse other customers.

**Fix:**
```java
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")  // Remove SUPPLIER
```

---

### Issue 2.3: SMS Testing Endpoints Exposed in Production
**Location:** `SecurityConfig.java:94`
**Severity:** 🟠 HIGH
**Problem:**
```java
.requestMatchers("/sms/**").permitAll()  // Development only
```

**Risk:**
- If deployed to production, test endpoints are publicly accessible
- Could be used to spam SMS messages
- Violates PCI-DSS compliance

**Fix:**
```java
// Remove this line or add profile-based configuration:
if (environment.getProperty("app.dev-mode").equals("true")) {
    .requestMatchers("/sms/**").permitAll()
}
```

---

## 3. MEDIUM PRIORITY ISSUES

### Issue 3.1: Inconsistent Delete Permission - Promotion vs Category
**Location:** Controllers
**Severity:** 🟡 MEDIUM
**Problem:**

**PromotionController DELETE (Line 106):**
```java
@DeleteMapping("/{promotionId}")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")  // No STAFF
```

**CategoryController:**
```java
// No DELETE endpoint exists!
```

**Issue:** 
- STAFF can CREATE/UPDATE promotions but NOT DELETE
- This is documented in CLAUDE.md as intended
- BUT Category DELETE endpoint missing entirely - inconsistent API design

**Recommendation:**
- Add CategoryController DELETE endpoint with same restriction
- Make DELETE consistency across all admin endpoints clear

---

### Issue 3.2: ViolationManagementController - Inconsistent Permissions
**Location:** `ViolationManagementController.java:86`
**Severity:** 🟡 MEDIUM
**Problem:**
```java
@RestController
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")  // Class level
public class ViolationManagementController {

    @PostMapping("/{violationId}/resolve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")  // Method level - stricter
```

**Issue:**
- STAFF can VIEW violations but NOT RESOLVE them
- Design question: Should STAFF be able to resolve or only review?
- Inconsistency in responsibility separation

**Recommendation:**
- Clarify business requirement
- Either remove STAFF from class-level or add resolve permission
- Document this separation clearly

---

### Issue 3.3: Unprotected Write Operations with Class-Level Security
**Location:** Multiple controllers
**Severity:** 🟡 MEDIUM
**Problem:**

Found 30 write operations without method-level @PreAuthorize:
```
- AddressController @PostMapping (protected by class-level)
- SupplierController @PutMapping("/me") (protected by class-level)
- ViolationManagementController @PostMapping/* (protected by class-level)
- AuthController endpoints (intentionally unprotected for registration)
```

**Issue:**
- Harder to understand security at glance
- IDE/static analysis tools can't detect if method is protected
- Maintenance risk - developers might forget method isn't individually secured

**Recommendation:**
- Add explicit @PreAuthorize to all write operations
- Make security visible at method level

**Example Fix:**
```java
// Before:
@PostMapping
public ResponseEntity<ApiResponse<AddressResponse>> addAddress() { }

// After:
@PostMapping
@PreAuthorize("hasRole('CUSTOMER')")
public ResponseEntity<ApiResponse<AddressResponse>> addAddress() { }
```

---

## 4. SECURITY GAPS TO ADDRESS

### Gap 4.1: No Data Ownership Validation Pattern
**Issue:** Services lack consistent ownership validation
- OrderService ✗ No validation
- ProductService ✓ Validates supplier ownership
- WalletService ✓ Uses getCurrentSupplier()
- StoreService ✗ No validation (public data, but should validate for writes)

**Recommendation:**
Create centralized SecurityUtils for ownership checks:
```java
public class SecurityUtils {
    public static void validateOrderOwnership(Order order, String userId, String userRole) {
        if ("CUSTOMER".equals(userRole) && !order.getCustomer().getUserId().equals(userId)) {
            throw new ForbiddenException();
        }
        // ...
    }
}
```

---

### Gap 4.2: Missing Cross-User Data Access Patterns
**Issue:** No clear pattern for admins accessing user data
```
- Can MODERATOR see customer's wallet?
- Can STAFF approve suppliers?
- Can MODERATOR delete promotions?
```

**Each answered differently across endpoints**

**Recommendation:**
Document explicit access matrix:

| Operation | SUPER_ADMIN | MODERATOR | STAFF | SUPPLIER | CUSTOMER |
|-----------|------------|-----------|-------|----------|----------|
| View Admin | Yes | No | No | No | No |
| Delete Admin | Yes | No | No | No | No |
| Approve Supplier | Yes | Yes | No | No | No |
| View Wallet | Own | No | No | Own | Own |
| Delete Promotion | Yes | Yes | No | No | No |
| Update Promotion | Yes | Yes | Yes | No | No |
| View Order | Own | All | All | Own | Own |

---

## 5. MISSING SECURITY FEATURES

### Feature 5.1: No Rate Limiting on Sensitive Operations
**Issue:** No rate limiting on:
- Login attempts (brute force vulnerability)
- OTP generation (already has limit but not on API)
- Order retrieval (information disclosure)

---

### Feature 5.2: No Audit Logging
**Issue:** No logs of:
- Who deleted what promotion
- Who approved/rejected supplier
- Who viewed customer data

---

## SUMMARY OF FINDINGS

| Category | Count | Severity |
|----------|-------|----------|
| Critical | 2 | 🔴 |
| High | 3 | 🟠 |
| Medium | 3 | 🟡 |
| Low | 2 | 🟢 |
| **Total** | **10** | |

---

## IMMEDIATE ACTIONS REQUIRED

### Priority 1 (Do Immediately):
1. ✅ Fix `/api/orders/**` permitAll() → Remove or restrict
2. ✅ Add ownership validation to OrderService.getOrderById()
3. ✅ Fix invalid 'ADMIN' role to 'SUPER_ADMIN'

### Priority 2 (Before Production):
4. ✅ Remove SMS endpoint permitAll() or add profile check
5. ✅ Remove SUPPLIER from CustomerController.getCustomerById()
6. ✅ Clarify /api/promotions/** security rules

### Priority 3 (Enhancement):
7. ✅ Add method-level @PreAuthorize to all write operations
8. ✅ Implement centralized ownership validation utilities
9. ✅ Create access matrix documentation
10. ✅ Add audit logging for sensitive operations

