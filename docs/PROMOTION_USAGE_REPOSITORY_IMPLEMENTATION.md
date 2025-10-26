# PromotionUsageRepository Implementation & Per-Customer Tracking

## Overview

This document describes the implementation of `PromotionUsageRepository` and the integration of per-customer usage tracking for promotions. This completes the promotion system by enabling per-customer usage limits and linking usage records with validation logs.

---

## Problem Statement

### Before Implementation

**Missing functionality:**
1. **No per-customer usage tracking**: Could validate promotion but couldn't enforce "1 use per customer" limit
2. **No usage audit trail**: No record of which customers used which promotions
3. **No discount tracking**: Couldn't calculate total savings per customer or total discount given per promotion
4. **Incomplete validation logs**: Validation logs existed but had no link to actual usage

**Example Issue:**
```java
// Promotion: "NEWUSER20" - 20% off, limit 1 per customer
// Customer A validates: ✅ Pass (usage count = 0)
// Customer A applies to Order #1: ✅ Success
// Customer A validates again: ❌ Should fail but passed (no tracking!)
// Customer A applies to Order #2: ❌ Should fail but succeeded!
```

---

## Solution Architecture

### Components

1. **PromotionUsageRepository** - Repository with tracking queries
2. **Updated PromotionServiceImpl** - Integrated per-customer checks and usage recording
3. **Validation Log Linking** - Connect validation attempts to actual usage

### Database Relationships

```
PromotionValidationLog (validation attempts)
    ├─ applied: boolean (false initially)
    └─ appliedAt: timestamp (set when applied)
         ↓
    Links to PromotionUsage when promotion is actually used
         ↓
PromotionUsage (actual usage records)
    ├─ promotion: Promotion entity
    ├─ customer: Customer entity
    ├─ order: Order entity (set when order is created)
    ├─ orderAmount: BigDecimal
    ├─ discountAmount: BigDecimal
    └─ usedAt: timestamp
```

---

## PromotionUsageRepository

### Key Methods

#### 1. Count Customer Usage

```java
@Query("SELECT COUNT(pu) FROM PromotionUsage pu " +
       "WHERE pu.promotion.promotionId = :promotionId " +
       "AND pu.customer.userId = :customerId")
long countByPromotionAndCustomer(
    @Param("promotionId") String promotionId,
    @Param("customerId") String customerId
);
```

**Usage:**
```java
// Check if customer has reached usage limit
long usageCount = promotionUsageRepository.countByPromotionAndCustomer(
    promotion.getPromotionId(),
    customer.getUserId()
);

if (usageCount >= promotion.getUsagePerCustomerLimit()) {
    throw new BadRequestException("You have already used this promotion");
}
```

#### 2. Check If Customer Used Promotion

```java
@Query("SELECT CASE WHEN COUNT(pu) > 0 THEN true ELSE false END " +
       "FROM PromotionUsage pu " +
       "WHERE pu.promotion.promotionId = :promotionId " +
       "AND pu.customer.userId = :customerId")
boolean hasCustomerUsedPromotion(
    @Param("promotionId") String promotionId,
    @Param("customerId") String customerId
);
```

**Usage:**
```java
// For one-time only promotions
if (promotionUsageRepository.hasCustomerUsedPromotion(promotionId, customerId)) {
    throw new BadRequestException("You have already used this one-time promotion");
}
```

#### 3. Get Total Savings

```java
// Total discount given by a promotion
@Query("SELECT COALESCE(SUM(pu.discountAmount), 0) FROM PromotionUsage pu " +
       "WHERE pu.promotion.promotionId = :promotionId")
BigDecimal getTotalDiscountByPromotion(@Param("promotionId") String promotionId);

// Total savings for a customer
@Query("SELECT COALESCE(SUM(pu.discountAmount), 0) FROM PromotionUsage pu " +
       "WHERE pu.customer.userId = :customerId")
BigDecimal getTotalSavingsByCustomer(@Param("customerId") String customerId);
```

