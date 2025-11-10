# 📊 Giải Thích Chi Tiết Về Cách Tính Doanh Thu

## 🎯 Tổng Quan

Trong hệ thống có **2 loại doanh thu khác nhau**, được sử dụng cho các mục đích khác nhau:

### 1. **Doanh Thu Tổng Quan** (Total Order Revenue)
- 💰 **Giá trị**: Tổng tiền khách hàng **THỰC TẾ TRẢ**
- 🧮 **Công thức**: `SUM(Order.totalAmount)`
- 📝 **Chi tiết**: `totalAmount = subtotal - discount + shippingFee`
- 🎯 **Mục đích**: Theo dõi doanh thu thực tế của toàn hệ thống
- 📍 **Hiển thị**: Dashboard Overview (Tổng doanh thu, Doanh thu hôm nay, Doanh thu tháng)

### 2. **Doanh Thu Theo Sản Phẩm/Danh Mục** (Product-Level Revenue)
- 💰 **Giá trị**: Doanh thu **CHỈ TỪ SẢN PHẨM**
- 🧮 **Công thức**: `SUM(OrderDetail.quantity × OrderDetail.amount)`
- 📝 **Chi tiết**: Chỉ tính giá sản phẩm × số lượng
- 🎯 **Mục đích**: Đánh giá hiệu suất của từng sản phẩm/danh mục
- 📍 **Hiển thị**: Top sản phẩm bán chạy, Doanh thu theo danh mục

---

## ❓ Tại Sao Có 2 Loại Doanh Thu Khác Nhau?

### 🔍 Lý Do Thiết Kế

#### **Doanh Thu Tổng Quan** (Order-Level)
```
Ví dụ: Đơn hàng #001
- Sản phẩm A: 100,000 VNĐ × 2 = 200,000 VNĐ
- Sản phẩm B: 50,000 VNĐ × 1 = 50,000 VNĐ
--------------------------------
Subtotal:                250,000 VNĐ
Giảm giá (mã KM 10%):   - 25,000 VNĐ
Phí ship:               + 15,000 VNĐ
================================
TỔNG KHÁCH HÀNG TRẢ:    240,000 VNĐ ← Đây là totalAmount
```

**→ Doanh thu tổng quan = 240,000 VNĐ** (số tiền thực tế vào két)

#### **Doanh Thu Theo Sản Phẩm** (Product-Level)
```
Cùng đơn hàng #001:
- Sản phẩm A: 200,000 VNĐ
- Sản phẩm B: 50,000 VNĐ
--------------------------------
Tổng doanh thu sản phẩm: 250,000 VNĐ
```

**→ Doanh thu sản phẩm = 250,000 VNĐ** (không bao gồm discount/shipping)

---

## 🤔 Tại Sao Không Phân Bổ Discount/Shipping Vào Sản Phẩm?

### ❌ Vấn Đề Nếu Phân Bổ

**1. Không Công Bằng**
```
Ví dụ: Giảm 10% đơn hàng
- Sản phẩm A (đắt): 200,000 VNĐ → giảm 20,000 VNĐ
- Sản phẩm B (rẻ): 50,000 VNĐ → giảm 5,000 VNĐ

→ Sản phẩm B "chịu thiệt" ít hơn, làm sai lệch hiệu suất
```

**2. Mã Giảm Giá Áp Dụng Cho Đơn Hàng, Không Phải Sản Phẩm**
- Khách hàng sử dụng mã "GIAMGIA10" cho **TOÀN ĐƠN**
- Không có sản phẩm cụ thể nào được giảm giá
- Phân bổ sẽ tạo ra con số giả tạo

**3. Phí Ship Là Chi Phí Đơn Hàng, Không Liên Quan Sản Phẩm**
- Phí ship phụ thuộc khoảng cách, không phải sản phẩm
- Một đơn 1 sản phẩm và đơn 10 sản phẩm có thể cùng phí ship
- Phân bổ sẽ méo mó hiệu suất sản phẩm

### ✅ Lợi Ích Của Cách Tính Hiện Tại

