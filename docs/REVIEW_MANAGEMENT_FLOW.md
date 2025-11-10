# Luồng Quản Lý Đánh Giá (Review Management Flow)

## Tổng Quan Hệ Thống

Hệ thống quản lý đánh giá sản phẩm cho phép khách hàng đánh giá sản phẩm đã mua, nhà cung cấp phản hồi đánh giá, và admin kiểm duyệt các đánh giá vi phạm.

### Các Vai Trò (Actors)

1. **Khách hàng (CUSTOMER)** - Người mua hàng và viết đánh giá
2. **Nhà cung cấp (SUPPLIER)** - Chủ cửa hàng, phản hồi đánh giá
3. **Quản trị viên (ADMIN/SUPER_ADMIN)** - Kiểm duyệt nội dung

---

## 1. Luồng Khách Hàng (Customer Flow)

### 1.1. Tạo Đánh Giá (Create Review)

**Điều kiện:**
- Khách hàng đã mua sản phẩm
- Đơn hàng đã được giao thành công (DELIVERED)
- Chưa đánh giá cho OrderDetail này (mỗi sản phẩm trong đơn hàng chỉ đánh giá 1 lần)

**Quy trình:**

```
[Khách hàng] → Đặt hàng → Nhận hàng → Viết đánh giá
```

**API Endpoint:**
```
POST /api/reviews
Authorization: Bearer <customer_token>
Content-Type: application/json

{
  "orderDetailId": "uuid",
  "rating": 5,               // 1-5 sao
  "comment": "Sản phẩm tốt", // Optional
  "imageUrl": "https://..."  // Optional
}
```

**Quy tắc nghiệp vụ:**
- **Rating**: Bắt buộc, từ 1-5 sao
- **Comment**: Tùy chọn, tối đa 1000 ký tự
- **Image**: Tùy chọn, upload trước qua `/api/reviews/upload-image`
- **Điểm thưởng**:
  - Đánh giá thường: +10 điểm
  - Đánh giá có ảnh: +5 điểm thêm
  - Tổng tối đa: 15 điểm/đánh giá

**Response:**
```json
{
  "reviewId": "uuid",
  "rating": 5,
  "comment": "Sản phẩm tốt",
  "imageUrl": "https://...",
  "customerName": "Nguyễn Văn A",
  "productName": "Cà chua sạch",
  "productImage": "https://...",
  "orderCode": "ORDER123",
  "createdAt": "2025-11-10T10:00:00",
  "markedAsSpam": false,
  "supplierReply": null,
  "repliedAt": null
}
```

**Validation lỗi:**
- `ORDER_NOT_FOUND`: Không tìm thấy OrderDetail
- `REVIEW_ALREADY_EXISTS`: Đã đánh giá sản phẩm này rồi
- `ORDER_NOT_DELIVERED`: Đơn hàng chưa giao
- `UNAUTHORIZED_ACCESS`: Không phải khách hàng của đơn hàng này

---

### 1.2. Chỉnh Sửa Đánh Giá (Update Review)

**Điều kiện:**
- Khách hàng là người viết đánh giá
- Trong vòng **7 ngày** kể từ khi tạo đánh giá
- Đánh giá chưa bị đánh dấu spam

**API Endpoint:**
```
PUT /api/reviews/{reviewId}
Authorization: Bearer <customer_token>

{
  "rating": 4,
  "comment": "Cập nhật đánh giá",
  "imageUrl": "https://..."
}
```

**Quy tắc:**
- Có thể thay đổi rating, comment, imageUrl
- **Không** được điểm thưởng thêm khi update
- Sau 7 ngày không thể chỉnh sửa

**Validation lỗi:**
- `REVIEW_NOT_FOUND`: Không tìm thấy đánh giá
- `UNAUTHORIZED_ACCESS`: Không phải người viết đánh giá
- `EDIT_WINDOW_EXPIRED`: Quá 7 ngày, không thể sửa
- `REVIEW_MARKED_AS_SPAM`: Đánh giá đã bị đánh dấu spam

---

### 1.3. Xóa Đánh Giá (Delete Review)