**Usage:**
```java
// Admin dashboard: Show how much discount each promotion has given
BigDecimal totalDiscount = promotionUsageRepository.getTotalDiscountByPromotion(promotionId);
// Output: "SAVE20 has given $12,450 in discounts"

// Customer profile: Show total savings
BigDecimal totalSavings = promotionUsageRepository.getTotalSavingsByCustomer(customerId);
// Output: "You've saved $234 with promotions!"
```

#### 4. Fraud Detection

```java
@Query("SELECT COUNT(pu) FROM PromotionUsage pu " +
       "WHERE pu.promotion.promotionId = :promotionId " +
       "AND pu.customer.userId = :customerId " +
       "AND pu.usedAt >= :since")
long countUsageInTimeWindow(
    @Param("promotionId") String promotionId,
    @Param("customerId") String customerId,
    @Param("since") LocalDateTime since
);
```

**Usage:**
```java
// Detect suspicious behavior: Same customer using same promotion 5 times in 1 hour
LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
long recentUsage = promotionUsageRepository.countUsageInTimeWindow(
    promotionId, customerId, oneHourAgo
);

if (recentUsage >= 5) {
    log.warn("Suspicious promotion usage detected: customer={}, promotion={}",
            customerId, promotionId);
    // Flag for admin review
}
```

#### 5. Most Popular Promotions

```java
@Query("SELECT pu.promotion.promotionId, pu.promotion.code, COUNT(pu) as usageCount " +
       "FROM PromotionUsage pu " +
       "WHERE pu.usedAt >= :since " +
       "GROUP BY pu.promotion.promotionId, pu.promotion.code " +
       "ORDER BY usageCount DESC")
List<Object[]> getMostPopularPromotions(@Param("since") LocalDateTime since);
```

**Usage:**
```java
// Admin dashboard: Show top 10 promotions
LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
List<Object[]> topPromotions = promotionUsageRepository.getMostPopularPromotions(thirtyDaysAgo);

for (Object[] row : topPromotions) {
    String code = (String) row[1];
    Long usageCount = (Long) row[2];
    System.out.println(code + ": " + usageCount + " uses");
}
// Output:
// SAVE20: 1,234 uses
// NEWUSER10: 856 uses
// FLASH50: 623 uses
```

#### 6. Promotion Statistics

```java
@Query("SELECT " +
       "COUNT(DISTINCT pu.customer.userId) as uniqueCustomers, " +
       "COUNT(pu) as totalUsages, " +
       "COALESCE(AVG(pu.orderAmount), 0) as avgOrderAmount, " +
       "COALESCE(AVG(pu.discountAmount), 0) as avgDiscountAmount, " +
       "COALESCE(SUM(pu.discountAmount), 0) as totalDiscountGiven " +
       "FROM PromotionUsage pu " +
       "WHERE pu.promotion.promotionId = :promotionId")
Object[] getPromotionStatistics(@Param("promotionId") String promotionId);
```

**Usage:**
```java
Object[] stats = promotionUsageRepository.getPromotionStatistics(promotionId);
Long uniqueCustomers = (Long) stats[0];
Long totalUsages = (Long) stats[1];
BigDecimal avgOrderAmount = (BigDecimal) stats[2];
BigDecimal avgDiscountAmount = (BigDecimal) stats[3];
BigDecimal totalDiscountGiven = (BigDecimal) stats[4];

System.out.printf("""
    Promotion: SAVE20
    Unique Customers: %d
    Total Uses: %d
    Avg Order: $%.2f
    Avg Discount: $%.2f
    Total Discount Given: $%.2f
    """,
    uniqueCustomers, totalUsages, avgOrderAmount, avgDiscountAmount, totalDiscountGiven
);
```

---

## Updated PromotionServiceImpl

### Changes to validatePromotionCode()

**Added per-customer usage check:**