**1. Đánh Giá Chính Xác Hiệu Suất Sản Phẩm**
```
Sản phẩm A bán 100 cái × 50,000 = 5,000,000 VNĐ
→ Đây là doanh thu "thật" của sản phẩm A
→ Không bị ảnh hưởng bởi chiến dịch giảm giá của Marketing
```

**2. So Sánh Công Bằng Giữa Các Sản Phẩm**
```
- Sản phẩm A: 5,000,000 VNĐ (product revenue)
- Sản phẩm B: 3,000,000 VNĐ (product revenue)

→ A bán chạy hơn B → Kết luận chính xác
→ Không bị sai lệch bởi chương trình khuyến mãi
```

**3. Hỗ Trợ Quyết Định Kinh Doanh**
- **Marketing**: Xem tổng doanh thu thực tế (có discount) để đánh giá ROI
- **Inventory**: Xem doanh thu sản phẩm để quyết định nhập hàng
- **Supplier**: Xem doanh thu sản phẩm để biết sản phẩm nào bán chạy

---

## 📊 Cách Hiểu Khi Xem Dashboard

### Màn Hình Dashboard

#### **Phần Tổng Quan** (Trên Cùng)
```
╔══════════════════════════════════════════════════════════╗
║  📊 TỔNG QUAN                                            ║
║                                                          ║
║  Tổng Doanh Thu: 50,000,000 VNĐ ← totalAmount (có giảm giá/ship) ║
║  Doanh Thu Tháng: 10,000,000 VNĐ                        ║
║  Doanh Thu Hôm Nay: 1,500,000 VNĐ                       ║
╚══════════════════════════════════════════════════════════╝
```
→ **Số tiền THỰC TẾ khách hàng đã trả**

#### **Phần Sản Phẩm Bán Chạy** (Dưới)
```
╔══════════════════════════════════════════════════════════╗
║  🔥 SẢN PHẨM BÁN CHẠY                                    ║
║                                                          ║
║  1. Sản phẩm A:  8,000,000 VNĐ ← product revenue (không có giảm giá/ship) ║
║  2. Sản phẩm B:  6,500,000 VNĐ                          ║
║  3. Sản phẩm C:  4,200,000 VNĐ                          ║
╚══════════════════════════════════════════════════════════╝
```
→ **Doanh thu thuần từ sản phẩm** (để so sánh công bằng)

#### **Phần Danh Mục Bán Chạy** (Dưới)
```
╔══════════════════════════════════════════════════════════╗
║  📦 DANH MỤC BÁN CHẠY                                    ║
║                                                          ║
║  1. Rau củ:      15,000,000 VNĐ ← product revenue      ║
║  2. Trái cây:    12,000,000 VNĐ                          ║
║  3. Thực phẩm:   10,500,000 VNĐ                          ║
╚══════════════════════════════════════════════════════════╝
```
→ **Doanh thu thuần từ danh mục**

---

## ⚠️ Lưu Ý Quan Trọng

### 🚨 Đừng So Sánh Trực Tiếp

```
❌ SAI: 
Tổng doanh thu = 50,000,000 VNĐ
Top 3 sản phẩm = 8M + 6.5M + 4.2M = 18,700,000 VNĐ
→ "Tại sao chênh lệch 31,300,000 VNĐ???"

✅ ĐÚNG:
- Tổng doanh thu (50M): Bao gồm discount, shipping
- Doanh thu sản phẩm (18.7M): Chỉ 3 sản phẩm top, không có discount/shipping
→ Không thể so sánh trực tiếp!
```

### ✅ Cách Đọc Đúng

**Khi Xem Tổng Doanh Thu:**
- "Hệ thống thu về 50M từ khách hàng"
- Dùng để: Tính lãi/lỗ, báo cáo tài chính, đánh giá chiến dịch marketing

**Khi Xem Doanh Thu Sản Phẩm:**
- "Sản phẩm A mang về 8M doanh thu thuần"
- Dùng để: Quyết định nhập hàng, đánh giá hiệu suất sản phẩm, so sánh giữa các mặt hàng

---

## 🛠️ Implementation Details

### Database Queries