**Điều kiện:**
- Khách hàng là người viết đánh giá
- Trong vòng **7 ngày** kể từ khi tạo

**API Endpoint:**
```
DELETE /api/reviews/{reviewId}
Authorization: Bearer <customer_token>
```

**Hậu quả:**
- Xóa vĩnh viễn đánh giá
- **KHÔNG** hoàn lại điểm thưởng đã nhận
- Có thể tạo đánh giá mới cho OrderDetail đó

---

### 1.4. Upload Ảnh Đánh Giá

**API Endpoint:**
```
POST /api/reviews/upload-image
Authorization: Bearer <customer_token>
Content-Type: multipart/form-data

file: <image_file>
```

**Quy tắc:**
- Định dạng: JPG, PNG, GIF, WebP
- Kích thước: Tối đa **5MB**
- Lưu trữ: Cloudinary (bucket: REVIEWS)

**Response:**
```json
{
  "imageUrl": "https://res.cloudinary.com/.../reviews/abc123.jpg"
}
```

Sau khi upload, sử dụng `imageUrl` này khi tạo/cập nhật đánh giá.

---

### 1.5. Xem Đánh Giá Của Mình

**API Endpoint:**
```
GET /api/reviews/my-reviews?page=0&size=10
Authorization: Bearer <customer_token>
```

**Response:** Danh sách tất cả đánh giá của khách hàng (phân trang)

---

## 2. Luồng Nhà Cung Cấp (Supplier Flow)

### 2.1. Xem Đánh Giá Cửa Hàng

**API Endpoint:**
```
GET /api/reviews/store/{storeId}?page=0&size=20&rating=5
Authorization: Bearer <supplier_token>
```

**Query Parameters:**
- `page`: Trang (0-indexed)
- `size`: Số lượng/trang
- `rating`: Lọc theo số sao (1-5), optional

**Response:** 
```json
{
  "content": [
    {
      "reviewId": "uuid",
      "rating": 5,
      "comment": "Tuyệt vời",
      "customerName": "Nguyễn Văn A",
      "productName": "Cà chua",
      "createdAt": "2025-11-10T10:00:00",
      "supplierReply": null,
      "markedAsSpam": false
    }
  ],
  "totalElements": 50,
  "totalPages": 3,
  "number": 0
}
```

---

### 2.2. Phản Hồi Đánh Giá (Reply to Review)

**Điều kiện:**
- Nhà cung cấp sở hữu cửa hàng có đánh giá này
- Chưa phản hồi trước đó

**API Endpoint:**
```
POST /api/reviews/{reviewId}/reply
Authorization: Bearer <supplier_token>

{
  "reply": "Cảm ơn quý khách đã ủng hộ"
}
```

**Quy tắc:**
- `reply`: Bắt buộc, tối đa 1000 ký tự
- Mỗi đánh giá chỉ phản hồi **1 lần** (nhưng có thể sửa/xóa)

**Response:** ReviewResponse với `supplierReply` và `repliedAt` đã điền

---

### 2.3. Sửa Phản Hồi (Update Reply)

**Điều kiện:**
- Đã phản hồi trước đó
- Trong vòng **7 ngày** kể từ khi phản hồi

**API Endpoint:**
```
PUT /api/reviews/{reviewId}/reply
Authorization: Bearer <supplier_token>

{
  "reply": "Cảm ơn quý khách, chúng tôi rất vui..."
}
```

**Validation:**
- `REPLY_NOT_FOUND`: Chưa có phản hồi để sửa
- `EDIT_WINDOW_EXPIRED`: Quá 7 ngày

---

### 2.4. Xóa Phản Hồi (Delete Reply)

**Điều kiện:**
- Đã phản hồi trước đó

**API Endpoint:**
```
DELETE /api/reviews/{reviewId}/reply
Authorization: Bearer <supplier_token>
```

**Hậu quả:**
- Xóa `supplierReply` và `repliedAt`
- Có thể phản hồi lại sau

---

### 2.5. Báo Cáo Đánh Giá Vi Phạm (Report Review) ⭐ MỚI

