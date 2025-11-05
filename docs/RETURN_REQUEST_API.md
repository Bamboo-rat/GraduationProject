# Return Request Management API Documentation

## Overview
Hệ thống quản lý yêu cầu trả hàng cho phép khách hàng tạo yêu cầu trả hàng trong vòng 7 ngày sau khi nhận hàng, và nhà cung cấp/admin phê duyệt hoặc từ chối yêu cầu.

## Return Flow

```
DELIVERED Order (trong 7 ngày)
    ↓
Customer tạo Return Request (PENDING)
    ↓
Supplier/Admin xem xét
    ↓
    ├─→ APPROVED → Order status = RETURNED → Hoàn tiền
    └─→ REJECTED → Giữ nguyên Order status = DELIVERED
```

## Return Reasons

- `DEFECTIVE_PRODUCT` - Sản phẩm lỗi/hỏng
- `WRONG_ITEM` - Giao sai hàng
- `NOT_AS_DESCRIBED` - Không đúng mô tả
- `POOR_QUALITY` - Chất lượng kém
- `DAMAGED_IN_SHIPPING` - Hư hỏng trong quá trình vận chuyển
- `CHANGED_MIND` - Đổi ý không muốn mua nữa
- `OTHER` - Lý do khác

## Return Request Status

- `PENDING` - Đang chờ xử lý
- `APPROVED` - Đã chấp nhận
- `REJECTED` - Đã từ chối
- `REFUNDED` - Đã hoàn tiền

## API Endpoints

### 1. Create Return Request
**POST** `/api/return-requests?orderId={orderId}`

**Authorization**: CUSTOMER role

**Request Body**:
```json
{
  "reason": "DEFECTIVE_PRODUCT",
  "description": "Sản phẩm bị lỗi màn hình, không hiển thị được",
  "imageUrls": [
    "https://storage.example.com/return-images/image1.jpg",
    "https://storage.example.com/return-images/image2.jpg"
  ]
}
```

**Response** (201 Created):
```json
{
  "id": "rr-uuid",
  "orderId": "order-uuid",
  "orderCode": "ORD-20250105-001",
  "customerId": "customer-uuid",
  "customerName": "Nguyễn Văn A",
  "storeId": "store-uuid",
  "storeName": "Cửa hàng Điện tử ABC",
  "reason": "DEFECTIVE_PRODUCT",
  "reasonDescription": "Sản phẩm lỗi/hỏng",
  "description": "Sản phẩm bị lỗi màn hình, không hiển thị được",
  "imageUrls": [
    "https://storage.example.com/return-images/image1.jpg",
    "https://storage.example.com/return-images/image2.jpg"
  ],
  "status": "PENDING",
  "statusDescription": "Đang chờ xử lý",
  "orderTotalAmount": 5000000,
  "createdAt": "2025-01-05T10:30:00",
  "updatedAt": "2025-01-05T10:30:00"
}
```

**Validation Rules**:
- Order must be in `DELIVERED` status
- Return request can only be created within 7 days of delivery
- One order can only have one return request
- Description must be 10-1000 characters

**Error Responses**:
```json
{
  "error": "Order does not belong to customer",
  "status": 400
}

{
  "error": "Can only create return request for delivered orders",
  "status": 400
}

{
  "error": "Return period expired. Can only return within 7 days of delivery",
  "status": 400
}

{
  "error": "Return request already exists for this order",
  "status": 400
}
```

---

### 2. Approve Return Request
**POST** `/api/return-requests/{returnRequestId}/approve`

**Authorization**: SUPPLIER, SUPER_ADMIN, MODERATOR, STAFF roles

**Request Body**:
```json
{
  "reviewNote": "Đã kiểm tra hàng trả, chấp nhận hoàn tiền"
}
```

**Response** (200 OK):
```json
{
  "id": "rr-uuid",
  "orderId": "order-uuid",
  "orderCode": "ORD-20250105-001",
  "status": "APPROVED",
  "statusDescription": "Đã chấp nhận",
  "reviewerId": "reviewer-uuid",
  "reviewerName": "Admin Nguyễn",
  "reviewNote": "Đã kiểm tra hàng trả, chấp nhận hoàn tiền",
  "reviewedAt": "2025-01-06T14:20:00",
  "refundAmount": 5000000,
  "orderTotalAmount": 5000000
}
```

**Business Logic**:
- Sets return request status to `APPROVED`
- Sets order status to `RETURNED`
- Sets refund amount = order total amount
- Records reviewer ID and review time

---

### 3. Reject Return Request
**POST** `/api/return-requests/{returnRequestId}/reject`

**Authorization**: SUPPLIER, SUPER_ADMIN, MODERATOR, STAFF roles

**Request Body**:
```json
{
  "reviewNote": "Sản phẩm không có dấu hiệu lỗi, từ chối trả hàng"
}
```

**Response** (200 OK):
```json
{
  "id": "rr-uuid",
  "orderId": "order-uuid",
  "orderCode": "ORD-20250105-001",
  "status": "REJECTED",
  "statusDescription": "Đã từ chối",
  "reviewerId": "reviewer-uuid",
  "reviewerName": "Supplier ABC",
  "reviewNote": "Sản phẩm không có dấu hiệu lỗi, từ chối trả hàng",
  "reviewedAt": "2025-01-06T14:20:00"
}
```

**Business Logic**:
- Sets return request status to `REJECTED`
- Order status remains `DELIVERED`
- Records reviewer ID and review time

---

### 4. Get Return Request by ID
**GET** `/api/return-requests/{returnRequestId}`

