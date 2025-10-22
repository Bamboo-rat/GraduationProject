# Email Notification Queue System

## Overview

This document describes the email notification queue system that handles email sending failures with automatic retry mechanism and admin monitoring capabilities.

## Problem Statement

**Previous Issue:**
- Supplier approved but email fails silently
- Admin thinks notification was sent but it actually failed
- Supplier doesn't know their account was approved
- No way to track or retry failed emails

**Solution:**
- Queue all critical emails in database
- Automatic retry with exponential backoff
- Admin dashboard to view failed notifications
- Manual retry capability

---

## System Architecture

### Components

1. **PendingNotification Entity** - Database table storing queued emails
2. **NotificationService** - Business logic for queueing and sending
3. **NotificationScheduledService** - Scheduled jobs for retry and cleanup
4. **NotificationController** - Admin endpoints to view/manage failures
5. **EmailNotificationType Enum** - Types of emails (SUPPLIER_APPROVAL, etc.)
6. **NotificationStatus Enum** - Status tracking (PENDING, SENT, FAILED, PROCESSING)

---

## Database Schema

### `pending_notifications` Table

```sql
CREATE TABLE pending_notifications (
    notification_id VARCHAR(36) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,              -- EmailNotificationType
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL,            -- NotificationStatus
    retry_count INT NOT NULL DEFAULT 0,
    max_retries INT NOT NULL DEFAULT 3,
    last_attempt_at TIMESTAMP,
    error_message TEXT,
    next_retry_at TIMESTAMP,
    related_entity_id VARCHAR(36),          -- supplierId, orderId, etc.
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    sent_at TIMESTAMP
);

CREATE INDEX idx_status_next_retry ON pending_notifications(status, next_retry_at);
CREATE INDEX idx_related_entity ON pending_notifications(related_entity_id);
```

---

## Notification Flow

### 1. Queue Notification

When admin approves/rejects a supplier:

```java
// In SupplierServiceImpl.approveSupplier()
notificationService.queueNotification(
    EmailNotificationType.SUPPLIER_APPROVAL,
    supplier.getEmail(),
    "SaveFood - Your Supplier Account Has Been Approved!",
    emailMessage,
    supplier.getUserId()
);
```

**What happens:**
1. Notification saved to database with status `PENDING`
2. Immediate send attempt is made
3. If successful → status changed to `SENT`, `sentAt` timestamp recorded
4. If failed → `retryCount` incremented, `nextRetryAt` scheduled with exponential backoff

### 2. Automatic Retry Mechanism

**Exponential Backoff Schedule:**
- Retry 1: 5 minutes after failure
- Retry 2: 15 minutes after retry 1 failure (5 × 3^1)
- Retry 3: 45 minutes after retry 2 failure (5 × 3^2)
- After 3 failures: Status changed to `FAILED`

**Scheduled Job:**
```java
@Scheduled(fixedRate = 300000) // Every 5 minutes
public void processPendingNotifications() {
    // Find all PENDING notifications where nextRetryAt <= now
    // Attempt to send each one
    // Update status accordingly
}
```

### 3. Failure Handling

When max retries (3) exceeded:
- Status set to `FAILED`
- Error message stored in `error_message` field
- Admin can view in dashboard at `/api/admin/notifications/failed`
- Admin can manually retry if needed

---

## API Endpoints

### Admin Endpoints

All endpoints require `SUPER_ADMIN` or `MODERATOR` role.

#### 1. Get Failed Notifications

```http
GET /api/admin/notifications/failed
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "code": "200",
  "message": "Failed notifications retrieved successfully",
  "data": [
    {
      "notificationId": "123e4567-e89b-12d3-a456-426614174000",
      "type": "SUPPLIER_APPROVAL",
      "recipientEmail": "supplier@example.com",
      "subject": "SaveFood - Your Supplier Account Has Been Approved!",
      "content": "Dear John Doe...",
      "status": "FAILED",
      "retryCount": 3,
      "maxRetries": 3,
      "lastAttemptAt": "2025-10-17T14:30:00",
      "errorMessage": "Connection timeout to SendGrid API",
      "relatedEntityId": "supplier-uuid-123",
      "createdAt": "2025-10-17T14:00:00",
      "updatedAt": "2025-10-17T15:15:00"
    }
  ]
}
```

