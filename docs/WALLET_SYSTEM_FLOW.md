# HỆ THỐNG VÍ TIỀN NHÀ CUNG CẤP - LUỒNG NGHIỆP VỤ

## 📋 MÔ TẢ TỔNG QUAN

Hệ thống ví tiền với luồng tự động hóa:
- **Đơn hàng hoàn thành**: Tiền vào `pendingBalance` (chưa được rút)
- **Cuối ngày**: Tự động chuyển `pendingBalance` → `availableBalance`
- **Cuối tháng**: Tự động chuyển `availableBalance` → `totalWithdrawn` (giả lập đã rút về ngân hàng)

Giúp đơn giản hóa nghiệp vụ, không cần mock data ngân hàng thật.

---

## 🏗️ CẤU TRÚC DỮ LIỆU

### 1. Bảng `supplier_wallets`

```sql
CREATE TABLE supplier_wallets (
    wallet_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    supplier_id BIGINT NOT NULL UNIQUE,
    
    -- Số dư các loại
    available_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,  -- Có thể rút (chờ cuối tháng)
    pending_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,    -- Đang chờ cuối ngày
    
    -- Thống kê tổng
    total_earnings DECIMAL(15,2) NOT NULL DEFAULT 0.00,     -- Tổng thu nhập từ trước đến nay
    total_withdrawn DECIMAL(15,2) NOT NULL DEFAULT 0.00,    -- Tổng đã rút (tự động cuối tháng)
    total_refunded DECIMAL(15,2) NOT NULL DEFAULT 0.00,     -- Tổng đã hoàn trả
    
    -- Thống kê tháng
    monthly_earnings DECIMAL(15,2) NOT NULL DEFAULT 0.00,   -- Thu nhập tháng này
    current_month VARCHAR(7),                                -- Format: 2025-01
    
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',           -- ACTIVE, SUSPENDED, FROZEN, CLOSED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_withdrawal_date TIMESTAMP,                          -- Lần rút gần nhất (cuối tháng)
    
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
    INDEX idx_wallet_supplier (supplier_id),
    INDEX idx_wallet_status (status),
    INDEX idx_wallet_balance (available_balance)
);
```

### 2. Bảng `wallet_transactions`

```sql
CREATE TABLE wallet_transactions (
    transaction_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    wallet_id BIGINT NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,           -- ORDER_COMPLETED, END_OF_DAY_RELEASE, END_OF_MONTH_WITHDRAWAL, ORDER_REFUND
    
    amount DECIMAL(15,2) NOT NULL,                  -- Số tiền giao dịch
    balance_after DECIMAL(15,2) NOT NULL,           -- availableBalance sau giao dịch
    pending_balance_after DECIMAL(15,2) NOT NULL,   -- pendingBalance sau giao dịch
    
    order_id BIGINT,                                -- Liên kết đến đơn hàng (nếu có)
    description TEXT,                               -- Mô tả giao dịch
    external_reference VARCHAR(255),                -- Mã tham chiếu ngoài (nếu có)
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (wallet_id) REFERENCES supplier_wallets(wallet_id),
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    INDEX idx_transaction_wallet (wallet_id),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_transaction_order (order_id),
    INDEX idx_transaction_date (created_at)
);
```

### 3. Enum TransactionType

```java
public enum TransactionType {
    ORDER_COMPLETED,            // Đơn hàng hoàn thành → pending
    END_OF_DAY_RELEASE,        // Cuối ngày: pending → available
    END_OF_MONTH_WITHDRAWAL,   // Cuối tháng: available → withdrawn
    ORDER_REFUND,              // Hoàn tiền khách hàng
    ADMIN_ADJUSTMENT,          // Admin điều chỉnh (nếu có lỗi)
    COMMISSION_FEE,            // Phí hoa hồng (nếu có)
    PENALTY_FEE                // Phí phạt (vi phạm chính sách)
}
```

---

## 🔄 LUỒNG NGHIỆP VỤ CHI TIẾT

### Luồng 1: Khách hàng đặt hàng → Hoàn thành đơn

