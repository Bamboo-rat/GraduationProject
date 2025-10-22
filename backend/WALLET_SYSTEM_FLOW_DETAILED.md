# HỆ THỐNG VÍ TIỀN NHÀ CUNG CẤP - LUỒNG CHI TIẾT

## 📊 TỔNG QUAN

Hệ thống ví tiền quản lý doanh thu của nhà cung cấp với các tính năng:
- ✅ **Tự động trừ phí hoa hồng** cho admin khi đơn hàng hoàn thành
- ✅ **Giữ phí khi hoàn tiền** (admin không hoàn lại phí hoa hồng)
- ✅ **Tự động chuyển tiền** cuối ngày (pending → available)
- ✅ **Tự động rút tiền** cuối tháng (available → withdrawn)
- ✅ **Audit trail đầy đủ** với WalletTransaction

---

## 💰 VÍ DỤ CỤ THỂ: ĐƠN HÀNG 100,000 VND (PHÍ HOA HỒNG 5%)

### **Bước 1: Khách đặt hàng & Đơn hoàn thành**

**Input:**
- `orderTotal = 100,000 VND`
- `supplier.commissionRate = 5%`

**Tính toán:**
```java
commissionAmount = 100,000 * 0.05 = 5,000 VND  // Admin thu
netAmount = 100,000 - 5,000 = 95,000 VND       // Supplier nhận
```

**Cập nhật ví:**
```java
wallet.addPendingBalance(95,000)  // Thêm 95k vào pending
wallet.addEarnings(95,000)        // Cộng 95k vào earnings
```

**Trạng thái ví:**
| Field | Giá trị |
|-------|---------|
| `pendingBalance` | 95,000 |
| `availableBalance` | 0 |
| `totalEarnings` | 95,000 |
| `monthlyEarnings` | 95,000 |
| `totalWithdrawn` | 0 |
| `totalRefunded` | 0 |

**Transactions được tạo:**

1. **ORDER_COMPLETED**
   ```json
   {
     "transactionType": "ORDER_COMPLETED",
     "amount": 95000,
     "balanceAfter": 0,
     "pendingBalanceAfter": 95000,
     "description": "Thu nhập từ đơn hàng #ORD001 (Tổng: 100000 VND, Phí: 5000 VND)"
   }
   ```

2. **COMMISSION_FEE**
   ```json
   {
     "transactionType": "COMMISSION_FEE",
     "amount": -5000,
     "balanceAfter": 0,
     "pendingBalanceAfter": 95000,
     "description": "Phí hoa hồng 5% cho đơn hàng #ORD001"
   }
   ```

---

### **Bước 2: Cuối ngày (00:00) - Release Pending Balance**

**Job tự động chạy:**
```java
@Scheduled(cron = "0 0 0 * * *")
public void endOfDayRelease()
```

**Cập nhật:**
```java
wallet.releasePendingBalance(95,000)
// pendingBalance -= 95,000
// availableBalance += 95,000
```

**Trạng thái ví sau cuối ngày:**
| Field | Giá trị |
|-------|---------|
| `pendingBalance` | 0 |
| `availableBalance` | **95,000** ⬆️ |
| `totalEarnings` | 95,000 |
| `monthlyEarnings` | 95,000 |

**Transaction:**
```json
{
  "transactionType": "END_OF_DAY_RELEASE",
  "amount": 95000,
  "balanceAfter": 95000,
  "pendingBalanceAfter": 0,
  "description": "Chuyển số dư khả dụng cuối ngày 2025-01-22"
}
```

---

### **Bước 3: Cuối tháng (00:00 ngày 1) - Auto Withdrawal**

**Job tự động chạy:**
```java
@Scheduled(cron = "0 0 0 1 * *")
public void endOfMonthWithdrawal()
```

**Cập nhật:**
```java
wallet.autoWithdrawMonthly()
// totalWithdrawn += availableBalance
// availableBalance = 0

wallet.resetMonthlyEarnings()
// monthlyEarnings = 0
```

**Trạng thái ví sau cuối tháng:**
| Field | Giá trị |
|-------|---------|
| `pendingBalance` | 0 |
| `availableBalance` | 0 |
| `totalEarnings` | 95,000 |
| `monthlyEarnings` | **0** (reset) |
| `totalWithdrawn` | **95,000** ⬆️ |
| `lastWithdrawalDate` | 2025-02-01 00:00:00 |

**Transaction:**
```json
{
  "transactionType": "END_OF_MONTH_WITHDRAWAL",
  "amount": 95000,
  "balanceAfter": 0,
  "pendingBalanceAfter": 0,
  "description": "Rút tiền tự động cuối tháng 2025-01"
}
```

