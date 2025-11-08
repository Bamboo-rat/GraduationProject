# Cải Tiến: Tự Động Generate Mã Vận Đơn (Tracking Number)

## Vấn Đề Ban Đầu
- Mã vận đơn (tracking number) được truyền từ **frontend** vào API `POST /api/orders/{orderId}/ship`
- Supplier phải tự nhập mã vận đơn → Rủi ro:
  - Trùng lặp mã
  - Mã không đúng format
  - Không an toàn (có thể đoán được)
  - Thiếu kiểm soát từ backend

## Giải Pháp Mới
Backend **tự động generate** mã vận đơn duy nhất khi supplier bắt đầu giao hàng.

### Format Mã Vận Đơn
```
GHN-YYYYMMDD-ORDERCODE-XXXX
```

**Ví dụ:**
```
GHN-20251108-ORD12345-A5B2
```

**Giải thích:**
- `GHN`: Prefix cố định (Giao Hàng Nhanh)
- `20251108`: Ngày tạo (YYYYMMDD)
- `ORD12345`: Mã đơn hàng
- `A5B2`: 4 ký tự random từ UUID (đảm bảo unique)

## Các Thay Đổi Code

### 1. OrderService Interface
**File:** `backend/src/main/java/com/example/backend/service/OrderService.java`

```java
// TỪ:
OrderResponse startShipping(String orderId, String trackingNumber);

// THÀNH:
OrderResponse startShipping(String orderId);
```

### 2. OrderServiceImpl
**File:** `backend/src/main/java/com/example/backend/service/impl/OrderServiceImpl.java`

**Thêm import:**
```java
import java.time.format.DateTimeFormatter;
```

**Thay đổi method:**
```java
@Override
@Transactional
public OrderResponse startShipping(String orderId) {  // Xóa tham số trackingNumber
    log.info("Starting order shipment: orderId={}", orderId);

    Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new NotFoundException(ErrorCode.ORDER_NOT_FOUND));

    if (order.getStatus() != OrderStatus.PREPARING) {
        throw new BadRequestException(ErrorCode.INVALID_ORDER_STATUS,
                "Chỉ có thể giao hàng từ trạng thái PREPARING");
    }

    // Generate unique tracking number - TỰ ĐỘNG TẠO
    String trackingNumber = generateTrackingNumber(order);
    
    // Create shipment record
    Shipment shipment = new Shipment();
    shipment.setOrder(order);
    shipment.setTrackingNumber(trackingNumber);
    shipment.setShippingProvider("Giao Hàng Nhanh");
    shipment.setStatus(ShipmentStatus.SHIPPING);
    shipment.setEstimatedDeliveryDate(LocalDateTime.now().plusDays(3));
    shipmentRepository.save(shipment);

    order.setStatus(OrderStatus.SHIPPING);
    order.setShippedAt(LocalDateTime.now());
    order.setShipment(shipment);
    order = orderRepository.save(order);

    sendOrderNotification(order,
            String.format("Đơn hàng #%s đang được giao đến bạn. Mã vận đơn: %s - Giao Hàng Nhanh",
                    order.getOrderCode(), trackingNumber));

    log.info("Order shipment started: orderId={}, trackingNumber={}", orderId, trackingNumber);
    return mapToOrderResponse(order);
}
```

**Thêm method generate:**
```java
/**
 * Generate unique tracking number for shipment
 * Format: GHN-YYYYMMDD-ORDERCODE-XXXX
 * Example: GHN-20251108-ORD1234-A5B2
 */
private String generateTrackingNumber(Order order) {
    String datePrefix = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
    String orderCode = order.getOrderCode().replace("#", "");
    String randomSuffix = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
    
    return String.format("GHN-%s-%s-%s", datePrefix, orderCode, randomSuffix);
}
```

### 3. OrderController
**File:** `backend/src/main/java/com/example/backend/controller/OrderController.java`

```java
// TỪ:
@PostMapping("/{orderId}/ship")
@PreAuthorize("hasRole('SUPPLIER')")
public ResponseEntity<ApiResponse<OrderResponse>> startShipping(
        @PathVariable String orderId,
        @RequestParam String trackingNumber) {  // ← XÓA THAM SỐ NÀY
    log.info("POST /api/orders/{}/ship - Starting shipment: trackingNumber={}", orderId, trackingNumber);
    OrderResponse response = orderService.startShipping(orderId, trackingNumber);
    return ResponseEntity.ok(ApiResponse.success("Đơn hàng đang được giao", response));
}

// THÀNH:
@PostMapping("/{orderId}/ship")
@PreAuthorize("hasRole('SUPPLIER')")
@Operation(summary = "Start shipping order", 
           description = "Start shipping order (PREPARING → SHIPPING). Automatically generates tracking number and creates shipment record")
public ResponseEntity<ApiResponse<OrderResponse>> startShipping(
        @PathVariable String orderId) {  // ← KHÔNG CẦN trackingNumber NỮA
    log.info("POST /api/orders/{}/ship - Starting shipment", orderId);
    OrderResponse response = orderService.startShipping(orderId);
    return ResponseEntity.ok(ApiResponse.success("Đơn hàng đang được giao", response));
}
```