**Điều kiện:**
- Đánh giá thuộc cửa hàng của nhà cung cấp
- Đánh giá chưa bị admin đánh dấu spam

**API Endpoint:**
```
POST /api/reviews/{reviewId}/report?reason=Spam/Quảng cáo
Authorization: Bearer <supplier_token>
```

**Các lý do phổ biến:**
- "Spam/Quảng cáo"
- "Nội dung xúc phạm/thô tục"
- "Đánh giá giả mạo"
- "Không liên quan đến sản phẩm"
- "Lý do khác..."

**Quy trình:**
1. Nhà cung cấp gửi báo cáo
2. Hệ thống gửi **thông báo đến tất cả admin**
3. Admin xem xét và quyết định

**Nội dung thông báo:**
```
Nhà cung cấp 'Cửa hàng ABC' đã báo cáo đánh giá vi phạm.
Lý do: Spam/Quảng cáo
Đánh giá: "Mua ở shop XYZ rẻ hơn..."
Khách hàng: Nguyễn Văn B
```

**Link:** `/admin/reviews/spam?reviewId={reviewId}`

**Response:**
```json
{
  "message": "Đã gửi báo cáo đánh giá vi phạm. Admin sẽ xem xét."
}
```

**Validation:**
- `UNAUTHORIZED_ACCESS`: Không phải cửa hàng của bạn
- `INVALID_REQUEST`: Đánh giá đã bị đánh dấu spam rồi

**Giao diện Supplier (CustomerReviews.tsx):**
- Nút "Báo cáo vi phạm" (🚩 Flag icon) màu cam
- Modal chọn lý do báo cáo
- Chỉ hiển thị nếu `!review.markedAsSpam`

---

## 3. Luồng Admin (Admin Flow)

### 3.1. Xem Danh Sách Đánh Giá Spam

**API Endpoint:**
```
GET /api/reviews/admin/spam?page=0&size=20
Authorization: Bearer <admin_token>
```

**Response:** Danh sách các đánh giá đã bị đánh dấu `markedAsSpam = true`

**Use case:**
- Admin xem tất cả đánh giá đã bị đánh dấu spam
- Kiểm tra lại có thể gỡ spam flag

---

### 3.2. Đánh Dấu Spam / Gỡ Spam

**API Endpoint:**
```
PATCH /api/reviews/admin/{reviewId}/spam?isSpam=true
Authorization: Bearer <admin_token>
```

**Parameters:**
- `isSpam=true`: Đánh dấu là spam (ẩn khỏi hiển thị công khai)
- `isSpam=false`: Gỡ spam flag (hiển thị lại)

**Quy trình:**
1. Admin nhận thông báo từ supplier report
2. Admin kiểm tra nội dung đánh giá
3. Nếu vi phạm → `isSpam=true`
4. Nếu hợp lệ → không làm gì hoặc `isSpam=false` nếu đã đánh dấu nhầm

**Ảnh hưởng:**
- `markedAsSpam = true`: Đánh giá bị ẩn, không hiển thị trên trang sản phẩm
- Không xóa dữ liệu, vẫn lưu trong database
- Có thể gỡ spam flag sau

---

## 4. Luồng Công Khai (Public Flow)

### 4.1. Xem Đánh Giá Sản Phẩm

**API Endpoint:**
```
GET /api/reviews/product/{productVariantId}?page=0&size=10&rating=5&sortBy=LATEST
Authorization: Optional (không bắt buộc)
```

**Query Parameters:**
- `rating`: Lọc theo số sao (1-5)
- `sortBy`: 
  - `LATEST`: Mới nhất (mặc định)
  - `RATING_HIGH`: Rating cao nhất
  - `RATING_LOW`: Rating thấp nhất

**Lọc tự động:**
- Chỉ hiển thị `markedAsSpam = false`
- Sắp xếp theo sortBy

---

### 4.2. Xem Tổng Quan Rating

**API Endpoint:**
```
GET /api/reviews/product/{productVariantId}/rating
```

**Response:**
```json
{
  "averageRating": 4.5,
  "totalReviews": 150,
  "ratingCounts": {
    "5": 80,
    "4": 50,
    "3": 15,
    "2": 3,
    "1": 2
  }
}
```