#### Bước 1: Khách đặt hàng (Payment = COD hoặc đã thanh toán online)
```java
// Khi khách đặt hàng, tiền vào pending
wallet.addPendingBalance(orderAmount); // VD: 500,000 VND

// Tạo transaction log
WalletTransaction transaction = new WalletTransaction();
transaction.setTransactionType(TransactionType.ORDER_COMPLETED);
transaction.setAmount(orderAmount);
transaction.setBalanceAfter(wallet.getAvailableBalance());
transaction.setPendingBalanceAfter(wallet.getPendingBalance()); // Tăng lên
transaction.setOrderId(order.getId());
transaction.setDescription("Thu nhập từ đơn hàng #" + order.getOrderCode());
```

**Trạng thái ví sau đó:**
```
availableBalance: 0 VND (chưa thay đổi)
pendingBalance: 500,000 VND ↑
totalEarnings: 500,000 VND ↑
monthlyEarnings: 500,000 VND ↑
```

#### Bước 2: Cuối ngày (00:00 AM) - Job tự động chạy
```java
// Service chạy định kỳ cuối ngày
@Scheduled(cron = "0 0 0 * * *") // Chạy lúc 00:00 mỗi ngày
public void endOfDayRelease() {
    List<SupplierWallet> wallets = walletRepository.findAllWithPendingBalance();
    
    for (SupplierWallet wallet : wallets) {
        BigDecimal pendingAmount = wallet.getPendingBalance();
        
        if (pendingAmount.compareTo(BigDecimal.ZERO) > 0) {
            // Chuyển pending → available
            wallet.releasePendingBalance(pendingAmount);
            
            // Log transaction
            WalletTransaction transaction = new WalletTransaction();
            transaction.setTransactionType(TransactionType.END_OF_DAY_RELEASE);
            transaction.setAmount(pendingAmount);
            transaction.setBalanceAfter(wallet.getAvailableBalance());
            transaction.setPendingBalanceAfter(BigDecimal.ZERO);
            transaction.setDescription("Chuyển số dư khả dụng cuối ngày " + LocalDate.now());
            
            walletRepository.save(wallet);
            transactionRepository.save(transaction);
        }
    }
}
```

**Trạng thái ví sau cuối ngày:**
```
availableBalance: 500,000 VND ↑ (từ 0)
pendingBalance: 0 VND ↓ (về 0)
totalEarnings: 500,000 VND (không đổi)
monthlyEarnings: 500,000 VND (không đổi)
```

#### Bước 3: Cuối tháng (00:00 AM ngày 1) - Job tự động rút tiền
```java
@Scheduled(cron = "0 0 0 1 * *") // Chạy lúc 00:00 ngày 1 hàng tháng
public void endOfMonthWithdrawal() {
    List<SupplierWallet> wallets = walletRepository.findAllWithAvailableBalance();
    
    for (SupplierWallet wallet : wallets) {
        BigDecimal availableAmount = wallet.getAvailableBalance();
        
        if (availableAmount.compareTo(BigDecimal.ZERO) > 0) {
            // Giả lập rút về ngân hàng
            wallet.autoWithdrawMonthly();
            
            // Log transaction
            WalletTransaction transaction = new WalletTransaction();
            transaction.setTransactionType(TransactionType.END_OF_MONTH_WITHDRAWAL);
            transaction.setAmount(availableAmount);
            transaction.setBalanceAfter(BigDecimal.ZERO);
            transaction.setPendingBalanceAfter(wallet.getPendingBalance());
            transaction.setDescription("Rút tiền tự động cuối tháng " + YearMonth.now().minusMonths(1));
            
            walletRepository.save(wallet);
            transactionRepository.save(transaction);
        }
        
        // Reset thu nhập tháng về 0 cho tháng mới
        wallet.resetMonthlyEarnings();
        String newMonth = YearMonth.now().toString(); // 2025-02
        wallet.setCurrentMonth(newMonth);
        walletRepository.save(wallet);
    }
}
```

