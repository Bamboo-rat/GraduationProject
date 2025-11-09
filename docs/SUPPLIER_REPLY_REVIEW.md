# 💬 TÍNH NĂNG NHÀ CUNG CẤP TRẢ LỜI ĐÁNH GIÁ

## 📋 TỔNG QUAN

Tính năng cho phép **nhà cung cấp trả lời đánh giá** của khách hàng đối với sản phẩm trong cửa hàng của họ. Điều này giúp:
- ✅ Tăng tương tác với khách hàng
- ✅ Giải đáp thắc mắc, khiếu nại
- ✅ Thể hiện sự chuyên nghiệp
- ✅ Cải thiện trải nghiệm mua sắm

---

## 🗄️ THAY ĐỔI CƠ SỞ DỮ LIỆU

### **Entity: Review.java**
Đã thêm 2 trường mới:

```java
@Column(nullable = true, length = 1000)
private String supplierReply;  // Nội dung phản hồi từ nhà cung cấp

private LocalDateTime repliedAt;  // Thời điểm trả lời
```

### **Migration SQL**
```sql
ALTER TABLE reviews 
ADD COLUMN supplier_reply VARCHAR(1000) NULL,
ADD COLUMN replied_at TIMESTAMP NULL;
```

---

## 📦 DTO MỚI

### **1. ReplyReviewRequest.java**
```java
@NotBlank(message = "Nội dung phản hồi không được để trống")
@Size(max = 1000, message = "Nội dung phản hồi không được vượt quá 1000 ký tự")
private String reply;
```

### **2. ReviewResponse.java** (Cập nhật)
Đã thêm các trường:
```java
private String supplierReply;     // Nội dung reply
private LocalDateTime repliedAt;   // Thời điểm reply
private boolean canReply;          // Supplier có thể reply không
private boolean canEditReply;      // Supplier có thể sửa reply không
```

---

## 🔧 API ENDPOINTS

### **1. POST /api/reviews/{reviewId}/reply**
**Nhà cung cấp tạo phản hồi**

**Authorization:** `ROLE_SUPPLIER`

**Request Body:**
```json
{
  "reply": "Cảm ơn bạn đã mua hàng! Chúng tôi sẽ cải thiện chất lượng sản phẩm."
}
```

**Response:** `200 OK`
```json
{
  "reviewId": "uuid",
  "customerId": "uuid",
  "customerName": "Nguyễn Văn A",
  "rating": 5,
  "comment": "Sản phẩm rất tốt!",
  "supplierReply": "Cảm ơn bạn đã mua hàng!",
  "repliedAt": "2025-11-09T10:30:00",
  ...
}
```

**Validation:**
- ✅ Chỉ nhà cung cấp sở hữu cửa hàng mới reply được
- ✅ Không thể reply 2 lần (nếu đã reply, dùng PUT để sửa)
- ❌ Error: `UNAUTHORIZED_ACCESS` - Không phải cửa hàng của bạn
- ❌ Error: `RESOURCE_ALREADY_EXISTS` - Đã reply rồi

---

### **2. PUT /api/reviews/{reviewId}/reply**
**Nhà cung cấp sửa phản hồi**

**Authorization:** `ROLE_SUPPLIER`

**Request Body:**
```json
{
  "reply": "Cảm ơn bạn! Chúng tôi đã cải thiện sản phẩm dựa trên góp ý của bạn."
}
```

**Response:** `200 OK` (same as POST)

**Validation:**
- ✅ Chỉ sửa được phản hồi của mình
- ✅ Chỉ sửa được trong vòng **7 ngày** kể từ khi reply
- ❌ Error: `RESOURCE_NOT_FOUND` - Chưa có reply để sửa
- ❌ Error: `OPERATION_NOT_ALLOWED` - Quá 7 ngày, không thể sửa

---

### **3. DELETE /api/reviews/{reviewId}/reply**
**Nhà cung cấp xóa phản hồi**