**Use case:**
- Hiển thị trên trang chi tiết sản phẩm
- Tính trung bình sao
- Biểu đồ phân bố rating

---

### 4.3. Tìm Kiếm Đánh Giá

**API Endpoint:**
```
GET /api/reviews/product/{productVariantId}/search?keyword=tươi&page=0&size=10
```

**Tìm kiếm trong:**
- `comment`: Nội dung đánh giá
- `customerName`: Tên khách hàng

---

## 5. Sơ Đồ Trạng Thái Review

```
┌─────────────────────────────────────────────────────────────────┐
│                        VÒNG ĐỜI ĐÁNH GIÁ                        │
└─────────────────────────────────────────────────────────────────┘

[Khách hàng nhận hàng]
         │
         ▼
    ┌─────────┐
    │ CHƯA CÓ │ ◄────────────┐
    │ REVIEW  │              │ (Xóa đánh giá)
    └─────────┘              │
         │                   │
         │ (Tạo đánh giá)    │
         ▼                   │
    ┌─────────┐              │
    │ ACTIVE  │──────────────┘
    │ markedAsSpam: false     │
    └─────────┘              │
         │                   │
         │                   │
         ├──────────────► (Supplier phản hồi)
         │                   │
         │                   ▼
         │              ┌──────────────┐
         │              │ ACTIVE       │
         │              │ + Reply      │
         │              └──────────────┘
         │                   │
         │                   │
         │◄──────────────────┘
         │
         │ (Supplier báo cáo vi phạm)
         │
         ▼
    [Thông báo gửi Admin]
         │
         │
         ▼
    ┌─────────────────┐
    │ ADMIN KIỂM DUYỆT│
    └─────────────────┘
         │
         ├───── (Vi phạm) ────►┌──────────┐
         │                      │  SPAM    │
         │                      │ Hidden   │
         │                      └──────────┘
         │                           │
         └───── (Hợp lệ) ────────────┼──►[Giữ nguyên ACTIVE]
                                     │
                                     └──► (Có thể gỡ spam)
                                           │
                                           ▼
                                      [Quay lại ACTIVE]
```

---

## 6. Quy Tắc Thời Gian

### 6.1. Thời Hạn Chỉnh Sửa (Edit Window)

**Constant:** `REVIEW_EDIT_WINDOW_DAYS = 7`

**Áp dụng cho:**
- ✅ Khách hàng sửa/xóa đánh giá: 7 ngày từ `createdAt`
- ✅ Nhà cung cấp sửa phản hồi: 7 ngày từ `repliedAt`

**Logic kiểm tra:**
```java
LocalDateTime deadline = createdAt.plusDays(REVIEW_EDIT_WINDOW_DAYS);
if (LocalDateTime.now().isAfter(deadline)) {
    throw new BadRequestException("Đã quá thời gian cho phép chỉnh sửa");
}
```

---

## 7. Hệ Thống Điểm Thưởng

### 7.1. Quy Tắc Tính Điểm

**Config Keys:**
- `points.review.bonus` = 10 điểm (đánh giá thường)
- `points.review.image.bonus` = 5 điểm (có ảnh)

**Logic:**
```java
int pointsEarned = DEFAULT_REVIEW_BONUS_POINTS; // 10
if (review.getImageUrl() != null) {
    pointsEarned += DEFAULT_REVIEW_IMAGE_BONUS_POINTS; // +5
}
// Tổng: 10 hoặc 15 điểm
```

**Ghi chú:**
- Điểm được cộng **1 lần** khi tạo đánh giá
- **KHÔNG** cộng điểm khi sửa đánh giá
- **KHÔNG** trừ điểm khi xóa đánh giá

---

## 8. Validation & Security

### 8.1. Kiểm Tra Quyền (Authorization)