**Trạng thái ví sau cuối tháng:**
```
availableBalance: 0 VND ↓ (về 0)
pendingBalance: 0 VND (không đổi)
totalEarnings: 500,000 VND (không đổi)
totalWithdrawn: 500,000 VND ↑
monthlyEarnings: 0 VND ↓ (reset về 0)
currentMonth: "2025-02" (tháng mới)
```

---

### Luồng 2: Khách hàng hủy đơn

#### Trường hợp 1: Hủy đơn trước khi giao hàng (đơn chưa hoàn thành)
```java
// Tiền vẫn đang ở pending, chưa release
Order order = orderRepository.findById(orderId);
if (order.getStatus() == OrderStatus.PENDING || order.getStatus() == OrderStatus.PROCESSING) {
    BigDecimal refundAmount = order.getTotalAmount();
    
    // Trừ từ pending balance
    wallet.refund(refundAmount, true); // isPending = true
    
    // Log transaction
    WalletTransaction transaction = new WalletTransaction();
    transaction.setTransactionType(TransactionType.ORDER_REFUND);
    transaction.setAmount(refundAmount.negate()); // Số âm để biểu thị trừ tiền
    transaction.setBalanceAfter(wallet.getAvailableBalance());
    transaction.setPendingBalanceAfter(wallet.getPendingBalance()); // Giảm
    transaction.setOrderId(order.getId());
    transaction.setDescription("Hoàn tiền đơn hàng #" + order.getOrderCode() + " (hủy trước khi giao)");
    
    order.setStatus(OrderStatus.CANCELLED);
}
```

**Trạng thái ví:**
```
availableBalance: 0 VND (không đổi)
pendingBalance: 0 VND ↓ (trừ đi 500k)
totalEarnings: 0 VND ↓ (trừ đi 500k)
totalRefunded: 500,000 VND ↑
monthlyEarnings: 0 VND ↓ (trừ đi 500k)
```

#### Trường hợp 2: Khách trả hàng sau khi nhận (đã qua cuối ngày)
```java
// Tiền đã chuyển sang available balance
if (order.getStatus() == OrderStatus.DELIVERED) {
    BigDecimal refundAmount = order.getTotalAmount();
    
    // Trừ từ available balance
    wallet.refund(refundAmount, false); // isPending = false
    
    // Log transaction
    WalletTransaction transaction = new WalletTransaction();
    transaction.setTransactionType(TransactionType.ORDER_REFUND);
    transaction.setAmount(refundAmount.negate());
    transaction.setBalanceAfter(wallet.getAvailableBalance()); // Giảm
    transaction.setPendingBalanceAfter(wallet.getPendingBalance());
    transaction.setOrderId(order.getId());
    transaction.setDescription("Hoàn tiền đơn hàng #" + order.getOrderCode() + " (trả hàng)");
    
    order.setStatus(OrderStatus.RETURNED);
}
```

**Trạng thái ví:**
```
availableBalance: 0 VND ↓ (trừ đi 500k)
pendingBalance: 0 VND (không đổi)
totalEarnings: 0 VND ↓ (trừ đi 500k)
totalRefunded: 500,000 VND ↑
```

---

## 📊 KỊCHvBẢN MOCK DATA

### Kịch bản 1: Nhà cung cấp mới - Tuần đầu tiên

#### Ngày 1 (15/01/2025 - Thứ 2)
```sql
-- Đơn hàng #1: 500,000 VND (10:00 AM)
INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, balance_after, pending_balance_after, order_id, description, created_at)
VALUES (1, 'ORDER_COMPLETED', 500000, 0, 500000, 101, 'Thu nhập từ đơn hàng #ORD-101', '2025-01-15 10:00:00');

-- Đơn hàng #2: 750,000 VND (14:30 PM)
INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, balance_after, pending_balance_after, order_id, description, created_at)
VALUES (1, 'ORDER_COMPLETED', 750000, 0, 1250000, 102, 'Thu nhập từ đơn hàng #ORD-102', '2025-01-15 14:30:00');
```

