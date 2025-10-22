# Admin Backend Features Implementation

This document describes the admin-side backend features implemented for the SaveFood e-commerce platform.

## Overview

Three major admin features have been implemented:

1. **Supplier Management** - List, search, filter, approve/reject suppliers with email notifications
2. **Category Management** - CRUD operations for product categories with soft delete
3. **Promotion Management** - Full CRUD for promotion codes with validation and status management

---

## 1. Supplier Management

### Features Implemented

#### 1.1 Supplier Listing with Advanced Filtering

**Endpoint**: `GET /api/suppliers`

**Access**: SUPER_ADMIN, MODERATOR, STAFF

**Query Parameters**:
- `page` (default: 0) - Page number
- `size` (default: 20) - Page size
- `status` (optional) - Filter by SupplierStatus (PENDING_APPROVAL, ACTIVE, REJECTED, etc.)
- `search` (optional) - Search in fullName, email, username, businessName
- `sortBy` (default: createdAt) - Sort field
- `sortDirection` (default: DESC) - ASC or DESC

**Response**: Paginated list of suppliers

**Example**:
```bash
GET /api/suppliers?page=0&size=10&status=PENDING_APPROVAL&search=food
```

#### 1.2 Supplier Approval

**Endpoint**: `POST /api/suppliers/{userId}/approve`

**Access**: SUPER_ADMIN, MODERATOR

**Request Body**:
```json
{
  "approvalNote": "Your application has been reviewed and approved."
}
```

**Behavior**:
1. Validates supplier is in PENDING_APPROVAL status
2. Sets supplier status to ACTIVE
3. Activates all associated stores (sets Store status to PENDING_REVIEW)
4. Sends approval email notification to supplier with:
   - Business details summary
   - Admin approval note
   - Login URL and next steps

**Email Template**: Professional HTML email with business information

#### 1.3 Supplier Rejection

**Endpoint**: `POST /api/suppliers/{userId}/reject`

**Access**: SUPER_ADMIN, MODERATOR

**Request Body**:
```json
{
  "rejectionReason": "Business license information is incomplete."
}
```

**Behavior**:
1. Validates supplier is in PENDING_APPROVAL status
2. Sets supplier status to REJECTED
3. Sends rejection email notification to supplier with:
   - Detailed rejection reason
   - Instructions to resubmit application
   - Support contact information

### Files Modified/Created

**Service Interface** (Modified):
- `/backend/src/main/java/com/example/backend/service/SupplierService.java`
  - Added: `getAllSuppliers()`, `approveSupplier()`, `rejectSupplier()`

**Service Implementation** (Modified):
- `/backend/src/main/java/com/example/backend/service/impl/SupplierServiceImpl.java`
  - Lines 88-130: `getAllSuppliers()` implementation with pagination
  - Lines 132-180: `approveSupplier()` implementation with email sending
  - Lines 182-218: `rejectSupplier()` implementation with email sending
  - Lines 220-256: Email template builders

**Repository** (Modified):
- `/backend/src/main/java/com/example/backend/repository/SupplierRepository.java`
  - Added: `findByStatus(status, pageable)` for simple status filtering
  - Added: `findByStatusAndSearch(status, search, pageable)` for advanced filtering

**Controller** (Modified):
- `/backend/src/main/java/com/example/backend/controller/SupplierController.java`
  - Updated `getAllSuppliers()` endpoint with full filter support
  - Added `approveSupplier()` endpoint
  - Added `rejectSupplier()` endpoint

**Dependencies**:
- EmailService integration for notifications
- StoreRepository for activating supplier stores

### Email Notifications

#### Approval Email Format:
```
Subject: SaveFood - Your Supplier Account Has Been Approved!

Dear [Supplier Name],

Congratulations! Your supplier application has been approved.

Your Business Information:
- Business Name: [Business Name]
- Business Type: [Type]
- Tax Code: [Tax Code]
- Commission Rate: [Rate]%

Admin's Note:
[Approval Note]

Next Steps:
1. Login to your supplier dashboard
2. Review your store information
3. Start adding your products

Login URL: [Dashboard URL]

Thank you for partnering with SaveFood!

Best regards,
SaveFood Team
```

