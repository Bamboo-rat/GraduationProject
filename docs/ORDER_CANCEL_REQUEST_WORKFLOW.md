# Order Cancel Request Workflow - Documentation

## Overview
Hệ thống **Order Cancel Request** cho phép khách hàng tạo yêu cầu hủy đơn hàng đối với các đơn hàng đang được xử lý (từ trạng thái PREPARING trở đi). Nhà cung cấp sẽ xem xét và phê duyệt hoặc từ chối yêu cầu.

## Business Rules

### 1. Direct Cancel vs Cancel Request

#### Direct Cancel (Hủy trực tiếp)
- **Áp dụng cho**: Đơn hàng ở trạng thái **PENDING** hoặc **CONFIRMED**
- **Ai có thể thực hiện**: Cả khách hàng và nhà cung cấp
- **Quy trình**: Hủy ngay lập tức, không cần phê duyệt
- **API**: `POST /api/orders/{orderId}/cancel`

#### Cancel Request (Yêu cầu hủy đơn)
- **Áp dụng cho**: Đơn hàng ở trạng thái **PREPARING** hoặc **SHIPPING**
- **Ai có thể tạo**: Chỉ khách hàng
- **Quy trình**: Tạo yêu cầu → Nhà cung cấp xét duyệt → Phê duyệt/Từ chối
- **API**: `POST /api/order-cancel-requests?orderId={orderId}`

### 2. Order Status Flow

```
PENDING ─────────────┐
                     │
CONFIRMED ───────────┼─→ [DIRECT CANCEL] ─→ CANCELED
                     │
PREPARING ───────────┤
                     │
SHIPPING ────────────┼─→ [CANCEL REQUEST] ─→ PENDING_REVIEW ─→ [APPROVED] ─→ CANCELED
                     │                                       └─→ [REJECTED] ─→ Order continues
DELIVERED ───────────┤
                     │
CANCELED ────────────┼─→ Cannot cancel
                     │
RETURNED ────────────┘
```

### 3. Cancel Request Status

| Status | Vietnamese | Description |
|--------|------------|-------------|
| `PENDING_REVIEW` | Chờ xét duyệt | Request đang chờ nhà cung cấp xem xét |
| `APPROVED` | Đã phê duyệt | Request được chấp nhận, order sẽ bị hủy |
| `REJECTED` | Bị từ chối | Request bị từ chối, order tiếp tục |

## API Endpoints

### 1. Create Cancel Request
**Endpoint**: `POST /api/order-cancel-requests?orderId={orderId}`  
**Authorization**: `CUSTOMER` only  
**Description**: Khách hàng tạo yêu cầu hủy đơn hàng đang ở trạng thái PREPARING hoặc SHIPPING

**Request Body**:
```json
{
  "reason": "string (min 10, max 1000 chars)"
}
```

**Response** (201 Created):
```json
{
  "cancelRequestId": "uuid",
  "orderId": "uuid",
  "orderCode": "ORD-123456",
  "customerId": "keycloak-user-id",
  "customerName": "Nguyễn Văn A",
  "storeId": "uuid",
  "storeName": "Cửa hàng ABC",
  "reason": "Tôi muốn đổi địa chỉ giao hàng",
  "status": "PENDING_REVIEW",
  "requestedAt": "2024-01-15T10:30:00",
  "reviewedAt": null,
  "reviewedBy": null,
  "reviewedByName": null,
  "reviewNote": null,
  "orderStatus": "PREPARING",
  "totalAmount": "500000"
}
```

**Validation Rules**:
- Order must exist and belong to customer
- Order status must be PREPARING or SHIPPING
- No existing PENDING_REVIEW request for this order
- Reason must be 10-1000 characters

**Notifications**:
- Supplier receives: "Khách hàng {name} yêu cầu hủy đơn hàng #{code}. Lý do: {reason}"

---

### 2. Review Cancel Request
**Endpoint**: `POST /api/order-cancel-requests/{cancelRequestId}/review`  
**Authorization**: `SUPPLIER` or `ADMIN`  
**Description**: Nhà cung cấp/Admin xét duyệt yêu cầu hủy

**Request Body**:
```json
{
  "approved": true,  // true = phê duyệt, false = từ chối
  "reviewNote": "string (optional, max 1000 chars)"
}
```

