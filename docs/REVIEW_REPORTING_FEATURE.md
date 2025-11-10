# Review Reporting Feature

## Overview
This document describes the review reporting feature that allows suppliers to flag inappropriate customer reviews for admin moderation.

## Business Context
Suppliers need the ability to report customer reviews that violate platform policies (spam, offensive content, fake reviews, etc.). This feature provides a formal reporting mechanism that notifies administrators for review moderation.

## Feature Components

### 1. Backend Implementation

#### 1.1 API Endpoint
**Endpoint:** `POST /api/reviews/{reviewId}/report`

**Authorization:** `@PreAuthorize("hasRole('SUPPLIER')")`

**Request Parameters:**
- `reviewId` (path variable): ID of the review to report
- `reason` (query parameter): Reason for reporting the review

**Response:**
```json
{
  "message": "Đánh giá đã được báo cáo thành công"
}
```

**Location:** `ReviewController.java`

#### 1.2 Service Layer

**Interface Method:**
```java
void reportReview(String supplierId, String reviewId, String reason);
```

**Location:** `ReviewService.java`

**Implementation:** `ReviewServiceImpl.java`

**Business Logic:**
1. Validates supplier exists
2. Validates review exists
3. Verifies supplier owns the store associated with the review
4. Checks if review is not already marked as spam by admin
5. Sends notification to all administrators
6. Logs the report action

**Validation Rules:**
- Supplier must own the store where the review was posted
- Cannot report reviews already marked as spam
- Reason parameter is required

#### 1.3 Notification System

**Notification Type:** `REVIEW_REPORTED`
- Vietnamese Name: "Báo cáo đánh giá vi phạm"
- English Description: "Review reported by supplier notification"

**Location:** `NotificationType.java`

**Notification Content:**
```
Nhà cung cấp '{supplier_name}' đã báo cáo đánh giá vi phạm.
Lý do: {reason}
Đánh giá: "{review_comment}"
Khách hàng: {customer_name}
```

**Notification Link:** `/admin/reviews/spam?reviewId={reviewId}`

### 2. Frontend Implementation (Supplier Portal)

#### 2.1 API Service

**Service Method:**
```typescript
reportReview: async (reviewId: string, reason: string): Promise<void>
```

**Location:** `reviewService.ts`

**Usage:**
```typescript
await reviewService.reportReview(reviewId, "Spam/Quảng cáo");
```

#### 2.2 ReviewCard Component

**New Props:**
- `onReport: () => void` - Callback when report button is clicked

**New UI Element:**
- Report button with Flag icon
- Display condition: Only shown if `!review.markedAsSpam`
- Button text: "Báo cáo vi phạm"
- Color: Orange (warning color)

**Location:** `ReviewCard.tsx`

#### 2.3 ReportReviewModal Component

**New Component:** `ReportReviewModal.tsx`

**Props:**
```typescript
interface ReportReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  reviewContent: {
    customerName: string;
    rating: number;
    comment?: string;
  };
}
```

**Features:**
- Radio button selection for predefined reasons:
  - "Spam/Quảng cáo" (SPAM)
  - "Nội dung xúc phạm/thô tục" (OFFENSIVE)
  - "Đánh giá giả mạo" (FAKE)
  - "Không liên quan đến sản phẩm" (IRRELEVANT)
  - "Khác" (OTHER) - with custom text input
- Review preview (customer name, rating, comment)
- Warning message about report consequences
- Loading state during submission
- Error handling

**UI/UX Considerations:**
- Orange/warning color theme
- AlertTriangle icon in header
- Custom reason textarea (max 500 characters) when "Khác" is selected
- Required validation for reason selection
- Success/error feedback via toast/alert

#### 2.4 CustomerReviews Page Integration

**New State:**
```typescript
const [reportModalOpen, setReportModalOpen] = useState(false);
```

**New Handler Functions:**
```typescript
const handleReport = (review: ReviewResponse) => {
  setSelectedReview(review);
  setReportModalOpen(true);
};

const handleSubmitReport = async (reason: string) => {
  if (!selectedReview) return;
  
  await reviewService.reportReview(selectedReview.reviewId, reason);
  setReportModalOpen(false);
  setSelectedReview(null);
  alert('Báo cáo đã được gửi thành công...');
};
```

**Location:** `CustomerReviews.tsx`

## User Workflow

### Supplier Workflow
1. Supplier navigates to "Đánh giá của khách hàng" page
2. Identifies inappropriate review
3. Clicks "Báo cáo vi phạm" button (Flag icon)
4. ReportReviewModal opens showing review details
5. Selects reason from predefined list or enters custom reason
6. Clicks "Gửi báo cáo" button
7. Receives success confirmation
8. Admin receives notification

