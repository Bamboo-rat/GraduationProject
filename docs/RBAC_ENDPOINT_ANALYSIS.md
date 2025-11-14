# DETAILED ENDPOINT SECURITY ANALYSIS

## 1. ORDER ENDPOINTS - CRITICAL RISK

### Vulnerable Endpoints
```
GET /api/orders/{orderId}
GET /api/orders/code/{orderCode}
```

**Current State:**
- SecurityConfig: `permitAll()` (Line 73)
- OrderController: hasAnyRole('CUSTOMER', 'SUPPLIER', 'ADMIN', 'MODERATOR', 'SUPER_ADMIN', 'STAFF')
- OrderService: No ownership validation

**Attack Scenario:**
```
1. Attacker requests: GET /api/orders/order123 (no authentication)
2. Response: Complete order details (customer address, items, payment)
3. Attacker enumerates order IDs or uses: GET /api/orders/code/ORDER-CODE
4. Sensitive data leak successful
```

**Required Fixes:**
```java
// 1. Remove permitAll from SecurityConfig
// Before:
.requestMatchers("/api/orders/**").permitAll()

// After:
// Remove this line entirely - use controller @PreAuthorize

// 2. Fix controller @PreAuthorize (remove invalid 'ADMIN' role)
@GetMapping("/{orderId}")
@PreAuthorize("hasAnyRole('CUSTOMER', 'SUPPLIER', 'SUPER_ADMIN', 'MODERATOR', 'STAFF')")
public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(@PathVariable String orderId) { }

// 3. Add ownership validation to service
public OrderResponse getOrderById(String orderId) {
    Order order = orderRepository.findById(orderId)
        .orElseThrow(() -> new NotFoundException(ErrorCode.ORDER_NOT_FOUND));
    
    // Validate user can access this order
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    String userId = extractUserId(auth);
    String userRole = extractRole(auth);
    
    validateOrderAccess(order, userId, userRole);
    return mapToOrderResponse(order);
}

private void validateOrderAccess(Order order, String userId, String userRole) {
    switch(userRole) {
        case "ROLE_CUSTOMER":
            if (!order.getCustomer().getUserId().equals(userId)) {
                throw new ForbiddenException("Cannot access other customer's order");
            }
            break;
        case "ROLE_SUPPLIER":
            if (!isSupplierOfOrder(userId, order)) {
                throw new ForbiddenException("Cannot access order outside your stores");
            }
            break;
        case "ROLE_SUPER_ADMIN", "ROLE_MODERATOR", "ROLE_STAFF":
            // Admins can view all orders
            break;
    }
}
```

---

## 2. CUSTOMER ENDPOINTS - HIGH RISK

### Problematic Endpoint
```
GET /api/customers/{userId}
```

**Current State:**
- @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF', 'SUPPLIER')")
- No ownership validation in service

**Issue:**
- SUPPLIER shouldn't be able to browse any customer
- CustomerService.getCustomerById() has no access control

**Attack:**
```
Supplier calls: GET /api/customers/customer-id-123
Response: Full customer profile (address, phone, spending habits)
Competitor suppliers can profile customers
```

**Required Fix:**
```java
// Controller fix
@GetMapping("/{userId}")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")  // Remove SUPPLIER
public ResponseEntity<ApiResponse<CustomerResponse>> getCustomerById(@PathVariable String userId) {
    // Only admins can view any customer
    CustomerResponse response = customerService.getCustomerById(userId);
    return ResponseEntity.ok(ApiResponse.success(response));
}
```

---

## 3. PROMOTION ENDPOINTS - MEDIUM RISK

### Configuration Conflict
```
SecurityConfig: .requestMatchers("/api/promotions/**").permitAll()
PromotionController:
  - POST: hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')
  - PUT: hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')
  - DELETE: hasAnyRole('SUPER_ADMIN', 'MODERATOR')
  - GET: No @PreAuthorize (public)
```

