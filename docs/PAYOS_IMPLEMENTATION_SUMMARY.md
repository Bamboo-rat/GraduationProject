# PayOS Integration - Backend Implementation Summary

## Tổng quan

Đã tích hợp PayOS payment gateway vào hệ thống FoodSave để hỗ trợ thanh toán trực tuyến cho mobile app.

## Files đã tạo

### 1. Configuration
- **PayOSConfig.java** - Configuration class đọc properties từ application.properties

### 2. DTOs (Data Transfer Objects)

#### Request DTOs:
- **CreatePaymentLinkRequest.java** - Request để tạo payment link
- **PayOSWebhookRequest.java** - Request từ PayOS webhook

#### Response DTOs:
- **PaymentLinkResponse.java** - Response chứa checkout URL và QR code

### 3. Service Layer
- **PayOSService.java** - Interface định nghĩa các methods
- **PayOSServiceImpl.java** - Implementation tích hợp PayOS API
  - `createPaymentLink()` - Tạo payment link mới
  - `getPaymentStatus()` - Lấy trạng thái thanh toán
  - `cancelPaymentLink()` - Hủy payment link
  - `processWebhook()` - Xử lý webhook từ PayOS
  - `verifyWebhookSignature()` - Verify signature bảo mật

### 4. Controller
- **PayOSController.java** - REST API endpoints
  - POST `/api/payments/payos/create-payment-link`
  - GET `/api/payments/payos/payment-status/{orderId}`
  - POST `/api/payments/payos/cancel-payment/{orderId}`
  - POST `/api/payments/payos/webhook` (public endpoint)
  - GET `/api/payments/payos/test-config` (admin only)

### 5. Enums Updated
- **PaymentProvider.java** - Thêm `PAYOS` vào enum

### 6. Documentation
- **PAYOS_MOBILE_INTEGRATION.md** - Hướng dẫn chi tiết cho mobile team

## Luồng hoạt động

### QR Code Payment (Recommended)
```
1. Mobile app: POST /api/payments/payos/create-payment-link
   - Gửi orderId, amount, returnUrl, cancelUrl
   
2. Backend: Gọi PayOS API để tạo payment link
   - Generate unique orderCode (timestamp)
   - Tạo request với buyer info
   - Nhận về checkoutUrl + qrCode
   
3. Backend: Update Payment entity
   - Set provider = PAYOS
   - Set transactionId = orderCode
   - Set status = PENDING
   
4. Mobile app: Hiển thị QR code
   - Customer quét QR bằng banking app
   - Customer xác nhận thanh toán
   
5. PayOS: Gửi webhook về backend
   - POST /api/payments/payos/webhook
   - Verify signature
   - Update payment status = SUCCESS
   - Update order status = CONFIRMED
   
6. Mobile app: Polling payment status
   - GET /api/payments/payos/payment-status/{orderId}
   - Khi status = PAID → Hiển thị thành công
```

### WebView Payment (Alternative)
```
1. Mobile app: Tạo payment link (như trên)
2. Mobile app: Mở WebView với checkoutUrl
3. Customer: Nhập thông tin thanh toán
4. PayOS: Redirect về returnUrl (deep link)
5. Mobile app: Bắt deep link và xử lý kết quả
```

## Security Features

1. **Webhook Signature Verification**
   - HMAC SHA256 signature
   - Sử dụng checksum-key từ PayOS
   - Verify mọi webhook request

2. **Customer Authorization**
   - Validate customer ownership của order
   - PreAuthorize cho mọi endpoint

3. **Order Status Validation**
   - Chỉ cho phép thanh toán order PENDING
   - Không cho phép thanh toán order đã PAID

4. **Idempotency**
   - Transaction ID unique (timestamp-based)
   - Prevent duplicate payments

## Configuration Required

### application.properties
```properties
# PayOS Configuration
payos.client-id=af093696-9d94-4744-8976-cb27487086b6
payos.api-key=2ed881cf-6ec8-4576-ab94-6fdd72e41bbb
payos.checksum-key=63079253be4ad6ee6bc34267a70e1b6614017f0cd42831c61e0e59999337bd0c
payos.base-url=https://api-merchant.payos.vn
payos.return-url=https://your-domain.com/mobile/payos/return
payos.cancel-url=https://your-domain.com/mobile/payos/cancel
```

### Webhook URL (Production)
Cần config trên PayOS dashboard:
```
https://your-backend-domain.com/api/payments/payos/webhook
```

## Testing

### 1. Test Config
```bash
curl -X GET https://api.foodsave.com/api/payments/payos/test-config \
  -H "Authorization: Bearer {admin-token}"
```

### 2. Create Payment Link
```bash
curl -X POST https://api.foodsave.com/api/payments/payos/create-payment-link \
  -H "Authorization: Bearer {customer-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "uuid-order-id",
    "amount": 500000,
    "description": "Test payment",
    "returnUrl": "foodsave://payment/success",
    "cancelUrl": "foodsave://payment/cancel"
  }'
```

### 3. Check Payment Status
```bash
curl -X GET https://api.foodsave.com/api/payments/payos/payment-status/{orderId} \
  -H "Authorization: Bearer {customer-token}"
```

## Error Handling

### Common Errors

| Error Code | Message | Solution |
|------------|---------|----------|
| ORDER_NOT_FOUND | Không tìm thấy đơn hàng | Kiểm tra orderId |
| INVALID_ORDER_STATUS | Chỉ có thể thanh toán đơn hàng PENDING | Order đã thanh toán hoặc hủy |
| UNAUTHORIZED_ACCESS | Không có quyền thanh toán | Order không thuộc về customer |
| EXTERNAL_SERVICE_ERROR | Lỗi PayOS API | Retry hoặc liên hệ support |
| INVALID_REQUEST | Webhook signature không hợp lệ | PayOS signature sai |

## Integration Checklist

- [x] Configuration class
- [x] DTOs (Request/Response)
- [x] Service interface & implementation
- [x] REST API controller
- [x] PaymentProvider enum updated
- [x] Webhook handling
- [x] Signature verification
- [x] Error handling
- [x] Mobile documentation
- [ ] Deploy và config webhook URL trên PayOS dashboard
- [ ] Test với PayOS sandbox
- [ ] Test với real banking apps
- [ ] Monitor webhook logs
- [ ] Set up alerting for failed payments

## Next Steps

1. **Deploy Backend**
   - Deploy code lên production
   - Verify endpoints hoạt động

2. **Config PayOS Dashboard**
   - Thêm webhook URL: `https://your-domain.com/api/payments/payos/webhook`
   - Test webhook delivery

3. **Mobile Integration**
   - Follow PAYOS_MOBILE_INTEGRATION.md
   - Implement QR code payment flow
   - Test deep linking

4. **Testing**
   - Test với PayOS sandbox
   - Test payment success flow
   - Test payment cancel flow
   - Test webhook retry mechanism

5. **Monitoring**
   - Monitor payment success rate
   - Monitor webhook response time
   - Set up alerts for failed payments

## Support Contacts

- PayOS Support: support@payos.vn
- PayOS Docs: https://payos.vn/docs
- Backend Team: [your-email]