**Authorization**: CUSTOMER, SUPPLIER, SUPER_ADMIN, MODERATOR, STAFF roles

**Response** (200 OK):
```json
{
  "id": "rr-uuid",
  "orderId": "order-uuid",
  "orderCode": "ORD-20250105-001",
  "customerId": "customer-uuid",
  "customerName": "Nguyễn Văn A",
  "storeId": "store-uuid",
  "storeName": "Cửa hàng Điện tử ABC",
  "reason": "DEFECTIVE_PRODUCT",
  "reasonDescription": "Sản phẩm lỗi/hỏng",
  "description": "Sản phẩm bị lỗi màn hình",
  "imageUrls": ["https://..."],
  "status": "PENDING",
  "statusDescription": "Đang chờ xử lý",
  "orderTotalAmount": 5000000,
  "createdAt": "2025-01-05T10:30:00",
  "updatedAt": "2025-01-05T10:30:00"
}
```

---

### 5. Get Return Request by Order ID
**GET** `/api/return-requests/order/{orderId}`

**Authorization**: CUSTOMER, SUPPLIER, SUPER_ADMIN, MODERATOR, STAFF roles

**Response** (200 OK): Same as endpoint #4

---

### 6. Get Customer's Return Requests
**GET** `/api/return-requests/my-requests?page=0&size=10`

**Authorization**: CUSTOMER role

**Query Parameters**:
- `page` (optional, default: 0) - Page number
- `size` (optional, default: 10) - Page size

**Response** (200 OK):
```json
{
  "content": [
    {
      "id": "rr-uuid-1",
      "orderId": "order-uuid-1",
      "orderCode": "ORD-20250105-001",
      "storeId": "store-uuid",
      "storeName": "Cửa hàng A",
      "reason": "DEFECTIVE_PRODUCT",
      "status": "APPROVED",
      "refundAmount": 5000000,
      "createdAt": "2025-01-05T10:30:00"
    },
    {
      "id": "rr-uuid-2",
      "orderId": "order-uuid-2",
      "orderCode": "ORD-20250103-002",
      "storeId": "store-uuid-2",
      "storeName": "Cửa hàng B",
      "reason": "WRONG_ITEM",
      "status": "PENDING",
      "createdAt": "2025-01-03T14:20:00"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 10
  },
  "totalElements": 2,
  "totalPages": 1,
  "last": true,
  "first": true
}
```

---

### 7. Get Store's Return Requests
**GET** `/api/return-requests/store/{storeId}?pending=false&page=0&size=10`

**Authorization**: SUPPLIER, SUPER_ADMIN, MODERATOR, STAFF roles

**Query Parameters**:
- `pending` (optional, default: false) - If true, only returns pending requests
- `page` (optional, default: 0) - Page number
- `size` (optional, default: 10) - Page size

**Response** (200 OK): Same format as endpoint #6

---

### 8. Get All Pending Return Requests (Admin)
**GET** `/api/return-requests/pending?page=0&size=10`

**Authorization**: SUPER_ADMIN, MODERATOR, STAFF roles

**Query Parameters**:
- `page` (optional, default: 0) - Page number
- `size` (optional, default: 10) - Page size

**Response** (200 OK): Same format as endpoint #6

---

## Database Schema

### `return_requests` Table
```sql
CREATE TABLE return_requests (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    customer_id VARCHAR(36) NOT NULL,
    store_id VARCHAR(36) NOT NULL,
    reason VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reviewer_id VARCHAR(36),
    review_note TEXT,
    reviewed_at TIMESTAMP,
    refund_amount DECIMAL(15,2),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    UNIQUE KEY unique_order_return (order_id),
    INDEX idx_customer_id (customer_id),
    INDEX idx_store_id (store_id),
    INDEX idx_status (status),
    INDEX idx_store_status (store_id, status)
);
```

### `return_request_images` Table
```sql
CREATE TABLE return_request_images (
    return_request_id VARCHAR(36) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    FOREIGN KEY (return_request_id) REFERENCES return_requests(id)
);
```

## Integration with Order Management

### Order Status Transition
```
DELIVERED
    ↓ (Customer creates return request within 7 days)
RETURNED (After return request is APPROVED)
```

### Order Entity Update
Added `deliveredAt` field to track delivery time for return period validation:
```java
@Column(name = "delivered_at")
private LocalDateTime deliveredAt;
```

When order is marked as `DELIVERED`, `deliveredAt` is set to current timestamp.

## Example Use Cases

### Use Case 1: Customer Returns Defective Product
1. Customer receives order (status: DELIVERED, deliveredAt: 2025-01-01)
2. Customer finds product is defective on 2025-01-03 (within 7 days)
3. Customer creates return request with reason `DEFECTIVE_PRODUCT` and uploads images
4. Supplier reviews request and approves with note
5. Order status changes to RETURNED
6. System processes refund

### Use Case 2: Supplier Rejects Invalid Return
1. Customer creates return request with reason `CHANGED_MIND`
2. Customer uploaded images showing product in perfect condition
3. Supplier reviews and rejects with note explaining store policy
4. Order status remains DELIVERED
5. Customer notified of rejection

## Error Handling

All endpoints follow standard error response format:
```json
{
  "error": "Error message",
  "status": 400,
  "timestamp": "2025-01-05T10:30:00"
}
```

Common HTTP status codes:
- `200 OK` - Success
- `201 Created` - Resource created successfully
- `400 Bad Request` - Validation error or business rule violation
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Testing

Test file location: `backend/src/test/java/com/example/backend/controller/ReturnRequestControllerTest.java`

Run tests:
```bash
mvn test -Dtest=ReturnRequestControllerTest
```