| Endpoint | Vai trò | Kiểm tra thêm |
|----------|---------|---------------|
| `POST /reviews` | CUSTOMER | Phải là chủ đơn hàng |
| `PUT /reviews/{id}` | CUSTOMER | Phải là người viết |
| `DELETE /reviews/{id}` | CUSTOMER | Phải là người viết + trong 7 ngày |
| `POST /{id}/reply` | SUPPLIER | Phải sở hữu store |
| `PUT /{id}/reply` | SUPPLIER | Phải sở hữu store + trong 7 ngày |
| `DELETE /{id}/reply` | SUPPLIER | Phải sở hữu store |
| `POST /{id}/report` | SUPPLIER | Phải sở hữu store + chưa spam |
| `PATCH /admin/{id}/spam` | ADMIN, SUPER_ADMIN | Không cần kiểm tra thêm |
| `GET /admin/spam` | ADMIN, SUPER_ADMIN | Không cần kiểm tra thêm |

### 8.2. Validation Input

**Rating:**
- Min: 1 sao
- Max: 5 sao
- Required: true

**Comment:**
- Max length: 1000 ký tự
- Required: false
- Có thể null

**Image:**
- Format: JPG, PNG, GIF, WebP
- Max size: 5MB
- Required: false

**Supplier Reply:**
- Max length: 1000 ký tự
- Required: true (khi tạo/sửa reply)

**Report Reason:**
- Max length: 500 ký tự
- Required: true

---

## 9. Các Trường Hợp Đặc Biệt

### 9.1. Đánh Giá Bị Đánh Dấu Spam

**Ảnh hưởng:**
- ❌ Không hiển thị trên trang sản phẩm
- ❌ Không tính vào averageRating
- ❌ Khách hàng KHÔNG thể sửa/xóa
- ✅ Vẫn lưu trong database
- ✅ Admin có thể gỡ spam flag

**UI:**
- Supplier: Không hiển thị nút "Báo cáo vi phạm"
- Customer: Có thể thấy đánh giá bị đánh dấu spam (nếu xem đánh giá của mình)

### 9.2. Supplier Phản Hồi Đánh Giá Spam

**Quy tắc:**
- ❌ Không thể phản hồi đánh giá đã bị đánh dấu spam
- ✅ Nếu đã phản hồi trước khi spam → phản hồi vẫn giữ nguyên

### 9.3. Xóa Sản Phẩm / Cửa Hàng

**Foreign Key Constraints:**
- Review → ProductVariant (NOT NULL)
- Review → Store (NOT NULL)
- Review → Customer (NOT NULL)

**Hành vi:**
- Nếu xóa ProductVariant/Store: 
  - **Cách 1**: Cascade delete (xóa luôn review)
  - **Cách 2**: Soft delete (giữ review, đánh dấu deleted)
  
*(Cần kiểm tra schema migration để xác định)*

---

## 10. Frontend Components

### 10.1. Supplier Portal (fe_supplier)

**Pages:**
- `CustomerReviews.tsx`: Quản lý đánh giá cửa hàng
  - Xem danh sách đánh giá
  - Lọc theo rating (1-5 sao)
  - Phản hồi / sửa / xóa phản hồi
  - **Báo cáo vi phạm** (mới)

**Components:**
- `ReviewCard.tsx`: Hiển thị 1 đánh giá
  - Avatar khách hàng
  - Rating (sao)
  - Comment & ảnh
  - Thông tin sản phẩm
  - Phản hồi của supplier (nếu có)
  - Nút: Reply, Edit Reply, Delete Reply, **Report** (mới)

- `ReplyModal.tsx`: Modal phản hồi đánh giá
- `ReportReviewModal.tsx`: Modal báo cáo vi phạm (mới)
  - Radio buttons: 5 lý do
  - Textarea: Lý do tùy chỉnh (nếu chọn "Khác")
  - Warning message

**Services:**
- `reviewService.ts`: API calls
  - `getReviewsByStore()`
  - `replyToReview()`
  - `updateReply()`
  - `deleteReply()`
  - `reportReview()` (mới)

### 10.2. Admin Portal (fe_admin)

**Status:** ⚠️ **CHƯA TRIỂN KHAI**

