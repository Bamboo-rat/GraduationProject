# FavoriteStore Metrics Update Feature

## Tổng quan
Tự động cập nhật metrics của FavoriteStore (cửa hàng yêu thích) khi khách hàng hoàn thành đơn hàng.

## Mục đích
- Theo dõi số lần khách hàng đặt hàng ở cửa hàng yêu thích
- Ghi nhận thời điểm đặt hàng gần nhất
- Hỗ trợ sắp xếp danh sách yêu thích theo tần suất đặt hàng
- Cung cấp thông tin để đề xuất cửa hàng thường xuyên

## Metrics được cập nhật

### 1. Order Count (Số đơn đã đặt)
- **Field**: `orderCount` (Integer)
- **Action**: Tăng thêm 1 mỗi khi đơn hàng được giao thành công
- **Initial value**: 0

### 2. Last Order Date (Lần cuối đặt hàng)
- **Field**: `lastOrderDate` (LocalDateTime)
- **Action**: Cập nhật thời gian hiện tại khi đơn hàng được giao
- **Initial value**: null

## Khi nào metrics được cập nhật?

### Trigger Point: `handleDeliveryCompletion()`
Metrics được cập nhật trong method `handleDeliveryCompletion()` của OrderServiceImpl, được gọi khi:

1. **markAsDelivered()**: Admin/Supplier đánh dấu đơn hàng đã giao
2. **updateOrderStatus()**: Cập nhật status = DELIVERED
3. **Auto-delivery confirmation**: Hệ thống tự động xác nhận giao hàng

### Flow:
```
Order status → DELIVERED
    ↓
handleDeliveryCompletion()
    ↓
1. Award bonus points
2. Create point transaction
3. Add wallet pending balance
4. Update FavoriteStore metrics ← NEW
```

## Implementation

### Entity: FavoriteStore
```java
@Entity
@Table(name = "favorite_stores")
public class FavoriteStore {
    @Id
    private String favoriteId;
    
    @ManyToOne
    private Customer customer;
    
    @ManyToOne
    private Store store;
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    // Metrics fields
    @Column(nullable = false)
    private Integer orderCount = 0;     // ← Updated on delivery
    
    private LocalDateTime lastOrderDate; // ← Updated on delivery
}
```

### OrderServiceImpl
```java
@Service
public class OrderServiceImpl implements OrderService {
    private final FavoriteStoreRepository favoriteStoreRepository;
    
    private void handleDeliveryCompletion(Order order) {
        // ... existing logic (points, wallet, etc.)
        
        // Update FavoriteStore metrics
        updateFavoriteStoreMetrics(
            order.getCustomer().getUserId(), 
            order.getStore().getStoreId()
        );
    }
    
    private void updateFavoriteStoreMetrics(String customerId, String storeId) {
        try {
            favoriteStoreRepository
                .findByCustomerIdAndStoreId(customerId, storeId)
                .ifPresent(favoriteStore -> {
                    favoriteStore.setOrderCount(favoriteStore.getOrderCount() + 1);
                    favoriteStore.setLastOrderDate(LocalDateTime.now());
                    favoriteStoreRepository.save(favoriteStore);
                    
                    log.info("Updated FavoriteStore metrics: customerId={}, storeId={}, orderCount={}", 
                        customerId, storeId, favoriteStore.getOrderCount());
                });
        } catch (Exception e) {
            // Don't fail order delivery if metrics update fails
            log.error("Failed to update FavoriteStore metrics", e);
        }
    }
}
```

## Behavior Details

### Case 1: Store is favorited
```
Customer A has Store X in favorites
Order #123 from Store X → DELIVERED

Result:
- favoriteStore.orderCount: 5 → 6
- favoriteStore.lastOrderDate: null → 2025-11-03 10:30:00
- Log: "Updated FavoriteStore metrics: customerId=A, storeId=X, orderCount=6"
```

### Case 2: Store is NOT favorited
```
Customer A does NOT have Store Y in favorites
Order #124 from Store Y → DELIVERED

Result:
- No FavoriteStore record exists
- findByCustomerIdAndStoreId() returns empty
- ifPresent() not executed
- No update, no error
```

### Case 3: Update fails
```
Database error during FavoriteStore update

Result:
- Exception caught in try-catch
- Order delivery still succeeds
- Error logged but not thrown
- Points, wallet still processed correctly
```

## Error Handling

### Non-blocking Design
```java
try {
    // Update FavoriteStore metrics
} catch (Exception e) {
    // Log error but don't throw
    // Order completion continues
}
```

**Why non-blocking?**
- FavoriteStore metrics are **supplementary data**
- Order delivery is the **primary operation**
- Metrics failure should NOT block customer from getting points/wallet updates
- Can be recalculated later if needed

## Use Cases

### 1. Sort favorites by frequency
```sql
SELECT * FROM favorite_stores 
WHERE customer_id = ? 
ORDER BY order_count DESC, last_order_date DESC;
```

### 2. Show "Often ordered" badge
```java
if (favoriteStore.getOrderCount() >= 5) {
    badge = "⭐ Thường đặt";
}
```

### 3. Suggest frequent stores
```java
List<FavoriteStore> frequentStores = favoriteStoreRepository
    .findMostOrderedByCustomerId(customerId, PageRequest.of(0, 5));
```

### 4. Identify inactive favorites
```java
// Haven't ordered in 30 days
LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
if (favoriteStore.getLastOrderDate().isBefore(thirtyDaysAgo)) {
    showReactivationPromotion();
}
```

## Database Schema

