# POINT TRANSACTION TRACKING IMPLEMENTATION

## 📋 Tổng quan

Đã triển khai hệ thống ghi log lịch sử tích điểm (Point Transaction Tracking) để lưu vết tất cả các giao dịch điểm của khách hàng, giúp:
- Theo dõi lịch sử tích điểm/tiêu điểm
- Audit trail đầy đủ
- Phân tích hành vi khách hàng
- Giải quyết tranh chấp về điểm

## 🎯 Vấn đề đã giải quyết

**Trước đây:**
```java
// TODO: Create PointTransaction record
// PointTransaction pointTransaction = new PointTransaction();
// pointTransaction.setCustomer(customer);
// pointTransaction.setType(PointTransactionType.ORDER_COMPLETION);
// pointTransaction.setPoints(pointsToAward.intValue());
// pointTransaction.setDescription("Hoàn thành đơn hàng " + order.getOrderCode());
// pointTransactionRepository.save(pointTransaction);
```

**Bây giờ:**
```java
// Create PointTransaction record for audit trail
PointTransaction pointTransaction = new PointTransaction();
pointTransaction.setCustomer(customer);
pointTransaction.setTransactionType(PointTransactionType.EARN);
pointTransaction.setPointsChange(pointsToAward.intValue());
pointTransaction.setReason("Hoàn thành đơn hàng #" + order.getOrderCode() + 
        " - Tích " + getPointsPercentage().multiply(new BigDecimal("100")).intValue() + "% giá trị đơn hàng");
pointTransactionRepository.save(pointTransaction);
```

## 🏗️ Kiến trúc

### 1. Entity: PointTransaction
```java
@Entity
@Table(name = "point_transactions")
public class PointTransaction {
    @Id
    private String transactionId;           // UUID
    
    private int pointsChange;               // +100 (earn) or -50 (spend)
    
    @Enumerated(EnumType.STRING)
    private PointTransactionType transactionType;
    
    private String reason;                  // "Hoàn thành đơn hàng #ORD123"
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    private Customer customer;
}
```

**Indexes:**
- `idx_point_customer` - Query by customer
- `idx_point_type` - Filter by transaction type
- `idx_point_created` - Sort by date
- `idx_point_customer_type` - Composite for better performance
- `idx_point_customer_created` - Composite for date range queries

### 2. Enum: PointTransactionType
```java
public enum PointTransactionType {
    EARN,           // Tích điểm (đặt hàng, hoạt động)
    REDEEM,         // Sử dụng điểm (đổi quà, giảm giá)
    EXPIRE,         // Hết hạn
    ADJUST,         // Điều chỉnh bởi admin
    BONUS           // Thưởng đặc biệt từ khuyến mãi
}
```

### 3. Repository: PointTransactionRepository
```java
public interface PointTransactionRepository extends JpaRepository<PointTransaction, String> {
    // Pagination support
    Page<PointTransaction> findByCustomerOrderByCreatedAtDesc(Customer customer, Pageable pageable);
    
    // Filter by type
    Page<PointTransaction> findByCustomerAndTransactionTypeOrderByCreatedAtDesc(
        Customer customer, PointTransactionType type, Pageable pageable);
    
    // Date range queries
    List<PointTransaction> findByCustomerAndDateRange(
        Customer customer, LocalDateTime startDate, LocalDateTime endDate);
    
    // Analytics queries
    int calculateTotalPointsEarned(Customer customer);
    int calculateTotalPointsSpent(Customer customer);
    List<Object[]> getPointsSummaryByType(Customer customer);
}
```

### 4. DTO: PointTransactionResponse
```java
@Data
@Builder
public class PointTransactionResponse {
    private String transactionId;
    private String customerId;
    private String customerName;
    private int pointsChange;                   // +100 or -50
    private String transactionType;             // "EARN"
    private String transactionTypeDisplay;      // "Tích điểm"
    private String reason;
    private LocalDateTime createdAt;
    private Integer balanceAfter;               // Balance after this transaction
}
```

## 💻 Implementation trong OrderServiceImpl

### Inject Repository
```java
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {
    // ... other repositories
    private final PointTransactionRepository pointTransactionRepository;
```