**Cần thiết:**
- Trang quản lý spam reviews (`/admin/reviews/spam`)
- Danh sách đánh giá đã bị báo cáo
- Nút Mark as Spam / Unmark Spam
- Bộ lọc (theo ngày báo cáo, lý do, cửa hàng, ...)

---

## 11. Notification System

### 11.1. Loại Thông Báo

**NotificationType.REVIEW_REPORTED:**
- Vietnamese: "Báo cáo đánh giá vi phạm"
- English: "Review reported by supplier notification"

### 11.2. Nội Dung Thông Báo

**Template:**
```
Nhà cung cấp '{supplier_name}' đã báo cáo đánh giá vi phạm.
Lý do: {reason}
Đánh giá: "{review_comment}"
Khách hàng: {customer_name}
```

**Link:** `/admin/reviews/spam?reviewId={reviewId}`

**Người nhận:** Tất cả ADMIN và SUPER_ADMIN

### 11.3. Quy Trình Gửi Notification

```java
inAppNotificationService.createNotificationForAllAdmins(
    NotificationType.REVIEW_REPORTED,
    notificationContent,
    "/admin/reviews/spam?reviewId=" + reviewId
);
```

---

## 12. Database Schema

### 12.1. Bảng `reviews`

```sql
CREATE TABLE reviews (
    review_id VARCHAR(36) PRIMARY KEY,      -- UUID
    customer_id VARCHAR(36) NOT NULL,       -- FK → customers
    product_variant_id VARCHAR(36) NOT NULL, -- FK → product_variants
    store_id VARCHAR(36) NOT NULL,          -- FK → stores
    order_detail_id VARCHAR(36) UNIQUE,     -- FK → order_details
    
    rating INT NOT NULL,                    -- 1-5
    comment VARCHAR(1000),                  -- Nội dung đánh giá
    image_url VARCHAR(1000),                -- URL ảnh
    
    marked_as_spam BOOLEAN DEFAULT FALSE,   -- Flag spam
    
    supplier_reply VARCHAR(1000),           -- Phản hồi supplier
    replied_at TIMESTAMP,                   -- Thời gian phản hồi
    
    created_at TIMESTAMP DEFAULT NOW(),     -- Thời gian tạo
    
    FOREIGN KEY (customer_id) REFERENCES customers(user_id),
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(product_variant_id),
    FOREIGN KEY (store_id) REFERENCES stores(store_id),
    FOREIGN KEY (order_detail_id) REFERENCES order_details(order_detail_id)
);
```

### 12.2. Indexes

**Nên có:**
```sql
CREATE INDEX idx_reviews_product ON reviews(product_variant_id, marked_as_spam);
CREATE INDEX idx_reviews_store ON reviews(store_id, marked_as_spam);
CREATE INDEX idx_reviews_customer ON reviews(customer_id);
CREATE INDEX idx_reviews_spam ON reviews(marked_as_spam);
CREATE UNIQUE INDEX idx_reviews_order_detail ON reviews(order_detail_id);
```

**Lý do:**
- Query đánh giá theo sản phẩm (trang chi tiết)
- Query đánh giá theo cửa hàng (supplier portal)
- Lọc spam reviews (admin)
- Đảm bảo 1 order detail chỉ có 1 review

---

## 13. Testing Checklist

### 13.1. Customer Flow
- [ ] Tạo đánh giá sau khi nhận hàng
- [ ] Không tạo đánh giá được nếu chưa nhận hàng
- [ ] Không tạo 2 đánh giá cho 1 sản phẩm
- [ ] Nhận đúng điểm thưởng (10 hoặc 15)
- [ ] Upload ảnh đánh giá
- [ ] Sửa đánh giá trong 7 ngày
- [ ] Không sửa được sau 7 ngày
- [ ] Xóa đánh giá trong 7 ngày
- [ ] Không xóa được sau 7 ngày
- [ ] Không sửa/xóa đánh giá đã bị spam

