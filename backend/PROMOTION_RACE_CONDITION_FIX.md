# Promotion Race Condition Fix

## Problem Statement

### The Race Condition

**Scenario**: 10 users simultaneously try to apply a promotion that has only 1 slot remaining.

**Without Protection**:
```
Time  | User1        | User2        | User3-10     | DB State
------|--------------|--------------|--------------|-------------
T1    | Read: 99/100 | Read: 99/100 | Read: 99/100 | count = 99
T2    | Check: OK ✓  | Check: OK ✓  | Check: OK ✓  | count = 99
T3    | Apply ✓      | Apply ✓      | Apply ✓      | count = 99
T4    | Write: 100   | Write: 100   | Write: 100   | count = 100
T5    |              |              |              | count = 110 ❌
```

**Result**: All 10 users pass validation and increment the counter → Final count = 110/100 (WRONG!)

This is a **Time-of-Check to Time-of-Use (TOCTOU)** vulnerability.

---

## Solution: Multi-Layer Protection

We implemented **3 layers of protection** to prevent race conditions:

### Layer 1: Pessimistic Locking (JPA)

**PromotionRepository.java** - Line 29:
```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT p FROM Promotion p WHERE p.code = :code")
Optional<Promotion> findByCodeWithLock(@Param("code") String code);
```

**What it does**:
- Acquires a database-level **exclusive lock** on the promotion row
- Other transactions must **wait** until the lock is released
- Prevents concurrent reads/writes to the same promotion

**SQL Generated** (PostgreSQL):
```sql
SELECT * FROM promotions WHERE code = 'SUMMER2025' FOR UPDATE;
```

**How it works**:
```
Time  | User1          | User2          | User3-10        | DB State
------|----------------|----------------|-----------------|-------------
T1    | Lock acquired  | WAITING...     | WAITING...      | count = 99 (locked by User1)
T2    | Read: 99/100   | WAITING...     | WAITING...      | count = 99
T3    | Check: OK ✓    | WAITING...     | WAITING...      | count = 99
T4    | Increment      | WAITING...     | WAITING...      | count = 100
T5    | Lock released  | Lock acquired  | WAITING...      | count = 100
T6    |                | Read: 100/100  | WAITING...      | count = 100 (locked by User2)
T7    |                | Check: FAIL ❌ | WAITING...      | count = 100
T8    |                | Error thrown   | Locks released  | count = 100
```

**Result**: Only User1 succeeds. User2-10 get "Promotion usage limit has been reached" error.

---

### Layer 2: Atomic Database Update

**PromotionRepository.java** - Line 85:
```java
@Modifying
@Query("UPDATE Promotion p SET p.currentUsageCount = p.currentUsageCount + 1 " +
       "WHERE p.promotionId = :promotionId " +
       "AND (p.totalUsageLimit IS NULL OR p.currentUsageCount < p.totalUsageLimit)")
int incrementUsageCountIfAvailable(@Param("promotionId") String promotionId);
```

**What it does**:
- **Checks and increments in a single atomic operation**
- Returns `1` if successful, `0` if limit reached
- No gap between check and update

**SQL Generated**:
```sql
UPDATE promotions
SET current_usage_count = current_usage_count + 1
WHERE promotion_id = '123'
  AND (total_usage_limit IS NULL OR current_usage_count < total_usage_limit);
```

**Why this is safe**:
- The `WHERE` clause ensures increment only happens if `currentUsageCount < totalUsageLimit`
- Database atomically checks condition and updates in one step
- Even if two transactions run simultaneously, database serializes the updates

**Example**:
```
Promotion: limit = 100, current = 99

Transaction 1:
UPDATE ... WHERE current_usage_count < 100  → Returns 1 (success), count = 100

Transaction 2 (runs simultaneously):
UPDATE ... WHERE current_usage_count < 100  → Returns 0 (fails, already 100)
```

---

### Layer 3: Transaction Management

