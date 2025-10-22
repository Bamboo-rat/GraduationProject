# Promotion Validation Tracking & Category Deletion Protection

## Overview

This document describes two critical fixes implemented to address data integrity issues:

1. **Promotion Validation Tracking**: Track incomplete promotion validations (customers who validate but don't complete orders)
2. **Category Deletion Protection**: Prevent deletion of categories that contain products (avoid orphan products)

---

## Issue 1: Incomplete Promotion Usage Tracking

### Problem Statement

**Scenario:**
- Customer adds items to cart ($100)
- Customer enters promotion code "SAVE20" and clicks "Validate"
- System responds: "Valid! You'll save $20"
- Customer abandons cart without completing order

**Issues:**
- No way to track that customer validated the promotion
- Can't calculate promotion "conversion rate" (validated vs. applied)
- Can't identify promotions with high abandon rates
- Missing analytics data for marketing optimization

### Solution: PromotionValidationLog Entity

Created a new tracking system that logs **every validation attempt**, whether successful or failed.

#### Database Schema

```sql
CREATE TABLE promotion_validation_logs (
    log_id VARCHAR(36) PRIMARY KEY,
    promotion_id VARCHAR(36) NOT NULL,
    customer_id VARCHAR(36) NOT NULL,
    status VARCHAR(20) NOT NULL,           -- VALID, NOT_FOUND, EXPIRED, etc.
    order_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2),
    error_message VARCHAR(500),
    applied BOOLEAN NOT NULL DEFAULT FALSE,
    order_id VARCHAR(36),                  -- Populated when actually applied
    created_at TIMESTAMP NOT NULL,
    applied_at TIMESTAMP,
    session_id VARCHAR(100),

    FOREIGN KEY (promotion_id) REFERENCES promotions(promotion_id),
    FOREIGN KEY (customer_id) REFERENCES customers(user_id),

    INDEX idx_validation_promotion (promotion_id),
    INDEX idx_validation_customer (customer_id),
    INDEX idx_validation_status (status)
);
```

#### PromotionValidationStatus Enum

```java
public enum PromotionValidationStatus {
    VALID,              // Validation succeeded
    NOT_FOUND,          // Promotion code not found
    EXPIRED,            // Promotion expired or inactive
    TIER_NOT_MET,       // Customer tier doesn't match
    MINIMUM_NOT_MET,    // Order amount below minimum
    LIMIT_REACHED,      // Usage limit reached
    ALREADY_USED,       // Customer already used
    ERROR               // Other error
}
```

### Implementation

#### Updated validatePromotionCode Method

**Before:**
```java
public PromotionResponse validatePromotionCode(String code, String customerId, BigDecimal orderAmount) {
    // Validation logic...
    // Returns response or throws exception
    // NO TRACKING!
}
```

**After:**
```java
public PromotionResponse validatePromotionCode(String code, String customerId, BigDecimal orderAmount) {
    PromotionValidationStatus validationStatus;
    String errorMessage = null;
    BigDecimal discountAmount = null;

    try {
        // Validation logic...
        validationStatus = PromotionValidationStatus.VALID;
        discountAmount = calculateDiscountAmount(promotion, orderAmount);
        return promotionMapper.toResponse(promotion);

    } catch (NotFoundException e) {
        validationStatus = PromotionValidationStatus.NOT_FOUND;
        errorMessage = e.getMessage();
        throw e;
    } catch (BadRequestException e) {
        // Status already set (EXPIRED, MINIMUM_NOT_MET, etc.)
        throw e;
    } finally {
        // Log validation attempt regardless of success/failure
        logValidationAttempt(promotion, customer, validationStatus,
                            orderAmount, discountAmount, errorMessage);
    }
}
```

Key changes:
- ✅ **Every validation logged** (success or failure)
- ✅ **Discount calculated** and stored
- ✅ **Error details captured** for failed validations
- ✅ **Non-blocking** - logging failures don't affect user experience

---

## Analytics Queries

### 1. Find Incomplete Validations (High Abandon Rate)

```sql
-- Find customers who validated but didn't complete order in last 7 days
SELECT
    pvl.log_id,
    pvl.created_at,
    c.email,
    p.code AS promotion_code,
    pvl.order_amount,
    pvl.discount_amount
FROM promotion_validation_logs pvl
JOIN customers c ON pvl.customer_id = c.user_id
JOIN promotions p ON pvl.promotion_id = p.promotion_id
WHERE pvl.status = 'VALID'
  AND pvl.applied = FALSE
  AND pvl.created_at >= NOW() - INTERVAL 7 DAY
ORDER BY pvl.created_at DESC;
```

**Use case:** Send reminder emails to customers who validated but didn't complete purchase

### 2. Promotion Conversion Rate

```sql
-- Calculate conversion rate for each promotion
SELECT
    p.code,
    p.title,
    COUNT(CASE WHEN pvl.status = 'VALID' THEN 1 END) AS total_validations,
    COUNT(CASE WHEN pvl.applied = TRUE THEN 1 END) AS total_applied,
    ROUND(
        COUNT(CASE WHEN pvl.applied = TRUE THEN 1 END) * 100.0 /
        NULLIF(COUNT(CASE WHEN pvl.status = 'VALID' THEN 1 END), 0),
        2
    ) AS conversion_rate_percent
FROM promotions p
LEFT JOIN promotion_validation_logs pvl ON p.promotion_id = pvl.promotion_id
WHERE p.created_at >= NOW() - INTERVAL 30 DAY
GROUP BY p.promotion_id, p.code, p.title
ORDER BY conversion_rate_percent ASC;
```

**Output example:**
```
code        | title           | validations | applied | conversion_rate
SAVE50      | Big Sale        | 1000        | 850     | 85.00%
NEWUSER20   | New User        | 500         | 200     | 40.00%  ⚠️ Low!
FLASH30     | Flash Sale      | 300         | 270     | 90.00%
```

**Insights:**
- `NEWUSER20` has 40% conversion rate → High abandon rate
- Possible reasons: Minimum order too high? Confusing terms?
- Action: Review promotion requirements, send follow-up emails

### 3. Validation Failure Reasons

```sql
-- Why are customers failing validation?
SELECT
    status,
    COUNT(*) AS failure_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM promotion_validation_logs), 2) AS percentage
FROM promotion_validation_logs
WHERE status != 'VALID'
  AND created_at >= NOW() - INTERVAL 30 DAY
GROUP BY status
ORDER BY failure_count DESC;
```

**Output example:**
```
status          | failure_count | percentage
MINIMUM_NOT_MET | 450           | 35.5%  ⚠️ High!
EXPIRED         | 280           | 22.1%
LIMIT_REACHED   | 150           | 11.8%
NOT_FOUND       | 120           | 9.5%
```

**Insights:**
- 35% failures due to minimum order amount
- Action: Lower minimum or communicate clearly in UI

---

## Issue 2: Category Deletion Protection

### Problem Statement

**Scenario:**
- Admin creates category "Snacks" with 50 products
- Admin soft-deletes category "Snacks" (sets `deleted = true`)
- 50 products now have `category_id` pointing to deleted category
- Products become **orphans** - can't display category name, can't filter by category

**SQL soft delete behavior:**
```java
@SQLDelete(sql = "UPDATE categories SET deleted = true WHERE category_id = ?")
@Where(clause = "deleted = false")
```

This only marks category as deleted, but **doesn't handle foreign key relationships**.

### Solution: Pre-deletion Validation

#### Error Code Added

```java
CATEGORY_HAS_PRODUCTS("4006",
    "Category has products",
    "Không thể xóa danh mục đang chứa sản phẩm. Vui lòng xóa hoặc chuyển sản phẩm sang danh mục khác trước",
    HttpStatus.CONFLICT)
```

#### Updated deleteCategory Method

**Before:**
```java
public void deleteCategory(String categoryId) {
    Category category = categoryRepository.findById(categoryId)
        .orElseThrow(() -> new NotFoundException(ErrorCode.CATEGORY_NOT_FOUND));

    categoryRepository.delete(category); // ⚠️ No check for products!
}
```

**After:**
```java
public void deleteCategory(String categoryId) {
    Category category = categoryRepository.findById(categoryId)
        .orElseThrow(() -> new NotFoundException(ErrorCode.CATEGORY_NOT_FOUND));

    // Check if category has any products
    if (category.getProducts() != null && !category.getProducts().isEmpty()) {
        log.warn("Cannot delete category {} - it contains {} products",
                categoryId, category.getProducts().size());
        throw new ConflictException(ErrorCode.CATEGORY_HAS_PRODUCTS);
    }

    categoryRepository.delete(category); // ✅ Safe to delete
}
```

### API Response Example

**Request:**
```http
DELETE /api/categories/{categoryId}
Authorization: Bearer {admin_jwt}
```

**Response (409 CONFLICT):**
```json
{
  "code": "4006",
  "message": "Category has products",
  "vietnameseMessage": "Không thể xóa danh mục đang chứa sản phẩm. Vui lòng xóa hoặc chuyển sản phẩm sang danh mục khác trước"
}
```

---

## Recommended Admin Workflow

### Option 1: Transfer Products to Another Category

**Step 1:** Admin tries to delete "Snacks" category
**Step 2:** System shows error with product count
**Step 3:** Admin transfers all products to "Food" category:

```http
PUT /api/products/{productId}
{
  "categoryId": "food-category-uuid"
}
```

**Step 4:** Admin retries deletion → Success!

### Option 2: Force Delete (Future Enhancement)

Add query parameter for force deletion:

```http
DELETE /api/categories/{categoryId}?force=true&moveTo={targetCategoryId}
```

Implementation:
```java
public void deleteCategory(String categoryId, boolean force, String moveToId) {
    Category category = categoryRepository.findById(categoryId)
        .orElseThrow(() -> new NotFoundException(ErrorCode.CATEGORY_NOT_FOUND));

    if (!category.getProducts().isEmpty()) {
        if (!force) {
            throw new ConflictException(ErrorCode.CATEGORY_HAS_PRODUCTS);
        }

        // Move products to target category
        Category targetCategory = categoryRepository.findById(moveToId)
            .orElseThrow(() -> new NotFoundException(ErrorCode.CATEGORY_NOT_FOUND));

        category.getProducts().forEach(product -> {
            product.setCategory(targetCategory);
        });

        productRepository.saveAll(category.getProducts());
    }

    categoryRepository.delete(category);
}
```

---

## Testing

### Test Case 1: Track Successful Validation

```java
@Test
void testValidatePromotion_LogsSuccessfulAttempt() {
    // Given
    Promotion promotion = createPromotion("SAVE20", 20, 100);
    Customer customer = createCustomer();
    BigDecimal orderAmount = BigDecimal.valueOf(150);

    // When
    PromotionResponse response = promotionService.validatePromotionCode(
        "SAVE20", customer.getUserId(), orderAmount
    );

    // Then
    List<PromotionValidationLog> logs =
        validationLogRepository.findByCustomerId(customer.getUserId());

    assertEquals(1, logs.size());
    assertEquals(PromotionValidationStatus.VALID, logs.get(0).getStatus());
    assertEquals(BigDecimal.valueOf(30), logs.get(0).getDiscountAmount()); // 20% of 150
    assertFalse(logs.get(0).isApplied());
}
```

### Test Case 2: Track Failed Validation

```java
@Test
void testValidatePromotion_LogsMinimumNotMet() {
    // Given
    Promotion promotion = createPromotion("SAVE20", 20, 100); // Min: $100
    Customer customer = createCustomer();
    BigDecimal orderAmount = BigDecimal.valueOf(50); // Below minimum

    // When/Then
    assertThrows(BadRequestException.class, () -> {
        promotionService.validatePromotionCode(
            "SAVE20", customer.getUserId(), orderAmount
        );
    });

    // Verify log
    List<PromotionValidationLog> logs =
        validationLogRepository.findByPromotionId(promotion.getPromotionId());

    assertEquals(1, logs.size());
    assertEquals(PromotionValidationStatus.MINIMUM_NOT_MET, logs.get(0).getStatus());
    assertNotNull(logs.get(0).getErrorMessage());
    assertFalse(logs.get(0).isApplied());
}
```

### Test Case 3: Delete Category with Products (Should Fail)

```java
@Test
void testDeleteCategory_WithProducts_ThrowsConflictException() {
    // Given
    Category category = createCategory("Snacks");
    Product product1 = createProduct("Chips", category);
    Product product2 = createProduct("Cookies", category);

    // When/Then
    ConflictException exception = assertThrows(ConflictException.class, () -> {
        categoryService.deleteCategory(category.getCategoryId());
    });

    assertEquals(ErrorCode.CATEGORY_HAS_PRODUCTS, exception.getErrorCode());

    // Verify category still exists
    assertTrue(categoryRepository.findById(category.getCategoryId()).isPresent());
}
```

### Test Case 4: Delete Empty Category (Should Succeed)

```java
@Test
void testDeleteCategory_EmptyCategory_Success() {
    // Given
    Category category = createCategory("Empty Category");
    // No products added

    // When
    categoryService.deleteCategory(category.getCategoryId());

    // Then - soft deleted (deleted = true, but still in DB)
    Optional<Category> deletedCategory = categoryRepository
        .findById(category.getCategoryId());

    // With @Where clause, it won't be found
    assertFalse(deletedCategory.isPresent());

    // But exists in DB with deleted = true
    Category hardFetch = entityManager.find(Category.class, category.getCategoryId());
    assertTrue(hardFetch.isDeleted());
}
```

---

## Database Migrations

### Migration 1: Create validation_logs table

```sql
CREATE TABLE promotion_validation_logs (
    log_id VARCHAR(36) PRIMARY KEY,
    promotion_id VARCHAR(36) NOT NULL,
    customer_id VARCHAR(36) NOT NULL,
    status VARCHAR(20) NOT NULL,
    order_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2),
    error_message VARCHAR(500),
    applied BOOLEAN NOT NULL DEFAULT FALSE,
    order_id VARCHAR(36),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    applied_at TIMESTAMP NULL,
    session_id VARCHAR(100),

    CONSTRAINT fk_validation_promotion
        FOREIGN KEY (promotion_id) REFERENCES promotions(promotion_id),
    CONSTRAINT fk_validation_customer
        FOREIGN KEY (customer_id) REFERENCES customers(user_id),

    INDEX idx_validation_promotion (promotion_id),
    INDEX idx_validation_customer (customer_id),
    INDEX idx_validation_status (status),
    INDEX idx_validation_created (created_at),
    INDEX idx_validation_promotion_customer (promotion_id, customer_id)
);
```

### Migration 2: No database change needed

Category protection is application-level validation, no schema changes required.

---

## Frontend Integration

### Display Validation Tracking

**Admin Dashboard - Promotion Analytics:**

```jsx
// GET /api/admin/promotions/{promotionId}/analytics
{
  "promotionId": "uuid",
  "code": "SAVE20",
  "totalValidations": 1000,
  "totalApplied": 750,
  "conversionRate": 75.0,
  "incompleteValidations": 250,
  "validationsByStatus": {
    "VALID": 800,
    "MINIMUM_NOT_MET": 150,
    "LIMIT_REACHED": 50
  }
}
```

**Display:**
- Conversion funnel chart: Validated → Applied
- Abandon rate alert: "⚠️ 25% of customers abandon after validation"
- Failure breakdown pie chart

### Category Deletion UI

**Frontend validation before API call:**

```jsx
async function deleteCategory(categoryId) {
  // Fetch category with product count
  const category = await api.get(`/categories/${categoryId}`);

  if (category.productCount > 0) {
    showConfirmDialog({
      title: "Category Contains Products",
      message: `This category has ${category.productCount} products.
                Please transfer or delete them first.`,
      actions: [
        { label: "Transfer Products", onClick: () => showTransferDialog(categoryId) },
        { label: "View Products", onClick: () => navigateTo(`/products?category=${categoryId}`) },
        { label: "Cancel", primary: true }
      ]
    });
    return;
  }

  // Safe to delete
  await api.delete(`/categories/${categoryId}`);
  toast.success("Category deleted successfully");
}
```

---

## Benefits

### Promotion Validation Tracking

| Benefit | Description |
|---------|-------------|
| **Conversion Analytics** | Track promotion performance beyond just usage count |
| **Abandon Rate Detection** | Identify promotions with high validation but low application |
| **Marketing Insights** | Understand why customers don't complete orders |
| **Retargeting** | Send follow-up emails to customers who validated but didn't buy |
| **A/B Testing Data** | Compare conversion rates across different promotion types |

### Category Deletion Protection

| Benefit | Description |
|---------|-------------|
| **Data Integrity** | Prevent orphan products with invalid category references |
| **Admin Guidance** | Clear error messages guide admins to correct workflow |
| **Product Visibility** | All products remain properly categorized |
| **Database Consistency** | Maintain referential integrity |
| **User Experience** | Customers never see "Category not found" errors |

---

## Future Enhancements

### Promotion Tracking

1. **Session Tracking**: Link validation logs to user sessions
2. **A/B Testing**: Track which promotion variants perform better
3. **Automatic Retargeting**: Auto-send emails to customers with incomplete validations
4. **Heatmap Integration**: Track where users click "Apply Promotion" button

### Category Management

1. **Bulk Transfer**: Transfer all products to another category in one action
2. **Archive Instead of Delete**: Mark categories as archived instead of deleted
3. **Category Merge**: Combine two categories into one
4. **Cascading Delete Options**: Option to delete category and all products

---

## Summary

### Files Created

1. **PromotionValidationLog.java** - Entity for tracking validation attempts
2. **PromotionValidationStatus.java** - Enum for validation status
3. **PromotionValidationLogRepository.java** - Repository with analytics queries

### Files Modified

1. **PromotionServiceImpl.java**:
   - Updated `validatePromotionCode()` to log all attempts
   - Added `calculateDiscountAmount()` helper
   - Added `logValidationAttempt()` helper

2. **CategoryServiceImpl.java**:
   - Updated `deleteCategory()` to check for products

3. **ErrorCode.java**:
   - Added `CATEGORY_HAS_PRODUCTS` error code

### Key Features

✅ **Every promotion validation logged** (success or failure)
✅ **Track incomplete validations** (validated but not applied)
✅ **Calculate conversion rates** (validated → applied)
✅ **Identify failure reasons** (minimum not met, expired, etc.)
✅ **Prevent category deletion** if products exist
✅ **Clear error messages** guide admin workflow

Both issues resolved with minimal code changes and maximum data protection!