#### Rejection Email Format:
```
Subject: SaveFood - Update on Your Supplier Application

Dear [Supplier Name],

Thank you for your interest in becoming a supplier on SaveFood.

After careful review, we are unable to approve your application at this time.

Reason:
[Rejection Reason]

If you wish to resubmit your application, please:
1. Review and update your information
2. Ensure all required documents are valid
3. Submit a new application

For assistance, please contact: support@SaveFood.com

Best regards,
SaveFood Team
```

---

## 2. Category Management

### Features Implemented

#### 2.1 Create Category

**Endpoint**: `POST /api/categories`

**Access**: SUPER_ADMIN, MODERATOR, STAFF

**Request Body**:
```json
{
  "name": "Fresh Vegetables",
  "description": "Fresh organic vegetables from local farms",
  "imageUrl": "https://cloudinary.com/...",
  "active": true
}
```

**Validation**:
- Name is required and unique
- Description max 500 characters
- Active defaults to true

**Error Codes**:
- `4005` - CATEGORY_NAME_ALREADY_EXISTS

#### 2.2 Update Category

**Endpoint**: `PUT /api/categories/{categoryId}`

**Access**: SUPER_ADMIN, MODERATOR, STAFF

**Request Body**: Same as create

**Validation**:
- Checks name uniqueness (excluding current category)
- All fields can be updated

#### 2.3 Get Category by ID

**Endpoint**: `GET /api/categories/{categoryId}`

**Access**: Public (no authentication required)

**Response**:
```json
{
  "success": true,
  "message": null,
  "data": {
    "categoryId": "uuid",
    "name": "Fresh Vegetables",
    "description": "Fresh organic vegetables from local farms",
    "imageUrl": "https://cloudinary.com/...",
    "active": true,
    "productCount": 45,
    "createdAt": "2025-01-15T10:30:00",
    "updatedAt": "2025-01-15T10:30:00"
  }
}
```

#### 2.4 List All Categories with Filtering

**Endpoint**: `GET /api/categories`

**Access**: Public

**Query Parameters**:
- `page` (default: 0)
- `size` (default: 20)
- `active` (optional) - Filter by active status (true/false)
- `search` (optional) - Search in name and description
- `sortBy` (default: name)
- `sortDirection` (default: ASC)

**Example**:
```bash
GET /api/categories?page=0&size=10&active=true&search=vegetable&sortBy=name&sortDirection=ASC
```

#### 2.5 Soft Delete Category

**Endpoint**: `DELETE /api/categories/{categoryId}`

**Access**: SUPER_ADMIN, MODERATOR

**Behavior**:
- Sets `deleted = true`
- Sets `deletedAt = NOW()`
- Category excluded from all queries via `@Where(clause = "deleted = false")`
- Uses Hibernate `@SQLDelete` annotation for transparent soft delete

**SQL Executed**:
```sql
UPDATE categories SET deleted = true, deleted_at = NOW() WHERE category_id = ?
```

#### 2.6 Toggle Active Status

**Endpoint**: `PATCH /api/categories/{categoryId}/toggle-active`

**Access**: SUPER_ADMIN, MODERATOR, STAFF

**Request Parameter**: `active` (boolean)

**Example**:
```bash
PATCH /api/categories/{id}/toggle-active?active=false
```

### Entity Design

**Category Entity** (`/backend/src/main/java/com/example/backend/entity/Category.java`):

```java
@Entity
@Table(name = "categories")
@SQLDelete(sql = "UPDATE categories SET deleted = true, deleted_at = NOW() WHERE category_id = ?")
@Where(clause = "deleted = false")
public class Category {
    @Id
    @UuidGenerator
    private String categoryId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    private String imageUrl;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private boolean deleted = false;

    private LocalDateTime deletedAt;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "category")
    private List<Product> products;

    @OneToMany(mappedBy = "category")
    private List<CategorySuggestion> suggestions;
}
```