```java
// Check per-customer usage limit
if (promotion.getUsagePerCustomerLimit() != null) {
    long customerUsageCount = promotionUsageRepository.countByPromotionAndCustomer(
            promotion.getPromotionId(), customerId);

    if (customerUsageCount >= promotion.getUsagePerCustomerLimit()) {
        validationStatus = PromotionValidationStatus.ALREADY_USED;
        errorMessage = String.format("You have already used this promotion %d times (limit: %d)",
                customerUsageCount, promotion.getUsagePerCustomerLimit());
        throw new BadRequestException(ErrorCode.PROMOTION_NOT_APPLICABLE, errorMessage);
    }
}
```

**Before:**
```java
// TODO: Check per-customer usage limit (requires PromotionUsage repository)
// This would need to query the PromotionUsage table...
```

**After:**
```java
// ✅ Fully implemented per-customer usage check
```

### Changes to applyPromotionToOrder()

**New steps added:**

```java
// Step 3: Check per-customer usage limit BEFORE incrementing
if (promotion.getUsagePerCustomerLimit() != null) {
    long customerUsageCount = promotionUsageRepository.countByPromotionAndCustomer(
            promotion.getPromotionId(), customerId);

    if (customerUsageCount >= promotion.getUsagePerCustomerLimit()) {
        throw new BadRequestException(ErrorCode.PROMOTION_NOT_APPLICABLE,
                String.format("You have already used this promotion %d times (limit: %d)",
                        customerUsageCount, promotion.getUsagePerCustomerLimit()));
    }
}

// ... existing total usage check ...

// Step 7: Calculate discount amount
BigDecimal discountAmount = calculateDiscountAmount(promotion, orderAmount);

// Step 8: Create PromotionUsage record for per-customer tracking
Customer customer = customerRepository.findById(customerId)
        .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

PromotionUsage usage = new PromotionUsage();
usage.setPromotion(promotion);
usage.setCustomer(customer);
usage.setOrderAmount(orderAmount);
usage.setDiscountAmount(discountAmount);
// Note: Order will be set later when the actual order is created

usage = promotionUsageRepository.save(usage);

// Step 9: Update validation log to mark as applied
updateValidationLogAsApplied(promotion, customer, usage.getUsageId());
```

### New Helper Method: updateValidationLogAsApplied()

**Purpose:** Link validation logs to actual usage records

```java
private void updateValidationLogAsApplied(Promotion promotion, Customer customer, String usageId) {
    try {
        // Find the most recent VALID validation log (within last 1 hour)
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        List<PromotionValidationLog> recentValidations = validationLogRepository.findRecentValidations(
                promotion.getPromotionId(),
                customer.getUserId(),
                oneHourAgo
        );

        // Find the first validation that hasn't been applied yet
        recentValidations.stream()
                .filter(log -> log.getStatus() == PromotionValidationStatus.VALID)
                .filter(log -> !log.isApplied())
                .findFirst()
                .ifPresent(log -> {
                    log.setApplied(true);
                    log.setAppliedAt(LocalDateTime.now());
                    log.setOrderId(usageId); // Store usage ID
                    validationLogRepository.save(log);
                });
    } catch (Exception e) {
        // Don't fail the main operation if updating log fails
        log.error("Failed to update validation log as applied", e);
    }
}
```

**Flow:**
1. Customer validates promotion at 14:00 → Validation log created (applied = false)
2. Customer completes order at 14:05 → Promotion applied
3. System finds validation log from 14:00 → Updates to (applied = true, appliedAt = 14:05)

---

## Complete Flow Example

### Scenario: Customer Using "NEWUSER20" Promotion

**Promotion Details:**
- Code: `NEWUSER20`
- Discount: 20% off
- Minimum order: $50
- Usage per customer limit: 1
- Total usage limit: 1000

#### Attempt 1: First Time Use

**Step 1: Validate Promotion**
```http
GET /api/promotions/validate?code=NEWUSER20&customerId=cust-123&orderAmount=100
```

**System checks:**
1. ✅ Promotion exists
2. ✅ Status = ACTIVE
3. ✅ Date range valid
4. ✅ Order amount ($100) >= minimum ($50)
5. ✅ Total usage (450/1000) < limit
6. ✅ **Customer usage (0/1) < limit** ← NEW CHECK
7. Calculate discount: $100 * 20% = $20

