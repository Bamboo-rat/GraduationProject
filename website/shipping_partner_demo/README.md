# Shipping Partner Demo Interface

Giao diện demo cho đối tác vận chuyển (shipping partner) để quản lý và cập nhật trạng thái giao hàng.

## 🚀 Tính năng

### ✅ Đã triển khai
- **Xem danh sách đơn hàng**: Hiển thị tất cả đơn hàng đang trong quá trình giao hàng
- **Thống kê**: Tổng đơn hàng, đang giao hàng, đã giao hôm nay
- **Tìm kiếm**: Tìm theo mã đơn hàng, tracking number, tên khách hàng
- **Lọc theo đơn vị vận chuyển**: Filter đơn hàng theo shipping provider
- **Cập nhật trạng thái**: Xác nhận đơn hàng đã giao thành công
- **Tự động làm mới**: Load dữ liệu real-time từ backend API

### 📊 Thông tin hiển thị
Mỗi đơn hàng hiển thị:
- Mã đơn hàng và tracking number
- Trạng thái giao hàng
- Thông tin cửa hàng
- Thông tin khách hàng (tên, SĐT)
- Địa chỉ giao hàng
- Số tiền COD
- Đơn vị vận chuyển
- Ngày tạo và ngày giao dự kiến

## 🔌 Backend API Integration

### Endpoints sử dụng

#### 1. Get All In-Transit Orders
```
GET /api/demo/shipping/orders
Query Params: provider (optional)
```

#### 2. Get Order by Tracking Number
```
GET /api/demo/shipping/orders/{trackingNumber}
```

#### 3. Mark Order as Delivered
```
POST /api/demo/shipping/orders/{trackingNumber}/deliver
```

### Response Format
```json
{
  "code": 200,
  "message": "Success message",
  "data": {
    "trackingNumber": "TRK12345",
    "orderId": "uuid",
    "orderCode": "ORD001",
    "shippingProvider": "GIAO_HANG_NHANH",
    "orderStatus": "SHIPPING",
    "shipmentStatus": "IN_TRANSIT",
    "storeName": "Store Name",
    "customerName": "Customer Name",
    "customerPhone": "0123456789",
    "shippingAddress": "Full address",
    "codAmount": 100000,
    "createdAt": "2025-11-06T10:00:00",
    "estimatedDeliveryDate": "2025-11-08T18:00:00",
    "deliveredAt": null
  }
}
```

## 🛠️ Cài đặt và Chạy

### 1. Yêu cầu
- Backend đang chạy tại `http://localhost:8080`
- CORS đã được cấu hình cho phép truy cập từ file:// hoặc domain hosting

### 2. Cấu hình Backend (nếu cần)
Đảm bảo trong `application.properties`:
```properties
app.cors.allowed-origins=http://localhost:3000,http://localhost:5173,file://
```

Hoặc set biến môi trường:
```bash
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,file://
```

### 3. Chạy Frontend
Mở file `index.html` trực tiếp trong trình duyệt:
```bash
# Windows
start index.html

# hoặc sử dụng Live Server trong VS Code
# hoặc http-server
npx http-server -p 3001
```

### 4. Cấu hình API URL
Nếu backend chạy ở địa chỉ khác, sửa trong `index.html`:
```javascript
const API_BASE_URL = 'http://your-backend-url:8080/api/demo/shipping';
```

## 📝 Luồng sử dụng

### Cho Shipping Partner
1. **Xem danh sách đơn**: Khi mở trang, tự động load danh sách đơn hàng đang giao
2. **Tìm kiếm đơn hàng**: Nhập mã đơn, tracking number hoặc tên khách hàng
3. **Lọc theo đơn vị**: Chọn đơn vị vận chuyển để chỉ xem đơn của mình
4. **Xác nhận đã giao**: Click nút "Xác nhận đã giao" khi hoàn tất giao hàng
5. **Làm mới**: Click nút "Làm mới" để cập nhật danh sách mới nhất

### Shipment Status
- `PENDING`: Chờ lấy hàng
- `IN_TRANSIT`: Đang giao hàng (có thể xác nhận đã giao)
- `DELIVERED`: Đã giao hàng thành công
- `CANCELLED`: Đã hủy
- `RETURNED`: Đã trả hàng

## 🎨 UI/UX Features

### Design System
- **Color Scheme**: SaveFood brand colors (green, beige, cream)
- **Typography**: System fonts (Apple, Segoe UI, Roboto)
- **Responsive**: Works on desktop, tablet, mobile
- **Icons**: Emoji icons for better UX

### Interactions
- Hover effects on cards and buttons
- Loading states with spinner
- Toast notifications for actions
- Smooth animations
- Empty state handling
- Error state handling

## 🔐 Security Notes

⚠️ **Important**: Đây là demo interface cho development/testing
- Endpoint `/api/demo/shipping/**` được config permitAll() trong SecurityConfig
- Trong production, cần thêm authentication:
  - API Key authentication
  - OAuth2 client credentials
  - IP whitelist
  - Rate limiting

## 🐛 Troubleshooting

### Lỗi CORS
```
Access to fetch at 'http://localhost:8080/api/demo/shipping/orders' from origin 'null' has been blocked by CORS policy
```
**Giải pháp**: Thêm `file://` hoặc domain của bạn vào `CORS_ALLOWED_ORIGINS`

### Không load được dữ liệu
1. Kiểm tra backend đang chạy: `http://localhost:8080/api/demo/shipping/orders`
2. Kiểm tra console log trong trình duyệt (F12)
3. Kiểm tra có đơn hàng SHIPPING status trong database

### Backend trả về 404
- Đảm bảo `ShippingPartnerDemoController` đã được Spring Boot scan
- Kiểm tra endpoint mapping: `/api/demo/shipping/**`

## 📞 Support

Nếu gặp vấn đề, check:
1. Backend logs
2. Browser console (F12 > Console)
3. Network tab (F12 > Network)
4. Database có đơn hàng với status SHIPPING

## 🚀 Future Enhancements

- [ ] Authentication với API Key
- [ ] Real-time updates với WebSocket
- [ ] Upload ảnh chứng nhận giao hàng
- [ ] Ghi chú lý do không giao được
- [ ] Lịch sử thay đổi trạng thái
- [ ] Export báo cáo
- [ ] Push notifications
- [ ] GPS tracking integration