### handleDeliveryCompletion() Method
```java
private void handleDeliveryCompletion(Order order) {
    log.info("Handling delivery completion: orderId={}", order.getOrderId());

    // 1. Calculate points to award (using dynamic config)
    BigDecimal pointsToAward = order.getTotalAmount()
            .multiply(getPointsPercentage())
            .setScale(0, RoundingMode.HALF_UP);

    // 2. Update customer points
    Customer customer = order.getCustomer();
    customer.setPoints(customer.getPoints() + pointsToAward.intValue());
    customer.setLifetimePoints(customer.getLifetimePoints() + pointsToAward.intValue());
    customerRepository.save(customer);

    log.info("Awarded {} points to customer: customerId={}", pointsToAward, customer.getUserId());

    // 3. ✅ Create PointTransaction record for audit trail
    PointTransaction pointTransaction = new PointTransaction();
    pointTransaction.setCustomer(customer);
    pointTransaction.setTransactionType(PointTransactionType.EARN);
    pointTransaction.setPointsChange(pointsToAward.intValue());
    pointTransaction.setReason("Hoàn thành đơn hàng #" + order.getOrderCode() + 
            " - Tích " + getPointsPercentage().multiply(new BigDecimal("100")).intValue() + 
            "% giá trị đơn hàng");
    pointTransactionRepository.save(pointTransaction);

    log.info("Created point transaction record: transactionId={}, points={}", 
            pointTransaction.getTransactionId(), pointsToAward);

    // 4. Record supplier wallet pending balance
    walletService.addPendingBalance(
            order.getStore().getSupplier().getUserId(),
            order,
            order.getTotalAmount(),
            "Doanh thu đơn hàng " + order.getOrderCode()
    );

    log.info("Delivery completion handled successfully: orderId={}", order.getOrderId());
}
```

## 📊 Database Schema

```sql
CREATE TABLE IF NOT EXISTS point_transactions (
    transaction_id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL,
    points_change INT NOT NULL COMMENT 'Positive for earning, negative for spending',
    transaction_type VARCHAR(50) NOT NULL COMMENT 'EARN, REDEEM, EXPIRE, ADJUST, BONUS',
    reason VARCHAR(500) COMMENT 'Description of the transaction',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_point_transaction_customer 
        FOREIGN KEY (customer_id) REFERENCES customer(user_id) 
        ON DELETE CASCADE,
    
    INDEX idx_point_customer (customer_id),
    INDEX idx_point_type (transaction_type),
    INDEX idx_point_created (created_at),
    INDEX idx_point_customer_type (customer_id, transaction_type),
    INDEX idx_point_customer_created (customer_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 📝 Sample Data

### Example 1: Earn Points from Order
```json
{
  "transactionId": "abc123...",
  "customerId": "customer-001",
  "pointsChange": 500,
  "transactionType": "EARN",
  "reason": "Hoàn thành đơn hàng #ORD20250103001 - Tích 5% giá trị đơn hàng",
  "createdAt": "2025-01-03T14:30:00"
}
```

### Example 2: Redeem Points for Discount
```json
{
  "transactionId": "def456...",
  "customerId": "customer-001",
  "pointsChange": -200,
  "transactionType": "REDEEM",
  "reason": "Sử dụng 200 điểm để giảm 20,000 VNĐ cho đơn hàng #ORD20250103002",
  "createdAt": "2025-01-03T15:45:00"
}
```

### Example 3: Bonus Points from Promotion
```json
{
  "transactionId": "ghi789...",
  "customerId": "customer-001",
  "pointsChange": 100,
  "transactionType": "BONUS",
  "reason": "Thưởng 100 điểm từ khuyến mãi Tết Nguyên Đán 2025",
  "createdAt": "2025-01-10T00:00:00"
}
```

## 🔍 Query Examples

### 1. Get Customer Point History
```sql
SELECT * FROM point_transactions 
WHERE customer_id = 'customer-001' 
ORDER BY created_at DESC 
LIMIT 20;
```

### 2. Calculate Total Points Earned
```sql
SELECT SUM(points_change) as total_earned
FROM point_transactions 
WHERE customer_id = 'customer-001' 
AND points_change > 0;
```

### 3. Calculate Total Points Spent
```sql
SELECT SUM(ABS(points_change)) as total_spent
FROM point_transactions 
WHERE customer_id = 'customer-001' 
AND points_change < 0;
```

### 4. Get Points Summary by Type
```sql
SELECT 
    transaction_type,
    COUNT(*) as transaction_count,
    SUM(points_change) as total_points
FROM point_transactions 
WHERE customer_id = 'customer-001'
GROUP BY transaction_type;
```

### 5. Get Points Activity in Last 30 Days
```sql
SELECT 
    DATE(created_at) as date,
    SUM(points_change) as daily_points
FROM point_transactions 
WHERE customer_id = 'customer-001' 
AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## 🎯 Use Cases