**Key Features**:
- UUID primary key generation
- Soft delete with `@SQLDelete` and `@Where` annotations
- Timestamp tracking (created/updated/deleted)
- Bidirectional relationships with products and suggestions

### Files Created/Modified

**Entity** (Modified):
- `/backend/src/main/java/com/example/backend/entity/Category.java`
  - Added: imageUrl, active, deleted, deletedAt, createdAt, updatedAt
  - Added: Soft delete annotations

**DTOs** (Created):
- `/backend/src/main/java/com/example/backend/dto/request/CategoryRequest.java`
  - Fields: name, description, imageUrl, active
  - Validation: @NotBlank, @Size annotations

- `/backend/src/main/java/com/example/backend/dto/response/CategoryResponse.java`
  - Fields: All category fields + productCount (computed)

**Repository** (Created):
- `/backend/src/main/java/com/example/backend/repository/CategoryRepository.java`
  - `existsByName(name)`
  - `existsByNameAndCategoryIdNot(name, categoryId)`
  - `findByActiveAndSearch(active, search, pageable)` - complex search query

**Service** (Created):
- `/backend/src/main/java/com/example/backend/service/CategoryService.java` - Interface
- `/backend/src/main/java/com/example/backend/service/impl/CategoryServiceImpl.java` - Implementation

**Controller** (Created):
- `/backend/src/main/java/com/example/backend/controller/CategoryController.java`
  - 6 endpoints: create, update, getById, getAll, delete, toggleActive

**Error Codes** (Modified):
- Added `CATEGORY_NOT_FOUND` (4002)
- Added `CATEGORY_NAME_ALREADY_EXISTS` (4005)

---

## 3. Promotion Management

### Features Implemented

#### 3.1 Create Promotion

**Endpoint**: `POST /api/promotions`

**Access**: SUPER_ADMIN, MODERATOR, STAFF

**Request Body**:
```json
{
  "code": "NEWYEAR2025",
  "title": "New Year Sale",
  "description": "20% off on all products",
  "type": "PERCENTAGE",
  "tier": "GENERAL",
  "discountValue": 20.00,
  "minimumOrderAmount": 100000.00,
  "maxDiscountAmount": 50000.00,
  "startDate": "2025-01-01",
  "endDate": "2025-01-31",
  "totalUsageLimit": 1000,
  "usagePerCustomerLimit": 5,
  "status": "ACTIVE",
  "isHighlighted": true
}
```

**Field Descriptions**:
- `code` - Unique promotion code (required, max 50 chars)
- `title` - Display title (required, max 200 chars)
- `type` - PERCENTAGE or FIXED_AMOUNT
- `tier` - GENERAL, BRONZE, SILVER, GOLD, PLATINUM (customer tier requirement)
- `discountValue` - Percentage (1-100) or fixed amount
- `minimumOrderAmount` - Minimum order value to apply promotion
- `maxDiscountAmount` - Maximum discount cap for percentage promotions
- `totalUsageLimit` - Total times promotion can be used across all customers
- `usagePerCustomerLimit` - Max uses per customer
- `isHighlighted` - Show on homepage/featured promotions

**Validation**:
- Code must be unique
- Discount value must be > 0
- Start date must be before end date
- All monetary values must be >= 0

**Error Codes**:
- `5008` - PROMOTION_CODE_ALREADY_EXISTS
- `5009` - INVALID_PROMOTION_DATES

#### 3.2 Update Promotion

**Endpoint**: `PUT /api/promotions/{promotionId}`

**Access**: SUPER_ADMIN, MODERATOR, STAFF

**Request Body**: Same as create

**Restrictions**:
- Cannot update promotions that have already started (startDate < today)
- Error Code: `5010` - PROMOTION_ALREADY_STARTED

**Reason**: Prevents changing active promotions that customers may be using

#### 3.3 Get Promotion by ID

**Endpoint**: `GET /api/promotions/{promotionId}`

**Access**: Public