### Admin Workflow (After Report)
1. Admin receives in-app notification with type "Báo cáo đánh giá vi phạm"
2. Notification includes:
   - Supplier name (business name or full name)
   - Report reason
   - Review comment
   - Customer name
3. Admin clicks notification link → redirects to spam review moderation page
4. Admin reviews the flagged content
5. Admin decides to:
   - Mark review as spam (removes from public view)
   - Take no action (leave review visible)
   - Contact supplier/customer for clarification

## Security & Validation

### Backend Security
- Spring Security role-based authorization (SUPPLIER role required)
- Ownership validation (supplier must own the store)
- Duplicate report prevention (cannot report spam-marked reviews)
- Input sanitization for reason text

### Frontend Validation
- Reason selection is required
- Custom reason text required when "Khác" is selected
- Maximum 500 characters for custom reason
- Loading state prevents multiple submissions
- Error handling for network failures

## Error Handling

### Backend Errors
- `USER_NOT_FOUND` - Supplier ID not found
- `RESOURCE_NOT_FOUND` - Review ID not found
- `UNAUTHORIZED_ACCESS` - Supplier doesn't own the store
- `INVALID_REQUEST` - Review already marked as spam

### Frontend Errors
- Network errors: Display error message in modal
- Validation errors: Show inline error messages
- Success: Display success alert and close modal

## Database Impact

**Note:** Current implementation uses the notification system only. No new database fields added to Review entity.

**Future Enhancement Consideration:**
Could add `reportedBySupplierId` and `reportedAt` fields to Review entity for audit trail.

## Testing Checklist

### Backend Testing
- [ ] Test API endpoint with valid supplier authentication
- [ ] Test with non-supplier roles (should return 403 Forbidden)
- [ ] Test reporting review on own store
- [ ] Test reporting review on another supplier's store (should fail)
- [ ] Test reporting already-spam-marked review (should fail)
- [ ] Test notification sent to all admins
- [ ] Test with invalid reviewId (should return 404)

### Frontend Testing
- [ ] Test report button visibility (hidden for spam-marked reviews)
- [ ] Test modal opening/closing
- [ ] Test reason selection (all 5 options)
- [ ] Test custom reason textarea (appears only for "Khác")
- [ ] Test form validation (reason required, custom text required)
- [ ] Test character limit for custom reason (500 chars)
- [ ] Test successful report submission
- [ ] Test error handling (network errors)
- [ ] Test loading state during submission
- [ ] Test success message display

### Integration Testing
- [ ] End-to-end: Report review → Admin receives notification
- [ ] Notification link redirects to correct admin page
- [ ] Notification content displays correctly
- [ ] Review remains visible after report (not auto-hidden)
- [ ] Multiple reports for same review (should work)

## Files Modified/Created

### Backend
- **Modified:**
  - `ReviewController.java` - Added `reportReview` endpoint
  - `ReviewService.java` - Added `reportReview` interface method
  - `ReviewServiceImpl.java` - Added implementation + dependency injection
  - `NotificationType.java` - Added `REVIEW_REPORTED` enum value

### Frontend
- **Created:**
  - `ReportReviewModal.tsx` - New modal component

- **Modified:**
  - `reviewService.ts` - Added `reportReview` API method
  - `ReviewCard.tsx` - Added report button and `onReport` prop
  - `CustomerReviews.tsx` - Added report modal integration

## Future Enhancements

1. **Admin Moderation Page**
   - Dedicated page to view all reported reviews
   - Filter by report reason
   - Bulk actions (approve/reject multiple reports)
   - Report history and audit trail

2. **Supplier Feedback**
   - Show report status (pending/reviewed/resolved)
   - Admin response/feedback on reports
   - Report history page for suppliers

3. **Analytics**
   - Track report trends
   - Identify patterns (frequently reported customers/products)
   - Measure admin response time

4. **Enhanced Reporting**
   - Upload evidence (screenshots)
   - Tag multiple violations
   - Severity level selection

5. **Automated Filtering**
   - ML-based spam detection
   - Auto-flag suspicious patterns
   - Reduce false reports

## Notes
- Report does not immediately hide the review (admin moderation required)
- Suppliers can report the same review multiple times (no duplicate prevention)
- Report reasons are predefined for consistency
- Notification sent even if service fails (non-blocking)
- Uses existing notification system infrastructure