**Response** (200 OK):
```json
{
  "cancelRequestId": "uuid",
  "orderId": "uuid",
  "orderCode": "ORD-123456",
  "customerId": "keycloak-user-id",
  "customerName": "Nguyễn Văn A",
  "storeId": "uuid",
  "storeName": "Cửa hàng ABC",
  "reason": "Tôi muốn đổi địa chỉ giao hàng",
  "status": "APPROVED",  // or "REJECTED"
  "requestedAt": "2024-01-15T10:30:00",
  "reviewedAt": "2024-01-15T11:00:00",
  "reviewedBy": "supplier-keycloak-id",
  "reviewedByName": "Nhà cung cấp",
  "reviewNote": "Đồng ý hủy đơn theo yêu cầu",
  "orderStatus": "CANCELED",  // if approved
  "totalAmount": "500000"
}
```

**Business Logic**:

#### If Approved (`approved: true`):
1. Set cancel request status = APPROVED
2. Record reviewer info (reviewedBy, reviewedAt, reviewNote)
3. **Cancel the order** using existing `OrderService.cancelOrder()`:
   - Return inventory to store products
   - Process refund if payment was made (not COD)
   - Rollback promotion usages
   - Set order status = CANCELED
4. Send notification to customer: "Yêu cầu hủy đơn hàng #{code} đã được phê duyệt. Tiền đã được hoàn lại."

#### If Rejected (`approved: false`):
1. Set cancel request status = REJECTED
2. Record reviewer info (reviewedBy, reviewedAt, reviewNote)
3. Order continues with current status
4. Send notification to customer: "Yêu cầu hủy đơn hàng #{code} bị từ chối. Lý do: {reviewNote}"

**Validation Rules**:
- Cancel request must exist
- Status must be PENDING_REVIEW (cannot review twice)
- Reviewer must be supplier of the store or admin

---

### 3. Get Cancel Request by ID
**Endpoint**: `GET /api/order-cancel-requests/{cancelRequestId}`  
**Authorization**: `CUSTOMER`, `SUPPLIER`, `ADMIN`  
**Description**: Lấy chi tiết một cancel request

**Response** (200 OK): Same as create response

---

### 4. Get Cancel Request by Order ID
**Endpoint**: `GET /api/order-cancel-requests/order/{orderId}`  
**Authorization**: `CUSTOMER`, `SUPPLIER`, `ADMIN`  
**Description**: Lấy cancel request của một order cụ thể

**Response** (200 OK): Same as create response

**Error** (404 Not Found): Nếu order không có cancel request

---

### 5. Get Customer's Cancel Requests
**Endpoint**: `GET /api/order-cancel-requests/my-requests?page=0&size=10`  
**Authorization**: `CUSTOMER` only  
**Description**: Khách hàng xem tất cả các yêu cầu hủy của mình

**Query Parameters**:
- `page`: Page number (default 0)
- `size`: Page size (default 10)

**Response** (200 OK):
```json
{
  "content": [
    { /* CancelRequestResponse */ },
    { /* CancelRequestResponse */ }
  ],
  "totalElements": 5,
  "totalPages": 1,
  "size": 10,
  "number": 0
}
```

**Sorting**: Newest first (requestedAt DESC)

---

### 6. Get Store's Cancel Requests
**Endpoint**: `GET /api/order-cancel-requests/store/{storeId}?pending=false&page=0&size=10`  
**Authorization**: `SUPPLIER`, `ADMIN`  
**Description**: Nhà cung cấp xem các cancel requests cho cửa hàng của mình

**Query Parameters**:
- `storeId`: Store UUID (path parameter)
- `pending`: true = chỉ lấy PENDING_REVIEW, false = tất cả (default false)
- `page`: Page number (default 0)
- `size`: Page size (default 10)

**Response** (200 OK): Same as customer's requests

**Sorting**: Oldest pending first (requestedAt ASC)

---

### 7. Get All Pending Cancel Requests
**Endpoint**: `GET /api/order-cancel-requests/pending?page=0&size=10`  
**Authorization**: `ADMIN` only  
**Description**: Admin xem tất cả các cancel requests đang chờ xét duyệt

**Query Parameters**:
- `page`: Page number (default 0)
- `size`: Page size (default 10)

**Response** (200 OK): Same as customer's requests

**Sorting**: Oldest first (requestedAt ASC)

---

## Database Schema

### Table: `order_cancel_requests`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `cancel_request_id` | VARCHAR(36) | PRIMARY KEY | UUID |
| `order_id` | VARCHAR(36) | NOT NULL, FK → orders | Order being cancelled |
| `customer_id` | VARCHAR(255) | NOT NULL, FK → customers | Requesting customer |
| `reason` | TEXT | NOT NULL | Customer's reason |
| `status` | VARCHAR(50) | NOT NULL, DEFAULT 'PENDING_REVIEW' | PENDING_REVIEW, APPROVED, REJECTED |
| `requested_at` | TIMESTAMP | NOT NULL, DEFAULT NOW | Request creation time |
| `reviewed_at` | TIMESTAMP | NULL | Review time |
| `reviewed_by` | VARCHAR(255) | NULL | Reviewer's Keycloak ID |
| `review_note` | TEXT | NULL | Reviewer's note |