### 1. Customer View - Points History
Customer có thể xem lịch sử điểm của mình:
```
Ngày           Loại giao dịch    Điểm      Lý do
=========================================================
03/01/2025     Tích điểm        +500      Hoàn thành đơn hàng #ORD123
03/01/2025     Sử dụng điểm     -200      Giảm giá đơn hàng #ORD124
02/01/2025     Tích điểm        +300      Hoàn thành đơn hàng #ORD122
01/01/2025     Thưởng           +100      Khuyến mãi Tết
31/12/2024     Tích điểm        +450      Hoàn thành đơn hàng #ORD121
```

### 2. Admin View - Customer Analytics
Admin có thể phân tích:
- Tổng điểm khách hàng đã tích được
- Tổng điểm đã sử dụng
- Điểm trung bình mỗi đơn hàng
- Xu hướng tích/tiêu điểm theo thời gian

### 3. Support - Dispute Resolution
Khi khách hàng khiếu nại về điểm:
1. Tra cứu lịch sử giao dịch
2. Xác minh từng giao dịch với đơn hàng
3. Giải thích rõ ràng cho khách hàng
4. Admin có thể điều chỉnh (ADJUST) nếu cần

## 🚀 Future Enhancements

### 1. Points Expiration System
```java
// Scheduled job to expire points after X days
@Scheduled(cron = "0 0 2 * * *") // Run at 2 AM daily
public void expireOldPoints() {
    LocalDateTime expiryDate = LocalDateTime.now().minusDays(365);
    List<PointTransaction> expiredTransactions = 
        pointTransactionRepository.findEarnTransactionsBeforeDate(expiryDate);
    
    for (PointTransaction transaction : expiredTransactions) {
        // Create negative transaction for expiry
        PointTransaction expiry = new PointTransaction();
        expiry.setCustomer(transaction.getCustomer());
        expiry.setTransactionType(PointTransactionType.EXPIRE);
        expiry.setPointsChange(-transaction.getPointsChange());
        expiry.setReason("Điểm hết hạn từ giao dịch " + transaction.getTransactionId());
        pointTransactionRepository.save(expiry);
    }
}
```

### 2. Points Balance Verification
```java
public void verifyPointsBalance(String customerId) {
    Customer customer = customerRepository.findById(customerId).orElseThrow();
    
    // Calculate from transactions
    int calculatedBalance = pointTransactionRepository
        .calculateNetPoints(customer);
    
    // Compare with customer.points
    if (calculatedBalance != customer.getPoints()) {
        log.warn("Points mismatch for customer {}: DB={}, Calculated={}", 
                customerId, customer.getPoints(), calculatedBalance);
        // Send alert to admin
    }
}
```

### 3. Customer API Endpoint
```java
@GetMapping("/api/customers/me/points/history")
public Page<PointTransactionResponse> getMyPointsHistory(
        Authentication auth,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String type) {
    
    String customerId = auth.getName();
    Customer customer = customerRepository.findById(customerId).orElseThrow();
    
    Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
    
    Page<PointTransaction> transactions;
    if (type != null) {
        PointTransactionType transactionType = PointTransactionType.valueOf(type);
        transactions = pointTransactionRepository
            .findByCustomerAndTransactionTypeOrderByCreatedAtDesc(customer, transactionType, pageable);
    } else {
        transactions = pointTransactionRepository
            .findByCustomerOrderByCreatedAtDesc(customer, pageable);
    }
    
    return transactions.map(this::mapToResponse);
}
```

### 4. Points Analytics Dashboard
Admin dashboard showing:
- Total points issued this month
- Total points redeemed this month
- Most active customers by points earned
- Points distribution chart
- Points expiration forecast

## ✅ Benefits

### Trước khi có Point Transaction Tracking
❌ Không có lịch sử giao dịch điểm  
❌ Không audit trail  
❌ Khó giải quyết tranh chấp  
❌ Không thể phân tích hành vi khách hàng  
❌ Không thể verify tính toán điểm  

### Sau khi có Point Transaction Tracking
✅ Lịch sử đầy đủ mọi giao dịch điểm  
✅ Audit trail chi tiết với timestamp  
✅ Giải quyết tranh chấp dễ dàng  
✅ Phân tích hành vi khách hàng  
✅ Verify tính toán điểm chính xác  
✅ Support nhiều loại giao dịch (EARN, REDEEM, BONUS, ADJUST, EXPIRE)  
✅ Query performance tốt với indexes  

## 📞 Support

**Logs Location:**
- `OrderServiceImpl.handleDeliveryCompletion()` - Points awarding
- `PointTransactionRepository` - All point transaction queries

**Troubleshooting:**
1. Check transaction records: `SELECT * FROM point_transactions WHERE customer_id = ?`
2. Verify balance: Compare `customer.points` with sum of `point_transactions.points_change`
3. Check logs for transaction creation
4. Verify foreign key constraints

**Contact:** Backend Development Team