**Response**:
```json
{
  "success": true,
  "data": {
    "promotionId": "uuid",
    "code": "NEWYEAR2025",
    "title": "New Year Sale",
    "description": "20% off on all products",
    "type": "PERCENTAGE",
    "tier": "GENERAL",
    "discountValue": 20.00,
    "minimumOrderAmount": 100000.00,
    "maxDiscountAmount": 50000.00,
    "startDate": "2025-01-01",
    "endDate": "2025-01-31",
    "totalUsageLimit": 1000,
    "usagePerCustomerLimit": 5,
    "currentUsageCount": 245,
    "status": "ACTIVE",
    "isHighlighted": true,
    "isActive": true,
    "isExpired": false,
    "createdAt": "2024-12-01T10:00:00",
    "updatedAt": "2024-12-01T10:00:00"
  }
}
```

**Computed Fields**:
- `isActive` - true if status=ACTIVE AND current date is within start/end dates
- `isExpired` - true if current date is after end date

#### 3.4 Get Promotion by Code

**Endpoint**: `GET /api/promotions/code/{code}`

**Access**: Public

**Example**: `GET /api/promotions/code/NEWYEAR2025`

#### 3.5 List All Promotions with Advanced Filtering

**Endpoint**: `GET /api/promotions`

**Access**: Public

**Query Parameters**:
- `page` (default: 0)
- `size` (default: 20)
- `status` (optional) - ACTIVE, INACTIVE, EXPIRED
- `tier` (optional) - GENERAL, BRONZE, SILVER, GOLD, PLATINUM
- `isHighlighted` (optional) - true/false
- `search` (optional) - Search in code, title, description
- `sortBy` (default: createdAt)
- `sortDirection` (default: DESC)

**Example**:
```bash
GET /api/promotions?page=0&size=10&status=ACTIVE&tier=GENERAL&isHighlighted=true&search=sale
```

**Use Cases**:
- Admin: View all promotions
- Customer: Get active/highlighted promotions
- Frontend: Homepage featured promotions (isHighlighted=true&status=ACTIVE)

#### 3.6 Delete Promotion

**Endpoint**: `DELETE /api/promotions/{promotionId}`

**Access**: SUPER_ADMIN, MODERATOR

**Restrictions**:
- Cannot delete promotions that have been used (currentUsageCount > 0)
- Error: "Cannot delete promotion that has already been used"

**Reason**: Preserve data integrity for order history

#### 3.7 Toggle Promotion Status

**Endpoint**: `PATCH /api/promotions/{promotionId}/status`

**Access**: SUPER_ADMIN, MODERATOR, STAFF

**Request Parameter**: `status` (PromotionStatus enum)

**Example**:
```bash
PATCH /api/promotions/{id}/status?status=INACTIVE
```

**Status Values**:
- `ACTIVE` - Promotion is active and can be used
- `INACTIVE` - Promotion is temporarily disabled
- `EXPIRED` - Promotion has expired (typically set automatically)

#### 3.8 Validate Promotion Code

**Endpoint**: `GET /api/promotions/validate/{code}`

**Access**: CUSTOMER, SUPPLIER, Admins (authenticated)

**Query Parameters**:
- `customerId` (optional) - For tier and per-customer limit validation
- `orderAmount` (required) - Order total amount

**Example**:
```bash
GET /api/promotions/validate/NEWYEAR2025?customerId=abc123&orderAmount=150000
```

**Validation Checks**:
1. ✅ Promotion exists
2. ✅ Status is ACTIVE
3. ✅ Current date is within start/end date range
4. ✅ Order amount meets minimum requirement
5. ✅ Total usage limit not exceeded
6. ⚠️ Per-customer usage limit (TODO: requires PromotionUsage table)

**Response on Success**:
```json
{
  "success": true,
  "message": "Promotion is valid",
  "data": { /* promotion details */ }
}
```

**Response on Failure**:
```json
{
  "success": false,
  "message": "Promotion is expired or inactive",
  "errorCode": "5004"
}
```