**Indexes**:
- `idx_order_cancel_request_order_id` on `order_id`
- `idx_order_cancel_request_customer_id` on `customer_id`
- `idx_order_cancel_request_status` on `status`
- `idx_order_cancel_request_requested_at` on `requested_at`

**Foreign Keys**:
- `order_id` → `orders(order_id)` ON DELETE CASCADE
- `customer_id` → `customers(user_id)` ON DELETE CASCADE

---

## Entity Relationships

```
Order (1) ──── (0..1) OrderCancelRequest
  │
  └─── (1) Customer
  │
  └─── (1) Store ──── (1) Supplier
```

---

## Error Codes

| Error Code | HTTP Status | Message | When |
|------------|-------------|---------|------|
| `ORDER_NOT_FOUND` | 404 | Order not found | Order doesn't exist |
| `UNAUTHORIZED_ACCESS` | 403 | Bạn không có quyền... | Customer doesn't own order |
| `INVALID_ORDER_STATUS` | 400 | Chỉ có thể tạo yêu cầu hủy... | Order not in PREPARING/SHIPPING |
| `RESOURCE_ALREADY_EXISTS` | 409 | Đơn hàng này đã có yêu cầu hủy... | Duplicate pending request |
| `RESOURCE_NOT_FOUND` | 404 | Không tìm thấy yêu cầu hủy đơn | Cancel request doesn't exist |
| `INVALID_REQUEST` | 400 | Yêu cầu hủy đơn này đã được xét duyệt | Already reviewed |
| `OPERATION_NOT_ALLOWED` | 403 | Đơn hàng đang được xử lý... | Customer tries direct cancel on PREPARING+ |

---

## Integration with Existing Systems

### 1. OrderService Integration
- **Modified Method**: `cancelOrder(customerId, orderId, request)`
- **New Validation**:
  ```java
  if (isCustomer && (status == PREPARING || status == SHIPPING)) {
      throw new BadRequestException(OPERATION_NOT_ALLOWED,
          "Đơn hàng đang được xử lý. Vui lòng tạo 'Yêu cầu hủy đơn'...");
  }
  ```
- **Used by**: `OrderCancelRequestService.reviewCancelRequest()` when approved

### 2. Notification System
- **Service**: `InAppNotificationService.createNotificationForUser()`
- **Type**: `NotificationType.ORDER_STATUS_UPDATE`
- **Recipients**:
  - Supplier: When customer creates request
  - Customer: When request is approved/rejected

### 3. Payment/Refund Integration
- **Automatic refund processing** when cancel request is approved
- Uses existing `OrderService.processRefund()` logic
- Updates `Payment.status` to `REFUNDED`

### 4. Inventory Management
- **Automatic stock return** when cancel request is approved
- Uses existing inventory return logic in `cancelOrder()`
- Updates `StoreProduct.stockQuantity`

### 5. Promotion System
- **Automatic rollback** of promotion usages when approved
- Deletes `PromotionUsage` records
- Frees up promotion usage limits

---

## Frontend Integration Guide

### Customer Flow

1. **Viewing Orders**:
   - Display "Yêu cầu hủy" button for orders in PREPARING/SHIPPING
   - Display "Hủy đơn" button for orders in PENDING/CONFIRMED

2. **Creating Cancel Request**:
   ```typescript
   const createCancelRequest = async (orderId: string, reason: string) => {
     const response = await fetch(`/api/order-cancel-requests?orderId=${orderId}`, {
       method: 'POST',
       headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
       body: JSON.stringify({ reason })
     });
     return response.json();
   };
   ```

3. **Viewing Cancel Request Status**:
   ```typescript
   const getCancelRequestByOrder = async (orderId: string) => {
     const response = await fetch(`/api/order-cancel-requests/order/${orderId}`, {
       headers: { 'Authorization': `Bearer ${token}` }
     });
     return response.json();
   };
   ```

4. **My Cancel Requests Page**:
   ```typescript
   const getMyCancelRequests = async (page = 0, size = 10) => {
     const response = await fetch(`/api/order-cancel-requests/my-requests?page=${page}&size=${size}`, {
       headers: { 'Authorization': `Bearer ${token}` }
     });
     return response.json();
   };
   ```

### Supplier Flow