**PromotionServiceImpl.java** - Line 229:
```java
@Override
@Transactional
public PromotionResponse applyPromotionToOrder(String code, String customerId, BigDecimal orderAmount) {
    // Step 1: Acquire lock
    Promotion promotion = promotionRepository.findByCodeWithLock(code)
            .orElseThrow(() -> new NotFoundException(ErrorCode.PROMOTION_NOT_FOUND));

    // Step 2: Validate (while holding lock)
    if (promotion.getCurrentUsageCount() >= promotion.getTotalUsageLimit()) {
        throw new BadRequestException(ErrorCode.PROMOTION_NOT_APPLICABLE);
    }

    // Step 3: Atomic increment
    int updated = promotionRepository.incrementUsageCountIfAvailable(promotion.getPromotionId());

    if (updated == 0) {
        // Another transaction won the race
        throw new BadRequestException(ErrorCode.PROMOTION_NOT_APPLICABLE);
    }

    // Success!
    return promotionMapper.toResponse(promotion);
}
```

**Transaction Isolation**:
- `@Transactional` ensures all operations are in a single database transaction
- If any step fails, the entire transaction is rolled back
- Lock is held until transaction commits or rolls back

---

## Complete Flow: 10 Concurrent Users, 1 Slot Left

```
┌────────────────────────────────────────────────────────────────────┐
│                    Initial State: 99/100 used                      │
└────────────────────────────────────────────────────────────────────┘

User1: POST /api/promotions/apply/SUMMER2025
  └─ BEGIN TRANSACTION
     ├─ SELECT ... FOR UPDATE (LOCK ACQUIRED)
     ├─ Read: 99/100
     ├─ Check: 99 < 100 ✓
     ├─ UPDATE SET count = count + 1 WHERE count < 100
     │  └─ Rows affected: 1 (Success!)
     ├─ New count: 100/100
     └─ COMMIT (LOCK RELEASED)
     ✅ Response: 200 OK

User2: POST /api/promotions/apply/SUMMER2025
  └─ BEGIN TRANSACTION
     ├─ SELECT ... FOR UPDATE (WAITING for User1...)
     ├─ (User1 commits, lock released)
     ├─ SELECT ... FOR UPDATE (LOCK ACQUIRED)
     ├─ Read: 100/100
     ├─ Check: 100 < 100 ✗
     └─ ROLLBACK (LOCK RELEASED)
     ❌ Response: 400 "Promotion usage limit has been reached"

User3-10: POST /api/promotions/apply/SUMMER2025
  └─ BEGIN TRANSACTION
     ├─ SELECT ... FOR UPDATE (WAITING for User2...)
     ├─ (User2 rollback, lock released)
     ├─ SELECT ... FOR UPDATE (LOCK ACQUIRED)
     ├─ Read: 100/100
     ├─ Check: 100 < 100 ✗
     └─ ROLLBACK (LOCK RELEASED)
     ❌ Response: 400 "Promotion usage limit has been reached"

┌────────────────────────────────────────────────────────────────────┐
│                    Final State: 100/100 used ✅                    │
│              Only User1 got the promotion (CORRECT!)               │
└────────────────────────────────────────────────────────────────────┘
```

---

## API Changes

### Old Endpoint (Validation Only - Not Safe!)

```http
GET /api/promotions/validate/SUMMER2025?orderAmount=150000

Response:
{
  "success": true,
  "message": "Promotion is valid",
  "data": {
    "promotionId": "123",
    "code": "SUMMER2025",
    "currentUsageCount": 99,
    "totalUsageLimit": 100,
    "isActive": true
  }
}
```

⚠️ **Problem**: This only checks if the promotion is valid at the time of the request. By the time you create the order, it might be full!

---

### New Endpoint (Atomic Apply - Thread-Safe!)

```http
POST /api/promotions/apply/SUMMER2025
Content-Type: application/x-www-form-urlencoded

customerId=user123&orderAmount=150000

Response (Success):
{
  "success": true,
  "message": "Promotion applied successfully",
  "data": {
    "promotionId": "123",
    "code": "SUMMER2025",
    "currentUsageCount": 100,
    "totalUsageLimit": 100,
    "isActive": true
  }
}

Response (Limit Reached):
{
  "success": false,
  "message": "Promotion usage limit has been reached",
  "errorCode": "5005"
}
```

✅ **Safe**: Atomically validates AND increments usage count in a single transaction.

---

## Updated Workflow