**Cuối ngày 1 (00:00 AM ngày 16/01):**
```sql
-- Chuyển pending → available
INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, balance_after, pending_balance_after, description, created_at)
VALUES (1, 'END_OF_DAY_RELEASE', 1250000, 1250000, 0, 'Chuyển số dư khả dụng cuối ngày 15/01/2025', '2025-01-16 00:00:00');

-- Trạng thái ví:
UPDATE supplier_wallets SET
    available_balance = 1250000,
    pending_balance = 0,
    total_earnings = 1250000,
    monthly_earnings = 1250000
WHERE wallet_id = 1;
```

#### Ngày 2 (16/01/2025 - Thứ 3)
```sql
-- Đơn hàng #3: 1,200,000 VND
INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, balance_after, pending_balance_after, order_id, description, created_at)
VALUES (1, 'ORDER_COMPLETED', 1200000, 1250000, 1200000, 103, 'Thu nhập từ đơn hàng #ORD-103', '2025-01-16 11:00:00');
```

**Cuối ngày 2 (00:00 AM ngày 17/01):**
```sql
INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, balance_after, pending_balance_after, description, created_at)
VALUES (1, 'END_OF_DAY_RELEASE', 1200000, 2450000, 0, 'Chuyển số dư khả dụng cuối ngày 16/01/2025', '2025-01-17 00:00:00');

UPDATE supplier_wallets SET
    available_balance = 2450000,  -- 1,250k + 1,200k
    pending_balance = 0,
    total_earnings = 2450000,
    monthly_earnings = 2450000
WHERE wallet_id = 1;
```

#### Ngày 3 (17/01/2025 - Thứ 4) - Có hủy đơn
```sql
-- Đơn hàng #4: 600,000 VND
INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, balance_after, pending_balance_after, order_id, description, created_at)
VALUES (1, 'ORDER_COMPLETED', 600000, 2450000, 600000, 104, 'Thu nhập từ đơn hàng #ORD-104', '2025-01-17 09:00:00');

-- Khách hủy đơn #4 (15:00 PM - chưa qua cuối ngày)
INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, balance_after, pending_balance_after, order_id, description, created_at)
VALUES (1, 'ORDER_REFUND', -600000, 2450000, 0, 104, 'Hoàn tiền đơn hàng #ORD-104 (hủy trước khi giao)', '2025-01-17 15:00:00');

UPDATE supplier_wallets SET
    pending_balance = 0,
    total_refunded = 600000
WHERE wallet_id = 1;
```

**Cuối ngày 3:** Không có pending nào → không release

#### Ngày 31 (31/01/2025) - Cuối tháng
```sql
-- Đơn hàng thêm trong tháng... (giả sử tổng available = 5,000,000 VND)

-- Cuối tháng: Rút tự động
INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, balance_after, pending_balance_after, description, created_at)
VALUES (1, 'END_OF_MONTH_WITHDRAWAL', 5000000, 0, 0, 'Rút tiền tự động cuối tháng 01/2025', '2025-02-01 00:00:00');

UPDATE supplier_wallets SET
    available_balance = 0,
    pending_balance = 0,
    total_withdrawn = 5000000,
    monthly_earnings = 0,          -- Reset về 0
    current_month = '2025-02',     -- Tháng mới
    last_withdrawal_date = '2025-02-01 00:00:00'
WHERE wallet_id = 1;
```

---

### Kịch bản 2: Khách trả hàng sau khi nhận

#### Tháng 1
```sql
-- Ngày 10/01: Đơn hàng hoàn thành
INSERT INTO wallet_transactions VALUES (1, 'ORDER_COMPLETED', 800000, 0, 800000, 201, '...', '2025-01-10 10:00:00');

-- Cuối ngày 10/01: Release
INSERT INTO wallet_transactions VALUES (1, 'END_OF_DAY_RELEASE', 800000, 800000, 0, NULL, '...', '2025-01-11 00:00:00');
```