**Conflict Analysis:**
- permitAll() in SecurityConfig applies to ALL requests to /api/promotions/**
- When permitAll() is specified, it takes precedence
- Controller @PreAuthorize might not be evaluated

**Test to Verify:**
```bash
# Try to delete promotion without authentication
curl -X DELETE http://localhost:8080/api/promotions/promo-id-123

# If this returns success, the bug is confirmed
# If it returns 403, then controller @PreAuthorize is working
```

**Recommendation:**
```java
// SecurityConfig - Option 1: Remove permitAll for promotions
// Delete line: .requestMatchers("/api/promotions/**").permitAll()

// SecurityConfig - Option 2: Separate GET from write operations
.requestMatchers("/api/promotions").permitAll()  // GET all
.requestMatchers("/api/promotions/{id}").permitAll()  // GET one
// POST/PUT/DELETE will be protected by controller @PreAuthorize

// Option 3 (Best): Let controller handle all security
// Remove the entire /api/promotions line from SecurityConfig
```

---

## 4. ADMIN ENDPOINTS - Properly Secured

```
POST /api/admins/register
@PreAuthorize("hasRole('SUPER_ADMIN')")  ✅

GET /api/admins
@PreAuthorize("hasRole('SUPER_ADMIN')")  ✅

PATCH /api/admins/{userId}/approve
@PreAuthorize("hasRole('SUPER_ADMIN')")  ✅

DELETE /api/admins/{userId}
// No delete operation? 🟡 Potential gap

PUT /api/admins/{userId}/role
@PreAuthorize("hasRole('SUPER_ADMIN')")  ✅
```

---

## 5. PRODUCT ENDPOINTS - Properly Secured

```
POST /api/products
@PreAuthorize("hasRole('SUPPLIER')")  ✅

DELETE /api/products/{id}
@PreAuthorize("hasRole('SUPPLIER')")  ✅
+ Service validates ownership  ✅

PUT /api/products/{id}
// Not shown in controller, check if implemented
```

---

## 6. FILE UPLOAD ENDPOINTS - Potential Risk

```
POST /api/files/upload/business-license
POST /api/files/upload/food-safety-certificate
POST /api/files/upload/supplier-logo
@Security: permitAll()  🔴 RISKY!
```

**Issues:**
- Anyone can upload files
- Could lead to storage abuse or malware upload
- These should require authentication

**Should Be:**
```
POST /api/files/upload/business-license
@PreAuthorize("hasRole('SUPPLIER')")

POST /api/files/upload/food-safety-certificate
@PreAuthorize("hasRole('SUPPLIER')")

POST /api/files/upload/supplier-logo
@PreAuthorize("hasRole('SUPPLIER')")
```

---

## 7. ENDPOINTS WITH PROTECTED WRITE, EXPOSED READ

### Category Endpoints
```
POST /api/categories - PROTECTED: hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')
PUT /api/categories/{id} - PROTECTED: hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')
PATCH /api/categories/{id}/toggle-active - PROTECTED: hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')
GET /api/categories - PUBLIC: permitAll()  ✅
DELETE /api/categories/{id} - MISSING! 🟡
```

**Issue:**
No way to delete categories. Design question: Should this be possible?

---

## 8. SMS ENDPOINTS - HIGH RISK

```
GET /api/sms/**
POST /api/sms/**
@Security: permitAll()  🔴 DEVELOPMENT ONLY!
```

**Risk:**
- If deployed to production, test SMS endpoints are publicly accessible
- Can send unlimited SMS via test endpoints
- Cost and spam vector

**Fix:**
```java
// Option 1: Remove entirely for production
// In application-prod.properties:
// Comment out or remove SMS controller bean

// Option 2: Profile-based security
@Configuration
public class SmsSecurityConfig {
    @Bean
    @ConditionalOnProperty(name = "app.dev-mode", havingValue = "true")
    public SecurityFilterChain devSecurityChain(HttpSecurity http) {
        // Allow SMS endpoints in dev
        return http.build();
    }
}

// Option 3: IP whitelist
.requestMatchers("/sms/**").hasIpAddress("127.0.0.1")
```

---

## 9. AUTHENTICATION ENDPOINTS - Correctly Unsecured

```
POST /api/auth/login - permitAll()  ✅
POST /api/auth/register/** - permitAll()  ✅
POST /api/auth/refresh - permitAll()  ✅
POST /api/auth/forgot-password - permitAll()  ✅
POST /api/auth/reset-password - permitAll()  ✅
```

**These are correct - users need to authenticate first**

---

## ENDPOINT SECURITY CHECKLIST

### Critical Endpoints Needing Review
- [x] GET /api/orders/* - Missing ownership validation
- [x] GET /api/customers/{id} - Supplier access not validated
- [x] GET /api/promotions/* - Config/controller conflict
- [x] POST /api/files/upload/* - Overly permissive
- [x] GET /api/sms/* - Development endpoint in production

### Good Examples to Follow
- [x] ProductService.deleteProduct() - Validates supplier ownership
- [x] WalletService.getMyWallet() - Uses getCurrentSupplier()
- [x] AdminController - Consistent @PreAuthorize on all methods
- [x] CartController - All endpoints protected by class-level @PreAuthorize

---

## IMPLEMENTATION PRIORITY

### P0 (Critical - Do Now)
1. Remove `/api/orders/**` permitAll()
2. Add ownership validation to OrderService
3. Fix invalid 'ADMIN' role in OrderController

### P1 (High - Before Release)
4. Remove SUPPLIER from CustomerController.getCustomerById()
5. Resolve /api/promotions SecurityConfig conflict
6. Protect file upload endpoints with authentication

### P2 (Medium - Soon)
7. Remove or protect /sms/** endpoints
8. Add method-level @PreAuthorize to class-level protected methods
9. Implement centralized ownership validation

### P3 (Nice to Have)
10. Add audit logging
11. Create access control documentation matrix
12. Implement rate limiting on sensitive operations