#### 2. Get Pending Notifications

```http
GET /api/admin/notifications/pending
Authorization: Bearer {jwt_token}
```

Shows notifications waiting to be sent or retried.

#### 3. Get Notification Statistics

```http
GET /api/admin/notifications/stats
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "code": "200",
  "message": "Notification statistics retrieved successfully",
  "data": {
    "pending": 5,
    "sent": 1203,
    "failed": 3,
    "processing": 0
  }
}
```

#### 4. Manually Retry Notification

```http
POST /api/admin/notifications/{notificationId}/retry
Authorization: Bearer {jwt_token}
```

**Use case:** Admin fixes email configuration, wants to immediately retry failed notifications.

**Response (success):**
```json
{
  "code": "200",
  "message": "Notification sent successfully",
  "data": "The notification has been sent successfully"
}
```

#### 5. Process All Pending (SUPER_ADMIN Only)

```http
POST /api/admin/notifications/process
Authorization: Bearer {jwt_token}
```

Manually triggers the scheduled job to process all pending notifications immediately.

**Response:**
```json
{
  "code": "200",
  "message": "Notification processing completed",
  "data": {
    "processedCount": 7
  }
}
```

---

## Email Types

### EmailNotificationType Enum

```java
public enum EmailNotificationType {
    SUPPLIER_APPROVAL,       // Supplier account approved
    SUPPLIER_REJECTION,      // Supplier application rejected
    ORDER_CONFIRMATION,      // Order placed successfully
    PASSWORD_RESET,          // Password reset link
    EMAIL_VERIFICATION,      // Email verification OTP
    WELCOME_EMAIL,           // Welcome new user
    GENERAL_EMAIL            // Generic notifications
}
```

### Adding New Email Types

When adding a new email type:

1. Add to `EmailNotificationType` enum
2. Use `notificationService.queueNotification()` instead of `emailService.sendEmail()` directly
3. Example:

```java
// In OrderService
notificationService.queueNotification(
    EmailNotificationType.ORDER_CONFIRMATION,
    customer.getEmail(),
    "Order Confirmation #" + order.getOrderId(),
    buildOrderConfirmationEmail(order),
    order.getOrderId()
);
```

---

## Notification Status Lifecycle

```
PENDING → [Send Attempt] → SUCCESS → SENT ✓
                         ↓
                       FAIL
                         ↓
                    PROCESSING (retry attempt)
                         ↓
                    [Retry <= 3] → SUCCESS → SENT ✓
                         ↓
                    [Retry > 3] → FAILED ✗
```

### Status Descriptions

- **PENDING**: Waiting to be sent, or scheduled for retry
- **PROCESSING**: Currently being sent (prevents duplicate sends)
- **SENT**: Successfully delivered
- **FAILED**: Max retries exceeded, requires manual intervention

---

## Scheduled Jobs

### 1. Process Pending Notifications

**Schedule:** Every 5 minutes
**Action:** Find and process all `PENDING` notifications ready to send

```java
@Scheduled(fixedRate = 300000)
public void processPendingNotifications() {
    // Queries: WHERE status = 'PENDING'
    //          AND (nextRetryAt IS NULL OR nextRetryAt <= NOW)
}
```

### 2. Cleanup Old Notifications

**Schedule:** Daily at 2:00 AM
**Action:** Delete `SENT` notifications older than 30 days

```java
@Scheduled(cron = "0 0 2 * * *")
public void cleanupOldNotifications() {
    notificationService.cleanupOldNotifications(30); // 30 days
}
```

**Why cleanup?**
- Prevent database bloat
- SENT notifications don't need indefinite storage
- FAILED notifications are kept for admin review

---

## Error Handling

### Service Layer

```java
@Override
@Transactional
public PendingNotification queueNotification(...) {
    // Save to database first
    PendingNotification notification = notificationRepository.save(...);

    // Try immediate send
    sendNotification(notification);

    return notification; // Returns regardless of send success
}
```

