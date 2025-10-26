# Admin Backend API Reference

Complete documentation of all available admin backend endpoints and functions.

## Base URL
```
http://localhost:8080/api
```

## Authentication
All endpoints require Bearer token authentication unless specified otherwise.

Header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 1. ADMIN MANAGEMENT (`/api/admins`)

### 1.1 Register Admin/Staff
**POST** `/api/admins/register`
- **Access**: SUPER_ADMIN
- **Description**: Register new admin or staff member
- **Request Body**:
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "fullName": "string",
  "phoneNumber": "string",
  "role": "SUPER_ADMIN | MODERATOR | STAFF",
  "avatarUrl": "string (optional)"
}
```
- **Status**: Immediately ACTIVE (no approval needed)

### 1.2 Get Current Admin Profile
**GET** `/api/admins/me`
- **Access**: SUPER_ADMIN, MODERATOR, STAFF
- **Description**: Get authenticated admin's profile

### 1.3 Get Admin by ID
**GET** `/api/admins/{userId}`
- **Access**: SUPER_ADMIN
- **Description**: Get specific admin details

### 1.4 Update Admin Profile
**PUT** `/api/admins/me`
- **Access**: SUPER_ADMIN, MODERATOR, STAFF
- **Description**: Update own profile
- **Request Body**:
```json
{
  "fullName": "string (optional)",
  "phoneNumber": "string (optional)",
  "avatarUrl": "string (optional)"
}
```

### 1.5 Get All Admins/Staff
**GET** `/api/admins`
- **Access**: SUPER_ADMIN
- **Query Parameters**:
  - `page` (default: 0)
  - `size` (default: 20)
  - `role` (optional): Filter by role
  - `status` (optional): Filter by status
- **Status**: ⚠️ NOT IMPLEMENTED YET

### 1.6 Approve/Activate Admin
**PATCH** `/api/admins/{userId}/approve`
- **Access**: SUPER_ADMIN
- **Description**: Set admin to ACTIVE status

### 1.7 Suspend Admin
**PATCH** `/api/admins/{userId}/suspend`
- **Access**: SUPER_ADMIN
- **Query Parameters**:
  - `reason` (optional): Suspension reason
- **Description**: Suspend admin account (sets to INACTIVE)

### 1.8 Activate Admin
**PATCH** `/api/admins/{userId}/activate`
- **Access**: SUPER_ADMIN
- **Description**: Reactivate suspended admin

---

## 2. SUPPLIER MANAGEMENT (`/api/suppliers`)

### 2.1 Get All Suppliers
**GET** `/api/suppliers`
- **Access**: SUPER_ADMIN, MODERATOR
- **Query Parameters**:
  - `page` (default: 0)
  - `size` (default: 20)
  - `status` (optional): PENDING_APPROVAL, ACTIVE, INACTIVE, SUSPENDED, REJECTED
  - `search` (optional): Search by name, email, tax code
  - `sortBy` (default: createdAt)
  - `sortDirection` (default: DESC)

### 2.2 Get Supplier by ID
**GET** `/api/suppliers/{userId}`
- **Access**: SUPER_ADMIN, MODERATOR
- **Description**: Get detailed supplier information
- **Returns**: Signed URLs for documents (valid 1 hour)

### 2.3 Approve Supplier
**PATCH** `/api/suppliers/{userId}/approve`
- **Access**: SUPER_ADMIN, MODERATOR
- **Query Parameters**:
  - `note` (optional): Approval note
- **Description**: Approve pending supplier application
- **Side Effects**: Sends approval email to supplier

### 2.4 Reject Supplier
**PATCH** `/api/suppliers/{userId}/reject`
- **Access**: SUPER_ADMIN, MODERATOR
- **Query Parameters**:
  - `reason` (optional): Rejection reason
- **Description**: Reject pending supplier application
- **Side Effects**: Sends rejection email with reason

### 2.5 Update Supplier Status
**PATCH** `/api/suppliers/{userId}/status`
- **Access**: SUPER_ADMIN
- **Query Parameters**:
  - `status` (required): New status
- **Description**: Manually change supplier status

### 2.6 Set Supplier Active/Inactive
**PATCH** `/api/suppliers/{userId}/active`
- **Access**: SUPER_ADMIN
- **Query Parameters**:
  - `active` (required): true/false
- **Description**: Enable or disable supplier account

### 2.7 Update Commission Rate
**PATCH** `/api/suppliers/{userId}/commission`
- **Access**: SUPER_ADMIN
- **Request Body**:
```json
{
  "commissionRate": 0.15
}
```
- **Description**: Update supplier commission percentage

---

## 3. CUSTOMER MANAGEMENT (`/api/customers`)

### 3.1 Get All Customers
**GET** `/api/customers`
- **Access**: SUPER_ADMIN, MODERATOR, STAFF
- **Query Parameters**:
  - `page` (default: 0)
  - `size` (default: 20)
  - `status` (optional): Filter by status
  - `tier` (optional): Filter by customer tier
  - `search` (optional): Search query

### 3.2 Get Customer by ID
**GET** `/api/customers/{userId}`
- **Access**: SUPER_ADMIN, MODERATOR, STAFF
- **Description**: Get detailed customer information

### 3.3 Update Customer Status
**PATCH** `/api/customers/{userId}/status`
- **Access**: SUPER_ADMIN, MODERATOR
- **Query Parameters**:
  - `status` (required): New status

### 3.4 Set Customer Active/Inactive
**PATCH** `/api/customers/{userId}/active`
- **Access**: SUPER_ADMIN, MODERATOR
- **Query Parameters**:
  - `active` (required): true/false

---

## 4. PRODUCT MANAGEMENT (`/api/products`)

### 4.1 Get All Products
**GET** `/api/products`
- **Access**: Public
- **Query Parameters**:
  - `page` (default: 0)
  - `size` (default: 20)
  - `status` (optional): PENDING, ACTIVE, INACTIVE, OUT_OF_STOCK, DISCONTINUED
  - `categoryId` (optional): Filter by category
  - `supplierId` (optional): Filter by supplier
  - `search` (optional): Search query
  - `minPrice` (optional): Min price filter
  - `maxPrice` (optional): Max price filter
  - `sortBy` (default: createdAt)
  - `sortDirection` (default: DESC)

### 4.2 Get Product by ID
**GET** `/api/products/{id}`
- **Access**: Public
- **Description**: Get detailed product information

### 4.3 Update Product
**PUT** `/api/products/{id}`
- **Access**: SUPPLIER (own products), MODERATOR, SUPER_ADMIN
- **Request Body**: ProductUpdateRequest
- **Description**: Update product details

### 4.4 Update Product Status
**PATCH** `/api/products/{id}/status`
- **Access**: SUPPLIER (own products), MODERATOR, SUPER_ADMIN
- **Request Body**:
```json
{
  "status": "ACTIVE | INACTIVE | OUT_OF_STOCK | DISCONTINUED"
}
```

### 4.5 Delete Product
**DELETE** `/api/products/{id}`
- **Access**: SUPPLIER (own products), SUPER_ADMIN
- **Description**: Soft delete product

### 4.6 Approve Product (Admin)
**PATCH** `/api/products/{id}/approve`
- **Access**: MODERATOR, SUPER_ADMIN
- **Description**: Approve pending product
- **Side Effects**: Sets status to ACTIVE

### 4.7 Reject Product (Admin)
**PATCH** `/api/products/{id}/reject`
- **Access**: MODERATOR, SUPER_ADMIN
- **Query Parameters**:
  - `reason` (optional): Rejection reason
- **Description**: Reject pending product

---

## 5. CATEGORY MANAGEMENT (`/api/categories`)

### 5.1 Create Category
**POST** `/api/categories`
- **Access**: SUPER_ADMIN, MODERATOR
- **Request Body**:
```json
{
  "name": "string",
  "description": "string",
  "imageUrl": "string (optional)",
  "parentCategoryId": "number (optional)"
}
```

### 5.2 Update Category
**PUT** `/api/categories/{categoryId}`
- **Access**: SUPER_ADMIN, MODERATOR
- **Request Body**: CategoryRequest

### 5.3 Get Category by ID
**GET** `/api/categories/{categoryId}`
- **Access**: Public
- **Description**: Get category details

### 5.4 Get All Categories
**GET** `/api/categories`
- **Access**: Public
- **Query Parameters**:
  - `page` (default: 0)
  - `size` (default: 20)
  - `parentId` (optional): Filter by parent category
  - `active` (optional): Filter by active status

### 5.5 Delete Category
**DELETE** `/api/categories/{categoryId}`
- **Access**: SUPER_ADMIN
- **Description**: Soft delete category

### 5.6 Toggle Category Active Status
**PATCH** `/api/categories/{categoryId}/toggle-active`
- **Access**: SUPER_ADMIN, MODERATOR
- **Description**: Enable/disable category

---

## 6. CATEGORY SUGGESTIONS (`/api/category-suggestions`)

### 6.1 Get All Suggestions (Admin View)
**GET** `/api/category-suggestions`
- **Access**: SUPER_ADMIN, MODERATOR
- **Query Parameters**:
  - `page` (default: 0)
  - `size` (default: 20)
  - `status` (optional): PENDING, APPROVED, REJECTED

### 6.2 Get Suggestion by ID
**GET** `/api/category-suggestions/{id}`
- **Access**: SUPER_ADMIN, MODERATOR, SUPPLIER (own suggestions)

### 6.3 Approve Suggestion
**PATCH** `/api/category-suggestions/{id}/approve`
- **Access**: SUPER_ADMIN, MODERATOR
- **Query Parameters**:
  - `createCategory` (default: true): Auto-create category
  - `adminNote` (optional): Admin note
- **Description**: Approve suggestion and optionally create category

### 6.4 Reject Suggestion
**PATCH** `/api/category-suggestions/{id}/reject`
- **Access**: SUPER_ADMIN, MODERATOR
- **Query Parameters**:
  - `reason` (optional): Rejection reason
- **Description**: Reject category suggestion

---

## 7. STORE MANAGEMENT (`/api/stores`)

### 7.1 Get Pending Store Updates
**GET** `/api/stores/pending-updates`
- **Access**: SUPER_ADMIN, MODERATOR
- **Query Parameters**:
  - `page` (default: 0)
  - `size` (default: 20)
- **Description**: Get all pending store update requests

### 7.2 Get Specific Pending Update
**GET** `/api/stores/pending-updates/{id}`
- **Access**: SUPER_ADMIN, MODERATOR
- **Description**: Get details of specific update request

### 7.3 Get Pending Updates for Store
**GET** `/api/stores/{storeId}/pending-updates`
- **Access**: SUPER_ADMIN, MODERATOR, SUPPLIER (own stores)
- **Description**: Get all pending updates for a specific store

### 7.4 Approve Store Update
**PATCH** `/api/stores/pending-updates/{id}/approve`
- **Access**: SUPER_ADMIN, MODERATOR
- **Query Parameters**:
  - `adminNote` (optional): Approval note
- **Description**: Approve and apply store update
- **Side Effects**: Updates store information, sends notification

### 7.5 Reject Store Update
**PATCH** `/api/stores/pending-updates/{id}/reject`
- **Access**: SUPER_ADMIN, MODERATOR
- **Query Parameters**:
  - `reason` (optional): Rejection reason
- **Description**: Reject store update request
- **Side Effects**: Sends rejection notification

---

## 8. PROMOTION MANAGEMENT (`/api/promotions`)

### 8.1 Create Promotion
**POST** `/api/promotions`
- **Access**: SUPER_ADMIN, MODERATOR
- **Request Body**:
```json
{
  "code": "string",
  "name": "string",
  "description": "string",
  "type": "PERCENTAGE | FIXED_AMOUNT | FREE_SHIPPING",
  "discountValue": 0.0,
  "minOrderValue": 0.0,
  "maxDiscountAmount": 0.0,
  "usageLimit": 100,
  "usageLimitPerCustomer": 1,
  "startDate": "2024-01-01T00:00:00",
  "endDate": "2024-12-31T23:59:59",
  "tierRequirement": "BRONZE | SILVER | GOLD | PLATINUM",
  "applicableCategories": [1, 2, 3]
}
```

### 8.2 Update Promotion
**PUT** `/api/promotions/{promotionId}`
- **Access**: SUPER_ADMIN, MODERATOR
- **Request Body**: PromotionRequest

### 8.3 Get Promotion by ID
**GET** `/api/promotions/{promotionId}`
- **Access**: Public
- **Description**: Get promotion details

### 8.4 Get Promotion by Code
**GET** `/api/promotions/code/{code}`
- **Access**: Public
- **Description**: Get promotion by code

### 8.5 Get All Promotions
**GET** `/api/promotions`
- **Access**: Public (active only), Admin (all)
- **Query Parameters**:
  - `page` (default: 0)
  - `size` (default: 20)
  - `status` (optional): ACTIVE, INACTIVE, EXPIRED, SCHEDULED
  - `type` (optional): Filter by promotion type

### 8.6 Delete Promotion
**DELETE** `/api/promotions/{promotionId}`
- **Access**: SUPER_ADMIN
- **Description**: Soft delete promotion

### 8.7 Update Promotion Status
**PATCH** `/api/promotions/{promotionId}/status`
- **Access**: SUPER_ADMIN, MODERATOR
- **Query Parameters**:
  - `status` (required): New status
- **Description**: Change promotion status

### 8.8 Validate Promotion
**GET** `/api/promotions/validate/{code}`
- **Access**: Customer
- **Query Parameters**:
  - `orderValue` (required): Order total
  - `categoryIds` (optional): Categories in cart
- **Description**: Check if promotion is valid and applicable

### 8.9 Apply Promotion
**POST** `/api/promotions/apply/{code}`
- **Access**: Customer
- **Request Body**:
```json
{
  "orderValue": 0.0,
  "categoryIds": [1, 2, 3]
}
```
- **Description**: Calculate discount for order

---

## 9. NOTIFICATION MANAGEMENT (`/api/notifications`)

### 9.1 Get Failed Notifications
**GET** `/api/notifications/failed`
- **Access**: SUPER_ADMIN, MODERATOR
- **Query Parameters**:
  - `page` (default: 0)
  - `size` (default: 20)
- **Description**: Get list of failed email notifications

### 9.2 Get Pending Notifications
**GET** `/api/notifications/pending`
- **Access**: SUPER_ADMIN, MODERATOR
- **Query Parameters**:
  - `page` (default: 0)
  - `size` (default: 20)
- **Description**: Get list of queued notifications

### 9.3 Get Notification Statistics
**GET** `/api/notifications/stats`
- **Access**: SUPER_ADMIN, MODERATOR
- **Response**:
```json
{
  "totalPending": 0,
  "totalFailed": 0,
  "totalSent": 0,
  "failureRate": 0.0
}
```

### 9.4 Retry Failed Notification
**POST** `/api/notifications/{notificationId}/retry`
- **Access**: SUPER_ADMIN, MODERATOR
- **Description**: Retry sending failed notification

### 9.5 Process Pending Notifications (Manual Trigger)
**POST** `/api/notifications/process`
- **Access**: SUPER_ADMIN
- **Description**: Manually trigger notification queue processing

---

## 10. FILE STORAGE (`/api/files`)

### 10.1 Upload Business License
**POST** `/api/files/upload/business-license`
- **Access**: SUPPLIER
- **Content-Type**: multipart/form-data
- **Form Data**: `file` (PDF or image)
- **Returns**: Cloudinary URL

### 10.2 Upload Food Safety Certificate
**POST** `/api/files/upload/food-safety-certificate`
- **Access**: SUPPLIER
- **Content-Type**: multipart/form-data
- **Form Data**: `file` (PDF or image)

### 10.3 Upload Banner
**POST** `/api/files/upload/banner`
- **Access**: SUPER_ADMIN, MODERATOR
- **Content-Type**: multipart/form-data
- **Form Data**: `file` (image)

### 10.4 Upload Product Image
**POST** `/api/files/upload/product`
- **Access**: SUPPLIER
- **Content-Type**: multipart/form-data
- **Form Data**: `file` (image)

### 10.5 Upload Multiple Product Images
**POST** `/api/files/upload/product/multiple`
- **Access**: SUPPLIER
- **Content-Type**: multipart/form-data
- **Form Data**: `files` (multiple images)
- **Returns**: Array of URLs

### 10.6 Upload Category Image
**POST** `/api/files/upload/category`
- **Access**: SUPER_ADMIN, MODERATOR
- **Content-Type**: multipart/form-data
- **Form Data**: `file` (image)

### 10.7 Upload Customer Avatar
**POST** `/api/files/upload/avatar`
- **Access**: CUSTOMER
- **Content-Type**: multipart/form-data
- **Form Data**: `file` (image)

### 10.8 Upload Admin Avatar
**POST** `/api/files/upload/avatar/admin`
- **Access**: SUPER_ADMIN, MODERATOR, STAFF
- **Content-Type**: multipart/form-data
- **Form Data**: `file` (image)

### 10.9 Upload Supplier Logo
**POST** `/api/files/upload/supplier-logo`
- **Access**: SUPPLIER
- **Content-Type**: multipart/form-data
- **Form Data**: `file` (image)

### 10.10 Delete File
**DELETE** `/api/files/delete`
- **Access**: Authenticated users
- **Query Parameters**:
  - `fileUrl` (required): URL of file to delete
  - `bucket` (required): Storage bucket name

---

## 11. AUTHENTICATION (`/api/auth`)

### 11.1 Login
**POST** `/api/auth/login`
- **Access**: Public
- **Request Body**:
```json
{
  "username": "string",
  "password": "string"
}
```
- **Returns**: JWT tokens

### 11.2 Get Current User
**GET** `/api/auth/me`
- **Access**: Authenticated users
- **Description**: Get current user info from token

### 11.3 Refresh Token
**POST** `/api/auth/refresh`
- **Access**: Authenticated users
- **Request Body**:
```json
{
  "refreshToken": "string"
}
```

### 11.4 Logout
**POST** `/api/auth/logout`
- **Access**: Authenticated users
- **Description**: Invalidate tokens

---

## Role-Based Access Summary

### SUPER_ADMIN
- Full system access
- Can create/manage admins and staff
- Can approve/reject all entities
- Can manage all users, products, categories, promotions
- Can access all reports and statistics

### MODERATOR
- Can approve/reject suppliers, products, categories
- Can manage customers
- Can create/update promotions and categories
- Can view and retry notifications
- Cannot manage other admins

### STAFF
- Can view customers
- Can view products
- Limited access to management functions

### SUPPLIER
- Can manage own products and stores
- Can upload documents
- Can submit category suggestions
- Cannot access admin functions

### CUSTOMER
- Can view products and promotions
- Can manage own profile
- Cannot access admin or supplier functions

---

## Response Format

### Success Response
```json
{
  "status": "success",
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2024-01-20T10:30:00Z"
}
```

### Error Response
```json
{
  "status": "error",
  "code": "ERROR_CODE",
  "message": "English error message",
  "vietnameseMessage": "Thông báo lỗi tiếng Việt",
  "timestamp": "2024-01-20T10:30:00Z"
}
```

### Paginated Response
```json
{
  "status": "success",
  "data": {
    "content": [...],
    "totalElements": 100,
    "totalPages": 10,
    "size": 10,
    "number": 0,
    "first": true,
    "last": false,
    "empty": false
  }
}
```

---

## Status Codes

- **200 OK**: Successful GET, PUT, PATCH
- **201 Created**: Successful POST (creation)
- **204 No Content**: Successful DELETE
- **400 Bad Request**: Validation error
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Duplicate or constraint violation
- **500 Internal Server Error**: Server error

---

## Next Steps for Implementation

### Not Yet Implemented:
1. ✅ Admin list with pagination (`GET /api/admins`)
2. Order management endpoints
3. Report and analytics endpoints
4. Payment management endpoints
5. Shipment tracking endpoints
6. Customer review management
7. Wallet and transaction endpoints
8. Search history analytics
9. Banner management endpoints
10. News/Article management endpoints

### Recently Implemented:
- ✅ Supplier approval/rejection with email notifications
- ✅ Product approval/rejection
- ✅ Category suggestions workflow
- ✅ Store update approval workflow
- ✅ Promotion management
- ✅ Notification queue and retry system
- ✅ File upload with Cloudinary (public access mode)
- ✅ Signed URL generation for private documents

---

## Swagger Documentation

Interactive API documentation is available at:
```
http://localhost:8080/swagger-ui/index.html
```

This provides:
- Interactive API testing
- Request/response schemas
- Authentication testing
- Example requests
