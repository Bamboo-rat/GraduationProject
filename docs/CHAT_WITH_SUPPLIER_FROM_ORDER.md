# Tính năng Chat với Nhà cung cấp qua Đơn hàng

## 📋 Tóm tắt

API `/api/orders/my-orders` **ĐÃ HOÀN CHỈNH** - Backend đã trả về đầy đủ thông tin `supplierId` và `supplierName` để hỗ trợ tính năng chat giữa khách hàng và nhà cung cấp.

## ✅ Các API đã có

### 1. API lấy danh sách đơn hàng của khách hàng
**Endpoint**: `GET /api/orders/my-orders`
- **Quyền**: `ROLE_CUSTOMER`
- **Response**: Trả về danh sách đơn hàng với đầy đủ thông tin:

```typescript
interface Order {
  id: string;
  orderCode: string;
  
  // Customer info
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  
  // ✅ Supplier info - SẴN SÀNG CHO CHAT
  supplierId: string;        // ← ID nhà cung cấp (dùng làm receiverId)
  supplierName: string;      // ← Tên nhà cung cấp (hiển thị trên UI)
  
  // Store info
  storeId: string;
  storeName: string;
  
  // ... các thông tin khác
}
```

### 2. Chat API đã có
**Backend**: `ChatController.java`, `ChatService.java`, `ChatMessage.java`
**Frontend Service**: `chatService.ts` (cả fe_admin và fe_supplier)

#### Các API chat có sẵn:
```typescript
// Gửi tin nhắn
POST /api/chat/send
Body: {
  content: string;
  receiverId: string;  // ← Sử dụng order.supplierId
  type?: MessageType;
}

// Lấy danh sách cuộc trò chuyện
GET /api/chat/conversations

// Lấy lịch sử chat với 1 người
GET /api/chat/conversations/{otherUserId}

// Đánh dấu đã đọc
POST /api/chat/messages/{messageId}/read
POST /api/chat/conversations/{otherUserId}/read

// Lấy số tin nhắn chưa đọc
GET /api/chat/unread-count
```

#### WebSocket đã có:
```typescript
// Kết nối WebSocket
ws://{host}/ws/chat

// Các destination STOMP:
/app/chat/send          // Gửi tin nhắn
/app/chat/typing        // Thông báo đang gõ
/app/chat/read          // Đánh dấu đã đọc

// Các queue nhận:
/user/queue/messages         // Nhận tin nhắn mới
/user/queue/read-receipts    // Nhận thông báo đã đọc
/user/queue/typing           // Nhận thông báo đang gõ
/user/queue/errors           // Nhận lỗi
```

## 🎯 Cách triển khai trên Frontend

### Ví dụ: Thêm nút "Nhắn tin" trong Order Detail

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

function OrderDetail({ order }: { order: Order }) {
  const navigate = useNavigate();

  const handleChatWithSupplier = () => {
    if (!order.supplierId) {
      alert('Không tìm thấy thông tin nhà cung cấp');
      return;
    }

    // Chuyển đến trang chat với receiverId = supplierId
    navigate(`/chat?receiverId=${order.supplierId}`);
    
    // Hoặc mở modal chat ngay tại trang order
    // openChatModal(order.supplierId, order.supplierName);
  };

  return (
    <div className="order-detail">
      {/* Order information */}
      <div className="order-header">
        <h2>Đơn hàng #{order.orderCode}</h2>
        <div className="order-actions">
          {/* Nút chat với nhà cung cấp */}
          <button 
            onClick={handleChatWithSupplier}
            className="btn btn-primary"
            disabled={!order.supplierId}
          >
            <MessageCircle size={18} />
            Nhắn tin với {order.supplierName}
          </button>
        </div>
      </div>
      
      {/* Store & Supplier info */}
      <div className="supplier-info">
        <h3>Thông tin cửa hàng</h3>
        <p><strong>Cửa hàng:</strong> {order.storeName}</p>
        <p><strong>Nhà cung cấp:</strong> {order.supplierName}</p>
        <p className="text-muted text-sm">ID: {order.supplierId}</p>
      </div>
      
      {/* Rest of order details */}
    </div>
  );
}
```

### Ví dụ: Gửi tin nhắn từ đơn hàng

```typescript
import chatService from '~/service/chatService';

async function sendMessageToSupplier(
  supplierId: string, 
  message: string,
  orderCode?: string
) {
  try {
    // Kết nối WebSocket nếu chưa kết nối
    if (!chatService.isConnected()) {
      await chatService.connect();
    }

    // Tạo nội dung tin nhắn có thể include mã đơn hàng
    const content = orderCode 
      ? `[Đơn hàng #${orderCode}]\n${message}`
      : message;

    // Gửi tin nhắn
    await chatService.sendMessage({
      content,
      receiverId: supplierId,  // ← Sử dụng supplierId từ order
      type: 'TEXT'
    });

    console.log('Tin nhắn đã gửi thành công');
  } catch (error) {
    console.error('Lỗi khi gửi tin nhắn:', error);
    throw error;
  }
}