---

## 🔄 VÍ DỤ 2: HỦY ĐƠN TRƯỚC KHI CUỐI NGÀY

### **Bước 1: Đơn hoàn thành**
- `pendingBalance = 95,000`
- `totalEarnings = 95,000`

### **Bước 2: Khách hủy đơn (isPending = true)**

**Input:**
```java
refundOrder(supplierId, order, 100000, true)
```

**Tính toán:**
```java
// Tính lại commission để biết NET amount
commissionAmount = 100,000 * 0.05 = 5,000
netAmount = 100,000 - 5,000 = 95,000  // Số tiền đã cộng vào wallet
```

**Cập nhật:**
```java
wallet.refund(95000, true)        // Trừ từ pending
wallet.subtractEarnings(95000)    // Trừ earnings (QUAN TRỌNG!)
```

**Trạng thái ví sau hoàn tiền:**
| Field | Giá trị |
|-------|---------|
| `pendingBalance` | **0** (95k - 95k) |
| `availableBalance` | 0 |
| `totalEarnings` | **0** (95k - 95k) ✅ |
| `monthlyEarnings` | **0** (95k - 95k) ✅ |
| `totalRefunded` | 95,000 |

**Transaction:**
```json
{
  "transactionType": "ORDER_REFUND",
  "amount": -95000,
  "balanceAfter": 0,
  "pendingBalanceAfter": 0,
  "description": "Hoàn tiền đơn hàng #ORD001 (hủy trước khi giao) - Tổng: 100000 VND, Hoàn: 95000 VND"
}
```

**⚠️ LƯU Ý**: Admin giữ phí hoa hồng 5,000 VND (không hoàn lại)

---

## 🔄 VÍ DỤ 3: TRẢ HÀNG SAU KHI ĐÃ GIAO

### **Bước 1: Đơn hoàn thành**
- `pendingBalance = 95,000`
- `totalEarnings = 95,000`

### **Bước 2: Cuối ngày**
- `availableBalance = 95,000`
- `pendingBalance = 0`

### **Bước 3: Khách trả hàng (isPending = false)**

**Input:**
```java
refundOrder(supplierId, order, 100000, false)
```

**Cập nhật:**
```java
wallet.refund(95000, false)       // Trừ từ available
wallet.subtractEarnings(95000)    // Trừ earnings
```

**Trạng thái ví sau trả hàng:**
| Field | Giá trị |
|-------|---------|
| `pendingBalance` | 0 |
| `availableBalance` | **0** (95k - 95k) |
| `totalEarnings` | **0** (95k - 95k) ✅ |
| `monthlyEarnings` | **0** (95k - 95k) ✅ |
| `totalRefunded` | 95,000 |

**Transaction:**
```json
{
  "transactionType": "ORDER_REFUND",
  "amount": -95000,
  "balanceAfter": 0,
  "pendingBalanceAfter": 0,
  "description": "Hoàn tiền đơn hàng #ORD001 (trả hàng) - Tổng: 100000 VND, Hoàn: 95000 VND"
}
```

---

## 📈 VÍ DỤ 4: NHIỀU ĐƠN HÀNG TRONG THÁNG

| Ngày | Sự kiện | Pending | Available | Total Earnings | Monthly Earnings |
|------|---------|---------|-----------|----------------|------------------|
| 01/01 | Đơn #1: 100k (phí 5k) | 95k | 0 | 95k | 95k |
| 02/01 00:00 | Cuối ngày | 0 | 95k | 95k | 95k |
| 05/01 | Đơn #2: 200k (phí 10k) | 190k | 95k | 285k | 285k |
| 06/01 00:00 | Cuối ngày | 0 | 285k | 285k | 285k |
| 10/01 | Đơn #3: 150k (phí 7.5k) | 142.5k | 285k | 427.5k | 427.5k |
| 11/01 00:00 | Cuối ngày | 0 | 427.5k | 427.5k | 427.5k |
| 15/01 | Hủy đơn #3 (142.5k) | 0 | 285k | **285k** | **285k** |
| 01/02 00:00 | Cuối tháng + rút | 0 | 0 | 285k | **0** (reset) |

**Kết quả:**
- ✅ Tổng đơn hàng: 450,000 VND
- ✅ Phí hoa hồng (5%): 22,500 VND (admin thu)
- ✅ Hủy 1 đơn: 150,000 VND (admin giữ 7,500 phí)
- ✅ Nhà cung cấp nhận: 285,000 VND
- ✅ `totalEarnings` = 285k (chính xác!)