#### **Tổng Doanh Thu** (OrderDetailRepository)
```java
@Query("SELECT COALESCE(SUM(o.totalAmount), 0.0) " +
       "FROM Order o " +
       "WHERE o.status = 'DELIVERED' " +
       "AND o.createdAt BETWEEN :startDate AND :endDate")
Double calculateRevenueByDateRange(...);
```

#### **Doanh Thu Sản Phẩm** (OrderDetailRepository)
```java
@Query("SELECT ... SUM(od.quantity * od.amount) as revenue ... " +
       "FROM OrderDetail od " +
       "WHERE od.order.status = 'DELIVERED' " +
       "GROUP BY p.productId ...")
List<Object[]> findTopProductsByRevenue(...);
```

### Calculation Formulas

```java
// Khi tạo đơn hàng (OrderServiceImpl.checkout)
BigDecimal subtotal = calculateSubtotal(cartDetails);
BigDecimal discount = calculateTotalDiscount(promotions);
BigDecimal shippingFee = getShippingFee(request);

BigDecimal finalTotal = subtotal
    .subtract(discount)
    .add(shippingFee);

order.setTotalAmount(finalTotal);
order.setDiscount(discount);
order.setShippingFee(shippingFee);
```

---

## 📈 Use Cases

### Case 1: Đánh Giá Chiến Dịch Marketing
```
Câu hỏi: "Chiến dịch giảm giá 20% có hiệu quả không?"

→ Xem: TỔNG DOANH THU (totalAmount)
→ So sánh trước/sau chiến dịch
→ Có tính cả discount để đánh giá ROI
```

### Case 2: Quyết Định Nhập Hàng
```
Câu hỏi: "Sản phẩm nào nên nhập thêm?"

→ Xem: DOANH THU SẢN PHẨM (product revenue)
→ Không bị ảnh hưởng bởi mã giảm giá
→ Phản ánh sức mua thật của sản phẩm
```

### Case 3: Báo Cáo Tài Chính
```
Câu hỏi: "Tháng này doanh thu bao nhiêu?"

→ Xem: TỔNG DOANH THU (totalAmount)
→ Đây là số tiền thực tế vào tài khoản
→ Dùng để tính thuế, lãi/lỗ
```

### Case 4: Phân Tích Danh Mục
```
Câu hỏi: "Danh mục nào bán chạy nhất?"

→ Xem: DOANH THU DANH MỤC (category product revenue)
→ So sánh công bằng giữa các danh mục
→ Không bị méo mó bởi chiến dịch khuyến mãi
```

---

## 🎓 Kết Luận

### Quy Tắc Vàng
1. **Tổng doanh thu**: Dùng `totalAmount` (có discount/shipping) - Cho quản lý tài chính
2. **Doanh thu sản phẩm**: Dùng `quantity × amount` (không có discount/shipping) - Cho phân tích sản phẩm
3. **Không so sánh trực tiếp** giữa 2 loại này
4. **Chú thích rõ ràng** trên UI nếu cần thiết

### Khi Nào Cần Thay Đổi?
Nếu yêu cầu business đặc biệt:
- Muốn phân bổ discount vào sản phẩm → Cần thiết kế thuật toán phân bổ công bằng
- Muốn unified revenue → Chọn 1 cách tính duy nhất
- Muốn thêm báo cáo chi tiết → Tạo view/report riêng với công thức cụ thể

---

## 📝 Changelog

### v1.0.0 (2025-11-11)
- ✅ Fixed: `OrderDetailRepository.calculateRevenueByDateRange` - Changed from `totalAmount - discount + shippingFee` to `totalAmount`
- ✅ Fixed: `findRevenueByCategoryWithDateRange` - Changed avgOrderValue from `totalAmount - discount + shippingFee` to `totalAmount`
- ✅ Fixed: `findRevenueByCategoryForSupplier` - Changed avgOrderValue calculation
- ✅ Added: Comprehensive documentation explaining revenue differences
- ✅ Added: Comments in code explaining product-level vs order-level revenue

### Các File Đã Cập Nhật
- `backend/src/main/java/com/example/backend/repository/OrderDetailRepository.java`
- `backend/src/main/java/com/example/backend/service/impl/DashboardServiceImpl.java`
- `docs/REVENUE_CALCULATION_EXPLAINED.md` (new)