### Table: favorite_stores
```sql
CREATE TABLE favorite_stores (
    favorite_id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL,
    store_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    order_count INT NOT NULL DEFAULT 0,           -- Incremented on delivery
    last_order_date TIMESTAMP NULL,               -- Updated on delivery
    
    UNIQUE KEY uk_customer_store (customer_id, store_id),
    INDEX idx_favorite_customer (customer_id),
    INDEX idx_favorite_store (store_id),
    INDEX idx_order_count (order_count),          -- For sorting by frequency
    INDEX idx_last_order_date (last_order_date),  -- For filtering inactive
    
    FOREIGN KEY (customer_id) REFERENCES customers(user_id),
    FOREIGN KEY (store_id) REFERENCES stores(store_id)
);
```

## API Impact

### Existing endpoints now return updated metrics:

#### GET /api/favorite-stores
```json
{
  "content": [
    {
      "favoriteId": "fav-123",
      "storeId": "store-456",
      "storeName": "Cửa hàng ABC",
      "createdAt": "2025-10-01T10:00:00",
      "orderCount": 12,                    // ← Updated automatically
      "lastOrderDate": "2025-11-03T10:30:00" // ← Updated automatically
    }
  ]
}
```

#### GET /api/favorite-stores/most-ordered
```json
{
  "content": [
    {
      "favoriteId": "fav-789",
      "storeName": "Cửa hàng XYZ",
      "orderCount": 25,           // Sorted by this field
      "lastOrderDate": "2025-11-02T15:00:00"
    },
    {
      "favoriteId": "fav-123",
      "storeName": "Cửa hàng ABC",
      "orderCount": 12,
      "lastOrderDate": "2025-11-03T10:30:00"
    }
  ]
}
```

## Logging

### Success Log
```
INFO: Updated FavoriteStore metrics: customerId=CUST123, storeId=STORE456, orderCount=8
```

### Error Log
```
ERROR: Failed to update FavoriteStore metrics: customerId=CUST123, storeId=STORE456
java.sql.SQLException: Connection timeout
```

### Delivery Completion Log
```
INFO: Handling delivery completion: orderId=ORD123
INFO: Awarded 5000 points to customer: customerId=CUST123
INFO: Created point transaction record: transactionId=TX789, points=5000
INFO: Updated FavoriteStore metrics: customerId=CUST123, storeId=STORE456, orderCount=3
INFO: Delivery completion handled successfully: orderId=ORD123
```

## Testing Scenarios

### Test 1: Normal update
```java
// Given
FavoriteStore favorite = createFavorite(customer, store);
favorite.setOrderCount(5);

// When
Order order = createOrder(customer, store);
orderService.markAsDelivered(order.getOrderId());

// Then
FavoriteStore updated = favoriteStoreRepository.findById(favorite.getId()).get();
assertEquals(6, updated.getOrderCount());
assertNotNull(updated.getLastOrderDate());
```

### Test 2: Store not favorited
```java
// Given
Customer customer = createCustomer();
Store store = createStore();
// No FavoriteStore record

// When
Order order = createOrder(customer, store);
orderService.markAsDelivered(order.getOrderId());

// Then
// No exception thrown
// Order delivery successful
verify(favoriteStoreRepository, never()).save(any());
```

### Test 3: Update fails gracefully
```java
// Given
when(favoriteStoreRepository.save(any()))
    .thenThrow(new RuntimeException("DB error"));

// When
Order order = createOrder(customer, store);
orderService.markAsDelivered(order.getOrderId());

// Then
// No exception propagated
// Points still awarded
// Wallet still updated
```

## Performance Considerations

### Query Optimization
- Uses `findByCustomerIdAndStoreId()` with index on (customer_id, store_id)
- Single query, no N+1 problem
- Optional.ifPresent() prevents unnecessary saves

### Transaction Boundary
- Runs within same transaction as order completion
- Rollback if order update fails → metrics not updated
- Commit together → data consistency guaranteed

### Async Alternative (Future Enhancement)
```java
@Async
public void updateFavoriteStoreMetricsAsync(String customerId, String storeId) {
    // Update in background thread
    // Don't block order completion
}
```

## Monitoring & Alerts

### Metrics to track:
1. **Update success rate**: Should be ~100%
2. **Update duration**: Should be <50ms
3. **Error frequency**: Should be <0.1%

### Alert conditions:
- Error rate > 1% → Check database connection
- Update duration > 100ms → Check index performance
- Inconsistent counts → Run reconciliation job

## Data Reconciliation

### Recalculate metrics (if needed)
```sql
UPDATE favorite_stores fs
SET 
    order_count = (
        SELECT COUNT(*) 
        FROM orders o 
        WHERE o.customer_id = fs.customer_id 
        AND o.store_id = fs.store_id 
        AND o.status = 'DELIVERED'
    ),
    last_order_date = (
        SELECT MAX(o.updated_at) 
        FROM orders o 
        WHERE o.customer_id = fs.customer_id 
        AND o.store_id = fs.store_id 
        AND o.status = 'DELIVERED'
    )
WHERE fs.favorite_id = ?;
```

## Benefits

1. ✅ **Real-time tracking**: Metrics updated instantly on delivery
2. ✅ **Accurate sorting**: List favorites by actual order frequency
3. ✅ **Personalized recommendations**: Suggest frequently ordered stores
4. ✅ **User insights**: Show customer their shopping patterns
5. ✅ **Marketing opportunities**: Re-engage customers with inactive favorites
6. ✅ **No manual calculation**: Automatic updates, no batch jobs needed
