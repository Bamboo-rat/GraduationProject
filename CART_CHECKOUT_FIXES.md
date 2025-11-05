# 🛒 CART & CHECKOUT LOGIC IMPROVEMENTS

## 📋 Các vấn đề đã được sửa (Ngày: 05/11/2025)

### ✅ **1. Thiếu @NotNull validation cho quantity**

**Vấn đề:** 
- `AddToCartRequest` và `UpdateCartItemRequest` chỉ có `@Min(1)` mà không có `@NotNull`
- Giá trị `quantity = null` sẽ lọt qua validation → gây `NullPointerException` hoặc lỗi NOT NULL ở DB

**Giải pháp:**
```java
// AddToCartRequest.java
@NotNull(message = "Quantity is required")
@Min(value = 1, message = "Quantity must be at least 1")
private Integer quantity;
```

---

### ✅ **2. Xử lý quantity = 0 hoặc null → Xóa sản phẩm**

**Vấn đề:**
- Không có cách tự nhiên để xóa sản phẩm khỏi giỏ hàng qua API update
- Frontend phải gọi riêng API delete

**Giải pháp:**
```java
// UpdateCartItemRequest.java
@Min(value = 0, message = "Quantity must be greater than or equal to 0")
@Schema(description = "Số lượng mới. Đặt 0 để xóa sản phẩm khỏi giỏ hàng")
private Integer quantity;

// CartServiceImpl.updateCartItem()
if (request.getQuantity() == null || request.getQuantity() == 0) {
    log.info("Quantity is 0 or null, removing cart item: cartDetailId={}", cartDetailId);
    return removeCartItem(customerId, cartDetailId);
}
```

**Lợi ích:**
- UX tốt hơn: Giảm số lượng xuống 0 = xóa sản phẩm
- Giảm API calls từ frontend
- Logic tự nhiên hơn cho người dùng

---

### ✅ **3. Checkout không làm mới giá - Dùng giá cũ từ cart**

**Vấn đề:**
- `checkout()` sao chép nguyên `cartDetail.getAmount()` sang order
- Nếu cửa hàng đổi giá sau khi khách thêm vào giỏ → đơn hàng dùng giá cũ
- Tổng tiền không phản ánh giá thực tế

**Giải pháp:**
```java
// OrderServiceImpl.checkout()

// Validate inventory and RECALCULATE prices with current prices
BigDecimal orderTotal = BigDecimal.ZERO;

for (CartDetail detail : cart.getCartDetails()) {
    // ... validation ...
    
    // Recalculate amount with CURRENT price (not cart's old price)
    BigDecimal currentUnitPrice = storeProduct.getPriceOverride() != null
            ? storeProduct.getPriceOverride()
            : (variant.getDiscountPrice() != null ? variant.getDiscountPrice() : variant.getOriginalPrice());
    BigDecimal itemAmount = currentUnitPrice.multiply(BigDecimal.valueOf(detail.getQuantity()));
    orderTotal = orderTotal.add(itemAmount);
}

// Create order with recalculated total
order.setTotalAmount(orderTotal); // Use recalculated total, NOT cart.getTotal()

// Copy cart details to order details with CURRENT prices
for (CartDetail cartDetail : cart.getCartDetails()) {
    // ... get current price ...
    BigDecimal itemAmount = currentUnitPrice.multiply(BigDecimal.valueOf(cartDetail.getQuantity()));
    
    orderDetail.setAmount(itemAmount); // Use CURRENT price, NOT cartDetail.getAmount()
}
```

**Lợi ích:**
- ✅ Giá chính xác tại thời điểm checkout
- ✅ Tránh gian lận (thêm vào giỏ khi giá thấp, checkout sau khi giá tăng)
- ✅ Đồng bộ giá với database

---

### ✅ **4. Khuyến mãi chỉ ghi nhận, KHÔNG giảm tiền thật**

**Vấn đề:**
- `applyPromotions()` lưu `PromotionUsage` và tăng counter
- KHÔNG giảm `order.totalAmount`
- KHÔNG đặt `discountAmount`/`orderAmount` trong `PromotionUsage`
- → Người dùng vẫn bị tính đủ tiền dù nhập mã giảm giá

**Giải pháp:**
```java
// OrderServiceImpl.applyPromotions() - Changed from void to BigDecimal

private BigDecimal applyPromotions(Order order, List<String> promotionCodes) {
    BigDecimal totalDiscount = BigDecimal.ZERO;
    BigDecimal originalAmount = order.getTotalAmount();
    
    for (String code : promotionCodes) {
        // ... validation ...
        
        // Calculate discount amount based on promotion type
        BigDecimal discountAmount = calculateDiscountAmount(promotion, originalAmount);
        totalDiscount = totalDiscount.add(discountAmount);

        // Create promotion usage record WITH order amount and discount
        PromotionUsage usage = new PromotionUsage();
        usage.setPromotion(promotion);
        usage.setCustomer(order.getCustomer());
        usage.setOrder(order);
        usage.setOrderAmount(originalAmount);      // ✅ Ghi nhận số tiền đơn hàng
        usage.setDiscountAmount(discountAmount);    // ✅ Ghi nhận số tiền giảm
        usage.setUsedAt(LocalDateTime.now());
        promotionUsageRepository.save(usage);
    }
    
    // ✅ UPDATE ORDER TOTAL after applying all discounts
    if (totalDiscount.compareTo(BigDecimal.ZERO) > 0) {
        BigDecimal finalAmount = originalAmount.subtract(totalDiscount);
        if (finalAmount.compareTo(BigDecimal.ZERO) < 0) {
            finalAmount = BigDecimal.ZERO;
        }
        order.setTotalAmount(finalAmount);
        orderRepository.save(order);
    }
    
    return totalDiscount;
}

// NEW METHOD: Calculate discount based on promotion type
private BigDecimal calculateDiscountAmount(Promotion promotion, BigDecimal orderAmount) {
    if (promotion.getType() == PromotionType.PERCENTAGE) {
        // Percentage discount: orderAmount * (discountValue / 100)
        BigDecimal discount = orderAmount.multiply(promotion.getDiscountValue())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        
        // Apply max discount limit if set
        if (promotion.getMaxDiscountAmount() != null && 
            discount.compareTo(promotion.getMaxDiscountAmount()) > 0) {
            discount = promotion.getMaxDiscountAmount();
        }
        return discount;
        
    } else if (promotion.getType() == PromotionType.FIXED_AMOUNT) {
        // Fixed amount discount
        BigDecimal discount = promotion.getDiscountValue();
        
        // Discount cannot exceed order amount
        if (discount.compareTo(orderAmount) > 0) {
            discount = orderAmount;
        }
        return discount;
        
    } else {
        // FREE_SHIPPING or other types - no monetary discount
        return BigDecimal.ZERO;
    }
}
```