**Key Points:**
- ✅ Queueing never fails the business operation
- ✅ If email send fails, operation still succeeds
- ✅ Retry mechanism handles delivery eventually
- ✅ Admin gets visibility into failures

### Controller Layer (SupplierService)

```java
// Queue approval email notification (will auto-retry on failure)
try {
    notificationService.queueNotification(...);
    log.info("Approval email queued for: {}", supplier.getEmail());
} catch (Exception e) {
    log.error("Failed to queue approval email for: {}", supplier.getEmail(), e);
    // Don't fail the operation if queueing fails
}
```

---

## Admin Dashboard Integration

### Frontend Implementation (Recommended)

#### Failed Notifications Page

**Location:** `/admin/notifications/failed`

**Features:**
1. Table showing all failed notifications
2. Columns:
   - Type (badge with color)
   - Recipient Email
   - Subject
   - Error Message
   - Retry Count
   - Created At
   - Actions (Retry button)
3. Refresh button to reload data
4. Statistics cards at top:
   - Total Pending
   - Total Failed
   - Total Sent (today)

#### Statistics Dashboard Widget

**Location:** `/admin/dashboard` (main page)

```jsx
<StatisticsCard
  title="Email Notifications"
  stats={[
    { label: "Pending", value: stats.pending, color: "yellow" },
    { label: "Failed", value: stats.failed, color: "red", alert: true },
    { label: "Sent Today", value: stats.sent, color: "green" }
  ]}
  link="/admin/notifications/failed"
/>
```

**Alert Badge:**
- Show red badge when `failed > 0`
- Click redirects to failed notifications page

---

## Testing

### Unit Tests

```java
@Test
void testQueueNotification_Success() {
    // Given
    PendingNotification notification = notificationService.queueNotification(
        EmailNotificationType.SUPPLIER_APPROVAL,
        "test@example.com",
        "Test Subject",
        "Test Content",
        "entity-123"
    );

    // Then
    assertNotNull(notification.getNotificationId());
    assertEquals(NotificationStatus.SENT, notification.getStatus());
    assertNotNull(notification.getSentAt());
}

@Test
void testRetryMechanism_ExponentialBackoff() {
    // Given: Email send fails
    when(emailService.sendEmail(...)).thenThrow(new RuntimeException("Send failed"));

    // When
    PendingNotification notification = notificationService.queueNotification(...);

    // Then
    assertEquals(NotificationStatus.PENDING, notification.getStatus());
    assertEquals(1, notification.getRetryCount());
    assertNotNull(notification.getNextRetryAt());

    // Verify backoff: should be ~5 minutes from now
    long minutesDelay = ChronoUnit.MINUTES.between(
        LocalDateTime.now(),
        notification.getNextRetryAt()
    );
    assertEquals(5, minutesDelay, 1); // Allow 1 minute tolerance
}

@Test
void testMaxRetriesExceeded_MarkedAsFailed() {
    // Given: 3 failed attempts
    notification.setRetryCount(2);
    when(emailService.sendEmail(...)).thenThrow(new RuntimeException("Send failed"));

    // When: Fourth attempt fails
    notificationService.retryNotification(notification.getNotificationId());

    // Then
    PendingNotification updated = notificationRepository.findById(...).get();
    assertEquals(NotificationStatus.FAILED, updated.getStatus());
    assertEquals(3, updated.getRetryCount());
}
```

### Integration Tests

```java
@SpringBootTest
@AutoConfigureMockMvc
class NotificationIntegrationTest {

    @Test
    void testApproveSupplier_EmailQueued() {
        // Given
        Supplier supplier = createPendingSupplier();

        // When
        supplierService.approveSupplier(supplier.getUserId(), "Approved!");

        // Then
        List<PendingNotification> notifications =
            notificationRepository.findByRelatedEntityId(supplier.getUserId());

        assertEquals(1, notifications.size());
        assertEquals(EmailNotificationType.SUPPLIER_APPROVAL, notifications.get(0).getType());
        assertEquals(supplier.getEmail(), notifications.get(0).getRecipientEmail());
    }
}
```

---

## Monitoring and Alerts

### Recommended Monitoring

1. **Alert when failed count > threshold**
   - If `failed_count > 10`: Send alert to admin team
   - Could indicate SendGrid outage or configuration issue