**Authorization:** `ROLE_SUPPLIER`

**Response:** `204 No Content`

**Validation:**
- ✅ Chỉ xóa được phản hồi của mình
- ❌ Error: `RESOURCE_NOT_FOUND` - Không có reply để xóa
- ❌ Error: `UNAUTHORIZED_ACCESS` - Không phải cửa hàng của bạn

---

## 📊 QUY TẮC KINH DOANH

### **1. Quyền trả lời**
- ✅ Chỉ nhà cung cấp sở hữu cửa hàng (qua `review.store.supplier.userId == supplierId`)
- ✅ 1 review chỉ có 1 reply duy nhất
- ✅ Không cần đơn hàng DELIVERED (reply bất cứ lúc nào)

### **2. Thời hạn chỉnh sửa**
- ✅ Nhà cung cấp có **7 ngày** để sửa reply kể từ `repliedAt`
- ✅ Sau 7 ngày, không thể sửa (chỉ có thể xóa và tạo mới)

### **3. Xóa reply**
- ✅ Xóa bất cứ lúc nào (không giới hạn thời gian)
- ✅ Sau khi xóa, có thể tạo reply mới

---

## 🎯 LUỒNG HOẠT ĐỘNG

### **Scenario 1: Nhà cung cấp trả lời đánh giá lần đầu**
```
1. Khách hàng tạo review (rating: 4★, comment: "Sản phẩm tốt nhưng giao hàng hơi chậm")
2. Nhà cung cấp xem review trong dashboard
3. Nhà cung cấp click "Trả lời"
4. POST /api/reviews/{reviewId}/reply
   Body: { "reply": "Cảm ơn bạn! Chúng tôi sẽ cải thiện dịch vụ giao hàng" }
5. Review hiển thị với supplierReply và repliedAt
```

### **Scenario 2: Sửa reply trong vòng 7 ngày**
```
1. Nhà cung cấp muốn sửa nội dung reply
2. Check: repliedAt = "2025-11-09", now = "2025-11-12" → OK (< 7 ngày)
3. PUT /api/reviews/{reviewId}/reply
   Body: { "reply": "Cảm ơn bạn! Đã cải thiện..." }
4. Reply được cập nhật
```

### **Scenario 3: Sửa reply sau 7 ngày (FAILED)**
```
1. Nhà cung cấp muốn sửa reply
2. Check: repliedAt = "2025-11-01", now = "2025-11-09" → FAILED (> 7 ngày)
3. Response: 400 Bad Request
   Error: "Đã quá thời hạn chỉnh sửa phản hồi (7 ngày)"
```

### **Scenario 4: Xóa và tạo lại**
```
1. Nhà cung cấp xóa reply cũ (sau 7 ngày)
   DELETE /api/reviews/{reviewId}/reply → 204 No Content
2. Tạo reply mới
   POST /api/reviews/{reviewId}/reply → 200 OK
```

---

## 🧪 TEST CASES

### **Test 1: Reply thành công**
```java
@Test
public void testReplyToReview_Success() {
    // Given: Review exists, supplier owns store
    // When: POST /api/reviews/{reviewId}/reply
    // Then: 200 OK, review.supplierReply = "...", repliedAt != null
}
```

### **Test 2: Reply review của store khác (FAILED)**
```java
@Test
public void testReplyToReview_UnauthorizedStore() {
    // Given: Review belongs to store A, supplier owns store B
    // When: POST /api/reviews/{reviewId}/reply
    // Then: 400 Bad Request, "Bạn không có quyền trả lời đánh giá của cửa hàng khác"
}
```

### **Test 3: Reply 2 lần (FAILED)**
```java
@Test
public void testReplyToReview_AlreadyReplied() {
    // Given: Review already has supplierReply
    // When: POST /api/reviews/{reviewId}/reply
    // Then: 400 Bad Request, "Bạn đã trả lời đánh giá này rồi"
}
```