### Frontend Implementation

**WRONG WAY** (Race Condition):
```typescript
// Step 1: Validate promotion
const validation = await promotionService.validatePromotionCode('SUMMER2025', orderAmount);
if (validation.isActive) {
  // ❌ Gap here! Another user might take the last slot!

  // Step 2: Create order
  const order = await orderService.createOrder({
    promotionCode: 'SUMMER2025',
    amount: orderAmount
  });
}
```

**CORRECT WAY** (Thread-Safe):
```typescript
// Step 1: Preview promotion (optional, for UI display)
try {
  const preview = await promotionService.validatePromotionCode('SUMMER2025', orderAmount);
  // Show discount preview to user
  setDiscountPreview(preview.discountValue);
} catch (error) {
  // Invalid promotion, show error
}

// Step 2: Apply promotion when user confirms order
try {
  const applied = await promotionService.applyPromotionToOrder('SUMMER2025', customerId, orderAmount);

  // Promotion successfully applied, proceed with order creation
  const order = await orderService.createOrder({
    promotionId: applied.promotionId,
    discountAmount: calculateDiscount(applied, orderAmount),
    finalAmount: orderAmount - calculateDiscount(applied, orderAmount)
  });

} catch (error) {
  if (error.errorCode === '5005') {
    // Promotion limit reached, show error to user
    alert('Sorry, this promotion is no longer available');
  }
}
```

---

## Database Configuration

### Required Isolation Level

The solution works with **READ_COMMITTED** or higher isolation levels.

**application.properties**:
```properties
# Default is READ_COMMITTED (sufficient for this solution)
spring.jpa.properties.hibernate.connection.isolation=2

# For maximum safety, use REPEATABLE_READ
# spring.jpa.properties.hibernate.connection.isolation=4
```

**Isolation Levels**:
- `1` = READ_UNCOMMITTED (Not recommended, dirty reads possible)
- `2` = READ_COMMITTED (Default, works with our solution)
- `4` = REPEATABLE_READ (More strict, prevents phantom reads)
- `8` = SERIALIZABLE (Strictest, may impact performance)

---

## Performance Considerations

### Lock Contention

When many users try to apply the same promotion simultaneously:
- Only one transaction holds the lock at a time
- Others wait in a queue
- Average wait time increases with concurrency

**Mitigation**:
1. **Lock Timeout**: Configure timeout to prevent indefinite waiting
   ```properties
   spring.jpa.properties.javax.persistence.lock.timeout=5000
   ```

2. **Optimistic Locking for Low Contention**: If promotions rarely hit limits, use optimistic locking instead
   ```java
   @Version
   private Long version;
   ```

3. **Promotion Pools**: Create multiple promotion codes with smaller limits
   - Instead of: 1 code with 1000 uses
   - Use: 10 codes with 100 uses each

### Database Index

Ensure `code` column is indexed for fast lookups:
```sql
CREATE INDEX idx_promotion_code ON promotions(code);
```

---

## Testing

### Unit Test for Race Condition

```java
@SpringBootTest
class PromotionConcurrencyTest {

    @Autowired
    private PromotionService promotionService;

    @Autowired
    private PromotionRepository promotionRepository;

    @Test
    void testConcurrentPromotionApplication() throws InterruptedException {
        // Setup: Create promotion with limit of 1
        Promotion promotion = new Promotion();
        promotion.setCode("TEST100");
        promotion.setTotalUsageLimit(1);
        promotion.setCurrentUsageCount(0);
        promotion.setStatus(PromotionStatus.ACTIVE);
        promotion.setStartDate(LocalDate.now());
        promotion.setEndDate(LocalDate.now().plusDays(7));
        promotionRepository.save(promotion);

        // Create 10 threads trying to apply the same promotion
        int threadCount = 10;
        CountDownLatch latch = new CountDownLatch(threadCount);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);

        ExecutorService executor = Executors.newFixedThreadPool(threadCount);

        for (int i = 0; i < threadCount; i++) {
            final int userId = i;
            executor.submit(() -> {
                try {
                    promotionService.applyPromotionToOrder(
                        "TEST100",
                        "customer" + userId,
                        new BigDecimal("100")
                    );
                    successCount.incrementAndGet();
                } catch (BadRequestException e) {
                    failureCount.incrementAndGet();
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        // Assert: Only 1 success, 9 failures
        assertEquals(1, successCount.get(), "Only 1 user should succeed");
        assertEquals(9, failureCount.get(), "9 users should fail");

        // Verify database state
        Promotion updated = promotionRepository.findByCode("TEST100").orElseThrow();
        assertEquals(1, updated.getCurrentUsageCount(), "Usage count should be exactly 1");
    }
}
```