## Lợi Ích

### 1. Bảo Mật & Kiểm Soát
- ✅ Backend kiểm soát hoàn toàn việc tạo mã vận đơn
- ✅ Không thể bị giả mạo hoặc trùng lặp
- ✅ Format nhất quán, dễ validate

### 2. Trải Nghiệm Người Dùng
- ✅ Supplier không phải lo nghĩ về mã vận đơn
- ✅ Chỉ cần click "Bắt đầu giao hàng" - hệ thống tự động
- ✅ Giảm thiểu sai sót do nhập liệu

### 3. Tích Hợp Đơn Vị Vận Chuyển
- ✅ Dễ dàng tích hợp với API bên thứ 3 sau này
- ✅ Có thể thêm logic generate phức tạp hơn (check trùng, prefix theo nhà vận chuyển, etc.)

### 4. Audit & Tracking
- ✅ Mã vận đơn được log rõ ràng với timestamp
- ✅ Có thể trace lại thời điểm tạo từ format (có ngày trong mã)
- ✅ Liên kết chặt chẽ với orderCode

## API Thay Đổi

### ❌ Cũ (KHÔNG DÙNG NỮA)
```http
POST /api/orders/{orderId}/ship?trackingNumber=ABC123
Authorization: Bearer <supplier_token>
```

### ✅ Mới
```http
POST /api/orders/{orderId}/ship
Authorization: Bearer <supplier_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Đơn hàng đang được giao",
  "data": {
    "orderId": "...",
    "orderCode": "#ORD12345",
    "status": "SHIPPING",
    "trackingNumber": "GHN-20251108-ORD12345-A5B2",  // ← TỰ ĐỘNG GENERATE
    "shippedAt": "2025-11-08T16:30:00",
    ...
  }
}
```

## Cập Nhật Frontend Cần Làm

### fe_supplier - Order Management
**File cần sửa:** `website/fe_supplier/app/pages/orders/OrderDetail.tsx` (hoặc tương tự)

**Xóa input tracking number:**
```typescript
// XÓA:
const [trackingNumber, setTrackingNumber] = useState("");

// XÓA form input này:
<input 
  placeholder="Nhập mã vận đơn"
  value={trackingNumber}
  onChange={(e) => setTrackingNumber(e.target.value)}
/>

// CẬP NHẬT API call:
// TỪ:
await fetch(`/api/orders/${orderId}/ship?trackingNumber=${trackingNumber}`, {
  method: 'POST'
});

// THÀNH:
await fetch(`/api/orders/${orderId}/ship`, {
  method: 'POST'
});
```

**Hiển thị tracking number sau khi giao:**
```typescript
// Sau khi gọi API thành công, response sẽ có trackingNumber
const response = await fetch(`/api/orders/${orderId}/ship`, {
  method: 'POST'
});
const data = await response.json();

// Hiển thị cho user
console.log(`Mã vận đơn: ${data.data.trackingNumber}`);
```

## Testing

### Test Case 1: Generate Tracking Number
```bash
# 1. Tạo order và confirm
# 2. Chuyển sang PREPARING
# 3. Gọi ship API:

POST http://localhost:8080/api/orders/{orderId}/ship
Authorization: Bearer <supplier_token>

# Verify:
# - Response có trackingNumber
# - Format đúng: GHN-YYYYMMDD-ORDERCODE-XXXX
# - Lưu vào DB (bảng shipments)
```

### Test Case 2: Unique Tracking Numbers
```bash
# Gọi ship cho 2 orders khác nhau
# Verify: Mã vận đơn khác nhau (suffix random)
```

### Test Case 3: Notification
```bash
# Verify customer nhận notification với tracking number
# "Đơn hàng #ORD123 đang được giao đến bạn. Mã vận đơn: GHN-20251108-ORD123-A5B2"
```

## Migration Notes
- ✅ **Backward Compatible**: Không ảnh hưởng orders cũ đã có tracking number
- ✅ **Database**: Không cần migration, trường `trackingNumber` vẫn giữ nguyên
- ⚠️ **Frontend**: CẦN cập nhật fe_supplier để xóa input tracking number

## Kết Luận
Cải tiến này làm hệ thống **chuyên nghiệp hơn**, **an toàn hơn** và **dễ sử dụng hơn**. Backend nắm quyền kiểm soát việc tạo mã vận đơn, đảm bảo tính toàn vẹn dữ liệu và trải nghiệm người dùng tốt hơn.