1. **Pending Requests Dashboard**:
   ```typescript
   const getPendingRequests = async (storeId: string) => {
     const response = await fetch(`/api/order-cancel-requests/store/${storeId}?pending=true`, {
       headers: { 'Authorization': `Bearer ${token}` }
     });
     return response.json();
   };
   ```

2. **Review Request**:
   ```typescript
   const reviewCancelRequest = async (
     cancelRequestId: string,
     approved: boolean,
     reviewNote?: string
   ) => {
     const response = await fetch(`/api/order-cancel-requests/${cancelRequestId}/review`, {
       method: 'POST',
       headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
       body: JSON.stringify({ approved, reviewNote })
     });
     return response.json();
   };
   ```

3. **All Requests History**:
   ```typescript
   const getAllStoreRequests = async (storeId: string, page = 0) => {
     const response = await fetch(`/api/order-cancel-requests/store/${storeId}?pending=false&page=${page}`, {
       headers: { 'Authorization': `Bearer ${token}` }
     });
     return response.json();
   };
   ```

### Admin Flow

1. **View All Pending**:
   ```typescript
   const getAllPending = async () => {
     const response = await fetch('/api/order-cancel-requests/pending', {
       headers: { 'Authorization': `Bearer ${token}` }
     });
     return response.json();
   };
   ```

2. **Admin can also review** using same `reviewCancelRequest` API

---

## Testing Scenarios

### Scenario 1: Customer Creates Cancel Request (Success)
1. Customer places order → Order status = PENDING
2. Supplier confirms → Order status = CONFIRMED
3. Supplier starts preparing → Order status = PREPARING
4. **Customer tries direct cancel** → ERROR: OPERATION_NOT_ALLOWED
5. **Customer creates cancel request** → SUCCESS: Request created, supplier notified
6. Request status = PENDING_REVIEW

### Scenario 2: Supplier Approves Cancel Request
1. Supplier reviews cancel request
2. **Supplier approves** with note: "Đồng ý hủy theo yêu cầu"
3. System:
   - Updates request status = APPROVED
   - Cancels order (returns inventory, processes refund)
   - Sets order status = CANCELED
   - Notifies customer: "Yêu cầu hủy đã được phê duyệt. Tiền đã được hoàn lại."

### Scenario 3: Supplier Rejects Cancel Request
1. Supplier reviews cancel request
2. **Supplier rejects** with note: "Hàng đã được đóng gói, không thể hủy"
3. System:
   - Updates request status = REJECTED
   - Order continues (status unchanged)
   - Notifies customer: "Yêu cầu hủy bị từ chối. Lý do: Hàng đã được đóng gói..."

### Scenario 4: Duplicate Request Prevention
1. Customer creates cancel request for order A → SUCCESS
2. **Customer tries to create another request** for order A → ERROR: RESOURCE_ALREADY_EXISTS
3. Only one PENDING_REVIEW request allowed per order

### Scenario 5: Direct Cancel for PENDING/CONFIRMED
1. Customer places order → Order status = PENDING
2. **Customer cancels directly** → SUCCESS: Order cancelled immediately
3. No cancel request needed for early-stage orders

---

## Performance Considerations

### Indexes
- `order_id`: Fast lookup for single order's cancel request
- `customer_id`: Efficient customer request history queries
- `status`: Quick filtering of pending requests
- `requested_at`: Sorted pagination

### Pagination
- All list endpoints support pagination
- Default page size: 10
- Sorting: Newest first for customers, oldest first for suppliers (priority)

### Notifications
- Asynchronous notification sending (non-blocking)
- Uses existing `InAppNotificationService`

---

## Future Enhancements

### Phase 2 (Potential)
1. **Auto-reject after timeout**: If supplier doesn't review within 24h, auto-approve
2. **Partial refund**: Allow supplier to deduct fees for already-prepared items
3. **Cancel request for DELIVERED**: Allow cancel/return for delivered orders with different flow
4. **Email notifications**: In addition to in-app notifications
5. **Cancel request chat**: Allow customer and supplier to discuss before approval
6. **Analytics dashboard**: Track cancellation rates by reason, store, time period

---

## Summary

The Order Cancel Request workflow provides a **fair and transparent** process for handling order cancellations after preparation has started. Key benefits:

✅ **Prevents supplier losses** from late-stage cancellations  
✅ **Gives customers flexibility** with valid reasons  
✅ **Automated refund processing** when approved  
✅ **Clear audit trail** with timestamps and reviewer info  
✅ **Notification integration** keeps all parties informed  
✅ **RESTful API design** easy to integrate with frontend  

**Critical Implementation**: This fixes a severe business logic flaw where customers could cancel PREPARING/SHIPPING orders without supplier approval, causing inventory and financial losses.