---

## 🔧 CODE IMPLEMENTATION

### **1. Entity: SupplierWallet.java**

```java
// Thêm vào pending (NET amount sau khi trừ phí)
public void addPendingBalance(BigDecimal amount) {
    this.pendingBalance = this.pendingBalance.add(amount);
}

// Tăng earnings
public void addEarnings(BigDecimal amount) {
    this.totalEarnings = this.totalEarnings.add(amount);
    this.monthlyEarnings = this.monthlyEarnings.add(amount);
}

// QUAN TRỌNG: Trừ earnings khi hoàn tiền
public void subtractEarnings(BigDecimal amount) {
    this.totalEarnings = this.totalEarnings.subtract(amount);
    this.monthlyEarnings = this.monthlyEarnings.subtract(amount);
}

// Hoàn tiền
public void refund(BigDecimal amount, boolean isPending) {
    if (isPending) {
        this.pendingBalance = this.pendingBalance.subtract(amount);
    } else {
        this.availableBalance = this.availableBalance.subtract(amount);
    }
    this.totalRefunded = this.totalRefunded.add(amount);
}

// Release pending → available
public void releasePendingBalance(BigDecimal amount) {
    this.pendingBalance = this.pendingBalance.subtract(amount);
    this.availableBalance = this.availableBalance.add(amount);
}

// Auto withdraw
public void autoWithdrawMonthly() {
    if (this.availableBalance.compareTo(BigDecimal.ZERO) > 0) {
        this.totalWithdrawn = this.totalWithdrawn.add(this.availableBalance);
        this.availableBalance = BigDecimal.ZERO;
        this.lastWithdrawalDate = LocalDateTime.now();
    }
}

// Reset monthly
public void resetMonthlyEarnings() {
    this.monthlyEarnings = BigDecimal.ZERO;
}
```

---

### **2. Service: WalletServiceImpl.java**

#### **Method: addPendingBalance()**

```java
@Transactional
public void addPendingBalance(String supplierId, Order order, BigDecimal amount, String description) {
    SupplierWallet wallet = getWalletBySupplierId(supplierId);
    Supplier supplier = wallet.getSupplier();

    // Tính phí hoa hồng
    BigDecimal commissionRate = BigDecimal.valueOf(supplier.getCommissionRate() / 100.0);
    BigDecimal commissionAmount = amount.multiply(commissionRate).setScale(2, ROUND_HALF_UP);
    BigDecimal netAmount = amount.subtract(commissionAmount);

    // Cộng NET amount vào wallet
    wallet.addPendingBalance(netAmount);
    wallet.addEarnings(netAmount);
    walletRepository.save(wallet);

    // Ghi 2 transactions: ORDER_COMPLETED + COMMISSION_FEE
    // ... (xem code ở trên)
}
```

#### **Method: refundOrder()**

```java
@Transactional
public void refundOrder(String supplierId, Order order, BigDecimal amount, boolean isPending) {
    SupplierWallet wallet = getWalletBySupplierId(supplierId);
    Supplier supplier = wallet.getSupplier();

    // Tính lại commission để biết NET amount
    BigDecimal commissionRate = BigDecimal.valueOf(supplier.getCommissionRate() / 100.0);
    BigDecimal commissionAmount = amount.multiply(commissionRate).setScale(2, ROUND_HALF_UP);
    BigDecimal netAmount = amount.subtract(commissionAmount);

    // Hoàn NET amount
    wallet.refund(netAmount, isPending);
    wallet.subtractEarnings(netAmount);  // QUAN TRỌNG!
    walletRepository.save(wallet);

    // Ghi transaction: ORDER_REFUND
    // ... (xem code ở trên)
}
```

#### **Scheduled Jobs**

```java
// Cuối ngày: Chuyển pending → available
@Scheduled(cron = "0 0 0 * * *")
@Transactional
public void endOfDayRelease() {
    List<SupplierWallet> wallets = walletRepository.findAllWithPendingBalance();
    for (SupplierWallet wallet : wallets) {
        BigDecimal pending = wallet.getPendingBalance();
        if (pending.compareTo(BigDecimal.ZERO) > 0) {
            wallet.releasePendingBalance(pending);
            // Save + create transaction
        }
    }
}

// Cuối tháng: Rút available + reset monthly
@Scheduled(cron = "0 0 0 1 * *")
@Transactional
public void endOfMonthWithdrawal() {
    List<SupplierWallet> wallets = walletRepository.findAllWithAvailableBalance();
    for (SupplierWallet wallet : wallets) {
        BigDecimal available = wallet.getAvailableBalance();
        if (available.compareTo(BigDecimal.ZERO) > 0) {
            wallet.autoWithdrawMonthly();
            // Save + create transaction
        }
        wallet.resetMonthlyEarnings();
        wallet.setCurrentMonth(YearMonth.now().toString());
    }
}
```