#### Tháng 2
```sql
-- Ngày 5/02: Khách trả hàng (đã nhận từ 10/01)
INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, balance_after, pending_balance_after, order_id, description, created_at)
VALUES (1, 'ORDER_REFUND', -800000, 0, 0, 201, 'Hoàn tiền đơn hàng #ORD-201 (trả hàng)', '2025-02-05 14:00:00');

UPDATE supplier_wallets SET
    available_balance = 0,        -- Trừ từ available (đã qua cuối tháng 1 có thể đã rút)
    total_refunded = 800000,
    total_earnings = -800000      -- Trừ khỏi tổng thu nhập
WHERE wallet_id = 1;
```

**Lưu ý:** Nếu tiền đã được rút cuối tháng 1, available = 0 → **Không thể hoàn tiền!**  
→ Cần xử lý: Cho phép `availableBalance` âm hoặc yêu cầu nhà cung cấp nạp tiền lại.

---

## 📈 QUERY BÁO CÁO

### 1. Tổng thu nhập của nhà cung cấp theo tháng
```sql
SELECT 
    s.supplier_id,
    s.store_name,
    sw.monthly_earnings AS earnings_this_month,
    sw.total_earnings AS total_all_time,
    sw.total_withdrawn AS total_withdrawn,
    sw.available_balance AS current_balance,
    sw.pending_balance AS pending_balance
FROM suppliers s
JOIN supplier_wallets sw ON s.supplier_id = sw.supplier_id
WHERE sw.current_month = '2025-01'
ORDER BY sw.monthly_earnings DESC;
```

### 2. Lịch sử giao dịch theo loại
```sql
SELECT 
    wt.transaction_type,
    COUNT(*) AS transaction_count,
    SUM(wt.amount) AS total_amount
FROM wallet_transactions wt
WHERE wt.wallet_id = 1
  AND wt.created_at >= '2025-01-01'
  AND wt.created_at < '2025-02-01'
GROUP BY wt.transaction_type
ORDER BY total_amount DESC;
```

### 3. Top nhà cung cấp có thu nhập cao nhất tháng này
```sql
SELECT 
    s.supplier_id,
    s.store_name,
    sw.monthly_earnings,
    COUNT(DISTINCT o.order_id) AS order_count,
    AVG(o.total_amount) AS avg_order_value
FROM suppliers s
JOIN supplier_wallets sw ON s.supplier_id = sw.supplier_id
LEFT JOIN orders o ON s.supplier_id = o.supplier_id 
    AND o.created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
WHERE sw.current_month = DATE_FORMAT(NOW(), '%Y-%m')
GROUP BY s.supplier_id
ORDER BY sw.monthly_earnings DESC
LIMIT 10;
```

### 4. Tỷ lệ hoàn trả (refund rate)
```sql
SELECT 
    s.supplier_id,
    s.store_name,
    sw.total_earnings,
    sw.total_refunded,
    ROUND((sw.total_refunded / NULLIF(sw.total_earnings, 0)) * 100, 2) AS refund_rate_percent
FROM suppliers s
JOIN supplier_wallets sw ON s.supplier_id = sw.supplier_id
WHERE sw.total_earnings > 0
ORDER BY refund_rate_percent DESC;
```

### 5. Timeline giao dịch của 1 nhà cung cấp
```sql
SELECT 
    wt.transaction_id,
    wt.transaction_type,
    wt.amount,
    wt.balance_after AS available_after,
    wt.pending_balance_after AS pending_after,
    o.order_code,
    wt.description,
    wt.created_at
FROM wallet_transactions wt
LEFT JOIN orders o ON wt.order_id = o.order_id
WHERE wt.wallet_id = 1
ORDER BY wt.created_at DESC
LIMIT 50;
```

---

## 🔧 SCHEDULED JOBS (Spring Boot)