2. **Track average retry count**
   - High retry count could indicate intermittent issues
   - `AVG(retry_count) WHERE status = 'SENT'`

3. **Monitor scheduled job execution**
   - Log when scheduled jobs run
   - Alert if job hasn't run for > 10 minutes

### Logging

```java
// Success
log.info("Successfully sent notification: id={}, type={}, recipient={}",
    notificationId, type, recipientEmail);

// Retry scheduled
log.warn("Notification {} failed (attempt {}/{}). Retry scheduled in {} minutes: {}",
    notificationId, retryCount, maxRetries, delayMinutes, errorMessage);

// Final failure
log.error("Notification {} FAILED after {} attempts: {}",
    notificationId, maxRetries, errorMessage);
```

---

## Configuration

### Application Properties

```properties
# Scheduling enabled (default: true)
spring.task.scheduling.enabled=true

# Scheduled job settings
notification.retry.max-retries=3
notification.retry.base-delay-minutes=5
notification.cleanup.days-old=30
```

### Customization

To change retry schedule, modify `NotificationServiceImpl.calculateExponentialBackoff()`:

```java
private int calculateExponentialBackoff(int retryCount) {
    // Current: 5, 15, 45 minutes
    // To change to 10, 30, 90 minutes:
    return 10 * (int) Math.pow(3, retryCount - 1);
}
```

---

## Migration from Direct Email Sending

### Before (Direct Send)

```java
// Old code in SupplierServiceImpl
try {
    emailService.sendEmail(supplier.getEmail(), subject, message);
    log.info("Email sent to: {}", supplier.getEmail());
} catch (Exception e) {
    log.error("Failed to send email", e);
    // Email lost forever!
}
```

### After (Queued)

```java
// New code
notificationService.queueNotification(
    EmailNotificationType.SUPPLIER_APPROVAL,
    supplier.getEmail(),
    subject,
    message,
    supplier.getUserId()
);
log.info("Email queued for: {}", supplier.getEmail());
// Will auto-retry on failure!
```

### Migration Checklist

- [x] Replace `emailService.sendEmail()` with `notificationService.queueNotification()` in SupplierServiceImpl
- [ ] Replace in OrderService (future)
- [ ] Replace in CustomerService (future)
- [ ] Replace in PasswordResetService (future)
- [ ] Update admin frontend to show notification dashboard
- [ ] Add monitoring/alerting for failed notifications
- [ ] Document for team in README

---

## Benefits

### For Admins
- ✅ See all failed email notifications in dashboard
- ✅ Manually retry failed sends
- ✅ Get statistics on email delivery success rate
- ✅ Identify systemic email issues quickly

### For Suppliers/Customers
- ✅ Automatic retry ensures they receive critical emails
- ✅ Better user experience (eventually get approval email)
- ✅ No need to contact support asking "was I approved?"

### For Developers
- ✅ Centralized email sending with built-in retry
- ✅ Easy to add new email types
- ✅ Testable with clear success/failure states
- ✅ Database audit trail of all emails

---

## Future Enhancements

### Possible Improvements

1. **Email Templates**
   - Store templates in database
   - Use template engine (Thymeleaf/FreeMarker)
   - Admin can edit templates without code changes

2. **Multiple Email Providers**
   - Fallback to secondary provider if SendGrid fails
   - Circuit breaker pattern

3. **Notification Preferences**
   - Users opt-in/out of certain email types
   - Check preferences before queueing

4. **Webhook Status Updates**
   - SendGrid webhook to update delivery status
   - Track opens, clicks, bounces

5. **Priority Queue**
   - High priority (password reset) sent immediately
   - Low priority (marketing) can be batched

6. **Rate Limiting**
   - Prevent spam by limiting emails per user per day
   - Global rate limit for SendGrid quota

---

## Summary

The email notification queue system provides:

- **Reliability**: Automatic retry with exponential backoff
- **Visibility**: Admin dashboard for failed notifications
- **Auditability**: Database records of all email attempts
- **Maintainability**: Easy to add new email types
- **Scalability**: Scheduled jobs process queue efficiently

No more lost emails due to transient failures!