### **Test 4: Sửa reply thành công (< 7 ngày)**
```java
@Test
public void testUpdateReply_WithinEditWindow() {
    // Given: Reply created 3 days ago
    // When: PUT /api/reviews/{reviewId}/reply
    // Then: 200 OK, reply updated
}
```

### **Test 5: Sửa reply thất bại (> 7 ngày)**
```java
@Test
public void testUpdateReply_ExceedEditWindow() {
    // Given: Reply created 10 days ago
    // When: PUT /api/reviews/{reviewId}/reply
    // Then: 400 Bad Request, "Đã quá thời hạn chỉnh sửa phản hồi (7 ngày)"
}
```

### **Test 6: Xóa reply thành công**
```java
@Test
public void testDeleteReply_Success() {
    // Given: Review has supplierReply
    // When: DELETE /api/reviews/{reviewId}/reply
    // Then: 204 No Content, supplierReply = null, repliedAt = null
}
```

---

## 🎨 FRONTEND IMPLEMENTATION (TODO)

### **fe_supplier - Danh sách đánh giá sản phẩm**

#### **1. ReviewList.tsx**
```tsx
// Hiển thị danh sách đánh giá của sản phẩm trong store
// Với mỗi review:
// - Hiển thị: customerName, rating, comment, imageUrl, createdAt
// - Nếu có supplierReply: hiển thị reply + repliedAt
// - Nếu chưa có reply: hiển thị button "Trả lời"
// - Nếu có reply và < 7 ngày: hiển thị button "Sửa" + "Xóa"
// - Nếu có reply và > 7 ngày: chỉ hiển thị button "Xóa"
```

#### **2. ReplyModal.tsx**
```tsx
// Modal để nhà cung cấp nhập reply
// Props: reviewId, existingReply (nếu đang sửa)
// State: reply (max 1000 ký tự)
// Submit:
//   - Nếu existingReply == null: POST /api/reviews/{reviewId}/reply
//   - Nếu existingReply != null: PUT /api/reviews/{reviewId}/reply
```

#### **3. reviewService.ts**
```typescript
export const reviewService = {
  // Lấy đánh giá của store
  getStoreReviews: (storeId: string, page: number) =>
    api.get(`/reviews/store/${storeId}?page=${page}`),

  // Nhà cung cấp reply
  replyToReview: (reviewId: string, reply: string) =>
    api.post(`/reviews/${reviewId}/reply`, { reply }),

  // Sửa reply
  updateReply: (reviewId: string, reply: string) =>
    api.put(`/reviews/${reviewId}/reply`, { reply }),

  // Xóa reply
  deleteReply: (reviewId: string) =>
    api.delete(`/reviews/${reviewId}/reply`),
};
```

---

## 📝 EXAMPLE UI

### **Review Card (Customer View)**
```
┌─────────────────────────────────────────┐
│ ⭐⭐⭐⭐⭐ Nguyễn Văn A                  │
│ "Sản phẩm rất tốt, đóng gói cẩn thận"   │
│ [Ảnh review]                            │
│ 2025-11-08                              │
│                                         │
│ 💬 Phản hồi từ cửa hàng:                │
│ "Cảm ơn bạn đã tin tưởng sản phẩm!"     │
│ 2025-11-09                              │
└─────────────────────────────────────────┘
```

### **Review Card (Supplier View - Chưa reply)**
```
┌─────────────────────────────────────────┐
│ ⭐⭐⭐⭐ Trần Thị B                     │
│ "Sản phẩm tốt nhưng giao hàng chậm"     │
│ 2025-11-08                              │
│                                         │
│ [Trả lời] ← Button                      │
└─────────────────────────────────────────┘
```