**Response:**
```json
{
  "code": "NEWUSER20",
  "discountAmount": 20.00,
  "valid": true
}
```

**Database:**
```sql
-- promotion_validation_logs table
INSERT INTO promotion_validation_logs (
    log_id, promotion_id, customer_id, status,
    order_amount, discount_amount, applied, created_at
) VALUES (
    'log-abc', 'promo-newuser20', 'cust-123', 'VALID',
    100.00, 20.00, FALSE, '2025-10-17 14:00:00'
);
```

**Step 2: Apply Promotion**
```http
POST /api/promotions/apply
{
  "code": "NEWUSER20",
  "customerId": "cust-123",
  "orderAmount": 100.00
}
```

**System executes:**
1. Lock promotion (pessimistic write lock)
2. Validate again (same checks as before)
3. **Check customer usage: countByPromotionAndCustomer() = 0** ← Uses repository
4. Check total usage: 450/1000 ✅
5. Atomic increment: UPDATE promotions SET current_usage_count = 451
6. **Create PromotionUsage record** ← NEW STEP
7. **Update validation log: applied = TRUE** ← Link validation to usage

**Response:**
```json
{
  "code": "NEWUSER20",
  "currentUsageCount": 451,
  "totalUsageLimit": 1000,
  "applied": true
}
```

**Database:**
```sql
-- promotions table
UPDATE promotions
SET current_usage_count = 451
WHERE promotion_id = 'promo-newuser20';

-- promotion_usage table (NEW)
INSERT INTO promotion_usage (
    usage_id, promotion_id, customer_id,
    order_amount, discount_amount, used_at
) VALUES (
    'usage-xyz', 'promo-newuser20', 'cust-123',
    100.00, 20.00, '2025-10-17 14:05:00'
);

-- promotion_validation_logs table (UPDATED)
UPDATE promotion_validation_logs
SET applied = TRUE, applied_at = '2025-10-17 14:05:00', order_id = 'usage-xyz'
WHERE log_id = 'log-abc';
```

#### Attempt 2: Try to Use Again (Should Fail)

**Step 1: Validate Again**
```http
GET /api/promotions/validate?code=NEWUSER20&customerId=cust-123&orderAmount=100
```

**System checks:**
1. ✅ Promotion exists
2. ✅ Status = ACTIVE
3. ✅ Date range valid
4. ✅ Order amount >= minimum
5. ✅ Total usage (451/1000) < limit
6. ❌ **Customer usage (1/1) >= limit** ← FAILS HERE

**Response (400 BAD REQUEST):**
```json
{
  "code": "5005",
  "message": "Promotion is not applicable for this order",
  "vietnameseMessage": "You have already used this promotion 1 times (limit: 1)"
}
```

**Database:**
```sql
-- promotion_validation_logs table
INSERT INTO promotion_validation_logs (
    log_id, promotion_id, customer_id, status,
    order_amount, error_message, applied, created_at
) VALUES (
    'log-def', 'promo-newuser20', 'cust-123', 'ALREADY_USED',
    100.00, 'You have already used this promotion 1 times (limit: 1)', FALSE, '2025-10-17 15:00:00'
);
```

---

## Analytics Queries

### 1. Conversion Rate by Promotion

```sql
-- How many customers who validated actually applied?
SELECT
    p.code,
    COUNT(DISTINCT pvl.customer_id) AS validated_customers,
    COUNT(DISTINCT pu.customer_id) AS applied_customers,
    ROUND(
        COUNT(DISTINCT pu.customer_id) * 100.0 /
        NULLIF(COUNT(DISTINCT pvl.customer_id), 0),
        2
    ) AS conversion_rate
FROM promotions p
LEFT JOIN promotion_validation_logs pvl ON p.promotion_id = pvl.promotion_id
    AND pvl.status = 'VALID'
LEFT JOIN promotion_usage pu ON p.promotion_id = pu.promotion_id
WHERE p.created_at >= NOW() - INTERVAL 30 DAY
GROUP BY p.promotion_id, p.code
ORDER BY conversion_rate ASC;
```