---

## ✅ CHECKLIST QUAN TRỌNG

### **Khi thêm tiền vào ví (addPendingBalance):**
- ✅ Tính commission từ `supplier.commissionRate`
- ✅ Trừ commission để ra NET amount
- ✅ Cộng NET amount vào `pendingBalance`
- ✅ Cộng NET amount vào `totalEarnings` và `monthlyEarnings`
- ✅ Tạo 2 transactions: ORDER_COMPLETED + COMMISSION_FEE

### **Khi hoàn tiền (refundOrder):**
- ✅ Tính lại commission để biết NET amount
- ✅ Gọi `wallet.refund(netAmount, isPending)`
- ✅ **BẮT BUỘC** gọi `wallet.subtractEarnings(netAmount)`
- ✅ Admin giữ phí hoa hồng (không hoàn lại)
- ✅ Tạo transaction ORDER_REFUND

### **Scheduled jobs:**
- ✅ End-of-day: Chạy 00:00 hàng ngày
- ✅ End-of-month: Chạy 00:00 ngày 1 hàng tháng
- ✅ Có error handling (try-catch cho từng wallet)
- ✅ Logging đầy đủ

---

## ❌ SAI LẦM THƯỜNG GẶP

### **1. Quên gọi subtractEarnings() khi refund**
```java
// ❌ SAI:
wallet.refund(amount, isPending);
// totalEarnings vẫn giữ nguyên → SAI!

// ✅ ĐÚNG:
wallet.refund(netAmount, isPending);
wallet.subtractEarnings(netAmount);  // Phải có dòng này!
```

### **2. Hoàn tiền full amount thay vì NET amount**
```java
// ❌ SAI: Hoàn cả 100k (không tính phí)
wallet.refund(100000, isPending);

// ✅ ĐÚNG: Chỉ hoàn NET 95k (đã trừ phí 5k)
BigDecimal netAmount = 100000 - (100000 * 0.05) = 95000;
wallet.refund(95000, isPending);
```

### **3. Không tạo transaction log**
```java
// ❌ SAI: Chỉ update wallet mà không ghi log
wallet.addPendingBalance(netAmount);
walletRepository.save(wallet);

// ✅ ĐÚNG: Phải tạo WalletTransaction
wallet.addPendingBalance(netAmount);
walletRepository.save(wallet);
transactionRepository.save(transaction);  // Ghi audit log
```

---

## 📊 QUERY HỮU ÍCH

### **1. Xem lịch sử giao dịch của supplier**
```sql
SELECT
    wt.transaction_type,
    wt.amount,
    wt.balance_after,
    wt.pending_balance_after,
    wt.description,
    wt.created_at
FROM wallet_transactions wt
JOIN supplier_wallets sw ON wt.wallet_id = sw.wallet_id
WHERE sw.supplier_id = 'supplier-uuid'
ORDER BY wt.created_at DESC;
```

### **2. Tổng phí hoa hồng admin thu trong tháng**
```sql
SELECT
    DATE_FORMAT(wt.created_at, '%Y-%m') AS month,
    SUM(ABS(wt.amount)) AS total_commission
FROM wallet_transactions wt
WHERE wt.transaction_type = 'COMMISSION_FEE'
GROUP BY month
ORDER BY month DESC;
```

### **3. Top suppliers theo doanh thu tháng**
```sql
SELECT
    u.username,
    s.business_name,
    sw.monthly_earnings,
    sw.current_month
FROM supplier_wallets sw
JOIN suppliers s ON sw.supplier_id = s.user_id
JOIN users u ON s.user_id = u.user_id
ORDER BY sw.monthly_earnings DESC
LIMIT 10;
```

---

## 🎯 KẾT LUẬN

Hệ thống ví tiền đã được thiết kế để:
1. ✅ **Tự động tính phí** hoa hồng cho admin
2. ✅ **Giữ earnings chính xác** ngay cả khi có hoàn tiền
3. ✅ **Tự động hóa** việc chuyển và rút tiền
4. ✅ **Audit trail đầy đủ** với mọi giao dịch
5. ✅ **Công bằng**: Admin giữ phí khi hoàn tiền (đã cung cấp dịch vụ)

**LƯU Ý**: Đây là flow **ĐÚNG** sau khi sửa. Code cũ có lỗi không gọi `subtractEarnings()` khi refund.