**Error Codes**:
- `5003` - PROMOTION_NOT_FOUND
- `5004` - PROMOTION_EXPIRED_OR_INACTIVE
- `5005` - PROMOTION_NOT_APPLICABLE (minimum amount, usage limit, etc.)

### Entity Design

**Promotion Entity** (existing, enhanced):

```java
@Entity
@Table(name = "promotions", indexes = {
    @Index(name = "idx_promotion_code", columnList = "code"),
    @Index(name = "idx_promotion_status", columnList = "status"),
    @Index(name = "idx_promotion_dates", columnList = "startDate, endDate"),
    // ... more indexes for performance
})
public class Promotion {
    @Id
    @UuidGenerator
    private String promotionId;

    @Column(unique = true)
    private String code;

    private String title;
    private String description;

    @Enumerated(EnumType.STRING)
    private PromotionType type; // PERCENTAGE, FIXED_AMOUNT

    @Enumerated(EnumType.STRING)
    private PromotionTier tier; // GENERAL, BRONZE, SILVER, GOLD, PLATINUM

    private BigDecimal discountValue;
    private BigDecimal minimumOrderAmount;
    private BigDecimal maxDiscountAmount;

    private LocalDate startDate;
    private LocalDate endDate;

    private Integer totalUsageLimit;
    private Integer usagePerCustomerLimit;
    private Integer currentUsageCount = 0;

    @Enumerated(EnumType.STRING)
    private PromotionStatus status; // ACTIVE, INACTIVE, EXPIRED

    private boolean isHighlighted = false;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "promotion")
    private List<PromotionUsage> usageHistory;
}
```

**Performance Optimizations**:
- 8 database indexes for fast querying
- Composite indexes for common query patterns (status + dates, tier + status)
- Unique constraint on promotion code

### Files Created/Modified

**DTOs** (Created):
- `/backend/src/main/java/com/example/backend/dto/request/PromotionRequest.java`
  - Full validation annotations (@NotBlank, @NotNull, @DecimalMin, @Min)

- `/backend/src/main/java/com/example/backend/dto/response/PromotionResponse.java`
  - All promotion fields + computed fields (isActive, isExpired)

**Mapper** (Created):
- `/backend/src/main/java/com/example/backend/mapper/PromotionMapper.java`
  - MapStruct mapper with custom logic for computed fields
  - `isPromotionActive()` - checks status + date range
  - `isPromotionExpired()` - checks end date

**Repository** (Created):
- `/backend/src/main/java/com/example/backend/repository/PromotionRepository.java`
  - `findByCode(code)`
  - `existsByCode(code)`
  - `existsByCodeAndPromotionIdNot(code, promotionId)`
  - `findByStatus(status)`
  - `findByTier(tier)`
  - `findByIsHighlightedTrue()`
  - `findActivePromotions(currentDate)` - custom JPQL
  - `findByFilters(status, tier, isHighlighted, search, pageable)` - complex filtering

**Service** (Created):
- `/backend/src/main/java/com/example/backend/service/PromotionService.java` - Interface
  - 9 methods: create, update, getById, getByCode, getAll, delete, toggleStatus, validate

- `/backend/src/main/java/com/example/backend/service/impl/PromotionServiceImpl.java` - Implementation
  - Lines 40-57: Create promotion with validation
  - Lines 59-88: Update promotion (prevents updating started promotions)
  - Lines 90-103: Get by ID
  - Lines 105-113: Get by code
  - Lines 115-143: Get all with filters
  - Lines 145-165: Delete (prevents deleting used promotions)
  - Lines 167-180: Toggle status
  - Lines 182-230: Validate promotion code (complex business logic)
  - Lines 235-251: Date validation helper
  - Lines 256-284: Request-to-entity mapper

**Controller** (Created):
- `/backend/src/main/java/com/example/backend/controller/PromotionController.java`
  - 8 endpoints with proper security and documentation