### **Review Card (Supplier View - Đã reply < 7 ngày)**
```
┌─────────────────────────────────────────┐
│ ⭐⭐⭐⭐ Trần Thị B                     │
│ "Sản phẩm tốt nhưng giao hàng chậm"     │
│ 2025-11-08                              │
│                                         │
│ 💬 Phản hồi của bạn:                    │
│ "Cảm ơn bạn! Chúng tôi sẽ cải thiện"    │
│ 2025-11-09 (còn 5 ngày để sửa)          │
│ [Sửa] [Xóa] ← Buttons                   │
└─────────────────────────────────────────┘
```

### **Review Card (Supplier View - Đã reply > 7 ngày)**
```
┌─────────────────────────────────────────┐
│ ⭐⭐⭐⭐ Trần Thị B                     │
│ "Sản phẩm tốt nhưng giao hàng chậm"     │
│ 2025-11-01                              │
│                                         │
│ 💬 Phản hồi của bạn:                    │
│ "Cảm ơn bạn! Chúng tôi sẽ cải thiện"    │
│ 2025-11-02                              │
│ [Xóa] ← Button (không thể sửa)          │
└─────────────────────────────────────────┘
```

---

## ✅ CHECKLIST

### **Backend** ✅
- [x] Thêm trường `supplierReply` và `repliedAt` vào entity Review
- [x] Tạo DTO `ReplyReviewRequest`
- [x] Cập nhật `ReviewResponse` với reply fields
- [x] Implement `replyToReview()` trong ReviewServiceImpl
- [x] Implement `updateReply()` với 7-day edit window
- [x] Implement `deleteReply()`
- [x] Thêm 3 endpoints vào ReviewController
- [x] Validate quyền sở hữu store
- [x] Validate không reply 2 lần
- [x] Validate thời hạn sửa (7 ngày)
- [x] Compile thành công

### **Database** ⏳
- [ ] Chạy migration để thêm 2 cột mới vào bảng `reviews`

### **Frontend (fe_supplier)** ⏳
- [ ] Tạo component `ReviewList.tsx`
- [ ] Tạo component `ReplyModal.tsx`
- [ ] Tạo service `reviewService.ts`
- [ ] Hiển thị danh sách review của store
- [ ] Button "Trả lời" cho review chưa có reply
- [ ] Button "Sửa"/"Xóa" cho review đã có reply
- [ ] Hiển thị thời hạn còn lại để sửa
- [ ] Toast notification khi thành công/thất bại

---

## 🚀 DEPLOYMENT

### **1. Database Migration**
```sql
-- Run trước khi deploy backend
ALTER TABLE reviews 
ADD COLUMN supplier_reply VARCHAR(1000) NULL,
ADD COLUMN replied_at TIMESTAMP NULL;
```

### **2. Backend Deployment**
- Build: `mvn clean package -DskipTests`
- Deploy JAR file
- Restart service

### **3. Frontend Deployment**
- Implement components (ReviewList, ReplyModal)
- Build: `npm run build`
- Deploy to server

---

## 📚 TÀI LIỆU LIÊN QUAN

- [RETURN_REQUEST_API.md](./RETURN_REQUEST_API.md) - API trả hàng
- [SUPPLIER_ORDER_MANAGEMENT_FLOW.md](./SUPPLIER_ORDER_MANAGEMENT_FLOW.md) - Quản lý đơn hàng
- [IMPROVEMENTS_SUMMARY.md](./IMPROVEMENTS_SUMMARY.md) - Tổng hợp cải tiến

---

## 🎯 NEXT STEPS

1. ✅ **Chạy migration SQL** để thêm 2 cột mới
2. ⏳ **Tạo frontend components** cho nhà cung cấp
3. ⏳ **Test end-to-end** toàn bộ luồng reply
4. ⏳ **Tạo notification** khi nhà cung cấp reply (optional)

---

**Ngày tạo:** 2025-11-09  
**Trạng thái:** ✅ Backend hoàn thành, ⏳ Frontend pending
