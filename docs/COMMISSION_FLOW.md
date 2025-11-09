# Luồng Nghiệp Vụ Hoa Hồng SaveFood Platform

## 📌 Tổng quan

SaveFood hoạt động như một **nền tảng trung gian** (marketplace) kết nối nhà cung cấp và khách hàng. Platform thu phí hoa hồng từ mỗi giao dịch.

## 💰 Cách tính tiền khi đơn hàng hoàn thành

### Khi khách hàng đặt đơn:
```
Tổng giá trị đơn hàng: 100,000 VNĐ
Tỷ lệ hoa hồng: 10%
```

### Phân chia tiền:
```
Hoa hồng Platform (SaveFood):  10,000 VNĐ  (100,000 × 10%)
Tiền nhà cung cấp nhận:        90,000 VNĐ  (100,000 - 10,000)
```

### Luồng xử lý trong code:

**File: `OrderServiceImpl.java` - Method `handleDeliveryCompletion()`**
```java
// Khi đơn hàng DELIVERED → Thêm tiền vào ví nhà cung cấp
walletService.addPendingBalance(
    supplierId,
    order,
    100_000,  // Tổng giá trị đơn
    "Doanh thu đơn hàng"
);
```

**File: `WalletServiceImpl.java` - Method `addPendingBalance()`**
```java
// Tính hoa hồng
BigDecimal commissionRate = 0.10;  // 10%
BigDecimal commissionAmount = 100_000 × 0.10 = 10_000 VNĐ
BigDecimal netAmount = 100_000 - 10_000 = 90_000 VNĐ

// Cộng vào ví nhà cung cấp
wallet.addPendingBalance(90_000);  // Nhà cung cấp nhận 90k

// Ghi nhận 2 transaction:
// 1. ORDER_COMPLETED: +90,000 VNĐ (tiền nhà cung cấp)
// 2. COMMISSION_FEE: -10,000 VNĐ (phí trừ vào nhà cung cấp)
```

## 🔄 Cách xử lý khi HỦY đơn hàng

### Trường hợp 1: Hủy TRƯỚC khi giao (PENDING/CONFIRMED/PREPARING)
- ✅ Không cần trừ ví (chưa cộng tiền vào)
- ✅ Chỉ hoàn tiền thanh toán cho khách (nếu có)
- ✅ Trả lại tồn kho

### Trường hợp 2: Hủy SAU khi giao (DELIVERED)
- ⚠️ **PHẢI trừ tiền từ ví nhà cung cấp**
- ⚠️ **PHẢI ghi nhận Platform mất tiền hoa hồng**

### Luồng xử lý trong code:

**File: `OrderServiceImpl.java` - Method `cancelOrder()` (ĐÃ SỬA)**
```java
// CRITICAL FIX: Khi hủy đơn đã DELIVERED
if (order.getStatus() == OrderStatus.DELIVERED || 
    (order.getStatus() == OrderStatus.SHIPPING && order.isBalanceReleased())) {
    
    // Trừ tiền từ ví nhà cung cấp
    walletService.refundOrder(supplierId, order, 100_000, isPending);
}
```

**File: `WalletServiceImpl.java` - Method `refundOrder()` (ĐÃ SỬA)**
```java
// Tính toán
BigDecimal commissionRate = 0.10;  // 10%
BigDecimal commissionAmount = 100_000 × 0.10 = 10_000 VNĐ
BigDecimal netAmount = 100_000 - 10_000 = 90_000 VNĐ

// 1. TRỪ tiền nhà cung cấp
wallet.refund(90_000, isPending);  // Trừ từ pending hoặc available
wallet.subtractEarnings(90_000);

// 2. Ghi transaction: ORDER_REFUND (-90,000 VNĐ)

// 3. Ghi nhận Platform mất hoa hồng
// Transaction: COMMISSION_REFUND (+10,000 VNĐ)
// Ý nghĩa: Platform hoàn lại 10k hoa hồng đã thu (Platform mất tiền)
```

## 📊 Ví dụ Transaction History

### Khi đơn hoàn thành:
```
┌─────────────────────────────────────────────────────────────────┐
│ Wallet của Supplier A                                           │
├─────────────────────────────────────────────────────────────────┤
│ [ORDER_COMPLETED] +90,000 VNĐ                                  │
│   "Doanh thu đơn #DH001 (Tổng: 100k, Phí: 10k)"              │
│                                                                 │
│ [COMMISSION_FEE] -10,000 VNĐ                                   │
│   "Phí hoa hồng 10% cho đơn #DH001"                           │
│                                                                 │
│ Pending Balance: 90,000 VNĐ                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Khi hủy đơn:
```
┌─────────────────────────────────────────────────────────────────┐
│ Wallet của Supplier A                                           │
├─────────────────────────────────────────────────────────────────┤
│ [ORDER_REFUND] -90,000 VNĐ                                     │
│   "Hoàn tiền đơn #DH001 bị hủy (từ số dư chờ xử lý)"         │
│   "Tổng: 100k, Hoàn: 90k"                                     │
│                                                                 │
│ [COMMISSION_REFUND] +10,000 VNĐ                                │
│   "Hoàn hoa hồng 10% cho đơn #DH001 bị hủy"                  │
│   "(Platform SaveFood mất 10,000 VNĐ)"                        │
│                                                                 │
│ Pending Balance: 0 VNĐ                                         │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Kết luận

### ✅ Logic đã sửa:

1. **Khi DELIVERED**: 
   - Nhà cung cấp nhận `netAmount` (sau trừ hoa hồng)
   - Platform thu `commission`
   - Ghi 2 transactions: `ORDER_COMPLETED` + `COMMISSION_FEE`

2. **Khi HỦY đơn đã delivered**:
   - Trừ `netAmount` từ ví nhà cung cấp
   - Ghi nhận Platform mất `commission`
   - Ghi 2 transactions: `ORDER_REFUND` + `COMMISSION_REFUND`

### 📝 Transaction Types mới:
- `COMMISSION_FEE`: Phí hoa hồng trừ từ nhà cung cấp (khi order completed)
- `COMMISSION_REFUND`: Hoàn hoa hồng khi hủy đơn (Platform mất tiền)

### 🔧 Files đã sửa:
1. ✅ `OrderServiceImpl.java` - Thêm logic trừ ví khi cancel delivered order
2. ✅ `WalletServiceImpl.java` - Thêm ghi nhận COMMISSION_REFUND
3. ✅ `TransactionType.java` - Thêm enum COMMISSION_REFUND

---

**Lưu ý**: Trong tương lai, nên tạo thêm entity `PlatformCommission` để track tổng hoa hồng platform thu được theo thời gian.