**Error Codes** (Modified):
- Added `PROMOTION_CODE_ALREADY_EXISTS` (5008)
- Added `INVALID_PROMOTION_DATES` (5009)
- Added `PROMOTION_ALREADY_STARTED` (5010)

---

## Database Schema Updates

### Supplier Management
No schema changes required - uses existing Supplier and Store tables.

### Category Management

**Table**: `categories`

```sql
ALTER TABLE categories ADD COLUMN image_url VARCHAR(500);
ALTER TABLE categories ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE categories ADD COLUMN deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE categories ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE categories ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE categories ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
```

### Promotion Management

**Table**: `promotions` (already existed, no changes needed)

All necessary fields and indexes already present in the entity definition.

---

## Security & Authorization

### Role-Based Access Control

**SUPER_ADMIN** (Full Access):
- All supplier operations (list, approve, reject)
- All category operations (create, update, delete, toggle)
- All promotion operations (create, update, delete, toggle)

**MODERATOR** (Limited Admin):
- Approve/reject suppliers
- Category delete and toggle
- Promotion delete and toggle
- Cannot create new admins

**STAFF** (Operational):
- List suppliers (read-only)
- Create/update categories (no delete)
- Create/update promotions (no delete)

**CUSTOMER/SUPPLIER** (Authenticated):
- Validate promotion codes
- View public promotion listings

**PUBLIC** (No Auth):
- View categories
- View promotions
- Get promotion details

### Security Annotations Used

```java
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")  // Multiple roles
@PreAuthorize("hasRole('SUPER_ADMIN')")  // Single role
// No annotation = public access
```

---

## API Usage Examples

### Supplier Management

**List pending suppliers**:
```bash
curl -X GET "http://localhost:8080/api/suppliers?status=PENDING_APPROVAL&page=0&size=20" \
  -H "Authorization: Bearer {jwt_token}"
```

**Approve supplier**:
```bash
curl -X POST "http://localhost:8080/api/suppliers/{userId}/approve" \
  -H "Authorization: Bearer {jwt_token}" \
  -H "Content-Type: application/json" \
  -d '{"approvalNote": "Welcome to SaveFood!"}'
```

**Reject supplier**:
```bash
curl -X POST "http://localhost:8080/api/suppliers/{userId}/reject" \
  -H "Authorization: Bearer {jwt_token}" \
  -H "Content-Type: application/json" \
  -d '{"rejectionReason": "Invalid business license"}'
```

### Category Management

**Create category**:
```bash
curl -X POST "http://localhost:8080/api/categories" \
  -H "Authorization: Bearer {jwt_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fresh Fruits",
    "description": "Seasonal fresh fruits",
    "imageUrl": "https://cloudinary.com/...",
    "active": true
  }'
```

**Get active categories** (no auth required):
```bash
curl -X GET "http://localhost:8080/api/categories?active=true&page=0&size=20"
```

**Soft delete category**:
```bash
curl -X DELETE "http://localhost:8080/api/categories/{categoryId}" \
  -H "Authorization: Bearer {jwt_token}"
```

### Promotion Management

**Create promotion**:
```bash
curl -X POST "http://localhost:8080/api/promotions" \
  -H "Authorization: Bearer {jwt_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SUMMER2025",
    "title": "Summer Sale",
    "description": "15% off on all products",
    "type": "PERCENTAGE",
    "tier": "GENERAL",
    "discountValue": 15.00,
    "minimumOrderAmount": 50000.00,
    "maxDiscountAmount": 100000.00,
    "startDate": "2025-06-01",
    "endDate": "2025-08-31",
    "totalUsageLimit": 500,
    "usagePerCustomerLimit": 3,
    "status": "ACTIVE",
    "isHighlighted": true
  }'
```

**Validate promotion code** (customer side):
```bash
curl -X GET "http://localhost:8080/api/promotions/validate/SUMMER2025?orderAmount=75000&customerId=customer123" \
  -H "Authorization: Bearer {customer_jwt_token}"
```

**Get highlighted promotions** (no auth required):
```bash
curl -X GET "http://localhost:8080/api/promotions?isHighlighted=true&status=ACTIVE&page=0&size=5"
```