// Sử dụng
const order = await orderService.getMyOrders();
await sendMessageToSupplier(
  order.content[0].supplierId,
  'Xin chào, tôi muốn hỏi về đơn hàng này',
  order.content[0].orderCode
);
```

## 📊 Luồng hoạt động

```
1. Khách hàng xem đơn hàng
   └─> GET /api/orders/my-orders
       └─> Response chứa: { supplierId, supplierName, ... }

2. Khách hàng click "Nhắn tin với nhà cung cấp"
   └─> Lấy supplierId từ order
   └─> Chuyển đến trang chat hoặc mở modal

3. Khách hàng gửi tin nhắn
   └─> POST /api/chat/send
       Body: {
         receiverId: order.supplierId,
         content: "Xin chào, tôi muốn hỏi về đơn hàng #ORD123..."
       }

4. Nhà cung cấp nhận tin nhắn
   └─> WebSocket: /user/queue/messages
   └─> Hiển thị notification
   └─> Có thể trả lời ngay

5. Cả 2 bên chat real-time
   └─> WebSocket giữ kết nối
   └─> Tin nhắn được đồng bộ real-time
   └─> Có typing indicator, read receipt
```

## 🎨 UI/UX Recommendations

### 1. **Trong trang Order List**
```
┌─────────────────────────────────────────┐
│ Đơn hàng #ORD12345                      │
│ Cửa hàng: SaveFood Store 1              │
│ Nhà cung cấp: Nguyễn Văn A              │
│                                         │
│ [Chi tiết] [Nhắn tin 💬]               │
└─────────────────────────────────────────┘
```

### 2. **Trong trang Order Detail**
```
┌─────────────────────────────────────────┐
│ Đơn hàng #ORD12345            [Nhắn tin]│
├─────────────────────────────────────────┤
│ Thông tin cửa hàng                      │
│ 🏪 SaveFood Store 1                     │
│ 👤 Nhà cung cấp: Nguyễn Văn A          │
│    📱 0901234567                        │
│    💬 [Nhắn tin ngay]                   │
└─────────────────────────────────────────┘
```

### 3. **Modal Chat nhanh**
```
┌─────────────────────────────────────────┐
│ 💬 Chat với Nguyễn Văn A          [X]  │
├─────────────────────────────────────────┤
│ Về đơn hàng: #ORD12345                 │
├─────────────────────────────────────────┤
│ [Tin nhắn cũ...]                        │
│                                         │
│ Khách hàng: Xin chào, sản phẩm còn...  │
│ Nhà cung: Dạ còn ạ, em giao hàng...    │
├─────────────────────────────────────────┤
│ [Nhập tin nhắn...]              [Gửi]  │
└─────────────────────────────────────────┘
```

## ✅ Checklist triển khai Frontend

### Phía Customer App (nếu có):
- [ ] Thêm nút "Nhắn tin" trong Order List
- [ ] Thêm nút "Nhắn tin với nhà cung cấp" trong Order Detail
- [ ] Implement trang Chat hoặc Modal Chat
- [ ] Tích hợp WebSocket để nhận tin nhắn real-time
- [ ] Hiển thị unread count badge
- [ ] Auto-fill context của đơn hàng vào tin nhắn đầu tiên

### Phía Supplier App (đã có):
- [x] Chat system đã có sẵn (`/chat` route)
- [x] WebSocket đã tích hợp
- [x] ChatService đã implement đầy đủ
- [ ] (Optional) Thêm link nhanh từ Order detail đến Chat

### Phía Admin App (đã có):
- [x] Chat system đã có sẵn (`/partners/chat` route)
- [x] Có thể xem và quản lý chat

## 🔒 Bảo mật đã có

1. **Authentication**: WebSocket yêu cầu Bearer token
2. **Authorization**: 
   - Chỉ customer và supplier liên quan mới chat được với nhau
   - Backend kiểm tra quyền truy cập conversation
3. **Validation**: 
   - receiverId phải tồn tại
   - Không thể gửi tin nhắn cho chính mình

## 📝 Kết luận

**KHÔNG CẦN THAY ĐỔI BACKEND** - Tất cả API cần thiết đã có sẵn!

Chỉ cần implement UI/UX ở frontend để:
1. Hiển thị thông tin nhà cung cấp từ order (đã có supplierId, supplierName)
2. Tạo nút "Nhắn tin" kết nối đến chat system
3. Sử dụng `order.supplierId` làm `receiverId` khi gọi chat API

**Trải nghiệm người dùng được nâng cao**:
- ✅ Khách hàng có thể hỏi trực tiếp nhà cung cấp về đơn hàng
- ✅ Chat real-time với WebSocket
- ✅ Context-aware: biết đang chat về đơn hàng nào
- ✅ Giảm support burden cho admin

---

**Ngày tạo**: 9 tháng 11, 2025  
**Tác giả**: GitHub Copilot  
**Trạng thái**: ✅ Backend đã hoàn chỉnh, chờ Frontend implement UI
