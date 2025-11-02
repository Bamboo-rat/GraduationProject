# Automated Customer Suspension System

## Overview

The Automated Suspension System automatically monitors customer behavior and enforces account restrictions based on predefined rules. This system helps maintain platform quality and prevent abuse without requiring constant manual admin intervention.

## Table of Contents

1. [Features](#features)
2. [Violation Types](#violation-types)
3. [Automated Rules](#automated-rules)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Integration Guide](#integration-guide)
7. [Admin Management](#admin-management)

---

## Features

### Automated Detection & Enforcement

- **Spam/Comment Monitoring**: Detects excessive commenting and banned keywords
- **Order Cancellation Tracking**: Monitors customer cancellation patterns
- **Community Reports**: Auto-suspends accounts with multiple confirmed reports
- **Automatic Reinstatement**: Reinstates customers when suspension period expires
- **Warning System**: Issues warnings before applying suspensions
- **Escalation Path**: Warning → Temporary Suspension → Permanent Ban

### Admin Capabilities

- View violation history for any customer
- Review and resolve pending violations
- Manually issue warnings, suspensions, or bans
- View comprehensive violation summaries
- Track suspension history

---

## Violation Types

| Violation Type | Severity | Description |
|---------------|----------|-------------|
| `SPAM_COMMENT` | LOW | Excessive comments in short time |
| `BANNED_KEYWORD` | HIGH | Comment contains banned keywords |
| `ORDER_CANCELLATION` | MEDIUM | Customer-fault order cancellations |
| `COMMUNITY_REPORT` | HIGH | Reported by other users |
| `HARASSMENT` | HIGH | Harassment or abusive behavior |
| `FRAUDULENT_ACTIVITY` | CRITICAL | Fraudulent or suspicious activity |
| `POLICY_VIOLATION` | MEDIUM | Terms of service violation |

### Actions Taken

| Action | Description | Duration |
|--------|-------------|----------|
| `NO_ACTION` | Recorded for tracking only | N/A |
| `WARNING` | User warned about violation | 30 days active |
| `TEMPORARY_SUSPENSION` | Account temporarily suspended | Configurable (3-7 days) |
| `PERMANENT_BAN` | Account permanently banned | Permanent |
| `UNDER_REVIEW` | Pending admin review | Until reviewed |

---

## Automated Rules

### 1. Spam & Comment Violations

#### Rule 1: High Comment Volume
- **Trigger**: >= 5 comments within 24 hours
- **Action**: Issue WARNING
- **Cooldown**: 24 hours before new warning

#### Rule 2: Banned Keywords/Reported Comments
- **Trigger**: >= 10 violating comments (cumulative)
- **Action**: 3-DAY SUSPENSION
- **Notes**: Includes comments with banned keywords or reported by users

#### Rule 3: Repeated Violations After Suspension
- **Trigger**: New violations within 3 days after suspension
- **Action**: PERMANENT BAN
- **Notes**: Zero tolerance after suspension

**Implementation:**
```java
// When customer posts a comment
suspensionService.recordComment(customerId, commentId, "REVIEW");

// If comment contains banned keywords or is reported
suspensionService.recordViolatingComment(customerId, commentId, "Contains spam link");

// System automatically checks and applies suspension if thresholds met
suspensionService.checkSpamViolations(customerId);
```

---

### 2. Order Cancellation Violations

**Important**: Only cancellations marked as "customer fault" are counted.

#### Rule 1: Frequent Cancellations (7 days)
- **Trigger**: >= 5 consecutive cancellations within 7 days
- **Action**: Issue WARNING
- **Cooldown**: 7 days before new warning

#### Rule 2: Excessive Cancellations (30 days)
- **Trigger**: >= 10 consecutive cancellations within 30 days
- **Action**: 7-DAY SUSPENSION
- **Notes**: Pattern indicates order bombing

#### Rule 3: Abuse Pattern (60 days)
- **Trigger**: >= 20 cancellations within 60 days
- **Action**: PERMANENT BAN
- **Notes**: Clear abuse of platform

**Implementation:**
```java
// When order is cancelled
boolean customerFault = order.getCancelReason().isCustomerFault();
suspensionService.recordOrderCancellation(customerId, orderId, customerFault);

// System automatically checks and applies suspension if thresholds met
suspensionService.checkCancellationViolations(customerId);
```

**Cancellation Classification:**

| Cancellation Reason | Customer Fault? |
|-------------------|----------------|
| Customer changed mind | ✅ YES |
| Customer found cheaper | ✅ YES |
| Customer ordered wrong item | ✅ YES |
| Store out of stock | ❌ NO |
| Store cancelled | ❌ NO |
| Delivery failed (store fault) | ❌ NO |

---

### 3. Community Report Violations

#### Rule: Multiple Confirmed Reports
- **Trigger**: >= 3 confirmed reports from different users
- **Action**: SUSPEND account + UNDER_REVIEW status
- **Process**:
  1. Account immediately suspended
  2. Admin notified for review
  3. Admin must manually resolve

**Implementation:**
```java
// When user reports another customer
suspensionService.recordCommunityReport(
    reportedCustomerId,
    reportingUserId,
    "Harassment in chat",
    chatMessageId
);

// System automatically suspends if >= 3 reports
suspensionService.checkCommunityReports(reportedCustomerId);
```

---

## Database Schema

### CustomerViolation Table

Tracks individual violation instances.

```sql
CREATE TABLE customer_violations (
    violation_id UUID PRIMARY KEY,
    customer_id UUID NOT NULL,
    violation_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    description TEXT,
    reference_id VARCHAR(255),      -- Order ID, Comment ID, etc.
    reference_type VARCHAR(50),     -- "ORDER", "COMMENT", "REPORT"
    action_taken VARCHAR(50) NOT NULL,
    suspension_until TIMESTAMP,
    is_auto_generated BOOLEAN NOT NULL DEFAULT true,
    reviewed_by_admin_id UUID,
    admin_notes TEXT,
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL,
    reviewed_at TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(user_id),
    FOREIGN KEY (reviewed_by_admin_id) REFERENCES users(user_id)
);
```

### CustomerSuspensionHistory Table

Tracks suspension actions and timeline.

```sql
CREATE TABLE customer_suspension_history (
    history_id UUID PRIMARY KEY,
    customer_id UUID NOT NULL,
    previous_status VARCHAR(50) NOT NULL,
    new_status VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    suspension_duration_days INT,
    suspended_until TIMESTAMP,
    is_auto_generated BOOLEAN NOT NULL DEFAULT true,
    actioned_by_admin_id UUID,
    created_at TIMESTAMP NOT NULL,
    reinstated_at TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(user_id),
    FOREIGN KEY (actioned_by_admin_id) REFERENCES users(user_id)
);
```

---

## API Endpoints

### Admin Management Endpoints

#### Get Customer Violations
```http
GET /api/violations/customer/{customerId}?page=0&size=20
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "status": "SUCCESS",
  "data": {
    "content": [
      {
        "violationId": "uuid",
        "violationType": "SPAM_COMMENT",
        "severity": "HIGH",
        "description": "Spam warning: 6 comments in 24 hours",
        "actionTaken": "WARNING",
        "createdAt": "2025-11-02T10:30:00",
        "isResolved": false
      }
    ],
    "totalElements": 15,
    "totalPages": 1
  }
}
```

#### Get Violation Summary
```http
GET /api/violations/customer/{customerId}/summary
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "status": "SUCCESS",
  "data": {
    "totalViolations": 15,
    "activeWarnings": 2,
    "activeSuspensions": 0,
    "permanentBans": 0,
    "spamCount24h": 3,
    "violatingCommentsCount": 8,
    "cancellationsLast7Days": 2,
    "cancellationsLast30Days": 7,
    "cancellationsLast60Days": 12,
    "confirmedReports": 1,
    "isCurrentlySuspended": false,
    "suspendedUntil": null
  }
}
```

#### Get Pending Reviews
```http
GET /api/violations/pending-review?page=0&size=20
Authorization: Bearer {admin_token}
```

#### Resolve Violation
```http
POST /api/violations/{violationId}/resolve?notes=Resolved+after+review
Authorization: Bearer {admin_token}
```

### Manual Action Endpoints

#### Issue Warning
```http
POST /api/violations/customer/{customerId}/warn?reason=Inappropriate+language
Authorization: Bearer {moderator_token}
```

#### Suspend Customer
```http
POST /api/violations/customer/{customerId}/suspend?durationDays=7&reason=Policy+violation
Authorization: Bearer {moderator_token}
```

#### Ban Customer (SUPER_ADMIN only)
```http
POST /api/violations/customer/{customerId}/ban?reason=Repeated+fraud+attempts
Authorization: Bearer {super_admin_token}
```

### Recording Endpoints

#### Record Comment
```http
POST /api/violations/record/comment
  ?customerId={uuid}
  &commentId={uuid}
  &commentType=REVIEW
Authorization: Bearer {token}
```

#### Record Violating Comment
```http
POST /api/violations/record/violating-comment
  ?customerId={uuid}
  &commentId={uuid}
  &reason=Contains+banned+keyword+spam
Authorization: Bearer {token}
```

#### Record Cancellation
```http
POST /api/violations/record/cancellation
  ?customerId={uuid}
  &orderId={uuid}
  &customerFault=true
Authorization: Bearer {token}
```

#### Record Community Report
```http
POST /api/violations/record/report
  ?customerId={uuid}
  &reportedBy={reporter_uuid}
  &reason=Harassment
  &referenceId={chat_message_id}
Authorization: Bearer {token}
```

---

## Integration Guide

### 1. Integrate with Review/Comment System

```java
@Service
public class ReviewServiceImpl implements ReviewService {

    @Autowired
    private AutomatedSuspensionService suspensionService;

    @Autowired
    private BannedKeywordService keywordService;

    @Override
    @Transactional
    public Review createReview(String customerId, ReviewRequest request) {
        // Create review
        Review review = new Review();
        review.setCustomer(customerRepository.findById(customerId).orElseThrow());
        review.setContent(request.getContent());
        review = reviewRepository.save(review);

        // Record for spam tracking
        suspensionService.recordComment(customerId, review.getReviewId(), "REVIEW");

        // Check for banned keywords
        if (keywordService.containsBannedKeywords(request.getContent())) {
            suspensionService.recordViolatingComment(
                customerId,
                review.getReviewId(),
                "Contains banned keywords: " + keywordService.findBannedKeywords(request.getContent())
            );
        }

        // Automatic checks run internally

        return review;
    }
}
```

### 2. Integrate with Order System

```java
@Service
public class OrderServiceImpl implements OrderService {

    @Autowired
    private AutomatedSuspensionService suspensionService;

    @Override
    @Transactional
    public void cancelOrder(String orderId, CancellationRequest request) {
        Order order = orderRepository.findById(orderId).orElseThrow();

        // Determine if customer fault
        boolean customerFault = request.getReason() != CancellationReason.STORE_OUT_OF_STOCK &&
                              request.getReason() != CancellationReason.STORE_CANCELLED &&
                              request.getCancelledBy().equals("CUSTOMER");

        // Update order status
        order.setStatus(OrderStatus.CANCELLED);
        order.setCancellationReason(request.getReason());
        orderRepository.save(order);

        // Record cancellation
        suspensionService.recordOrderCancellation(
            order.getCustomer().getUserId(),
            orderId,
            customerFault
        );

        // Automatic checks run internally
    }
}
```

### 3. Integrate with Reporting System

```java
@Service
public class ReportServiceImpl implements ReportService {

    @Autowired
    private AutomatedSuspensionService suspensionService;

    @Override
    @Transactional
    public void reportUser(ReportRequest request) {
        // Create report record
        Report report = new Report();
        report.setReportedUser(request.getReportedUserId());
        report.setReportedBy(request.getReporterId());
        report.setReason(request.getReason());
        report = reportRepository.save(report);

        // If report is confirmed (verified by admin or automatic checks)
        if (isReportConfirmed(report)) {
            suspensionService.recordCommunityReport(
                request.getReportedUserId(),
                request.getReporterId(),
                request.getReason(),
                report.getReportId()
            );
        }

        // Automatic checks run internally
    }
}
```

---

## Admin Management

### Viewing Violations

Admins can view violations through the admin dashboard:

1. Navigate to **Customers** → **Violations**
2. Search for specific customer
3. View violation history and summary
4. See pending reviews that need admin attention

### Resolving Violations

For violations marked `UNDER_REVIEW`:

1. Review the violation details
2. Check customer history
3. Make decision:
   - **Resolve**: Clear the violation (false positive)
   - **Uphold**: Keep suspension/ban in place
   - **Escalate**: Increase penalty

### Manual Actions

Admins can take manual actions:

- **Issue Warning**: First-time offenders or minor violations
- **Temporary Suspension**: Moderate violations (specify days)
- **Permanent Ban**: Severe or repeated violations (SUPER_ADMIN only)

### Suspension Timeline

```
Customer violates policy
    ↓
System records violation
    ↓
Automatic check runs
    ↓
Threshold met?
    ├── NO → Continue monitoring
    └── YES → Apply action
            ├── Warning → Notify customer
            ├── Suspension → Lock account + notify
            └── Ban → Permanent lock + notify
                ↓
        Suspension expires?
            ├── YES → Auto-reinstate (scheduled job)
            └── NO → Keep suspended
```

---

## Scheduled Jobs

### Expired Suspension Processing

Runs **hourly** to check and reinstate customers:

```java
@Scheduled(cron = "0 0 * * * *") // Every hour
public void processExpiredSuspensions() {
    suspensionService.processExpiredSuspensions();
}
```

**Process:**
1. Find all suspensions where `suspended_until < NOW()`
2. For each suspension:
   - Change customer status from `SUSPENDED` to `ACTIVE`
   - Set `active = true`
   - Mark suspension as `reinstated_at = NOW()`
   - Send notification to customer

---

## Notifications

### Customer Notifications

| Event | Notification Type | Message |
|-------|------------------|---------|
| Warning Issued | WARNING | "Cảnh báo: {reason}. Vui lòng tuân thủ chính sách..." |
| Account Suspended | ACCOUNT_SUSPENDED | "Tài khoản bị tạm khóa {days} ngày. Lý do: {reason}" |
| Account Banned | ACCOUNT_BANNED | "Tài khoản bị cấm vĩnh viễn. Lý do: {reason}" |
| Account Restored | ACCOUNT_RESTORED | "Tài khoản đã được khôi phục. Vui lòng tuân thủ..." |

### Admin Notifications

| Event | Target | Message |
|-------|--------|---------|
| Auto-Suspension | All Admins | "Khách hàng '{name}' bị tạm khóa tự động..." |
| Permanent Ban | All Admins | "Khách hàng '{name}' bị cấm vĩnh viễn tự động..." |
| Pending Review | All Admins | "Có {count} vi phạm cần xem xét..." |

---

## Best Practices

### For Developers

1. **Always record violations**: Even if no immediate action, record for tracking
2. **Distinguish cancellation reasons**: Mark customer vs store fault accurately
3. **Validate reports**: Don't auto-record all reports, validate first
4. **Test thresholds**: Adjust thresholds based on actual platform usage
5. **Monitor false positives**: Regularly review auto-suspensions for accuracy

### For Admins

1. **Review pending violations daily**: Don't let them accumulate
2. **Document decisions**: Always add admin notes when resolving
3. **Escalate wisely**: Use graduated response (warning → suspension → ban)
4. **Monitor patterns**: Look for systemic issues, not just individual violations
5. **Communicate with customers**: Explain violations clearly in notifications

### For Product Managers

1. **Adjust thresholds seasonally**: Holiday periods may have different patterns
2. **Track metrics**: Monitor suspension rates, false positives, appeals
3. **Update banned keywords**: Regularly review and update keyword list
4. **User feedback**: Collect feedback on suspension system fairness
5. **Appeal process**: Implement formal appeal process for suspensions

---

## Troubleshooting

### Common Issues

**Issue**: Customer claims they're suspended but can still login
**Solution**: Check that `CustomerStatus` is properly synced with `active` flag. Run:
```sql
SELECT user_id, status, active FROM users WHERE user_id = '{customerId}';
```

**Issue**: Suspension not auto-expiring
**Solution**: Check scheduler is running. Verify `suspension_until` dates are correct.

**Issue**: Too many false positive spam warnings
**Solution**: Adjust threshold in `checkSpamViolations`. Current: 5 comments/24h

**Issue**: Store cancellations counting against customer
**Solution**: Verify `customerFault` parameter is set correctly in order cancellation logic

---

## Migration Guide

### Initial Setup

1. **Run migrations**: Create `customer_violations` and `customer_suspension_history` tables
2. **Enable scheduler**: Ensure `@EnableScheduling` is active in Spring config
3. **Configure notifications**: Set up email/in-app notification templates
4. **Import banned keywords**: Populate initial banned keyword list
5. **Train admins**: Ensure admins understand review process

### Testing

1. **Create test customers**: Set up test accounts for each violation scenario
2. **Test thresholds**: Verify each rule triggers correctly
3. **Test auto-reinstatement**: Create expired suspension, verify hourly job works
4. **Test notifications**: Verify customers and admins receive notifications
5. **Test admin UI**: Ensure violation management UI works properly

---

## Future Enhancements

Potential improvements for future versions:

1. **Machine Learning**: Use ML to detect suspicious patterns
2. **Appeal System**: Allow customers to appeal suspensions
3. **Graduated Penalties**: Different suspension durations based on violation history
4. **Reputation Score**: Numerical score showing customer trustworthiness
5. **Whitelisting**: Exempt verified/trusted customers from some checks
6. **Analytics Dashboard**: Visualize violation trends and patterns
7. **Webhook Integration**: Notify external systems of suspensions
8. **Multi-language Support**: Localized violation messages

---

## Support

For issues or questions:
- **Technical Issues**: Contact dev team
- **Policy Questions**: Contact compliance team
- **False Positives**: Submit review request through admin panel
- **Feature Requests**: Submit via product backlog

---

**Last Updated**: 2025-11-02
**Version**: 1.0.0
**Author**: SaveFood Development Team