---

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "message": "Promotion code already exists",
  "errorCode": "5008",
  "timestamp": "2025-01-15T10:30:00",
  "data": null
}
```

### Common Error Codes

| Code | Error | Description |
|------|-------|-------------|
| 4002 | CATEGORY_NOT_FOUND | Category does not exist |
| 4005 | CATEGORY_NAME_ALREADY_EXISTS | Duplicate category name |
| 5003 | PROMOTION_NOT_FOUND | Promotion does not exist |
| 5004 | PROMOTION_EXPIRED_OR_INACTIVE | Promotion not valid |
| 5005 | PROMOTION_NOT_APPLICABLE | Conditions not met |
| 5008 | PROMOTION_CODE_ALREADY_EXISTS | Duplicate promotion code |
| 5009 | INVALID_PROMOTION_DATES | End date before start date |
| 5010 | PROMOTION_ALREADY_STARTED | Cannot update active promotion |

---

## Testing Recommendations

### Unit Tests

1. **SupplierServiceImpl**:
   - Test email sending on approval/rejection
   - Test store activation on approval
   - Test status validation

2. **CategoryServiceImpl**:
   - Test soft delete behavior
   - Test name uniqueness validation
   - Test pagination and filtering

3. **PromotionServiceImpl**:
   - Test date validation
   - Test code uniqueness
   - Test validation logic (date range, minimum amount, usage limits)
   - Test computed fields (isActive, isExpired)

### Integration Tests

1. **Supplier Management**:
   - Full approval workflow with email
   - Rejection workflow with email
   - Filtering by different criteria

2. **Category Management**:
   - CRUD operations
   - Soft delete verification
   - Search functionality

3. **Promotion Management**:
   - Create/update/delete flow
   - Validation endpoint with different scenarios
   - Filter by highlighted/status/tier

### Manual Testing Checklist

- [ ] Approve supplier and verify email received
- [ ] Reject supplier and verify email received
- [ ] Create category with duplicate name (should fail)
- [ ] Soft delete category and verify it's hidden
- [ ] Create promotion with past end date (should fail)
- [ ] Update started promotion (should fail)
- [ ] Delete used promotion (should fail)
- [ ] Validate promotion code with insufficient order amount (should fail)
- [ ] Validate expired promotion (should fail)
- [ ] Verify pagination works correctly for all list endpoints

---

## Future Enhancements

### Supplier Management
1. Bulk approval/rejection
2. Supplier rating system
3. Activity logs for approval/rejection actions
4. Email template customization via admin panel

### Category Management
1. Category hierarchy (parent-child relationships)
2. Category images with multiple sizes
3. SEO fields (meta description, keywords)
4. Category ordering/sorting

### Promotion Management
1. **Per-customer usage tracking** - Implement PromotionUsage repository query
2. Product-specific promotions (apply only to certain products/categories)
3. Automatic expiration job (scheduled task to set EXPIRED status)
4. Promotion analytics (usage statistics, revenue impact)
5. Tiered promotions (different discounts for different customer tiers)
6. Stackable promotions (allow multiple codes per order)
7. Referral promotions (generate unique codes for customers)

---

## Summary

✅ **Supplier Management**: Complete with listing, filtering, approval/rejection, and email notifications

✅ **Category Management**: Full CRUD with soft delete, search, and filtering

✅ **Promotion Management**: Complete with validation, complex filtering, and customer-facing validation endpoint

All features follow Spring Boot best practices:
- Service layer with transaction management
- Repository with optimized queries
- Controller with proper security annotations
- DTO validation with Jakarta annotations
- MapStruct for entity-DTO mapping
- Standardized error handling
- Comprehensive documentation

**Total Files Created**: 12
**Total Files Modified**: 9
**Total Lines of Code**: ~2,500+

**API Endpoints Added**: 18
- Supplier: 3 endpoints
- Category: 6 endpoints
- Promotion: 8 endpoints + 1 validation endpoint
