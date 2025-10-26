# CẤU TRÚC CÁC BẢNG CƠ SỞ DỮ LIỆU - SAVEFOOD E-COMMERCE

> **Tài liệu này mô tả chi tiết cấu trúc cơ sở dữ liệu của hệ thống SaveFood - Nền tảng thương mại điện tử thực phẩm đa nhà cung cấp**

---

## 📋 MỤC LỤC

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Hệ thống người dùng](#2-hệ-thống-người-dùng)
3. [Hệ thống sản phẩm](#3-hệ-thống-sản-phẩm)
4. [Hệ thống cửa hàng và kho](#4-hệ-thống-cửa-hàng-và-kho)
5. [Hệ thống giỏ hàng và đơn hàng](#5-hệ-thống-giỏ-hàng-và-đơn-hàng)
6. [Hệ thống khuyến mãi và tích điểm](#6-hệ-thống-khuyến-mãi-và-tích-điểm)
7. [Hệ thống ví tiền nhà cung cấp](#7-hệ-thống-ví-tiền-nhà-cung-cấp)
8. [Hệ thống đánh giá và thông báo](#8-hệ-thống-đánh-giá-và-thông-báo)
9. [Các bảng hỗ trợ khác](#9-các-bảng-hỗ-trợ-khác)
10. [Danh sách Enum](#10-danh-sách-enum)
11. [Chiến lược Index](#11-chiến-lược-index)

---

## 1. TỔNG QUAN HỆ THỐNG

### 🎯 Mục đích

SaveFood là nền tảng thương mại điện tử kết nối:

- **Khách hàng** (người mua)
- **Nhà cung cấp** (vendor/supplier - người bán)
- **Cửa hàng** (địa điểm vật lý của nhà cung cấp)
- **Quản trị viên** (admin - người điều hành nền tảng)

### 🔑 Đặc điểm chính

- **Multi-vendor marketplace**: Nhiều nhà cung cấp bán hàng trên cùng một nền tảng
- **Xác thực đa vai trò**: Sử dụng Keycloak cho OAuth2/JWT
- **Hệ thống tích điểm**: Khách hàng tích điểm và thăng hạng (Bronze → Diamond)
- **Ví điện tử**: Nhà cung cấp có ví tiền để quản lý doanh thu
- **Kiểm duyệt nội dung**: Sản phẩm và nhà cung cấp phải được admin phê duyệt

### 🗄️ Công nghệ Database

- **Production**: MySQL (AWS RDS)
- **Development**: PostgreSQL/MySQL
- **Testing**: H2 in-memory
- **Cache/OTP**: Redis (TTL-based)

---

## 2. HỆ THỐNG NGƯỜI DÙNG

### 📊 Sơ đồ kế thừa (JOINED Inheritance)

```
users (bảng cha trừu tượng)
├── customers (khách hàng)
├── suppliers (nhà cung cấp)
└── admins (quản trị viên)
```

### Bảng: `users` (Bảng cha - Abstract)

| Cột                | Kiểu dữ liệu     | Mô tả                               |
| ------------------- | ------------------- | ------------------------------------- |
| **userId** 🔑 | VARCHAR(36) UUID    | Khóa chính                          |
| username            | VARCHAR(255) UNIQUE | Tên đăng nhập (unique, indexed)   |
| email               | VARCHAR(255) UNIQUE | Email (unique, indexed)               |
| phoneNumber         | VARCHAR(20) UNIQUE  | Số điện thoại (unique, indexed)   |
| keycloakId          | VARCHAR(255) UNIQUE | ID liên kết với Keycloak (indexed) |
| fullName            | VARCHAR(255)        | Họ và tên                          |
| avatarUrl           | TEXT                | URL ảnh đại diện (Cloudinary)     |
| active              | BOOLEAN             | Trạng thái hoạt động (indexed)   |
| version             | BIGINT              | Phiên bản (optimistic locking)      |
| createdAt           | TIMESTAMP           | Ngày tạo (indexed)                  |
| updatedAt           | TIMESTAMP           | Ngày cập nhật                      |

**Indexes:**

- `idx_user_username` (username)
- `idx_user_email` (email)
- `idx_user_phone` (phoneNumber)
- `idx_user_keycloak` (keycloakId)
- `idx_user_active` (active)
- `idx_user_active_created` (active, createdAt) - Composite

**Chiến lược**: JPA `InheritanceType.JOINED` - Mỗi loại người dùng có bảng riêng, join với bảng `users`

---

### Bảng: `customers` (Khách hàng)

**Kế thừa từ**: `users`

| Cột                | Kiểu dữ liệu | Mô tả                                                                              |
| ------------------- | --------------- | ------------------------------------------------------------------------------------ |
| **userId** 🔑 | VARCHAR(36)     | FK đến users.userId                                                                |
| points              | INT             | Điểm tích lũy hiện tại (indexed)                                               |
| lifetimePoints      | INT             | Tổng điểm tích lũy từ trước đến nay (indexed)                              |
| pointsThisYear      | INT             | Điểm tích lũy trong năm (reset hàng năm)                                      |
| dateOfBirth         | DATE            | Ngày sinh (indexed theo tháng cho chương trình sinh nhật)                      |
| status              | ENUM            | Trạng thái (ACTIVE, INACTIVE, SUSPENDED, BANNED, PENDING_VERIFICATION, RESTRICTED) |
| tier                | ENUM            | Hạng thành viên (BRONZE, SILVER, GOLD, PLATINUM, DIAMOND)                         |
| tierUpdatedAt       | TIMESTAMP       | Thời điểm cập nhật hạng                                                        |

**Quan hệ:**

- `addresses` (1:N) → Danh sách địa chỉ giao hàng
- `carts` (1:N) → Giỏ hàng (mỗi cửa hàng có 1 giỏ)
- `orders` (1:N) → Đơn hàng
- `reviews` (1:N) → Đánh giá sản phẩm
- `pointTransactions` (1:N) → Lịch sử giao dịch điểm
- `favoriteStores` (1:N) → Cửa hàng yêu thích

**Indexes:**

- `idx_customer_status` (status)
- `idx_customer_tier` (tier)
- `idx_customer_status_tier` (status, tier)
- `idx_customer_points` (points)
- `idx_customer_lifetime_points` (lifetimePoints)
- `idx_customer_birth_month` (dateOfBirth)

**Quy trình đăng ký (2 bước):**

1. **Bước 1**: Nhập thông tin cơ bản (phone, email, fullName) → Status = `PENDING_VERIFICATION`
2. **Bước 2**: Xác thực OTP qua SMS → Status = `ACTIVE`

**Hệ thống hạng thành viên:**

- **BRONZE**: 0-499 điểm (hạng cơ bản)
- **SILVER**: 500-1,999 điểm (ưu đãi giảm giá)
- **GOLD**: 2,000-4,999 điểm (nhiều quyền lợi đặc biệt)
- **PLATINUM**: 5,000-9,999 điểm (ưu đãi độc quyền)
- **DIAMOND**: 10,000+ điểm (đặc quyền tối đa)

---

### Bảng: `suppliers` (Nhà cung cấp)

**Kế thừa từ**: `users`

| Cột                     | Kiểu dữ liệu | Mô tả                               |
| ------------------------ | --------------- | ------------------------------------- |
| **userId** 🔑      | VARCHAR(36)     | FK đến users.userId                 |
| businessName             | VARCHAR(100)    | Tên doanh nghiệp/thương hiệu     |
| businessLicense          | VARCHAR(255)    | Số giấy phép kinh doanh            |
| businessLicenseUrl       | TEXT            | URL file giấy phép (Cloudinary)     |
| foodSafetyCertificate    | VARCHAR(255)    | Số giấy chứng nhận ATTP           |
| foodSafetyCertificateUrl | TEXT            | URL file giấy ATTP                   |
| taxCode                  | VARCHAR(50)     | Mã số thuế                         |
| businessAddress          | TEXT            | Địa chỉ trụ sở doanh nghiệp     |
| businessType             | ENUM            | Loại hình kinh doanh (BusinessType) |
| commissionRate           | DOUBLE          | Tỷ lệ hoa hồng (%) nền tảng thu  |
| status                   | ENUM            | Trạng thái (SupplierStatus)         |

**Quan hệ:**

- `wallet` (1:1) → Ví tiền (SupplierWallet)
- `stores` (1:N) → Danh sách cửa hàng
- `products` (1:N) → Danh sách sản phẩm
- `categorySuggestions` (1:N) → Đề xuất danh mục

**Quy trình đăng ký (4 bước):**

1. **Bước 1**: Thông tin tài khoản + mật khẩu → Status = `PENDING_VERIFICATION` → Tạo user trong Keycloak → Gửi OTP email
2. **Bước 2**: Xác thực OTP email → Status = `PENDING_DOCUMENTS`
3. **Bước 3**: Tải lên giấy tờ (giấy phép KD, ATTP **BẮT BUỘC**; avatar tùy chọn) → Status = `PENDING_STORE_INFO`
4. **Bước 4**: Thông tin doanh nghiệp + cửa hàng → Status = `PENDING_APPROVAL` (chờ admin duyệt)

**Trạng thái nhà cung cấp:**

- `PENDING_VERIFICATION`: Chờ xác thực email
- `PENDING_DOCUMENTS`: Chờ tải tài liệu
- `PENDING_STORE_INFO`: Chờ thông tin cửa hàng
- `PENDING_APPROVAL`: Chờ admin phê duyệt
- `ACTIVE`: Đã duyệt, có thể bán hàng
- `SUSPENDED`: Tạm ngưng do vi phạm
- `PAUSE`: Tạm dừng hoạt động (tự nguyện)
- `REJECTED`: Bị từ chối bởi admin

⚠️ **Lưu ý quan trọng**: Luôn lưu entity `Supplier` TRƯỚC khi tạo `Store` (do ràng buộc khóa ngoại)

---

### Bảng: `admins` (Quản trị viên)

**Kế thừa từ**: `users`

| Cột                | Kiểu dữ liệu | Mô tả                    |
| ------------------- | --------------- | -------------------------- |
| **userId** 🔑 | VARCHAR(36)     | FK đến users.userId      |
| lastLoginIp         | VARCHAR(45)     | IP đăng nhập gần nhất |
| status              | ENUM            | Trạng thái (AdminStatus) |
| role                | ENUM            | Vai trò (Role)            |

**Vai trò admin:**

- **ROLE_SUPER_ADMIN**: Quyền cao nhất, tạo admin khác
- **ROLE_MODERATOR**: Kiểm duyệt nhà cung cấp, sản phẩm
- **ROLE_STAFF**: Hỗ trợ khách hàng, thao tác hạn chế

**Quy tắc tạo admin:**

- Chỉ `SUPER_ADMIN` mới có thể tạo admin mới
- Admin được tạo sẽ có status = `ACTIVE` ngay lập tức (KHÔNG qua `PENDING_APPROVAL`)
- Phải đồng bộ `status` và `active` field

---

## 3. HỆ THỐNG SẢN PHẨM

### Bảng: `categories` (Danh mục sản phẩm)

| Cột                    | Kiểu dữ liệu       | Mô tả                          |
| ----------------------- | --------------------- | -------------------------------- |
| **categoryId** 🔑 | VARCHAR(36) UUID      | Khóa chính                     |
| name                    | VARCHAR(100) NOT NULL | Tên danh mục                   |
| description             | VARCHAR(500)          | Mô tả                          |
| imageUrl                | TEXT                  | Hình ảnh danh mục             |
| active                  | BOOLEAN               | Đang hoạt động               |
| deleted                 | BOOLEAN               | Đã xóa mềm (soft delete)     |
| deletedAt               | TIMESTAMP             | Thời điểm xóa                |
| version                 | BIGINT                | Phiên bản (optimistic locking) |
| createdAt               | TIMESTAMP             | Ngày tạo                       |
| updatedAt               | TIMESTAMP             | Ngày cập nhật                 |

**Quan hệ:**

- `products` (1:N) → Danh sách sản phẩm

**Soft Delete**: Sử dụng `@SQLDelete` annotation - khi xóa, chỉ set `deleted=true` thay vì xóa khỏi DB

---

### Bảng: `products` (Sản phẩm cha)

| Cột                   | Kiểu dữ liệu  | Mô tả                       |
| ---------------------- | ---------------- | ----------------------------- |
| **productId** 🔑 | VARCHAR(36) UUID | Khóa chính                  |
| supplierId 🔗          | VARCHAR(36)      | FK đến suppliers (indexed)  |
| categoryId 🔗          | VARCHAR(36)      | FK đến categories (indexed) |
| name                   | VARCHAR(255)     | Tên sản phẩm (indexed)     |
| description            | TEXT             | Mô tả chi tiết             |
| status                 | ENUM             | Trạng thái (ProductStatus)  |

**Quan hệ:**

- `supplier` (N:1) → Nhà cung cấp
- `category` (N:1) → Danh mục
- `images` (1:N) → Hình ảnh sản phẩm (ProductImage)
- `attributes` (1:N) → Thuộc tính (ProductAttribute)
- `variants` (1:N) → Biến thể (ProductVariant)
- `reviews` (1:N) → Đánh giá

**Trạng thái sản phẩm:**

- `PENDING_APPROVAL`: Chờ admin duyệt
- `APPROVED`: Đã duyệt, hiển thị trên nền tảng
- `REJECTED`: Bị từ chối (vi phạm chính sách)
- `SOLD_OUT`: Tạm hết hàng

**Indexes:**

- `idx_product_status` (status)
- `idx_product_supplier` (supplierId)
- `idx_product_category` (categoryId)
- `idx_product_name` (name)
- `idx_product_supplier_status` (supplierId, status)
- `idx_product_category_status` (categoryId, status)

---

### Bảng: `product_variants` (Biến thể sản phẩm)

**Giải thích**: Một sản phẩm có thể có nhiều biến thể (ví dụ: Coca Cola có các biến thể "Chai 1.5L", "Lon 330ml", "Vị Cherry", v.v.)

| Cột                   | Kiểu dữ liệu       | Mô tả                                       |
| ---------------------- | --------------------- | --------------------------------------------- |
| **variantId** 🔑 | VARCHAR(36) UUID      | Khóa chính                                  |
| productId 🔗           | VARCHAR(36)           | FK đến products                             |
| name                   | VARCHAR(255) NOT NULL | Tên biến thể (vd: "Vị Dâu", "Chai 1.5L") |
| sku                    | VARCHAR(100) UNIQUE   | Mã SKU quản lý kho                         |
| originalPrice          | DECIMAL(15,2)         | Giá gốc                                     |
| discountPrice          | DECIMAL(15,2)         | Giá khuyến mãi                             |
| manufacturingDate      | DATE                  | Ngày sản xuất                              |
| expiryDate             | DATE                  | Hạn sử dụng                                |

**Quan hệ:**

- `product` (N:1) → Sản phẩm cha
- `storeProducts` (1:N) → Tồn kho tại từng cửa hàng

⚠️ **Lưu ý**: `manufacturingDate` và `expiryDate` là của **từng biến thể cụ thể**, không phải của sản phẩm cha (vì mỗi lô hàng có HSD khác nhau)

---

### Bảng: `product_images` (Hình ảnh sản phẩm)

| Cột                 | Kiểu dữ liệu  | Mô tả                     |
| -------------------- | ---------------- | --------------------------- |
| **imageId** 🔑 | VARCHAR(36) UUID | Khóa chính                |
| productId 🔗         | VARCHAR(36)      | FK đến products           |
| imageUrl             | TEXT             | URL hình ảnh (Cloudinary) |
| isPrimary            | BOOLEAN          | Ảnh đại diện chính     |

**Quan hệ:**

- `product` (N:1) → Sản phẩm

---

### Bảng: `product_attributes` (Thuộc tính sản phẩm)

**Giải thích**: Lưu các thuộc tính key-value như "Thương hiệu: Coca-Cola", "Trọng lượng: 500g", "Xuất xứ: Việt Nam"

| Cột                     | Kiểu dữ liệu       | Mô tả                                  |
| ------------------------ | --------------------- | ---------------------------------------- |
| **attributeId** 🔑 | VARCHAR(36) UUID      | Khóa chính                             |
| productId 🔗             | VARCHAR(36)           | FK đến products                        |
| attributeName            | VARCHAR(100) NOT NULL | Tên thuộc tính (vd: "Trọng lượng") |
| attributeValue           | VARCHAR(255) NOT NULL | Giá trị (vd: "500g")                   |

**Quan hệ:**

- `product` (N:1) → Sản phẩm

---

## 4. HỆ THỐNG CỬA HÀNG VÀ KHO

### Bảng: `stores` (Cửa hàng)

**Giải thích**: Mỗi nhà cung cấp có thể có nhiều cửa hàng tại các địa điểm khác nhau

| Cột                 | Kiểu dữ liệu       | Mô tả                        |
| -------------------- | --------------------- | ------------------------------ |
| **storeId** 🔑 | VARCHAR(36) UUID      | Khóa chính                   |
| supplierId 🔗        | VARCHAR(36)           | FK đến suppliers (indexed)   |
| storeName            | VARCHAR(255) NOT NULL | Tên cửa hàng (indexed)      |
| address              | TEXT NOT NULL         | Địa chỉ                     |
| latitude             | VARCHAR(20) NOT NULL  | Vĩ độ (geolocation)         |
| longitude            | VARCHAR(20) NOT NULL  | Kinh độ (geolocation)        |
| phoneNumber          | VARCHAR(20)           | Số điện thoại cửa hàng   |
| description          | TEXT                  | Mô tả                        |
| imageUrl             | TEXT                  | Hình ảnh cửa hàng          |
| rating               | DECIMAL(2,1)          | Đánh giá (0.0-5.0, indexed) |
| totalReviews         | INT                   | Tổng số đánh giá          |
| openTime             | TIME                  | Giờ mở cửa                  |
| closeTime            | TIME                  | Giờ đóng cửa               |
| status               | ENUM                  | Trạng thái (StoreStatus)     |
| createdAt            | TIMESTAMP             | Ngày tạo                     |
| updatedAt            | TIMESTAMP             | Ngày cập nhật               |

**Quan hệ:**

- `supplier` (N:1) → Nhà cung cấp
- `storeProducts` (1:N) → Tồn kho sản phẩm
- `orders` (1:N) → Đơn hàng
- `carts` (1:N) → Giỏ hàng
- `favoritedBy` (1:N) → Khách hàng yêu thích

**Indexes:**

- `idx_store_name` (storeName)
- `idx_store_status` (status)
- `idx_store_supplier` (supplierId)
- `idx_store_location` (latitude, longitude) - Composite cho tìm kiếm theo địa lý
- `idx_store_rating` (rating)
- `idx_store_supplier_status` (supplierId, status)
- `idx_store_status_rating` (status, rating)

---

### Bảng: `store_products` (Tồn kho tại cửa hàng)

**Giải thích**: Bảng trung gian quản lý số lượng tồn kho của từng biến thể tại từng cửa hàng

| Cột                        | Kiểu dữ liệu  | Mô tả                                          |
| --------------------------- | ---------------- | ------------------------------------------------ |
| **storeProductId** 🔑 | VARCHAR(36) UUID | Khóa chính                                     |
| storeId 🔗                  | VARCHAR(36)      | FK đến stores                                  |
| variantId 🔗                | VARCHAR(36)      | FK đến product_variants                        |
| stockQuantity               | INT              | Số lượng tồn kho                             |
| priceOverride               | DECIMAL(15,2)    | Giá đặc biệt tại cửa hàng này (nếu có) |
| createdAt                   | TIMESTAMP        | Ngày thêm vào kho                             |
| updatedAt                   | TIMESTAMP        | Ngày cập nhật                                 |

**Quan hệ:**

- `store` (N:1) → Cửa hàng
- `variant` (N:1) → Biến thể sản phẩm

**Lưu ý**: `priceOverride` cho phép mỗi cửa hàng định giá khác nhau cho cùng một sản phẩm

---

## 5. HỆ THỐNG GIỎ HÀNG VÀ ĐỐN HÀNG

### Bảng: `carts` (Giỏ hàng)

| Cột                | Kiểu dữ liệu  | Mô tả            |
| ------------------- | ---------------- | ------------------ |
| **cartId** 🔑 | VARCHAR(36) UUID | Khóa chính       |
| customerId 🔗       | VARCHAR(36)      | FK đến customers |
| storeId 🔗          | VARCHAR(36)      | FK đến stores    |
| total               | DECIMAL(15,2)    | Tổng tiền        |

**Ràng buộc:**

- **UNIQUE** (customerId, storeId) - Mỗi khách hàng chỉ có 1 giỏ hàng cho mỗi cửa hàng

**Quan hệ:**

- `customer` (N:1) → Khách hàng
- `store` (N:1) → Cửa hàng
- `cartDetails` (1:N) → Chi tiết sản phẩm trong giỏ
- `appliedPromotions` (1:N) → Khuyến mãi đã áp dụng

---

### Bảng: `cart_details` (Chi tiết giỏ hàng)

| Cột                      | Kiểu dữ liệu  | Mô tả                 |
| ------------------------- | ---------------- | ----------------------- |
| **cartDetailId** 🔑 | VARCHAR(36) UUID | Khóa chính            |
| cartId 🔗                 | VARCHAR(36)      | FK đến carts          |
| storeProductId 🔗         | VARCHAR(36)      | FK đến store_products |
| quantity                  | INT              | Số lượng             |

**Quan hệ:**

- `cart` (N:1) → Giỏ hàng
- `storeProduct` (N:1) → Sản phẩm trong kho cửa hàng

---

### Bảng: `orders` (Đơn hàng)

| Cột                 | Kiểu dữ liệu    | Mô tả                                         |
| -------------------- | ------------------ | ----------------------------------------------- |
| **orderId** 🔑 | VARCHAR(36) UUID   | Khóa chính                                    |
| customerId 🔗        | VARCHAR(36)        | FK đến customers (indexed)                    |
| storeId 🔗           | VARCHAR(36)        | FK đến stores (indexed)                       |
| orderCode            | VARCHAR(50) UNIQUE | Mã đơn hàng hiển thị                      |
| totalAmount          | DECIMAL(15,2)      | Tổng tiền (indexed)                           |
| status               | ENUM               | Trạng thái đơn hàng (OrderStatus, indexed) |
| paymentStatus        | ENUM               | Trạng thái thanh toán (PaymentStatus)        |
| shippingAddress      | TEXT               | Địa chỉ giao hàng                           |
| createdAt            | TIMESTAMP          | Ngày tạo (indexed)                            |
| updatedAt            | TIMESTAMP          | Ngày cập nhật (indexed)                      |

**Quan hệ:**

- `customer` (N:1) → Khách hàng
- `store` (N:1) → Cửa hàng
- `orderDetails` (1:N) → Chi tiết sản phẩm
- `payment` (1:1) → Thanh toán
- `shipment` (1:1) → Vận chuyển
- `promotionUsages` (1:N) → Khuyến mãi đã sử dụng

**Trạng thái đơn hàng (OrderStatus):**

1. `PENDING` - Chờ xác nhận
2. `CONFIRMED` - Đã xác nhận
3. `PREPARING` - Đang chuẩn bị
4. `SHIPPING` - Đang giao hàng
5. `DELIVERED` - Đã giao thành công
6. `CANCELED` - Đã hủy
7. `RETURNED` - Đã trả lại

**Indexes (rất quan trọng cho hiệu năng):**

- `idx_order_status` (status)
- `idx_order_customer` (customerId)
- `idx_order_store` (storeId)
- `idx_order_created` (createdAt)
- `idx_order_total` (totalAmount)
- `idx_order_customer_status` (customerId, status) - Lịch sử đơn hàng của khách
- `idx_order_store_status` (storeId, status) - Quản lý đơn hàng của cửa hàng
- `idx_order_status_created` (status, createdAt) - Dashboard admin

---

### Bảng: `order_details` (Chi tiết đơn hàng)

| Cột                       | Kiểu dữ liệu  | Mô tả                    |
| -------------------------- | ---------------- | -------------------------- |
| **orderDetailId** 🔑 | VARCHAR(36) UUID | Khóa chính               |
| orderId 🔗                 | VARCHAR(36)      | FK đến orders            |
| storeProductId 🔗          | VARCHAR(36)      | FK đến store_products    |
| quantity                   | INT              | Số lượng                |
| amount                     | DECIMAL(15,2)    | Giá tại thời điểm mua |

**Quan hệ:**

- `order` (N:1) → Đơn hàng
- `storeProduct` (N:1) → Sản phẩm
- `review` (1:1) → Đánh giá (optional)

⚠️ **Lưu ý**: `amount` lưu giá tại thời điểm đặt hàng để tránh thay đổi nếu giá sản phẩm thay đổi sau này

---

### Bảng: `payments` (Thanh toán)

| Cột                   | Kiểu dữ liệu  | Mô tả                               |
| ---------------------- | ---------------- | ------------------------------------- |
| **paymentId** 🔑 | VARCHAR(36) UUID | Khóa chính                          |
| orderId 🔗             | VARCHAR(36)      | FK đến orders (indexed, unique)     |
| method                 | ENUM             | Phương thức (PaymentMethod)        |
| provider               | ENUM             | Nhà cung cấp (PaymentProvider)      |
| amount                 | DECIMAL(15,2)    | Số tiền                             |
| status                 | ENUM             | Trạng thái (PaymentStatus, indexed) |
| transactionId          | VARCHAR(255)     | Mã giao dịch bên ngoài (indexed)  |
| createdAt              | TIMESTAMP        | Ngày tạo (indexed)                  |
| updatedAt              | TIMESTAMP        | Ngày cập nhật                      |

**Trạng thái thanh toán:**

- `PENDING` - Chờ thanh toán
- `SUCCESS` - Thanh toán thành công
- `FAILED` - Thanh toán thất bại
- `REFUNDED` - Đã hoàn tiền

**Indexes:**

- `idx_payment_status` (status)
- `idx_payment_method` (method)
- `idx_payment_order` (orderId)
- `idx_payment_transaction` (transactionId) - Tra cứu giao dịch
- `idx_payment_provider` (provider)
- `idx_payment_status_created` (status, createdAt)

---

### Bảng: `shipments` (Vận chuyển)

| Cột                    | Kiểu dữ liệu  | Mô tả                       |
| ----------------------- | ---------------- | ----------------------------- |
| **shipmentId** 🔑 | VARCHAR(36) UUID | Khóa chính                  |
| orderId 🔗              | VARCHAR(36)      | FK đến orders (unique)      |
| trackingNumber          | VARCHAR(100)     | Mã vận đơn                |
| shippingProvider        | VARCHAR(100)     | Đơn vị vận chuyển        |
| shippingFee             | DECIMAL(15,2)    | Phí vận chuyển             |
| status                  | ENUM             | Trạng thái (ShipmentStatus) |
| estimatedDeliveryDate   | TIMESTAMP        | Ngày giao dự kiến          |
| createdAt               | TIMESTAMP        | Ngày tạo                    |
| updatedAt               | TIMESTAMP        | Ngày cập nhật              |

**Trạng thái vận chuyển:**

- `PREPARING` - Đang chuẩn bị
- `IN_TRANSIT` - Đang vận chuyển
- `DELIVERED` - Đã giao hàng

---

## 6. HỆ THỐNG KHUYẾN MÃI VÀ TÍCH ĐIỂM

### Bảng: `promotions` (Khuyến mãi)

| Cột                     | Kiểu dữ liệu    | Mô tả                                                  |
| ------------------------ | ------------------ | -------------------------------------------------------- |
| **promotionId** 🔑 | VARCHAR(36) UUID   | Khóa chính                                             |
| code                     | VARCHAR(50) UNIQUE | Mã khuyến mãi (indexed)                               |
| title                    | VARCHAR(255)       | Tiêu đề                                               |
| description              | TEXT               | Mô tả chi tiết                                        |
| type                     | ENUM               | Loại (PromotionType, indexed)                           |
| tier                     | ENUM               | Hạng áp dụng (PromotionTier, indexed)                 |
| discountValue            | DECIMAL(15,2)      | Giá trị giảm (% hoặc số tiền)                      |
| minimumOrderAmount       | DECIMAL(15,2)      | Đơn hàng tối thiểu                                  |
| maxDiscountAmount        | DECIMAL(15,2)      | Giảm tối đa                                           |
| startDate                | DATE               | Ngày bắt đầu (indexed)                               |
| endDate                  | DATE               | Ngày kết thúc (indexed)                               |
| totalUsageLimit          | INT                | Giới hạn tổng lượt sử dụng                        |
| usagePerCustomerLimit    | INT                | Giới hạn mỗi khách hàng                             |
| currentUsageCount        | INT                | Số lần đã sử dụng                                  |
| status                   | ENUM               | Trạng thái (PromotionStatus, indexed)                  |
| isHighlighted            | BOOLEAN            | Khuyến mãi nổi bật (indexed)                         |
| version                  | BIGINT             | Phiên bản (optimistic locking - tránh race condition) |
| createdAt                | TIMESTAMP          | Ngày tạo                                               |
| updatedAt                | TIMESTAMP          | Ngày cập nhật                                         |

**Quan hệ:**

- `usageHistory` (1:N) → Lịch sử sử dụng (PromotionUsage)

**Loại khuyến mãi (PromotionType):**

- `PERCENTAGE` - Giảm giá theo phần trăm
- `FIXED_AMOUNT` - Giảm giá cố định
- `FREE_SHIPPING` - Miễn phí vận chuyển

**Hạng áp dụng (PromotionTier):**

- `GENERAL` - Tất cả khách hàng
- `BRONZE` - Chỉ hạng Đồng trở lên
- `SILVER` - Chỉ hạng Bạc trở lên
- `GOLD` - Chỉ hạng Vàng trở lên
- `PLATINUM` - Chỉ hạng Bạch Kim trở lên
- `DIAMOND` - Chỉ hạng Kim Cương

**Indexes:**

- `idx_promotion_code` (code)
- `idx_promotion_status` (status)
- `idx_promotion_type` (type)
- `idx_promotion_tier` (tier)
- `idx_promotion_dates` (startDate, endDate)
- `idx_promotion_highlighted` (isHighlighted)
- `idx_promotion_active_dates` (status, startDate, endDate)
- `idx_promotion_tier_status` (tier, status)

⚠️ **Optimistic Locking**: Sử dụng `version` field để tránh nhiều người dùng cùng sử dụng mã giảm giá vượt quá giới hạn

---

### Bảng: `promotion_usages` (Lịch sử sử dụng khuyến mãi)

| Cột                 | Kiểu dữ liệu  | Mô tả                |
| -------------------- | ---------------- | ---------------------- |
| **usageId** 🔑 | VARCHAR(36) UUID | Khóa chính           |
| promotionId 🔗       | VARCHAR(36)      | FK đến promotions    |
| customerId 🔗        | VARCHAR(36)      | FK đến customers     |
| orderId 🔗           | VARCHAR(36)      | FK đến orders        |
| usedAt               | TIMESTAMP        | Thời điểm sử dụng |

**Quan hệ:**

- `promotion` (N:1) → Khuyến mãi
- `customer` (N:1) → Khách hàng
- `order` (N:1) → Đơn hàng

**Mục đích**: Audit trail để kiểm tra khách hàng đã dùng mã giảm giá bao nhiêu lần

---

### Bảng: `cart_promotions` (Khuyến mãi trong giỏ hàng)

| Cột                         | Kiểu dữ liệu  | Mô tả             |
| ---------------------------- | ---------------- | ------------------- |
| **cartPromotionId** 🔑 | VARCHAR(36) UUID | Khóa chính        |
| cartId 🔗                    | VARCHAR(36)      | FK đến carts      |
| promotionId 🔗               | VARCHAR(36)      | FK đến promotions |

**Quan hệ:**

- `cart` (N:1) → Giỏ hàng
- `promotion` (N:1) → Khuyến mãi

**Mục đích**: Lưu khuyến mãi đã áp dụng trước khi checkout

---

### Bảng: `point_transactions` (Lịch sử giao dịch điểm)

| Cột                       | Kiểu dữ liệu  | Mô tả                                                           |
| -------------------------- | ---------------- | ----------------------------------------------------------------- |
| **transactionId** 🔑 | VARCHAR(36) UUID | Khóa chính                                                      |
| customerId 🔗              | VARCHAR(36)      | FK đến customers (indexed)                                      |
| pointsChange               | INT              | Số điểm thay đổi (+ hoặc -)                                 |
| transactionType            | ENUM             | Loại giao dịch (PointTransactionType, indexed)                  |
| reason                     | VARCHAR(500)     | Lý do (vd: "Đặt hàng thành công", "Đánh giá sản phẩm") |
| createdAt                  | TIMESTAMP        | Ngày tạo (indexed)                                              |

**Quan hệ:**

- `customer` (N:1) → Khách hàng

**Loại giao dịch:**

- `EARN` - Tích điểm (đặt hàng, đánh giá)
- `REDEEM` - Đổi điểm
- `EXPIRE` - Điểm hết hạn
- `REFUND` - Hoàn điểm (hủy đơn)

**Indexes:**

- `idx_point_customer` (customerId)
- `idx_point_type` (transactionType)
- `idx_point_created` (createdAt)
- `idx_point_customer_type` (customerId, transactionType)
- `idx_point_customer_created` (customerId, createdAt)

---

## 7. HỆ THỐNG VÍ TIỀN NHÀ CUNG CẤP

### Bảng: `supplier_wallets` (Ví tiền nhà cung cấp)

**Giải thích**: Thay thế cho thông tin tài khoản ngân hàng trực tiếp. Mỗi nhà cung cấp có 1 ví để quản lý doanh thu.

| Cột                  | Kiểu dữ liệu       | Mô tả                                      |
| --------------------- | --------------------- | -------------------------------------------- |
| **walletId** 🔑 | BIGINT AUTO_INCREMENT | Khóa chính                                 |
| supplierId 🔗         | VARCHAR(36) UNIQUE    | FK đến suppliers (1:1, indexed)            |
| availableBalance      | DECIMAL(15,2)         | Số dư khả dụng (có thể rút, indexed)  |
| pendingBalance        | DECIMAL(15,2)         | Số dư đang giữ (chờ hoàn thành đơn) |
| totalEarnings         | DECIMAL(15,2)         | Tổng thu nhập từ trước đến nay        |
| totalWithdrawn        | DECIMAL(15,2)         | Tổng đã rút                              |
| totalRefunded         | DECIMAL(15,2)         | Tổng đã hoàn trả khách                 |
| monthlyEarnings       | DECIMAL(15,2)         | Thu nhập tháng hiện tại                  |
| currentMonth          | VARCHAR(7)            | Tháng/năm hiện tại (format: YYYY-MM)     |
| status                | ENUM                  | Trạng thái (WalletStatus, indexed)         |
| lastWithdrawalDate    | TIMESTAMP             | Thời điểm rút tiền gần nhất           |
| createdAt             | TIMESTAMP             | Ngày tạo                                   |
| updatedAt             | TIMESTAMP             | Ngày cập nhật                             |

**Quan hệ:**

- `supplier` (1:1) → Nhà cung cấp
- `transactions` (1:N) → Lịch sử giao dịch

**Luồng tiền (có tính phí hoa hồng):**

1. **Khách đặt hàng & Đơn hoàn thành**
   - Tổng đơn hàng: `100,000 VND`
   - Phí hoa hồng (5%): `-5,000 VND` (admin nhận)
   - Nhà cung cấp nhận: `95,000 VND`
   - `pendingBalance = 95,000 VND`
   - `totalEarnings = 95,000 VND`
   - Ghi log: 2 transactions (ORDER_COMPLETED + COMMISSION_FEE)

2. **Cuối ngày** (scheduled job @ 00:00 hàng ngày)
   - Chuyển `pendingBalance` → `availableBalance`
   - `availableBalance = 95,000 VND`, `pendingBalance = 0`

3. **Cuối tháng** (scheduled job @ 00:00 ngày 1)
   - Rút toàn bộ `availableBalance` → `totalWithdrawn`
   - `totalWithdrawn = 95,000 VND`, `availableBalance = 0`
   - Reset `monthlyEarnings = 0`

4. **Nếu hủy đơn/trả hàng**
   - Hoàn lại số tiền NET (đã trừ phí): `95,000 VND`
   - Trừ từ `pendingBalance` hoặc `availableBalance`
   - **QUAN TRỌNG**: Trừ `totalEarnings` và `monthlyEarnings`
   - Admin GIỮ phí hoa hồng `5,000 VND` (không hoàn lại)

**Helper methods trong entity:**

- `addPendingBalance(amount)` - Thêm vào pending (số tiền NET sau khi trừ phí)
- `addEarnings(amount)` - Tăng thu nhập (số tiền NET)
- `subtractEarnings(amount)` - ⭐ **QUAN TRỌNG**: Trừ thu nhập khi hoàn tiền
- `deductCommission(amount)` - Trừ phí hoa hồng (không dùng nữa, logic đã tích hợp)
- `releasePendingBalance(amount)` - Chuyển pending → available (cuối ngày)
- `autoWithdrawMonthly()` - Tự động rút cuối tháng
- `refund(amount, isPending)` - Hoàn tiền (trừ từ pending hoặc available)
- `resetMonthlyEarnings()` - Reset thu nhập tháng về 0

**⚠️ LƯU Ý QUAN TRỌNG:**

1. **Khi gọi `addPendingBalance()`**: Service tự động tính và trừ phí hoa hồng
   ```java
   // Service tự làm:
   netAmount = orderTotal - (orderTotal * commissionRate)
   wallet.addPendingBalance(netAmount)
   wallet.addEarnings(netAmount)
   ```

2. **Khi gọi `refundOrder()`**: PHẢI gọi `subtractEarnings()` để giữ earnings chính xác
   ```java
   wallet.refund(netAmount, isPending);
   wallet.subtractEarnings(netAmount);  // BẮT BUỘC!
   ```

3. **Admin thu phí hoa hồng**:
   - Mỗi đơn hàng tạo 2 transactions:
     - `ORDER_COMPLETED`: +95,000 (nhà cung cấp nhận)
     - `COMMISSION_FEE`: -5,000 (admin thu)
   - Khi hoàn tiền: Chỉ hoàn NET amount, admin giữ phí

**Indexes:**

- `idx_wallet_supplier` (supplierId) - UNIQUE
- `idx_wallet_status` (status)
- `idx_wallet_balance` (availableBalance)

---

### Bảng: `wallet_transactions` (Lịch sử giao dịch ví)

**Giải thích**: Mỗi thay đổi số dư trong ví đều được ghi lại để truy vết (audit trail)

| Cột                       | Kiểu dữ liệu  | Mô tả                                     |
| -------------------------- | ---------------- | ------------------------------------------- |
| **transactionId** 🔑 | VARCHAR(36) UUID | Khóa chính                                |
| walletId 🔗                | BIGINT           | FK đến supplier_wallets (indexed)         |
| transactionType            | ENUM             | Loại giao dịch (TransactionType, indexed) |
| amount                     | DECIMAL(15,2)    | Số tiền (luôn dương)                   |
| balanceAfter               | DECIMAL(15,2)    | Số dư available sau giao dịch            |
| pendingBalanceAfter        | DECIMAL(15,2)    | Số dư pending sau giao dịch              |
| orderId 🔗                 | VARCHAR(36)      | FK đến orders (nếu có, indexed)         |
| description                | VARCHAR(500)     | Mô tả chi tiết                           |
| externalReference          | VARCHAR(100)     | Tham chiếu ngoài (mã ngân hàng, v.v.)  |
| adminId                    | VARCHAR(36)      | ID admin (nếu là giao dịch thủ công)   |
| adminNote                  | TEXT             | Ghi chú của admin                         |
| createdAt                  | TIMESTAMP        | Ngày tạo (indexed)                        |

**Quan hệ:**

- `wallet` (N:1) → Ví tiền
- `order` (N:1) → Đơn hàng (optional)

**Loại giao dịch (TransactionType):**

- `EARNING` - Thu nhập từ đơn hàng
- `WITHDRAWAL` - Rút tiền
- `REFUND` - Hoàn trả khách hàng
- `ADJUSTMENT` - Điều chỉnh thủ công (admin)

**Indexes:**

- `idx_transaction_wallet` (walletId)
- `idx_transaction_type` (transactionType)
- `idx_transaction_order` (orderId)
- `idx_transaction_created` (createdAt)
- `idx_transaction_wallet_type` (walletId, transactionType)
- `idx_transaction_wallet_created` (walletId, createdAt)

---

### Bảng: `withdrawal_requests` (Yêu cầu rút tiền)

**Giải thích**: Nếu tắt auto-withdrawal, nhà cung cấp phải tạo yêu cầu rút tiền thủ công

| Cột                   | Kiểu dữ liệu  | Mô tả                         |
| ---------------------- | ---------------- | ------------------------------- |
| **requestId** 🔑 | VARCHAR(36) UUID | Khóa chính                    |
| walletId 🔗            | BIGINT           | FK đến supplier_wallets       |
| amount                 | DECIMAL(15,2)    | Số tiền muốn rút            |
| status                 | ENUM             | Trạng thái (WithdrawalStatus) |
| requestedAt            | TIMESTAMP        | Ngày yêu cầu                 |
| processedAt            | TIMESTAMP        | Ngày xử lý                   |
| processedBy            | VARCHAR(36)      | ID admin xử lý                |
| rejectReason           | TEXT             | Lý do từ chối (nếu có)     |

**Trạng thái:**

- `PENDING` - Chờ xử lý
- `APPROVED` - Đã duyệt
- `REJECTED` - Từ chối
- `COMPLETED` - Đã chuyển tiền

---

## 8. HỆ THỐNG ĐÁNH GIÁ VÀ THÔNG BÁO

### Bảng: `reviews` (Đánh giá sản phẩm)

| Cột                  | Kiểu dữ liệu    | Mô tả                          |
| --------------------- | ------------------ | -------------------------------- |
| **reviewId** 🔑 | VARCHAR(36) UUID   | Khóa chính                     |
| customerId 🔗         | VARCHAR(36)        | FK đến customers               |
| productId 🔗          | VARCHAR(36)        | FK đến products                |
| storeId 🔗            | VARCHAR(36)        | FK đến stores                  |
| orderDetailId 🔗      | VARCHAR(36) UNIQUE | FK đến order_details (1:1)     |
| rating                | INT                | Điểm đánh giá (1-5 sao)     |
| comment               | TEXT               | Nội dung đánh giá (optional) |
| markedAsSpam          | BOOLEAN            | Đánh dấu spam                 |
| createdAt             | TIMESTAMP          | Ngày tạo                       |

**Quan hệ:**

- `customer` (N:1) → Khách hàng
- `product` (N:1) → Sản phẩm
- `store` (N:1) → Cửa hàng
- `orderDetail` (1:1) → Chi tiết đơn hàng

⚠️ **Ràng buộc quan trọng**: `orderDetailId` là UNIQUE - nghĩa là mỗi sản phẩm trong đơn hàng chỉ được đánh giá 1 lần. Điều này ngăn chặn fake reviews.

---

### Bảng: `notifications` (Thông báo)

| Cột                        | Kiểu dữ liệu  | Mô tả                                          |
| --------------------------- | ---------------- | ------------------------------------------------ |
| **notificationId** 🔑 | VARCHAR(36) UUID | Khóa chính                                     |
| content                     | TEXT NOT NULL    | Nội dung thông báo                            |
| type                        | ENUM             | Loại (NotificationType)                         |
| linkUrl                     | VARCHAR(500)     | Deep link                                        |
| isBroadcast                 | BOOLEAN          | Thông báo hệ thống (broadcast) hay cá nhân |
| createdAt                   | TIMESTAMP        | Ngày tạo                                       |

**Loại thông báo (NotificationType):**

- `ORDER_STATUS` - Cập nhật trạng thái đơn hàng
- `PROMOTION` - Khuyến mãi mới
- `SYSTEM` - Thông báo hệ thống
- `REVIEW` - Đánh giá mới
- v.v.

---

### Bảng: `user_notification_status` (Trạng thái đọc thông báo)

**Giải thích**: Theo dõi thông báo nào khách hàng đã đọc/chưa đọc

| Cột                  | Kiểu dữ liệu  | Mô tả                |
| --------------------- | ---------------- | ---------------------- |
| **statusId** 🔑 | VARCHAR(36) UUID | Khóa chính           |
| notificationId 🔗     | VARCHAR(36)      | FK đến notifications |
| userId 🔗             | VARCHAR(36)      | FK đến users         |
| isRead                | BOOLEAN          | Đã đọc             |
| readAt                | TIMESTAMP        | Thời điểm đọc     |

---

### Bảng: `pending_notifications` (Hàng đợi gửi thông báo)

**Giải thích**: Email/SMS cần gửi được đẩy vào queue này, một scheduled job sẽ xử lý

| Cột                        | Kiểu dữ liệu  | Mô tả                            |
| --------------------------- | ---------------- | ---------------------------------- |
| **notificationId** 🔑 | VARCHAR(36) UUID | Khóa chính                       |
| recipientEmail              | VARCHAR(255)     | Email người nhận                |
| recipientPhone              | VARCHAR(20)      | SĐT người nhận                 |
| notificationType            | ENUM             | Loại (EmailNotificationType)      |
| status                      | ENUM             | Trạng thái (NotificationStatus)  |
| content                     | TEXT             | Nội dung                          |
| scheduledAt                 | TIMESTAMP        | Thời điểm dự kiến gửi        |
| sentAt                      | TIMESTAMP        | Thời điểm đã gửi             |
| retryCount                  | INT              | Số lần thử lại                 |
| errorMessage                | TEXT             | Thông báo lỗi (nếu thất bại) |

**Trạng thái:**

- `PENDING` - Chờ gửi
- `SENT` - Đã gửi
- `FAILED` - Thất bại

---

## 9. CÁC BẢNG HỖ TRỢ KHÁC

### Bảng: `addresses` (Địa chỉ giao hàng)

| Cột                   | Kiểu dữ liệu       | Mô tả                 |
| ---------------------- | --------------------- | ----------------------- |
| **addressId** 🔑 | VARCHAR(36) UUID      | Khóa chính            |
| customerId 🔗          | VARCHAR(36)           | FK đến customers      |
| fullName               | VARCHAR(255) NOT NULL | Tên người nhận      |
| phoneNumber            | VARCHAR(20) NOT NULL  | SĐT người nhận      |
| province               | VARCHAR(100) NOT NULL | Tỉnh/Thành phố       |
| district               | VARCHAR(100) NOT NULL | Quận/Huyện            |
| ward                   | VARCHAR(100) NOT NULL | Phường/Xã            |
| street                 | TEXT NOT NULL         | Số nhà, tên đường |
| isDefault              | BOOLEAN               | Địa chỉ mặc định  |
| latitude               | DOUBLE                | Vĩ độ                |
| longitude              | DOUBLE                | Kinh độ               |

**Quan hệ:**

- `customer` (N:1) → Khách hàng

---

### Bảng: `favorite_stores` (Cửa hàng yêu thích)

**Giải thích**: Bảng trung gian Many-to-Many giữa Customer và Store

| Cột                    | Kiểu dữ liệu  | Mô tả                 |
| ----------------------- | ---------------- | ----------------------- |
| **favoriteId** 🔑 | VARCHAR(36) UUID | Khóa chính            |
| customerId 🔗           | VARCHAR(36)      | FK đến customers      |
| storeId 🔗              | VARCHAR(36)      | FK đến stores         |
| createdAt               | TIMESTAMP        | Ngày thêm yêu thích |

---

### Bảng: `category_suggestions` (Đề xuất danh mục)

**Giải thích**: Nhà cung cấp có thể đề xuất danh mục mới, admin sẽ phê duyệt

| Cột                      | Kiểu dữ liệu       | Mô tả                                 |
| ------------------------- | --------------------- | --------------------------------------- |
| **suggestionId** 🔑 | VARCHAR(36) UUID      | Khóa chính                            |
| suggesterId 🔗            | VARCHAR(36)           | FK đến suppliers (người đề xuất) |
| processorId 🔗            | VARCHAR(36)           | FK đến admins (người xử lý)       |
| name                      | VARCHAR(100) NOT NULL | Tên danh mục đề xuất               |
| reason                    | TEXT                  | Lý do đề xuất                       |
| status                    | ENUM                  | Trạng thái (SuggestionStatus)         |
| adminNotes                | TEXT                  | Ghi chú của admin                     |
| createdAt                 | TIMESTAMP             | Ngày đề xuất                        |
| processedAt               | TIMESTAMP             | Ngày xử lý                           |

**Trạng thái:**

- `PENDING` - Chờ duyệt
- `APPROVED` - Đã duyệt
- `REJECTED` - Từ chối

---

### Bảng: `store_pending_updates` (Cập nhật cửa hàng chờ duyệt)

**Giải thích**: Thay đổi thông tin cửa hàng quan trọng phải được admin phê duyệt trước

| Cột                  | Kiểu dữ liệu  | Mô tả                     |
| --------------------- | ---------------- | --------------------------- |
| **updateId** 🔑 | VARCHAR(36) UUID | Khóa chính                |
| storeId 🔗            | VARCHAR(36)      | FK đến stores             |
| updateData            | JSON             | Dữ liệu thay đổi (JSON) |
| status                | ENUM             | Trạng thái                |
| requestedAt           | TIMESTAMP        | Ngày yêu cầu             |
| processedAt           | TIMESTAMP        | Ngày xử lý               |
| processedBy           | VARCHAR(36)      | Admin xử lý               |

---

### Bảng: `email_verification_tokens` (Token xác thực email)

**Giải thích**: Lưu OTP/token xác thực email (tạm thời, có thời hạn)

| Cột                 | Kiểu dữ liệu  | Mô tả              |
| -------------------- | ---------------- | -------------------- |
| **tokenId** 🔑 | VARCHAR(36) UUID | Khóa chính         |
| userId 🔗            | VARCHAR(36)      | FK đến users       |
| token                | VARCHAR(255)     | Token xác thực     |
| expiresAt            | TIMESTAMP        | Thời gian hết hạn |
| used                 | BOOLEAN          | Đã sử dụng       |
| createdAt            | TIMESTAMP        | Ngày tạo           |

---

### Bảng: `promotion_validation_logs` (Log xác thực khuyến mãi)

**Giải thích**: Ghi lại các lần validate mã giảm giá để phát hiện fraud

| Cột               | Kiểu dữ liệu  | Mô tả                                  |
| ------------------ | ---------------- | ---------------------------------------- |
| **logId** 🔑 | VARCHAR(36) UUID | Khóa chính                             |
| promotionId 🔗     | VARCHAR(36)      | FK đến promotions                      |
| customerId 🔗      | VARCHAR(36)      | FK đến customers                       |
| status             | ENUM             | Trạng thái (PromotionValidationStatus) |
| failReason         | VARCHAR(500)     | Lý do thất bại                        |
| createdAt          | TIMESTAMP        | Ngày kiểm tra                          |

---

### Bảng: `banners` (Banner quảng cáo)

| Cột                  | Kiểu dữ liệu  | Mô tả             |
| --------------------- | ---------------- | ------------------- |
| **bannerId** 🔑 | VARCHAR(36) UUID | Khóa chính        |
| title                 | VARCHAR(255)     | Tiêu đề          |
| imageUrl              | TEXT             | Hình ảnh banner   |
| linkUrl               | VARCHAR(500)     | Link đích         |
| displayOrder          | INT              | Thứ tự hiển thị |
| active                | BOOLEAN          | Đang hoạt động  |
| startDate             | DATE             | Ngày bắt đầu    |
| endDate               | DATE             | Ngày kết thúc    |

---

### Bảng: `news_articles` (Bài viết tin tức)

| Cột                   | Kiểu dữ liệu  | Mô tả           |
| ---------------------- | ---------------- | ----------------- |
| **articleId** 🔑 | VARCHAR(36) UUID | Khóa chính      |
| title                  | VARCHAR(255)     | Tiêu đề        |
| content                | TEXT             | Nội dung         |
| imageUrl               | TEXT             | Hình đại diện |
| publishedAt            | TIMESTAMP        | Ngày xuất bản  |
| authorId               | VARCHAR(36)      | FK đến admins   |

---

### Bảng: `search_history` (Lịch sử tìm kiếm)

| Cột                  | Kiểu dữ liệu  | Mô tả              |
| --------------------- | ---------------- | -------------------- |
| **searchId** 🔑 | VARCHAR(36) UUID | Khóa chính         |
| customerId 🔗         | VARCHAR(36)      | FK đến customers   |
| keyword               | VARCHAR(255)     | Từ khóa tìm kiếm |
| searchedAt            | TIMESTAMP        | Thời điểm tìm    |

**Mục đích**: Phân tích hành vi người dùng, gợi ý sản phẩm

---

### Bảng: `chat_messages` (Tin nhắn chat hỗ trợ)

| Cột                   | Kiểu dữ liệu  | Mô tả                                            |
| ---------------------- | ---------------- | -------------------------------------------------- |
| **messageId** 🔑 | VARCHAR(36) UUID | Khóa chính                                       |
| senderId               | VARCHAR(36)      | FK đến users                                     |
| receiverId             | VARCHAR(36)      | FK đến users                                     |
| content                | TEXT             | Nội dung tin nhắn                                |
| messageType            | ENUM             | Loại (MessageType - TEXT/IMAGE/FILE)              |
| status                 | ENUM             | Trạng thái (MessageStatus - SENT/DELIVERED/READ) |
| sentAt                 | TIMESTAMP        | Thời gian gửi                                    |

---

## 10. DANH SÁCH ENUM

### Role (Vai trò Admin)

```java
ROLE_SUPER_ADMIN    // Quản trị viên cao nhất
ROLE_MODERATOR      // Kiểm duyệt viên
ROLE_STAFF          // Nhân viên
```

### CustomerStatus (Trạng thái khách hàng)

```java
ACTIVE                  // Hoạt động
INACTIVE                // Không hoạt động
SUSPENDED               // Tạm ngưng
BANNED                  // Bị cấm
PENDING_VERIFICATION    // Chờ xác thực
RESTRICTED              // Hạn chế
```

### CustomerTier (Hạng thành viên)

```java
BRONZE      // 0-499 điểm
SILVER      // 500-1,999 điểm
GOLD        // 2,000-4,999 điểm
PLATINUM    // 5,000-9,999 điểm
DIAMOND     // 10,000+ điểm
```

### SupplierStatus (Trạng thái nhà cung cấp)

```java
PENDING_VERIFICATION    // Chờ xác thực email
PENDING_DOCUMENTS       // Chờ tải tài liệu
PENDING_STORE_INFO      // Chờ thông tin cửa hàng
PENDING_APPROVAL        // Chờ admin phê duyệt
ACTIVE                  // Đang hoạt động
SUSPENDED               // Tạm ngưng
PAUSE                   // Tạm dừng
REJECTED                // Từ chối
```

### AdminStatus

```java
ACTIVE              // Hoạt động
INACTIVE            // Không hoạt động
PENDING_APPROVAL    // Chờ phê duyệt
```

### ProductStatus (Trạng thái sản phẩm)

```java
PENDING_APPROVAL    // Chờ duyệt
APPROVED            // Đã duyệt
REJECTED            // Bị từ chối
SOLD_OUT            // Hết hàng
```

### OrderStatus (Trạng thái đơn hàng)

```java
PENDING         // Chờ xác nhận
CONFIRMED       // Đã xác nhận
PREPARING       // Đang chuẩn bị
SHIPPING        // Đang giao hàng
DELIVERED       // Đã giao thành công
CANCELED        // Đã hủy
RETURNED        // Đã trả lại
```

### PaymentStatus (Trạng thái thanh toán)

```java
PENDING     // Chờ thanh toán
SUCCESS     // Thanh toán thành công
FAILED      // Thanh toán thất bại
REFUNDED    // Đã hoàn tiền
```

### PaymentMethod (Phương thức thanh toán)

```java
CASH            // Tiền mặt
CREDIT_CARD     // Thẻ tín dụng
DEBIT_CARD      // Thẻ ghi nợ
E_WALLET        // Ví điện tử
BANK_TRANSFER   // Chuyển khoản
```

### PaymentProvider (Nhà cung cấp thanh toán)

```java
VNPAY
MOMO
ZALOPAY
VIETTEL_PAY
SHOPEE_PAY
PAYPAL
```

### ShipmentStatus (Trạng thái vận chuyển)

```java
PREPARING       // Đang chuẩn bị
IN_TRANSIT      // Đang vận chuyển
DELIVERED       // Đã giao hàng
FAILED          // Giao hàng thất bại
RETURNED        // Trả hàng
```

### PromotionType (Loại khuyến mãi)

```java
PERCENTAGE      // Giảm giá phần trăm
FIXED_AMOUNT    // Giảm giá cố định
FREE_SHIPPING   // Miễn phí vận chuyển
```

### PromotionTier (Hạng áp dụng khuyến mãi)

```java
GENERAL     // Tất cả khách hàng
BRONZE      // Hạng Đồng trở lên
SILVER      // Hạng Bạc trở lên
GOLD        // Hạng Vàng trở lên
PLATINUM    // Hạng Bạch Kim trở lên
DIAMOND     // Chỉ hạng Kim Cương
```

### PromotionStatus (Trạng thái khuyến mãi)

```java
ACTIVE      // Đang hoạt động
INACTIVE    // Không hoạt động
EXPIRED     // Đã hết hạn
PAUSED      // Tạm dừng
```

### PointTransactionType (Loại giao dịch điểm)

```java
EARN        // Tích điểm
REDEEM      // Đổi điểm
EXPIRE      // Điểm hết hạn
REFUND      // Hoàn điểm
BONUS       // Điểm thưởng
```

### TransactionType (Loại giao dịch ví)

```java
EARNING         // Thu nhập
WITHDRAWAL      // Rút tiền
REFUND          // Hoàn trả
ADJUSTMENT      // Điều chỉnh
```

### WalletStatus (Trạng thái ví)

```java
ACTIVE      // Hoạt động
FROZEN      // Đóng băng
SUSPENDED   // Tạm ngưng
CLOSED      // Đã đóng
```

### WithdrawalStatus (Trạng thái rút tiền)

```java
PENDING     // Chờ xử lý
APPROVED    // Đã duyệt
REJECTED    // Từ chối
COMPLETED   // Hoàn thành
```

### BusinessType (Loại hình kinh doanh)

```java
INDIVIDUAL          // Cá nhân
HOUSEHOLD           // Hộ kinh doanh
COMPANY             // Công ty
COOPERATIVE         // Hợp tác xã
```

### StoreStatus (Trạng thái cửa hàng)

```java
ACTIVE      // Đang hoạt động
INACTIVE    // Không hoạt động
SUSPENDED   // Tạm ngưng
CLOSED      // Đã đóng
```

### SuggestionStatus (Trạng thái đề xuất)

```java
PENDING     // Chờ duyệt
APPROVED    // Đã duyệt
REJECTED    // Từ chối
```

### NotificationType (Loại thông báo)

```java
ORDER_STATUS    // Cập nhật đơn hàng
PROMOTION       // Khuyến mãi
SYSTEM          // Hệ thống
REVIEW          // Đánh giá
ACCOUNT         // Tài khoản
```

### NotificationStatus (Trạng thái thông báo queue)

```java
PENDING     // Chờ gửi
SENT        // Đã gửi
FAILED      // Thất bại
```

### EmailNotificationType (Loại email)

```java
WELCOME                 // Email chào mừng
ORDER_CONFIRMATION      // Xác nhận đơn hàng
ORDER_STATUS_UPDATE     // Cập nhật trạng thái
PASSWORD_RESET          // Đặt lại mật khẩu
VERIFICATION            // Xác thực tài khoản
PROMOTION               // Khuyến mãi
```

### MessageType (Loại tin nhắn chat)

```java
TEXT        // Văn bản
IMAGE       // Hình ảnh
FILE        // File đính kèm
AUDIO       // Âm thanh
VIDEO       // Video
```

### MessageStatus (Trạng thái tin nhắn)

```java
SENT        // Đã gửi
DELIVERED   // Đã nhận
READ        // Đã đọc
FAILED      // Thất bại
```

### StorageBucket (Bucket lưu trữ Cloudinary)

```java
BUSINESS_LICENSES           // Giấy phép kinh doanh
FOOD_SAFETY_CERTIFICATES    // Giấy ATTP
BANNER                      // Banner quảng cáo
PRODUCTS                    // Sản phẩm
CATEGORY_IMAGES             // Danh mục
AVATAR_CUSTOMER             // Avatar khách hàng
AVATAR_ADMIN                // Avatar admin
SUPPLIER_LOGO               // Logo nhà cung cấp
```

---

## 11. CHIẾN LƯỢC INDEX

### Nguyên tắc tạo index:

1. **Foreign keys**: Luôn index các khóa ngoại
2. **Search fields**: Index các cột dùng trong WHERE clause
3. **Sort fields**: Index các cột dùng trong ORDER BY
4. **Composite indexes**: Tạo index tổ hợp cho các query phổ biến
5. **UNIQUE constraints**: Tự động tạo index

### Các composite index quan trọng:

**Users:**

- `(active, createdAt)` - Dashboard admin lọc user mới

**Customers:**

- `(status, tier)` - Phân loại khách hàng
- `(customerId, status)` - Lịch sử đơn hàng khách
- `(customerId, createdAt)` - Timeline hoạt động

**Products:**

- `(supplierId, status)` - Sản phẩm của supplier
- `(categoryId, status)` - Browse theo danh mục

**Orders:**

- `(customerId, status)` - Đơn hàng của khách
- `(storeId, status)` - Quản lý đơn của cửa hàng
- `(status, createdAt)` - Dashboard admin
- `(customerId, createdAt)` - Timeline mua hàng

**Stores:**

- `(latitude, longitude)` - Tìm cửa hàng gần
- `(supplierId, status)` - Cửa hàng của supplier
- `(status, rating)` - Top stores

**Payments:**

- `(status, createdAt)` - Báo cáo tài chính
- `(orderId)` - UNIQUE, tra cứu nhanh

**Promotions:**

- `(status, startDate, endDate)` - Khuyến mãi đang chạy
- `(tier, status)` - Khuyến mãi theo hạng

**Wallet Transactions:**

- `(walletId, transactionType)` - Lọc theo loại
- `(walletId, createdAt)` - Timeline giao dịch

---

## 📌 LƯU Ý QUAN TRỌNG

### 1. Quy tắc tạo dữ liệu

- **Supplier**: Luôn lưu entity `Supplier` TRƯỚC khi tạo `Store`
- **Admin**: Tạo bởi SUPER_ADMIN, status = ACTIVE ngay lập tức
- **Customer**: Xác thực OTP trước khi ACTIVE
- **Product**: Phải APPROVED mới hiển thị

### 2. Optimistic Locking

Các entity sau dùng `@Version` để tránh race condition:

- `users` (version)
- `categories` (version)
- `promotions` (version) - Quan trọng cho việc kiểm soát số lượng sử dụng

### 3. Soft Delete

Chỉ `categories` dùng soft delete (deleted flag), các bảng khác xóa thật

### 4. Default Avatar

Tất cả user được gán avatar mặc định khi đăng ký:

```
https://res.cloudinary.com/dk7coitah/image/upload/v1760668372/avatar_cflwdp.jpg
```

### 5. OTP System (Redis)

**Không lưu trong DB**, dùng Redis với TTL 3 phút:

- Key pattern: `otp:phone:{phone}` hoặc `otp:email:{email}`
- Rate limit: `otp:ratelimit:phone:{phone}` (max 3 lần/giờ)

### 6. Keycloak Synchronization

- Luôn tạo user trong Keycloak TRƯỚC
- Lưu `keycloakId` trong local DB
- Rollback nếu Keycloak creation thất bại

### 7. File Upload Flow

1. Frontend upload lên `/api/storage/upload`
2. Cloudinary trả về secure URL
3. Frontend gửi URL trong request
4. Backend validate và lưu URL vào DB

### 8. Ràng buộc UNIQUE quan trọng

- `users`: username, email, phoneNumber, keycloakId
- `carts`: (customerId, storeId) - 1 giỏ/khách/cửa hàng
- `orders`: orderCode
- `promotions`: code
- `product_variants`: sku
- `reviews`: orderDetailId - 1 review/order item

---

## 🎯 TỔNG KẾT

### Thống kê Database:

- **37+ bảng** chính
- **28 enum types** (validation domain)
- **100+ indexes** (performance optimization)
- **Inheritance**: JOINED strategy (User hierarchy)
- **Primary Keys**: UUID (security & distributed systems)
- **Timestamps**: CreationTimestamp & UpdateTimestamp (audit trail)

### Đặc điểm thiết kế:

✅ **Chuẩn hóa 3NF** (Normalized to 3rd Normal Form)
✅ **Quan hệ rõ ràng** (Foreign keys với cascade rules)
✅ **Audit trail đầy đủ** (Timestamps, transaction logs)
✅ **Scalable** (UUID PKs, composite indexes)
✅ **Secure** (Keycloak integration, optimistic locking)
✅ **Business logic** (Helper methods trong entities)
✅ **Multi-tenancy** (Mỗi supplier độc lập)

### Công nghệ sử dụng:

- **JPA/Hibernate** - ORM
- **Spring Data JPA** - Repository pattern
- **MySQL** - Relational database
- **Redis** - Cache & OTP storage
- **Keycloak** - Identity management
- **Cloudinary** - File storage

---

**Tài liệu này được tạo để dễ hiểu cấu trúc database của hệ thống SaveFood. Mọi thắc mắc vui lòng liên hệ team development.**

**Phiên bản**: 1.0
**Ngày cập nhật**: 2025-01-22
**Tác giả**: SaveFood Development Team