### 13.2. Supplier Flow
- [ ] Xem đánh giá cửa hàng mình
- [ ] Không xem được đánh giá cửa hàng khác
- [ ] Phản hồi đánh giá
- [ ] Sửa phản hồi trong 7 ngày
- [ ] Không sửa được phản hồi sau 7 ngày
- [ ] Xóa phản hồi
- [ ] Báo cáo đánh giá vi phạm
- [ ] Không báo cáo được đánh giá cửa hàng khác
- [ ] Không báo cáo được đánh giá đã spam
- [ ] Admin nhận thông báo khi báo cáo

### 13.3. Admin Flow
- [ ] Xem danh sách spam reviews
- [ ] Đánh dấu đánh giá là spam
- [ ] Gỡ spam flag
- [ ] Spam review không hiển thị công khai
- [ ] Spam review không tính vào rating trung bình

### 13.4. Public Flow
- [ ] Xem đánh giá sản phẩm
- [ ] Spam reviews không hiển thị
- [ ] Lọc theo rating
- [ ] Tìm kiếm đánh giá
- [ ] Sắp xếp đánh giá (mới nhất, rating cao/thấp)
- [ ] Xem tổng quan rating chính xác

---

## 14. Error Codes Summary

| Error Code | Mô tả | HTTP Status |
|------------|-------|-------------|
| `USER_NOT_FOUND` | Không tìm thấy user (customer/supplier) | 404 |
| `RESOURCE_NOT_FOUND` | Không tìm thấy review/order detail | 404 |
| `REVIEW_ALREADY_EXISTS` | Đã đánh giá sản phẩm này rồi | 400 |
| `ORDER_NOT_DELIVERED` | Đơn hàng chưa giao | 400 |
| `UNAUTHORIZED_ACCESS` | Không có quyền truy cập | 403 |
| `EDIT_WINDOW_EXPIRED` | Quá thời gian cho phép sửa (7 ngày) | 400 |
| `REVIEW_MARKED_AS_SPAM` | Đánh giá đã bị đánh dấu spam | 400 |
| `REPLY_NOT_FOUND` | Chưa có phản hồi để sửa/xóa | 404 |
| `INVALID_REQUEST` | Yêu cầu không hợp lệ | 400 |

---

## 15. Cải Tiến Tương Lai

### 15.1. Admin Portal
- ✅ Trang quản lý spam reviews
- ✅ Dashboard thống kê đánh giá
- ✅ Bộ lọc nâng cao
- ✅ Export báo cáo

### 15.2. Review Quality
- ✅ Vote helpful/unhelpful cho đánh giá
- ✅ Phát hiện spam tự động (ML)
- ✅ Verified purchase badge
- ✅ Image moderation (AI check ảnh)

### 15.3. Analytics
- ✅ Top reviewed products
- ✅ Sentiment analysis (tích cực/tiêu cực)
- ✅ Trend rating theo thời gian
- ✅ Supplier response rate & time

### 15.4. User Experience
- ✅ Review preview trước khi submit
- ✅ Template phản hồi cho supplier
- ✅ Bulk reply (phản hồi nhiều đánh giá)
- ✅ Rich text editor cho reply

---

## 16. Tổng Kết

### Tính Năng Đã Hoàn Thiện
- ✅ CRUD đánh giá (Customer)
- ✅ Phản hồi đánh giá (Supplier)
- ✅ Báo cáo vi phạm (Supplier → Admin)
- ✅ Đánh dấu spam (Admin)
- ✅ Hệ thống điểm thưởng
- ✅ Upload ảnh đánh giá
- ✅ Thời hạn chỉnh sửa (7 ngày)
- ✅ Notification system

### Cần Triển Khai
- ⚠️ Admin frontend (trang quản lý spam)
- ⚠️ Dashboard analytics
- ⚠️ Automated spam detection

### Tài Liệu Liên Quan
- `REVIEW_REPORTING_FEATURE.md`: Chi tiết tính năng báo cáo vi phạm
- `SUPPLIER_BUSINESS_FLOW.md`: Toàn bộ luồng nghiệp vụ supplier
- `SUPPLIER_ORDER_MANAGEMENT_FLOW.md`: Quản lý đơn hàng

---

**Cập nhật:** 10/11/2025  
**Phiên bản:** 1.0  
**Người tạo:** GitHub Copilot