### Job 1: End of Day Release
```java
@Service
public class WalletScheduledService {
    
    @Autowired
    private SupplierWalletRepository walletRepository;
    
    @Autowired
    private WalletTransactionRepository transactionRepository;
    
    /**
     * Chạy lúc 00:00 mỗi ngày
     * Chuyển pending → available
     */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void endOfDayRelease() {
        LocalDate today = LocalDate.now();
        log.info("Starting End-of-Day Release for date: {}", today.minusDays(1));
        
        List<SupplierWallet> wallets = walletRepository.findAllByPendingBalanceGreaterThan(BigDecimal.ZERO);
        
        for (SupplierWallet wallet : wallets) {
            BigDecimal pendingAmount = wallet.getPendingBalance();
            
            // Chuyển pending → available
            wallet.releasePendingBalance(pendingAmount);
            
            // Log transaction
            WalletTransaction transaction = WalletTransaction.builder()
                .wallet(wallet)
                .transactionType(TransactionType.END_OF_DAY_RELEASE)
                .amount(pendingAmount)
                .balanceAfter(wallet.getAvailableBalance())
                .pendingBalanceAfter(BigDecimal.ZERO)
                .description("Chuyển số dư khả dụng cuối ngày " + today.minusDays(1))
                .build();
            
            transactionRepository.save(transaction);
            walletRepository.save(wallet);
            
            log.info("Released {} VND for wallet ID: {}", pendingAmount, wallet.getWalletId());
        }
        
        log.info("End-of-Day Release completed. Total wallets processed: {}", wallets.size());
    }
    
    /**
     * Chạy lúc 00:00 ngày 1 hàng tháng
     * Rút tự động available → withdrawn và reset monthly earnings
     */
    @Scheduled(cron = "0 0 0 1 * *")
    @Transactional
    public void endOfMonthWithdrawal() {
        YearMonth lastMonth = YearMonth.now().minusMonths(1);
        log.info("Starting End-of-Month Withdrawal for month: {}", lastMonth);
        
        List<SupplierWallet> wallets = walletRepository.findAllByAvailableBalanceGreaterThan(BigDecimal.ZERO);
        
        for (SupplierWallet wallet : wallets) {
            BigDecimal availableAmount = wallet.getAvailableBalance();
            
            // Rút tự động
            wallet.autoWithdrawMonthly();
            
            // Log transaction
            WalletTransaction transaction = WalletTransaction.builder()
                .wallet(wallet)
                .transactionType(TransactionType.END_OF_MONTH_WITHDRAWAL)
                .amount(availableAmount)
                .balanceAfter(BigDecimal.ZERO)
                .pendingBalanceAfter(wallet.getPendingBalance())
                .description("Rút tiền tự động cuối tháng " + lastMonth)
                .build();
            
            transactionRepository.save(transaction);
            
            // Reset monthly earnings
            wallet.resetMonthlyEarnings();
            wallet.setCurrentMonth(YearMonth.now().toString());
            
            walletRepository.save(wallet);
            
            log.info("Withdrew {} VND for wallet ID: {}", availableAmount, wallet.getWalletId());
        }
        
        log.info("End-of-Month Withdrawal completed. Total wallets processed: {}", wallets.size());
    }
}
```

---

## 📱 API ENDPOINTS (Gợi ý)

### 1. Xem thông tin ví (Supplier)
```http
GET /api/supplier/wallet
Authorization: Bearer {token}

Response:
{
  "walletId": 1,
  "availableBalance": 2450000,
  "pendingBalance": 0,
  "totalEarnings": 5000000,
  "totalWithdrawn": 2550000,
  "totalRefunded": 0,
  "monthlyEarnings": 2450000,
  "currentMonth": "2025-01",
  "status": "ACTIVE",
  "lastWithdrawalDate": "2025-01-01T00:00:00"
}
```

### 2. Lịch sử giao dịch (Supplier)
```http
GET /api/supplier/wallet/transactions?page=0&size=20&type=ORDER_COMPLETED

Response:
{
  "content": [
    {
      "transactionId": 156,
      "transactionType": "ORDER_COMPLETED",
      "amount": 500000,
      "balanceAfter": 0,
      "pendingBalanceAfter": 500000,
      "orderId": 101,
      "orderCode": "ORD-101",
      "description": "Thu nhập từ đơn hàng #ORD-101",
      "createdAt": "2025-01-15T10:00:00"
    }
  ],
  "totalElements": 50,
  "totalPages": 3
}
```