**Output:**
```
code         | validated | applied | conversion_rate
NEWUSER20    | 1000      | 850     | 85.00%
SAVE50       | 500       | 200     | 40.00%  ⚠️ Low!
FLASH30      | 300       | 270     | 90.00%
```

### 2. Top Customers by Savings

```sql
-- Which customers save the most?
SELECT
    c.email,
    c.full_name,
    COUNT(pu.usage_id) AS promotions_used,
    SUM(pu.discount_amount) AS total_savings,
    AVG(pu.order_amount) AS avg_order_amount
FROM customers c
JOIN promotion_usage pu ON c.user_id = pu.customer_id
GROUP BY c.user_id, c.email, c.full_name
ORDER BY total_savings DESC
LIMIT 10;
```

**Output:**
```
email                  | name        | promotions_used | total_savings | avg_order
john@example.com       | John Doe    | 15              | $450.00       | $150.00
jane@example.com       | Jane Smith  | 12              | $380.00       | $120.00
```

### 3. Promotion ROI

```sql
-- Calculate ROI for each promotion
SELECT
    p.code,
    p.title,
    COUNT(pu.usage_id) AS total_uses,
    SUM(pu.order_amount) AS revenue_generated,
    SUM(pu.discount_amount) AS discount_given,
    SUM(pu.order_amount) - SUM(pu.discount_amount) AS net_revenue,
    ROUND(
        (SUM(pu.order_amount) - SUM(pu.discount_amount)) * 100.0 /
        SUM(pu.discount_amount),
        2
    ) AS roi_percent
FROM promotions p
JOIN promotion_usage pu ON p.promotion_id = pu.promotion_id
WHERE pu.used_at >= NOW() - INTERVAL 30 DAY
GROUP BY p.promotion_id, p.code, p.title
ORDER BY roi_percent DESC;
```

**Output:**
```
code      | total_uses | revenue    | discount   | net_revenue | ROI
SAVE10    | 1000       | $50,000    | $5,000     | $45,000     | 900%
SAVE20    | 500        | $40,000    | $8,000     | $32,000     | 400%
SAVE50    | 100        | $15,000    | $7,500     | $7,500      | 100%
```

### 4. Repeat Usage Attempts (Fraud Detection)

```sql
-- Find customers trying to use same promotion multiple times
SELECT
    c.email,
    p.code,
    COUNT(pvl.log_id) AS validation_attempts,
    COUNT(CASE WHEN pvl.status = 'ALREADY_USED' THEN 1 END) AS blocked_attempts,
    MAX(pvl.created_at) AS last_attempt
FROM promotion_validation_logs pvl
JOIN customers c ON pvl.customer_id = c.user_id
JOIN promotions p ON pvl.promotion_id = p.promotion_id
WHERE pvl.created_at >= NOW() - INTERVAL 7 DAY
GROUP BY c.user_id, c.email, p.promotion_id, p.code
HAVING COUNT(CASE WHEN pvl.status = 'ALREADY_USED' THEN 1 END) >= 3
ORDER BY blocked_attempts DESC;
```

**Output (suspicious activity):**
```
email                  | code      | attempts | blocked | last_attempt
suspicious@test.com    | NEWUSER20 | 15       | 14      | 2025-10-17 16:30
fraud@test.com         | SAVE50    | 8        | 7       | 2025-10-17 15:45
```

---

## Testing

### Unit Test: Per-Customer Usage Limit