### Load Test with JMeter

```xml
<ThreadGroup>
  <num_threads>100</num_threads>
  <ramp_time>1</ramp_time>
  <HTTPSampler>
    <method>POST</method>
    <path>/api/promotions/apply/SUMMER2025</path>
    <param name="customerId" value="${__UUID}"/>
    <param name="orderAmount" value="150000"/>
  </HTTPSampler>
</ThreadGroup>
```

**Expected Result**: If promotion has 10 slots, exactly 10 requests succeed, 90 fail.

---

## Monitoring & Alerts

### Database Lock Monitoring

**PostgreSQL**:
```sql
SELECT
  pid,
  usename,
  state,
  wait_event_type,
  wait_event,
  query
FROM pg_stat_activity
WHERE wait_event_type = 'Lock';
```

**MySQL**:
```sql
SELECT * FROM information_schema.innodb_locks;
SELECT * FROM information_schema.innodb_lock_waits;
```

### Application Metrics

```java
@Autowired
private MeterRegistry meterRegistry;

public PromotionResponse applyPromotionToOrder(...) {
    Timer.Sample sample = Timer.start(meterRegistry);
    try {
        // Apply promotion logic
        PromotionResponse response = ...;

        meterRegistry.counter("promotion.apply.success").increment();
        sample.stop(Timer.builder("promotion.apply.duration")
            .tag("result", "success")
            .register(meterRegistry));

        return response;
    } catch (BadRequestException e) {
        meterRegistry.counter("promotion.apply.failure",
            "reason", "limit_reached").increment();
        throw e;
    }
}
```

---

## Summary

### Protection Layers

| Layer | Mechanism | SQL | Prevents |
|-------|-----------|-----|----------|
| 1 | Pessimistic Locking | `SELECT ... FOR UPDATE` | Concurrent reads |
| 2 | Atomic Update | `UPDATE ... WHERE count < limit` | Check-then-act gap |
| 3 | Transaction | `@Transactional` | Partial updates |

### Files Modified

1. ✅ `PromotionRepository.java` - Added `findByCodeWithLock()` and `incrementUsageCountIfAvailable()`
2. ✅ `PromotionService.java` - Added `applyPromotionToOrder()` method
3. ✅ `PromotionServiceImpl.java` - Implemented atomic apply logic
4. ✅ `PromotionController.java` - Added `POST /apply/{code}` endpoint

### Migration Guide

**For existing deployments**:
1. No database migration needed (uses existing columns)
2. Update backend code
3. Update frontend to use `/apply` instead of `/validate` + manual increment
4. Monitor lock wait times in production

### Best Practices

✅ **DO**:
- Use `/apply` endpoint for actual promotion usage
- Use `/validate` endpoint only for preview/UI display
- Handle `5005` error code gracefully (limit reached)
- Set appropriate lock timeout (5-10 seconds)
- Monitor database lock contention

❌ **DON'T**:
- Don't rely on `/validate` for reserving promotions
- Don't increment usage count manually in application code
- Don't use optimistic locking for high-contention scenarios
- Don't forget to handle timeout exceptions

---

## Future Enhancements

1. **Distributed Locking**: For multi-instance deployments, consider Redis-based distributed locks
2. **Reservation System**: Reserve promotions for 5 minutes during checkout
3. **Queue System**: Use message queue for high-traffic promotions
4. **Rate Limiting**: Limit promotion application attempts per user

---

**Problem Solved!** ✅

The race condition is now completely eliminated through:
- Database-level locking
- Atomic operations
- Transaction management

10 users, 1 slot → Exactly 1 success, 9 failures. Every time. Guaranteed.