### 3. Thống kê thu nhập (Supplier)
```http
GET /api/supplier/wallet/earnings-summary?year=2025&month=1

Response:
{
  "month": "2025-01",
  "totalOrders": 25,
  "totalEarnings": 5000000,
  "totalRefunded": 600000,
  "netEarnings": 4400000,
  "averageOrderValue": 200000,
  "withdrawnAmount": 0,
  "availableToWithdraw": 4400000,
  "topSellingProducts": [...]
}
```

### 4. Admin: Xem tổng quan hệ thống
```http
GET /api/admin/wallets/overview

Response:
{
  "totalSuppliers": 150,
  "totalAvailableBalance": 125000000,
  "totalPendingBalance": 35000000,
  "totalWithdrawnThisMonth": 85000000,
  "totalEarningsThisMonth": 245000000,
  "averageEarningsPerSupplier": 1633333
}
```

---

## ✅ CHECKLIST IMPLEMENTATION

### Backend
- [ ] Tạo entity `SupplierWallet` với các helper methods
- [ ] Tạo entity `WalletTransaction` với index
- [ ] Tạo enum `TransactionType`, `WalletStatus`
- [ ] Tạo repository `SupplierWalletRepository`, `WalletTransactionRepository`
- [ ] Service `WalletService`: Xử lý logic nghiệp vụ
- [ ] Service `WalletScheduledService`: 2 scheduled jobs (cuối ngày, cuối tháng)
- [ ] Controller: API endpoints cho supplier và admin
- [ ] Migration script: Tạo bảng, migrate data cũ
- [ ] Unit test cho wallet balance calculations
- [ ] Integration test cho scheduled jobs

### Frontend (Supplier Portal)
- [ ] Dashboard: Hiển thị ví (available, pending, total)
- [ ] Transaction history page với filter
- [ ] Monthly earnings chart
- [ ] Notifications khi tiền được release/withdrawn

### Frontend (Admin Portal)
- [ ] Wallet overview dashboard
- [ ] Supplier wallet management
- [ ] Transaction monitoring
- [ ] Manual adjustment (nếu cần)

---

## 🎯 LỢI ÍCH CỦA LUỒNG MỚI

✅ **Đơn giản hóa nghiệp vụ**: Không cần mock data ngân hàng thật  
✅ **Tự động hóa hoàn toàn**: Không cần nhà cung cấp yêu cầu rút tiền  
✅ **Minh bạch**: Nhà cung cấp thấy rõ tiền pending → available → withdrawn  
✅ **Dễ báo cáo**: Có `monthlyEarnings` và `totalWithdrawn` để thống kê  
✅ **An toàn**: Tiền chỉ chuyển sau khi đơn hàng hoàn thành 1 ngày (tránh fraud)  
✅ **Dễ test**: Có thể chạy manual scheduled job để test  

---

## 📝 GHI CHÚ QUAN TRỌNG

1. **Pending Balance Purpose**: Giữ tiền trong 1 ngày để xử lý tranh chấp/hoàn trả nhanh
2. **Available Balance Purpose**: Tiền đã "an toàn", sẽ tự động rút cuối tháng
3. **Total Withdrawn**: Tổng tiền giả lập đã chuyển về ngân hàng (không cần bank API thật)
4. **Monthly Earnings**: Reset về 0 mỗi tháng để dễ báo cáo tháng hiện tại

**Lưu ý về timezone**: Tất cả scheduled job chạy theo server timezone. Đảm bảo cấu hình đúng timezone trong Spring Boot.

**Backup plan**: Nếu cần rút tiền thật trong tương lai, chỉ cần:
- Bỏ auto-withdrawal job
- Thêm `WithdrawalRequest` entity
- Thêm API "Request Withdrawal" cho supplier
- Admin approve → Chuyển available → withdrawn
