# 📋 DANH SÁCH CHỨC NĂNG THEO VAI TRÒ - SaveFood SYSTEM

**Business Functions Breakdown**  
**Ngày:** 19/10/2025

---

## 📚 MỤC LỤC

1. [Customer (Khách hàng)](#1-customer-khách-hàng)
2. [Supplier (Nhà cung cấp)](#2-supplier-nhà-cung-cấp)
3. [Admin (Quản trị viên)](#3-admin-quản-trị-viên)
4. [Public (Không cần đăng nhập)](#4-public-không-cần-đăng-nhập)

---

## 1. CUSTOMER (Khách hàng)

### 1.1. Quản lý Tài khoản

| # | Chức năng | Endpoint | Method | Mô tả |
|---|-----------|----------|--------|-------|
| 1.1.1 | Đăng ký tài khoản | `/api/auth/register/customer/step1` | POST | Đăng ký với phone, email, username, password |
| 1.1.2 | Xác thực OTP | `/api/auth/register/customer/step2` | POST | Nhập OTP từ email/SMS để kích hoạt |
| 1.1.3 | Gửi lại OTP | `/api/auth/register/customer/resend-otp` | POST | Request OTP mới nếu không nhận được |
| 1.1.4 | Đăng nhập | `/api/auth/login` | POST | Username/email + password |
| 1.1.5 | Đăng xuất | `/api/auth/logout` | POST | Revoke refresh token |
| 1.1.6 | Refresh token | `/api/auth/refresh` | POST | Lấy access token mới |
| 1.1.7 | Xem thông tin cá nhân | `/api/customers/me` | GET | Profile đầy đủ |
| 1.1.8 | Cập nhật profile | `/api/customers/me` | PUT | Họ tên, email, phone, avatar, DOB |
| 1.1.9 | Xem điểm thưởng | `/api/customers/me` | GET | Points, lifetime points, tier |
| 1.1.10 | Xem lịch sử tích điểm | `/api/customers/me/point-transactions` | GET | Lịch sử +/- điểm |

**Related Entities:**
- `Customer` (extends User)
- `PointTransaction`
- `EmailVerificationToken`

**Business Rules:**
- Customer phải đủ 18 tuổi
- Email/Phone/Username phải unique
- Password phải mạnh (min 8 ký tự, có chữ hoa, số, ký tự đặc biệt)
- OTP hết hạn sau 5 phút
- Tier được tự động nâng cấp dựa trên lifetime points:
  - Bronze: 0-999 points
  - Silver: 1,000-4,999 points
  - Gold: 5,000-19,999 points
  - Platinum: 20,000+ points

---

### 1.2. Quản lý Địa chỉ

| # | Chức năng | Endpoint | Method | Mô tả |
|---|-----------|----------|--------|-------|
| 1.2.1 | Xem danh sách địa chỉ | `/api/addresses` | GET | Tất cả địa chỉ của customer |
| 1.2.2 | Thêm địa chỉ mới | `/api/addresses` | POST | Tên, phone, tỉnh, quận, phường, đường |
| 1.2.3 | Cập nhật địa chỉ | `/api/addresses/{id}` | PUT | Sửa thông tin địa chỉ |
| 1.2.4 | Xóa địa chỉ | `/api/addresses/{id}` | DELETE | Soft delete |
| 1.2.5 | Đặt địa chỉ mặc định | `/api/addresses/{id}/set-default` | PATCH | Chỉ 1 địa chỉ mặc định |

**Related Entities:**
- `Address`

**Business Rules:**
- Customer có thể có nhiều địa chỉ
- Chỉ 1 địa chỉ mặc định tại 1 thời điểm
- Không thể xóa địa chỉ đang là mặc định (phải set default cho địa chỉ khác trước)

---

### 1.3. Tìm kiếm & Duyệt Sản phẩm

| # | Chức năng | Endpoint | Method | Mô tả |
|---|-----------|----------|--------|-------|
| 1.3.1 | Tìm kiếm sản phẩm | `/api/products/search` | GET | Full-text search |
| 1.3.2 | Lọc theo danh mục | `/api/products?categoryId=xxx` | GET | Products trong category |
| 1.3.3 | Lọc theo giá | `/api/products?minPrice=x&maxPrice=y` | GET | Khoảng giá |
| 1.3.4 | Lọc theo cửa hàng | `/api/products?storeId=xxx` | GET | Sản phẩm của 1 store |
| 1.3.5 | Sắp xếp | `/api/products?sortBy=price&sortDirection=ASC` | GET | Giá, tên, rating, mới nhất |
| 1.3.6 | Xem chi tiết sản phẩm | `/api/products/{id}` | GET | Thông tin đầy đủ |
| 1.3.7 | Xem variants | `/api/products/{id}/variants` | GET | Danh sách SKU, giá, HSD |
| 1.3.8 | Xem tồn kho theo store | `/api/products/{id}/inventory` | GET | Số lượng còn tại từng store |
| 1.3.9 | Xem đánh giá sản phẩm | `/api/products/{id}/reviews` | GET | Reviews + rating |
| 1.3.10 | Lưu lịch sử tìm kiếm | `/api/search-history` | POST | Auto-save search query |

**Related Entities:**
- `Product`
- `ProductVariant`
- `StoreProduct`
- `ProductImage`
- `ProductAttribute`
- `Review`
- `SearchHistory`

**Business Rules:**
- Chỉ hiển thị sản phẩm APPROVED
- Chỉ hiển thị sản phẩm có stock > 0
- Chỉ hiển thị sản phẩm chưa hết hạn
- Rating được tính trung bình từ reviews

---

### 1.4. Giỏ hàng

| # | Chức năng | Endpoint | Method | Mô tả |
|---|-----------|----------|--------|-------|
| 1.4.1 | Xem giỏ hàng | `/api/carts/me` | GET | Giỏ hàng hiện tại |
| 1.4.2 | Thêm vào giỏ | `/api/carts/items` | POST | storeProductId + quantity |
| 1.4.3 | Cập nhật số lượng | `/api/carts/items/{id}` | PUT | Tăng/giảm quantity |
| 1.4.4 | Xóa khỏi giỏ | `/api/carts/items/{id}` | DELETE | Remove item |
| 1.4.5 | Clear giỏ hàng | `/api/carts/me/clear` | DELETE | Xóa tất cả items |
| 1.4.6 | Áp dụng mã KM | `/api/carts/me/apply-promotion` | POST | Promotion code |
| 1.4.7 | Gỡ mã KM | `/api/carts/me/remove-promotion` | DELETE | Bỏ promotion |
| 1.4.8 | Tính tổng tiền | `/api/carts/me/calculate` | GET | Total, discount, final |

**Related Entities:**
- `Cart`
- `CartDetail`
- `CartPromotion`
- `StoreProduct`

**Business Rules:**
- 1 Customer có nhiều Cart (1 cart/store)
- Không thể mix sản phẩm từ nhiều store trong 1 order
- Kiểm tra tồn kho real-time trước khi checkout
- Auto-remove items hết hạn hoặc hết stock
- Promotion chỉ áp dụng nếu đạt minimum order amount

---

### 1.5. Đặt hàng & Thanh toán

| # | Chức năng | Endpoint | Method | Mô tả |
|---|-----------|----------|--------|-------|
| 1.5.1 | Checkout | `/api/orders/checkout` | POST | Cart → Order |
| 1.5.2 | Chọn địa chỉ giao hàng | `/api/orders/checkout` | POST | addressId |
| 1.5.3 | Chọn phương thức TT | `/api/orders/checkout` | POST | COD/VNPay/Momo/ZaloPay |
| 1.5.4 | Thanh toán VNPay | `/api/payments/vnpay/create` | POST | Return payment URL |
| 1.5.5 | Callback VNPay | `/api/payments/vnpay/callback` | GET | Verify payment |
| 1.5.6 | Xem danh sách đơn hàng | `/api/orders/me` | GET | Lịch sử orders |
| 1.5.7 | Xem chi tiết đơn | `/api/orders/{id}` | GET | Order details |
| 1.5.8 | Theo dõi vận chuyển | `/api/orders/{id}/shipment` | GET | Tracking info |
| 1.5.9 | Hủy đơn hàng | `/api/orders/{id}/cancel` | PATCH | Chỉ khi PENDING/CONFIRMED |
| 1.5.10 | Xác nhận đã nhận hàng | `/api/orders/{id}/complete` | PATCH | Mark as DELIVERED |

**Related Entities:**
- `Order`
- `OrderDetail`
- `Payment`
- `Shipment`
- `PromotionUsage`

**Business Rules:**
- Checkout tạo Order với status PENDING
- Sau thanh toán thành công → CONFIRMED
- Supplier xác nhận → PROCESSING
- Bắt đầu giao → SHIPPING
- Hoàn tất → DELIVERED
- Có thể hủy khi: PENDING, CONFIRMED (trước khi PROCESSING)
- Tích điểm: 1% order value sau khi DELIVERED
- Bonus điểm khi review sản phẩm

**Payment Flow:**
```
PENDING → PROCESSING → SUCCESS/FAILED
```

**Order Flow:**
```
PENDING → CONFIRMED → PROCESSING → SHIPPING → DELIVERED
                ↓
            CANCELLED
```

---

### 1.6. Đánh giá & Phản hồi

| # | Chức năng | Endpoint | Method | Mô tả |
|---|-----------|----------|--------|-------|
| 1.6.1 | Đánh giá sản phẩm | `/api/reviews` | POST | Rating (1-5) + comment |
| 1.6.2 | Cập nhật đánh giá | `/api/reviews/{id}` | PUT | Edit review |
| 1.6.3 | Xóa đánh giá | `/api/reviews/{id}` | DELETE | Remove review |
| 1.6.4 | Xem đánh giá của mình | `/api/reviews/me` | GET | My reviews |
| 1.6.5 | Báo cáo đánh giá spam | `/api/reviews/{id}/report` | POST | Report fake review |

**Related Entities:**
- `Review`
- `OrderDetail` (1-1 relationship)

**Business Rules:**
- Chỉ review sau khi order DELIVERED
- Mỗi OrderDetail chỉ review 1 lần
- Review có thể edit trong 7 ngày
- Bonus +50 points khi review có hình ảnh
- Admin có thể mark review as spam

---

### 1.7. Khuyến mãi & Điểm thưởng

| # | Chức năng | Endpoint | Method | Mô tả |
|---|-----------|----------|--------|-------|
| 1.7.1 | Xem mã KM available | `/api/promotions/available` | GET | Promotions cho tier |
| 1.7.2 | Xem mã KM highlight | `/api/promotions/highlighted` | GET | Featured promotions |
| 1.7.3 | Validate mã KM | `/api/promotions/validate` | POST | Check trước khi apply |
| 1.7.4 | Xem lịch sử dùng mã | `/api/promotions/me/usage` | GET | My promotion usage |
| 1.7.5 | Xem điểm hiện tại | `/api/customers/me/points` | GET | Points balance |
| 1.7.6 | Lịch sử tích điểm | `/api/customers/me/point-transactions` | GET | Point history |
| 1.7.7 | Đổi điểm lấy voucher | `/api/points/redeem` | POST | Exchange points |

**Related Entities:**
- `Promotion`
- `PromotionUsage`
- `PromotionValidationLog`
- `PointTransaction`

**Business Rules:**

**Promotion Tiers:**
- ALL: Tất cả customer
- BRONZE: >= Bronze tier
- SILVER: >= Silver tier
- GOLD: >= Gold tier
- PLATINUM: Platinum only

**Promotion Types:**
- PERCENTAGE: % discount (max cap)
- FIXED_AMOUNT: Giảm cố định

**Usage Limits:**
- `totalUsageLimit`: Tổng số lần dùng toàn hệ thống
- `usagePerCustomerLimit`: Số lần 1 customer dùng
- Race condition được xử lý bằng pessimistic locking

**Point Earning:**
- Base: 1% của order value
- Bonus: +50 points khi review có ảnh
- Birthday month: x2 points
- Tier multiplier:
  - Bronze: x1
  - Silver: x1.2
  - Gold: x1.5
  - Platinum: x2

---

### 1.8. Thông báo

| # | Chức năng | Endpoint | Method | Mô tả |
|---|-----------|----------|--------|-------|
| 1.8.1 | Xem thông báo | `/api/notifications/me` | GET | Danh sách notifications |
| 1.8.2 | Đánh dấu đã đọc | `/api/notifications/{id}/read` | PATCH | Mark as read |
| 1.8.3 | Đánh dấu tất cả đã đọc | `/api/notifications/me/read-all` | PATCH | Bulk mark read |
| 1.8.4 | Xóa thông báo | `/api/notifications/{id}` | DELETE | Delete notification |
| 1.8.5 | Cài đặt thông báo | `/api/customers/me/notification-settings` | PUT | Email/SMS preferences |

**Related Entities:**
- `Notification`
- `UserNotificationStatus`

**Notification Types:**
- ORDER_STATUS: Cập nhật trạng thái đơn hàng
- PROMOTION: Mã KM mới
- SYSTEM: Thông báo hệ thống
- MARKETING: Quảng cáo

---

## 2. SUPPLIER (Nhà cung cấp)

### 2.1. Đăng ký & Onboarding (4 bước)

| # | Chức năng | Endpoint | Method | Mô tả |
|---|-----------|----------|--------|-------|
| 2.1.1 | **Step 1:** Tạo tài khoản | `/api/auth/register/supplier/step1` | POST | Username, email, phone, password, fullName |
| 2.1.2 | **Step 2:** Xác thực email | `/api/auth/register/supplier/step2` | POST | OTP verification |
| 2.1.3 | Gửi lại OTP | `/api/auth/register/supplier/resend-otp` | POST | Resend OTP |
| 2.1.4 | **Step 3:** Upload giấy tờ | `/api/auth/register/supplier/step3` | POST | Business license + Food safety cert |
| 2.1.5 | **Step 4:** Thông tin cửa hàng | `/api/auth/register/supplier/step4` | POST | Business info + first store |

**Required Documents:**
- Business License (số + URL ảnh)
- Food Safety Certificate (số + URL ảnh)
- Avatar (optional)

**Business Info:**
- Business name
- Tax code
- Business address
- Business type (enum)
- Bank account info

**First Store:**
- Store name
- Store address
- Phone number
- Lat/Long
- Description
- Image URL

**Registration Flow:**
```
PENDING_VERIFICATION → PENDING_DOCUMENTS → PENDING_STORE_INFO → PENDING_APPROVAL
                                                                        ↓
                                                                    ACTIVE/REJECTED
```

**Related Entities:**
- `Supplier`
- `Store`
- `EmailVerificationToken`

**Business Rules:**
- Status transition: PENDING_VERIFICATION → PENDING_DOCUMENTS → PENDING_STORE_INFO → PENDING_APPROVAL
- Admin approve → ACTIVE (email notification)
- Admin reject → REJECTED (email với lý do)
- Business license & tax code phải unique
- Commission rate mặc định: 5%

---

### 2.2. Quản lý Profile

| # | Chức năng | Endpoint | Method | Mô tả |
|---|-----------|----------|--------|-------|
| 2.2.1 | Xem profile | `/api/suppliers/me` | GET | Full supplier info |
| 2.2.2 | Cập nhật profile | `/api/suppliers/me` | PUT | Họ tên, phone, avatar, business address |
| 2.2.3 | Cập nhật bank info | `/api/suppliers/me/bank` | PUT | Bank account details |
| 2.2.4 | Xem commission rate | `/api/suppliers/me/commission` | GET | Current rate |
| 2.2.5 | Xem trạng thái tài khoản | `/api/suppliers/me/status` | GET | ACTIVE/INACTIVE/etc |

**Related Entities:**
- `Supplier`

**Supplier Status:**
- PENDING_VERIFICATION: Chờ xác thực email
- PENDING_DOCUMENTS: Chờ upload giấy tờ
- PENDING_STORE_INFO: Chờ thông tin cửa hàng
- PENDING_APPROVAL: Chờ admin duyệt
- ACTIVE: Hoạt động bình thường
- INACTIVE: Bị vô hiệu hóa
- REJECTED: Bị từ chối

---

### 2.3. Quản lý Cửa hàng

| # | Chức năng | Endpoint | Method | Mô tả |
|---|-----------|----------|--------|-------|
| 2.3.1 | Xem danh sách cửa hàng | `/api/stores/me` | GET | All my stores |
| 2.3.2 | Tạo cửa hàng mới | `/api/stores` | POST | Add new store |
| 2.3.3 | Xem chi tiết cửa hàng | `/api/stores/{id}` | GET | Store details |
| 2.3.4 | Yêu cầu cập nhật thông tin | `/api/stores/{id}/update-request` | POST | Pending admin approval |
| 2.3.5 | Xem trạng thái yêu cầu | `/api/stores/{id}/pending-updates` | GET | Update status |
| 2.3.6 | Xem đánh giá cửa hàng | `/api/stores/{id}/reviews` | GET | Store reviews |
| 2.3.7 | Cập nhật giờ mở/đóng cửa | `/api/stores/{id}/hours` | PUT | Open/close time |

**Related Entities:**
- `Store`
- `StorePendingUpdate`
- `Review`

**Store Status:**
- PENDING: Chờ approve (store đầu tiên khi đăng ký)
- ACTIVE: Đang hoạt động
- INACTIVE: Tạm ngưng
- SUSPENDED: Bị đình chỉ

**Business Rules:**
- Store đầu tiên tạo khi đăng ký (step 4)
- Các store sau cần approve riêng
- Thay đổi thông tin quan trọng cần admin approve (tạo StorePendingUpdate)
- Fields cần approve: Name, Address, Phone, Lat/Long

---

### 2.4. Quản lý Sản phẩm

| # | Chức năng | Endpoint | Method | Mô tả |
|---|-----------|----------|--------|-------|
| 2.4.1 | Tạo sản phẩm mới | `/api/products` | POST | Full product with variants |
| 2.4.2 | Xem sản phẩm của mình | `/api/products/me` | GET | My products |
| 2.4.3 | Lọc theo trạng thái | `/api/products/me?status=PENDING_APPROVAL` | GET | Filter by status |
| 2.4.4 | Xem chi tiết sản phẩm | `/api/products/{id}` | GET | Product details |
| 2.4.5 | Cập nhật sản phẩm | `/api/products/{id}` | PUT | Edit product |
| 2.4.6 | Cập nhật trạng thái | `/api/products/{id}/status` | PATCH | ACTIVE/INACTIVE |
| 2.4.7 | Xóa sản phẩm (soft) | `/api/products/{id}` | DELETE | Set SOLD_OUT |
| 2.4.8 | Thêm variant mới | `/api/products/{id}/variants` | POST | Add variant |
| 2.4.9 | Cập nhật variant | `/api/products/{id}/variants/{variantId}` | PUT | Edit SKU, price, HSD |
| 2.4.10 | Quản lý tồn kho | `/api/products/{id}/inventory` | GET/PUT | Stock per store |
| 2.4.11 | Upload hình ảnh | `/api/files/upload/product` | POST | Multipart file |
| 2.4.12 | Đề xuất danh mục mới | `/api/category-suggestions` | POST | Suggest new category |
| 2.4.13 | Xem đề xuất của mình | `/api/category-suggestions/me` | GET | My suggestions |

**Related Entities:**
- `Product`
- `ProductVariant`
- `ProductAttribute`
- `ProductImage`
- `StoreProduct`
- `CategorySuggestion`

**Product Status Flow:**
```
PENDING_APPROVAL → APPROVED/REJECTED
         ↓
    ACTIVE/INACTIVE/SOLD_OUT
```

**Product Creation Flow:**
1. Upload images → Get URLs
2. POST `/api/products` with:
   - Product info (name, description, categoryId)
   - Attributes (optional)
   - Variants (required, ≥1)
   - Images (URLs)
   - Store inventory (optional)
3. Status = PENDING_APPROVAL
4. Admin approve → APPROVED
5. Supplier can set ACTIVE/INACTIVE

**Business Rules:**
- Product mới luôn PENDING_APPROVAL
- Cần ít nhất 1 variant
- SKU phải unique
- Expiry date > manufacturing date
- Expiry date > today
- Discount price ≤ original price
- Chỉ có thể quản lý sản phẩm của mình
- Chỉ có thể thêm inventory vào store của mình

---

### 2.5. Quản lý Đơn hàng

| # | Chức năng | Endpoint | Method | Mô tả |
|---|-----------|----------|--------|-------|
| 2.5.1 | Xem đơn hàng mới | `/api/orders/supplier/pending` | GET | PENDING/CONFIRMED orders |
| 2.5.2 | Xem tất cả đơn hàng | `/api/orders/supplier/me` | GET | All my orders |
| 2.5.3 | Lọc theo trạng thái | `/api/orders/supplier/me?status=PROCESSING` | GET | Filter orders |
| 2.5.4 | Lọc theo store | `/api/orders/supplier/me?storeId=xxx` | GET | Orders by store |
| 2.5.5 | Xem chi tiết đơn | `/api/orders/{id}` | GET | Order details |
| 2.5.6 | Xác nhận đơn hàng | `/api/orders/{id}/confirm` | PATCH | CONFIRMED → PROCESSING |
| 2.5.7 | Từ chối đơn hàng | `/api/orders/{id}/reject` | PATCH | CONFIRMED → CANCELLED |
| 2.5.8 | Bắt đầu xử lý | `/api/orders/{id}/process` | PATCH | PROCESSING |
| 2.5.9 | Bắt đầu giao hàng | `/api/orders/{id}/ship` | PATCH | SHIPPING |
| 2.5.10 | Cập nhật tracking | `/api/orders/{id}/shipment` | PUT | Update tracking info |
| 2.5.11 | Hoàn tất giao hàng | `/api/orders/{id}/deliver` | PATCH | DELIVERED |

**Related Entities:**
- `Order`
- `OrderDetail`
- `Shipment`

**Order Status Flow (Supplier perspective):**
```
CONFIRMED → PROCESSING → SHIPPING → DELIVERED
    ↓
CANCELLED (if rejected)
```

**Business Rules:**
- Chỉ xem orders của store mình
- Chỉ confirm trong 24h, quá hạn auto-cancel
- Không thể từ chối order đã PROCESSING
- Phải cập nhật tracking number khi SHIPPING
- Auto-DELIVERED sau 7 ngày nếu customer không xác nhận

---

### 2.6. Báo cáo & Phân tích

| # | Chức năng | Endpoint | Method | Mô tả |
|---|-----------|----------|--------|-------|
| 2.6.1 | Dashboard tổng quan | `/api/suppliers/me/dashboard` | GET | Sales, orders, products |
| 2.6.2 | Báo cáo doanh thu | `/api/suppliers/me/revenue` | GET | Revenue by period |
| 2.6.3 | Báo cáo hoa hồng | `/api/suppliers/me/commission` | GET | Commission to pay |
| 2.6.4 | Top sản phẩm bán chạy | `/api/suppliers/me/top-products` | GET | Best sellers |
| 2.6.5 | Thống kê đánh giá | `/api/suppliers/me/review-stats` | GET | Average rating |
| 2.6.6 | Báo cáo tồn kho | `/api/suppliers/me/inventory-report` | GET | Low stock alerts |

**Metrics:**
- Total Revenue
- Total Orders
- Average Order Value
- Conversion Rate
- Top Products
- Low Stock Items
- Commission Payable
- Customer Ratings

---

## 3. ADMIN (Quản trị viên)

### 3.1. Quản lý Tài khoản Admin

| # | Chức năng | Endpoint | Method | Roles | Mô tả |
|---|-----------|----------|--------|-------|-------|
| 3.1.1 | Đăng ký admin/staff mới | `/api/admins/register` | POST | SUPER_ADMIN | Tạo tài khoản admin |
| 3.1.2 | Xem profile | `/api/admins/me` | GET | ALL | My profile |
| 3.1.3 | Cập nhật profile | `/api/admins/me` | PUT | ALL | Edit profile |
| 3.1.4 | Xem danh sách admin | `/api/admins` | GET | SUPER_ADMIN | All admins |
| 3.1.5 | Xem chi tiết admin | `/api/admins/{id}` | GET | SUPER_ADMIN | Admin details |
| 3.1.6 | Kích hoạt admin | `/api/admins/{id}/activate` | PATCH | SUPER_ADMIN | Set ACTIVE |
| 3.1.7 | Vô hiệu hóa admin | `/api/admins/{id}/suspend` | PATCH | SUPER_ADMIN | Set INACTIVE |

**Admin Roles:**
- **SUPER_ADMIN**: Full access
- **MODERATOR**: Approve suppliers, products, handle complaints
- **STAFF**: View reports, customer support

**Admin Status:**
- PENDING_APPROVAL: Chờ duyệt (hiện không dùng, auto-active)
- ACTIVE: Đang hoạt động
- INACTIVE: Bị vô hiệu hóa

---

### 3.2. Quản lý Supplier

| # | Chức năng | Endpoint | Method | Roles | Mô tả |
|---|-----------|----------|--------|-------|-------|
| 3.2.1 | Xem danh sách supplier | `/api/suppliers` | GET | ALL | All suppliers |
| 3.2.2 | Lọc theo trạng thái | `/api/suppliers?status=PENDING_APPROVAL` | GET | ALL | Filter |
| 3.2.3 | Tìm kiếm supplier | `/api/suppliers?search=xxx` | GET | ALL | Search by name |
| 3.2.4 | Xem chi tiết supplier | `/api/suppliers/{id}` | GET | ALL | Supplier details |
| 3.2.5 | **Duyệt supplier** | `/api/suppliers/{id}/approve` | PATCH | MODERATOR+ | Approve registration |
| 3.2.6 | **Từ chối supplier** | `/api/suppliers/{id}/reject` | PATCH | MODERATOR+ | Reject with reason |
| 3.2.7 | Cập nhật commission rate | `/api/suppliers/{id}/commission` | PATCH | SUPER_ADMIN | Change rate |
| 3.2.8 | Kích hoạt/Vô hiệu hóa | `/api/suppliers/{id}/active` | PATCH | MODERATOR+ | Toggle active |

**Business Rules:**
- Approve supplier → gửi email thông báo
- Reject supplier → gửi email với lý do
- Suppliers mới: PENDING_APPROVAL
- Commission rate default: 5%

---

### 3.3. Quản lý Customer

| # | Chức năng | Endpoint | Method | Roles | Mô tả |
|---|-----------|----------|--------|-------|-------|
| 3.3.1 | Xem danh sách customer | `/api/customers` | GET | ALL | All customers |
| 3.3.2 | Tìm kiếm customer | `/api/customers?search=xxx` | GET | ALL | Search |
| 3.3.3 | Lọc theo tier | `/api/customers?tier=GOLD` | GET | ALL | Filter by tier |
| 3.3.4 | Xem chi tiết customer | `/api/customers/{id}` | GET | ALL | Customer details |
| 3.3.5 | Xem lịch sử đơn hàng | `/api/customers/{id}/orders` | GET | ALL | Order history |
| 3.3.6 | Xem lịch sử điểm | `/api/customers/{id}/points` | GET | ALL | Point transactions |
| 3.3.7 | Cộng/Trừ điểm thủ công | `/api/customers/{id}/points/adjust` | POST | MODERATOR+ | Manual adjustment |
| 3.3.8 | Khóa/Mở khóa tài khoản | `/api/customers/{id}/active` | PATCH | MODERATOR+ | Toggle active |

---

### 3.4. Quản lý Sản phẩm

| # | Chức năng | Endpoint | Method | Roles | Mô tả |
|---|-----------|----------|--------|-------|-------|
| 3.4.1 | Xem tất cả sản phẩm | `/api/products` | GET | ALL | All products |
| 3.4.2 | Lọc chờ duyệt | `/api/products?status=PENDING_APPROVAL` | GET | ALL | Pending products |
| 3.4.3 | Xem chi tiết sản phẩm | `/api/products/{id}` | GET | ALL | Product details |
| 3.4.4 | **Duyệt sản phẩm** | `/api/products/{id}/approve` | PATCH | MODERATOR+ | Approve product |
| 3.4.5 | **Từ chối sản phẩm** | `/api/products/{id}/reject` | PATCH | MODERATOR+ | Reject with reason |
| 3.4.6 | Xóa sản phẩm | `/api/products/{id}` | DELETE | SUPER_ADMIN | Hard delete |

**Business Rules:**
- Products mới: PENDING_APPROVAL
- Admin approve → APPROVED (supplier có thể set ACTIVE)
- Admin reject → REJECTED (supplier phải edit và submit lại)

---

### 3.5. Quản lý Danh mục

| # | Chức năng | Endpoint | Method | Roles | Mô tả |
|---|-----------|----------|--------|-------|-------|
| 3.5.1 | Xem danh sách category | `/api/categories` | GET | ALL | All categories |
| 3.5.2 | Tạo category mới | `/api/categories` | POST | MODERATOR+ | Create category |
| 3.5.3 | Cập nhật category | `/api/categories/{id}` | PUT | MODERATOR+ | Edit category |
| 3.5.4 | Xóa category | `/api/categories/{id}` | DELETE | SUPER_ADMIN | Soft delete |
| 3.5.5 | Kích hoạt/Vô hiệu hóa | `/api/categories/{id}/active` | PATCH | MODERATOR+ | Toggle active |
| 3.5.6 | Upload hình ảnh category | `/api/files/upload/category` | POST | MODERATOR+ | Upload image |

**Business Rules:**
- Không xóa category có products
- Category bị xóa: soft delete (deleted = true)

---

### 3.6. Quản lý Đề xuất Danh mục

| # | Chức năng | Endpoint | Method | Roles | Mô tả |
|---|-----------|----------|--------|-------|-------|
| 3.6.1 | Xem đề xuất chờ duyệt | `/api/category-suggestions?status=PENDING` | GET | MODERATOR+ | Pending suggestions |
| 3.6.2 | Xem tất cả đề xuất | `/api/category-suggestions` | GET | ALL | All suggestions |
| 3.6.3 | Xem chi tiết đề xuất | `/api/category-suggestions/{id}` | GET | ALL | Suggestion details |
| 3.6.4 | **Duyệt đề xuất** | `/api/category-suggestions/{id}/approve` | POST | MODERATOR+ | Approve & create category |
| 3.6.5 | **Từ chối đề xuất** | `/api/category-suggestions/{id}/reject` | PATCH | MODERATOR+ | Reject with note |

**CategorySuggestion Status:**
- PENDING: Chờ duyệt
- APPROVED: Đã duyệt → tạo Category mới
- REJECTED: Bị từ chối

---

### 3.7. Quản lý Cửa hàng

| # | Chức năng | Endpoint | Method | Roles | Mô tả |
|---|-----------|----------|--------|-------|-------|
| 3.7.1 | Xem danh sách store | `/api/stores` | GET | ALL | All stores |
| 3.7.2 | Lọc theo supplier | `/api/stores?supplierId=xxx` | GET | ALL | Filter by supplier |
| 3.7.3 | Xem chi tiết store | `/api/stores/{id}` | GET | ALL | Store details |
| 3.7.4 | Xem yêu cầu cập nhật | `/api/store-pending-updates` | GET | MODERATOR+ | Pending updates |
| 3.7.5 | **Duyệt cập nhật** | `/api/store-pending-updates/{id}/approve` | PATCH | MODERATOR+ | Approve changes |
| 3.7.6 | **Từ chối cập nhật** | `/api/store-pending-updates/{id}/reject` | PATCH | MODERATOR+ | Reject with note |
| 3.7.7 | Vô hiệu hóa store | `/api/stores/{id}/status` | PATCH | MODERATOR+ | Set INACTIVE/SUSPENDED |

**StorePendingUpdate Status:**
- PENDING: Chờ duyệt
- APPROVED: Đã duyệt → áp dụng thay đổi
- REJECTED: Bị từ chối

---

### 3.8. Quản lý Khuyến mãi

| # | Chức năng | Endpoint | Method | Roles | Mô tả |
|---|-----------|----------|--------|-------|-------|
| 3.8.1 | Xem danh sách promotion | `/api/promotions` | GET | ALL | All promotions |
| 3.8.2 | Tạo promotion mới | `/api/promotions` | POST | MODERATOR+ | Create promotion |
| 3.8.3 | Cập nhật promotion | `/api/promotions/{id}` | PUT | MODERATOR+ | Edit promotion |
| 3.8.4 | Xóa promotion | `/api/promotions/{id}` | DELETE | MODERATOR+ | Delete (if unused) |
| 3.8.5 | Kích hoạt/Vô hiệu hóa | `/api/promotions/{id}/status` | PATCH | MODERATOR+ | Toggle status |
| 3.8.6 | Set highlight | `/api/promotions/{id}/highlight` | PATCH | MODERATOR+ | Featured promotion |
| 3.8.7 | Xem thống kê sử dụng | `/api/promotions/{id}/usage-stats` | GET | ALL | Usage statistics |
| 3.8.8 | Xem lịch sử validation | `/api/promotions/{id}/validation-logs` | GET | ALL | Validation logs |

**Promotion Fields:**
- Code (unique)
- Title, Description
- Type: PERCENTAGE / FIXED_AMOUNT
- Tier: ALL / BRONZE / SILVER / GOLD / PLATINUM
- Discount value
- Min order amount
- Max discount amount (for PERCENTAGE)
- Start date, End date
- Total usage limit
- Usage per customer limit
- Is highlighted

**Business Rules:**
- Promotion code unique
- End date > start date
- Không thể edit promotion đã bắt đầu
- Không thể xóa promotion đã có usage
- Race condition handled với pessimistic locking

---

### 3.9. Quản lý Đơn hàng

| # | Chức năng | Endpoint | Method | Roles | Mô tả |
|---|-----------|----------|--------|-------|-------|
| 3.9.1 | Xem tất cả đơn hàng | `/api/orders` | GET | ALL | All orders |
| 3.9.2 | Lọc theo trạng thái | `/api/orders?status=PENDING` | GET | ALL | Filter by status |
| 3.9.3 | Lọc theo customer | `/api/orders?customerId=xxx` | GET | ALL | Customer's orders |
| 3.9.4 | Lọc theo supplier | `/api/orders?supplierId=xxx` | GET | ALL | Supplier's orders |
| 3.9.5 | Xem chi tiết đơn | `/api/orders/{id}` | GET | ALL | Order details |
| 3.9.6 | Hủy đơn hàng | `/api/orders/{id}/cancel` | PATCH | MODERATOR+ | Force cancel |
| 3.9.7 | Hoàn tiền | `/api/orders/{id}/refund` | POST | MODERATOR+ | Process refund |

---

### 3.10. Marketing & Nội dung

| # | Chức năng | Endpoint | Method | Roles | Mô tả |
|---|-----------|----------|--------|-------|-------|
| 3.10.1 | Xem danh sách banner | `/api/banners` | GET | ALL | All banners |
| 3.10.2 | Tạo banner | `/api/banners` | POST | MODERATOR+ | Create banner |
| 3.10.3 | Cập nhật banner | `/api/banners/{id}` | PUT | MODERATOR+ | Edit banner |
| 3.10.4 | Xóa banner | `/api/banners/{id}` | DELETE | MODERATOR+ | Delete banner |
| 3.10.5 | Upload banner image | `/api/files/upload/banner` | POST | MODERATOR+ | Upload image |
| 3.10.6 | Xem danh sách tin tức | `/api/news` | GET | ALL | All news |
| 3.10.7 | Tạo tin tức | `/api/news` | POST | MODERATOR+ | Create article |
| 3.10.8 | Cập nhật tin tức | `/api/news/{id}` | PUT | MODERATOR+ | Edit article |
| 3.10.9 | Xóa tin tức | `/api/news/{id}` | DELETE | MODERATOR+ | Delete article |
| 3.10.10 | Gửi thông báo hệ thống | `/api/notifications/broadcast` | POST | MODERATOR+ | Send to all users |

---

### 3.11. Báo cáo & Phân tích

| # | Chức năng | Endpoint | Method | Roles | Mô tả |
|---|-----------|----------|--------|-------|-------|
| 3.11.1 | Dashboard tổng quan | `/api/admin/dashboard` | GET | ALL | Overview metrics |
| 3.11.2 | Báo cáo doanh thu | `/api/reports/revenue` | GET | ALL | Revenue by period |
| 3.11.3 | Báo cáo hành vi KH | `/api/reports/customer-behavior` | GET | ALL | Customer analytics |
| 3.11.4 | Báo cáo lãng phí | `/api/reports/food-waste` | GET | ALL | Food waste reduction |
| 3.11.5 | Báo cáo hiệu suất supplier | `/api/reports/supplier-performance` | GET | ALL | Supplier metrics |
| 3.11.6 | Thống kê sản phẩm | `/api/reports/product-stats` | GET | ALL | Product analytics |
| 3.11.7 | Thống kê đơn hàng | `/api/reports/order-stats` | GET | ALL | Order analytics |

**Report Metrics:**
- GMV (Gross Merchandise Value)
- Total Orders
- Active Users
- Conversion Rate
- Average Order Value
- Commission Revenue
- Food Saved (kg)
- Top Products
- Top Suppliers
- Customer Acquisition
- Customer Retention

---

### 3.12. Hệ thống & Cấu hình

| # | Chức năng | Endpoint | Method | Roles | Mô tả |
|---|-----------|----------|--------|-------|-------|
| 3.12.1 | Xem cấu hình hệ thống | `/api/settings` | GET | SUPER_ADMIN | System settings |
| 3.12.2 | Cập nhật cấu hình | `/api/settings` | PUT | SUPER_ADMIN | Update settings |
| 3.12.3 | Xem nhật ký hoạt động | `/api/audit-logs` | GET | SUPER_ADMIN | Audit trail |
| 3.12.4 | Backup database | `/api/system/backup` | POST | SUPER_ADMIN | Create backup |
| 3.12.5 | Xem system health | `/api/system/health` | GET | SUPER_ADMIN | Health check |

---

## 4. PUBLIC (Không cần đăng nhập)

| # | Chức năng | Endpoint | Method | Mô tả |
|---|-----------|----------|--------|-------|
| 4.1 | Xem danh sách sản phẩm | `/api/public/products` | GET | Browse products |
| 4.2 | Tìm kiếm sản phẩm | `/api/public/products/search` | GET | Search products |
| 4.3 | Xem chi tiết sản phẩm | `/api/public/products/{id}` | GET | Product details |
| 4.4 | Xem danh mục | `/api/public/categories` | GET | Browse categories |
| 4.5 | Xem cửa hàng gần nhất | `/api/public/stores/nearby` | GET | Stores by location |
| 4.6 | Xem tin tức | `/api/public/news` | GET | News articles |
| 4.7 | Xem banner | `/api/public/banners` | GET | Active banners |
| 4.8 | Đăng ký nhận newsletter | `/api/public/newsletter/subscribe` | POST | Email subscription |

---

## 📊 TỔNG HỢP SỐ LƯỢNG CHỨC NĂNG

| Vai trò | Số lượng chức năng | Modules chính |
|---------|-------------------|---------------|
| **Customer** | 70+ | Account, Shopping, Cart, Orders, Reviews, Points |
| **Supplier** | 65+ | Registration, Profile, Stores, Products, Orders, Reports |
| **Admin** | 80+ | Users, Products, Categories, Promotions, Orders, Reports, System |
| **Public** | 8 | Browse, Search, View |
| **TỔNG** | **220+ chức năng** | |

---

## 🎯 KEY BUSINESS RULES SUMMARY

### Authentication
- Keycloak-based SSO
- JWT tokens (access + refresh)
- Role-based access control (RBAC)
- OTP verification cho registration

### Registration Flows
- **Customer**: 2 steps (Account + OTP)
- **Supplier**: 4 steps (Account + OTP + Documents + Store)
- **Admin**: Immediate (created by Super Admin)

### Approval Flows
- Supplier registration → Admin approval
- Product creation → Admin approval
- Store update → Admin approval
- Category suggestion → Admin approval

### Point System
- Earn: 1% of order value (after delivered)
- Bonus: +50 points for review with images
- Tier: Bronze → Silver → Gold → Platinum
- Tier benefits: More promotions, higher point multiplier

### Promotion System
- Race condition protected với pessimistic locking
- Usage limits: total + per customer
- Tier-based access
- Validation logs for analytics

### Order Flow
- PENDING → CONFIRMED → PROCESSING → SHIPPING → DELIVERED
- Auto-cancel if supplier không xác nhận trong 24h
- Auto-delivered nếu customer không confirm trong 7 ngày
- Commission calculated on delivered orders

---

**Document Status:** ✅ Complete  
**Last Updated:** October 19, 2025  
**Next Review:** Q1 2026