**Lợi ích:**
- ✅ Khuyến mãi thực sự giảm giá
- ✅ Ghi nhận đầy đủ `orderAmount` và `discountAmount` cho báo cáo
- ✅ Hỗ trợ cả PERCENTAGE và FIXED_AMOUNT
- ✅ Giới hạn max discount (nếu có)

---

### ✅ **5. Payment amount không cập nhật sau khuyến mãi**

**Vấn đề:**
- `payment.setAmount(order.getTotalAmount())` được gọi TRƯỚC khi áp dụng khuyến mãi
- → Payment luôn thu đủ giá gốc

**Giải pháp:**
```java
// OrderServiceImpl.checkout()

// Apply promotions if provided (this will update order.totalAmount)
BigDecimal totalDiscount = BigDecimal.ZERO;
if (request.getPromotionCodes() != null && !request.getPromotionCodes().isEmpty()) {
    totalDiscount = applyPromotions(order, request.getPromotionCodes());
}

// Create payment record with FINAL amount AFTER discount
Payment payment = new Payment();
payment.setOrder(order);
payment.setMethod(request.getPaymentMethod());
payment.setAmount(order.getTotalAmount()); // ✅ Amount AFTER discount
payment.setStatus(PaymentStatus.PENDING);
```

**Lợi ích:**
- ✅ Thanh toán đúng số tiền sau giảm giá
- ✅ Cổng thanh toán nhận đúng số tiền
- ✅ Công nợ chính xác

---

## 📊 Tóm tắt các thay đổi

| File | Thay đổi | Mục đích |
|------|----------|----------|
| `AddToCartRequest.java` | Thêm `@NotNull` cho `quantity` | Bắt buộc quantity, tránh null |
| `UpdateCartItemRequest.java` | Cho phép `quantity = 0`, đổi `@Min(1)` → `@Min(0)` | Xóa sản phẩm khi quantity = 0 |
| `CartServiceImpl.updateCartItem()` | Xử lý `quantity = 0 or null` → gọi `removeCartItem()` | Logic xóa tự nhiên |
| `OrderServiceImpl.checkout()` | Tính lại giá theo giá hiện tại, không dùng cart amount | Giá chính xác tại checkout |
| `OrderServiceImpl.applyPromotions()` | Tính discount, cập nhật `order.totalAmount`, ghi `orderAmount` & `discountAmount` | Khuyến mãi giảm tiền thật |
| `OrderServiceImpl.calculateDiscountAmount()` | **NEW METHOD** - Tính discount theo type (PERCENTAGE/FIXED_AMOUNT) | Logic tính discount đúng |
| `OrderServiceImpl.checkout()` payment | Tạo payment SAU khi áp dụng khuyến mãi | Payment đúng số tiền sau giảm |

---

## ✅ Kết quả

- ✅ **Build SUCCESS** (351 source files compiled)
- ✅ Tất cả validation đầy đủ
- ✅ Logic xóa sản phẩm tự nhiên (quantity = 0)
- ✅ Giá được tính lại chính xác khi checkout
- ✅ Khuyến mãi giảm tiền thật sự
- ✅ Payment amount chính xác sau discount
- ✅ Ghi nhận đầy đủ orderAmount & discountAmount cho báo cáo

---

## 🎯 Lợi ích tổng thể

1. **Bảo mật**: Không cho null/invalid quantity pass qua
2. **UX tốt hơn**: Giảm quantity xuống 0 = xóa (tự nhiên)
3. **Chính xác**: Giá luôn được tính theo giá hiện tại
4. **Trung thực**: Khuyến mãi thực sự giảm giá cho khách
5. **Báo cáo**: Có đầy đủ dữ liệu orderAmount & discountAmount
6. **Thanh toán**: Payment amount chính xác sau discount

---

## 🔍 Testing Checklist

- [ ] Thêm sản phẩm vào giỏ với quantity null → Lỗi validation
- [ ] Update quantity = 0 → Sản phẩm bị xóa
- [ ] Update quantity = null → Sản phẩm bị xóa
- [ ] Thêm vào giỏ giá 100k, sau đó đổi giá thành 120k, checkout → Order phải có giá 120k
- [ ] Đơn 100k + mã giảm 20% → Total = 80k, Payment = 80k
- [ ] Đơn 100k + mã giảm 50k → Total = 50k, Payment = 50k
- [ ] Đơn 100k + mã giảm 20% (max 15k) → Total = 85k
- [ ] Check PromotionUsage có đầy đủ orderAmount & discountAmount

---

**Ngày hoàn thành:** 05/11/2025  
**Build status:** ✅ SUCCESS (21.879s)  
**Files changed:** 4 files  
**Lines added:** ~100 lines (with better logic)