```java
@Test
void testValidatePromotion_CustomerReachedLimit_ThrowsException() {
    // Given
    Promotion promotion = createPromotion("NEWUSER20", 20, 50);
    promotion.setUsagePerCustomerLimit(1);

    Customer customer = createCustomer();

    // Customer has already used this promotion once
    PromotionUsage previousUsage = new PromotionUsage();
    previousUsage.setPromotion(promotion);
    previousUsage.setCustomer(customer);
    previousUsage.setOrderAmount(BigDecimal.valueOf(100));
    previousUsage.setDiscountAmount(BigDecimal.valueOf(20));
    promotionUsageRepository.save(previousUsage);

    // When/Then
    BadRequestException exception = assertThrows(BadRequestException.class, () -> {
        promotionService.validatePromotionCode(
            "NEWUSER20",
            customer.getUserId(),
            BigDecimal.valueOf(150)
        );
    });

    assertEquals(ErrorCode.PROMOTION_NOT_APPLICABLE, exception.getErrorCode());
    assertTrue(exception.getMessage().contains("already used"));

    // Verify validation log was created with ALREADY_USED status
    List<PromotionValidationLog> logs =
        validationLogRepository.findByCustomerId(customer.getUserId());

    assertEquals(1, logs.size());
    assertEquals(PromotionValidationStatus.ALREADY_USED, logs.get(0).getStatus());
}
```

### Integration Test: Full Flow with Linking

```java
@Test
void testApplyPromotion_LinksValidationLogToUsage() {
    // Given
    Promotion promotion = createPromotion("SAVE20", 20, 50);
    Customer customer = createCustomer();
    BigDecimal orderAmount = BigDecimal.valueOf(100);

    // Step 1: Validate
    promotionService.validatePromotionCode("SAVE20", customer.getUserId(), orderAmount);

    // Verify validation log created
    List<PromotionValidationLog> validationLogs =
        validationLogRepository.findByCustomerId(customer.getUserId());
    assertEquals(1, validationLogs.size());
    assertFalse(validationLogs.get(0).isApplied());

    // Step 2: Apply
    promotionService.applyPromotionToOrder("SAVE20", customer.getUserId(), orderAmount);

    // Verify usage record created
    List<PromotionUsage> usageRecords =
        promotionUsageRepository.findByCustomerId(customer.getUserId());
    assertEquals(1, usageRecords.size());
    assertEquals(BigDecimal.valueOf(20), usageRecords.get(0).getDiscountAmount());

    // Verify validation log updated
    validationLogs = validationLogRepository.findByCustomerId(customer.getUserId());
    assertEquals(1, validationLogs.size());
    assertTrue(validationLogs.get(0).isApplied()); // ← Linked!
    assertNotNull(validationLogs.get(0).getAppliedAt());
}
```

---

## Benefits

| Feature | Before | After |
|---------|--------|-------|
| **Per-Customer Limits** | ❌ Not enforced | ✅ Fully enforced with database tracking |
| **Usage Audit Trail** | ❌ No record | ✅ Complete history in `promotion_usage` table |
| **Discount Tracking** | ❌ Not tracked | ✅ Total savings per customer/promotion |
| **Validation Linking** | ❌ Orphan validation logs | ✅ Validation logs linked to actual usage |
| **Fraud Detection** | ❌ Not possible | ✅ Query for suspicious repeat attempts |
| **Analytics** | ❌ Limited to usage count | ✅ ROI, conversion rate, popular promotions |
| **Customer Insights** | ❌ No data | ✅ Total savings, usage history |

---

## Summary

### Files Created

1. **PromotionUsageRepository.java** - 15 query methods for usage tracking

### Files Modified

1. **PromotionServiceImpl.java**:
   - Updated `validatePromotionCode()` to check per-customer usage
   - Updated `applyPromotionToOrder()` to create `PromotionUsage` records
   - Added `updateValidationLogAsApplied()` helper to link validation logs

### Key Features

✅ **Per-customer usage limits** enforced with database queries
✅ **Complete usage audit trail** in `promotion_usage` table
✅ **Discount tracking** per customer and per promotion
✅ **Validation log linking** to actual usage records
✅ **Analytics queries** for conversion rate, ROI, popular promotions
✅ **Fraud detection** queries for suspicious activity
✅ **Customer insights** showing total savings

The promotion system is now complete with full usage tracking and analytics capabilities!
