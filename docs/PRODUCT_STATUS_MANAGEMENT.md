# Product Status Management System

## Overview

The product management system has been redesigned to eliminate manual approval workflows and implement automatic status management based on inventory and expiry dates.

**Key Changes:**
1. **No Approval Required**: Products are set to `ACTIVE` immediately upon creation
2. **Auto SOLD_OUT**: When total inventory reaches 0
3. **Auto EXPIRED**: When any variant passes its expiry date
4. **Auto INACTIVE**: After 1 day of being SOLD_OUT or EXPIRED
5. **Supplier Hide/Show**: Suppliers can toggle between ACTIVE and INACTIVE
6. **Admin Suspension**: Admins can suspend products for policy violations
7. **Soft Delete with Cleanup**: Deletion sets DELETED status and removes Cloudinary images

---

## Product Status Enum

```java
public enum ProductStatus {
    ACTIVE,      // Product is active and available for purchase
    INACTIVE,    // Product is temporarily hidden by supplier or auto-set after 1 day SOLD_OUT/EXPIRED
    SOLD_OUT,    // Product inventory = 0 (auto-set)
    EXPIRED,     // Product has expired variants (auto-set)
    SUSPENDED,   // Product is suspended by admin for policy violation
    DELETED      // Product is soft-deleted (removed from listings)
}
```

---

## Status Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ Product Created by Supplier                                     │
│ Status: ACTIVE (immediately - no approval needed)               │
└────────────────────┬────────────────────────────────────────────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
    ▼                ▼                ▼
┌─────────┐   ┌──────────┐    ┌────────────┐
│ACTIVE   │   │SOLD_OUT  │    │  EXPIRED   │
│(normal) │   │(inv=0)   │    │(past exp.) │
└────┬────┘   └────┬─────┘    └─────┬──────┘
     │             │                │
     │        (after 1 day)    (after 1 day)
     │             │                │
     │             ▼                ▼
     │        ┌─────────────────────────┐
     │        │     INACTIVE            │
     │        │ (auto-set by scheduler) │
     │        └──────────┬──────────────┘
     │                   │
     └───────────────────┘
     │
     ├──> INACTIVE (supplier hides product manually)
     │
     ├──> SUSPENDED (admin suspends for violation)
     │
     └──> DELETED (supplier deletes + Cloudinary cleanup)
```

---

## Automatic Status Updates

### 1. Auto SOLD_OUT (Inventory = 0)

**Trigger:** Total inventory across all variants and stores = 0

**Implementation:**
```java
// Product entity method
public int getTotalInventory() {
    return variants.stream()
            .flatMap(variant -> variant.getStoreProducts().stream())
            .mapToInt(StoreProduct::getStockQuantity)
            .sum();
}

// Auto-update logic
if (product.getTotalInventory() == 0) {
    product.setStatus(ProductStatus.SOLD_OUT);
    product.setSoldOutSince(LocalDate.now());
}
```

**When Checked:**
- After product creation
- After inventory updates (future feature)
- When supplier tries to activate product

---

### 2. Auto EXPIRED (Variant Past Expiry Date)

**Trigger:** Any product variant's expiryDate < today

**Implementation:**
```java
// Product entity method
public boolean hasExpiredVariant() {
    LocalDate today = LocalDate.now();
    return variants.stream()
            .anyMatch(variant -> variant.getExpiryDate() != null
                    && variant.getExpiryDate().isBefore(today));
}

// Auto-update logic
if (product.hasExpiredVariant()) {
    product.setStatus(ProductStatus.EXPIRED);
    product.setExpiredSince(LocalDate.now());
}
```

**When Checked:**
- After product creation
- Daily by scheduler
- When supplier tries to activate product

---

### 3. Auto INACTIVE (1+ Day Old SOLD_OUT/EXPIRED)

**Trigger:** Product has been SOLD_OUT or EXPIRED for more than 1 day

**Implementation:**
```java
// Product entity method
public boolean shouldAutoSetInactive() {
    LocalDate oneDayAgo = LocalDate.now().minusDays(1);

    if (soldOutSince != null && soldOutSince.isBefore(oneDayAgo)) {
        return true;
    }

    if (expiredSince != null && expiredSince.isBefore(oneDayAgo)) {
        return true;
    }

    return false;
}
```

**Scheduler:**
- Runs daily at 3:00 AM
- Finds all SOLD_OUT and EXPIRED products
- Sets to INACTIVE if soldOutSince/expiredSince > 1 day ago

```java
@Scheduled(cron = "0 0 3 * * *") // 3 AM daily
public void autoSetInactiveForOldProducts() {
    List<Product> soldOutProducts = productRepository.findByStatus(ProductStatus.SOLD_OUT);
    List<Product> expiredProducts = productRepository.findByStatus(ProductStatus.EXPIRED);

    for (Product product : allProducts) {
        if (product.shouldAutoSetInactive()) {
            product.setStatus(ProductStatus.INACTIVE);
        }
    }
}
```

---

## Manual Status Changes

### 1. Supplier: Toggle Visibility (ACTIVE ↔ INACTIVE)

**Endpoint:** `PATCH /api/products/{id}/visibility?makeActive=true/false`

**Authorization:** `ROLE_SUPPLIER` (owner only)

**Logic:**
```java
public ProductResponse toggleProductVisibility(String productId, String keycloakId, boolean makeActive) {
    // Validate ownership
    // Check not suspended

    if (makeActive) {
        product.setStatus(ProductStatus.ACTIVE);
        // Re-check inventory and expiry
        checkAndUpdateProductStatus(productId);
    } else {
        product.setStatus(ProductStatus.INACTIVE);
    }
}
```

**Use Cases:**
- Supplier wants to temporarily hide product from customers
- Supplier wants to reactivate previously hidden product
- Product is out of season

**Restrictions:**
- Cannot toggle if product is SUSPENDED (admin must unsuspend first)
- If toggling to ACTIVE, system automatically re-checks inventory/expiry

---

### 2. Admin: Suspend Product (Policy Violation)

**Endpoint:** `PATCH /api/products/{id}/suspend?reason=...`

**Authorization:** `ROLE_SUPER_ADMIN`, `ROLE_MODERATOR`

**Logic:**
```java
public ProductResponse suspendProduct(String productId, String reason) {
    product.setStatus(ProductStatus.SUSPENDED);
    product.setSuspensionReason(reason);
}
```

**Use Cases:**
- Product violates platform policies
- Product has misleading information
- Product is reported by customers

**Fields:**
- `status`: Set to SUSPENDED
- `suspensionReason`: Stored in database for audit

---

### 3. Admin: Unsuspend Product

**Endpoint:** `PATCH /api/products/{id}/unsuspend`

**Authorization:** `ROLE_SUPER_ADMIN`, `ROLE_MODERATOR`

**Logic:**
```java
public ProductResponse unsuspendProduct(String productId) {
    // Validate is suspended

    product.setStatus(ProductStatus.ACTIVE);
    product.setSuspensionReason(null);

    // Re-check inventory and expiry
    checkAndUpdateProductStatus(productId);
}
```

**Restrictions:**
- Only works on SUSPENDED products
- After unsuspension, system re-checks inventory/expiry (may auto-set to SOLD_OUT/EXPIRED)

---

### 4. Supplier: Soft Delete Product

**Endpoint:** `DELETE /api/products/{id}`

**Authorization:** `ROLE_SUPPLIER` (owner only)

**Logic:**
```java
public void deleteProduct(String productId, String keycloakId) {
    // Validate ownership

    // Collect all image URLs
    List<String> imageUrls = new ArrayList<>();
    product.getImages().forEach(img -> imageUrls.add(img.getImageUrl()));
    product.getVariants().forEach(variant ->
            variant.getVariantImages().forEach(img -> imageUrls.add(img.getImageUrl())));

    // Soft delete
    product.setStatus(ProductStatus.DELETED);
    productRepository.save(product);

    // Delete from Cloudinary
    for (String imageUrl : imageUrls) {
        fileStorageService.deleteFile(imageUrl);
    }
}
```

**Features:**
- Sets status to DELETED
- Deletes all product images from Cloudinary
- Deletes all variant images from Cloudinary
- Continues even if some deletions fail (logs errors)
- Product remains in database for audit purposes

---

## Frontend Implementation Guide

### Product Listing

**Hide Products with Status:**
- `INACTIVE`
- `SOLD_OUT`
- `EXPIRED`
- `SUSPENDED`
- `DELETED`

**Show Only:**
- `ACTIVE` products

**UI Indicators:**
```tsx
const getProductBadge = (status: ProductStatus) => {
  switch (status) {
    case 'SOLD_OUT':
      return <Badge color="gray">Hết hàng</Badge>;
    case 'EXPIRED':
      return <Badge color="red">Hết hạn</Badge>;
    case 'SUSPENDED':
      return <Badge color="orange">Bị khóa</Badge>;
    case 'INACTIVE':
      return <Badge color="gray">Đã ẩn</Badge>;
    default:
      return null;
  }
};
```

---

### Product Detail Page (Customer View)

**SOLD_OUT Status:**
```tsx
if (product.status === 'SOLD_OUT') {
  return (
    <div className="out-of-stock">
      <Button disabled className="gray-out">
        Hết hàng
      </Button>
      <p>Sản phẩm tạm thời hết hàng</p>
    </div>
  );
}
```

**EXPIRED Status:**
```tsx
if (product.status === 'EXPIRED') {
  return (
    <div className="expired">
      <Button disabled className="gray-out">
        Hết hạn
      </Button>
      <p>Sản phẩm đã hết hạn sử dụng</p>
    </div>
  );
}
```

---

### Supplier Dashboard

**Product Actions:**
```tsx
const ProductActions = ({ product }) => {
  const canToggle = product.status !== 'SUSPENDED';
  const isActive = product.status === 'ACTIVE';

  return (
    <>
      {canToggle && (
        <Button onClick={() => toggleVisibility(product.id, !isActive)}>
          {isActive ? 'Ẩn sản phẩm' : 'Hiện sản phẩm'}
        </Button>
      )}

      {product.status === 'SUSPENDED' && (
        <Alert color="warning">
          Sản phẩm bị khóa bởi admin: {product.suspensionReason}
        </Alert>
      )}

      <Button color="danger" onClick={() => deleteProduct(product.id)}>
        Xóa sản phẩm
      </Button>
    </>
  );
};
```

---

### Admin Dashboard

**Product Moderation:**
```tsx
const AdminProductActions = ({ product }) => {
  return (
    <>
      {product.status !== 'SUSPENDED' && (
        <Button color="warning" onClick={() => suspendProduct(product.id)}>
          Khóa sản phẩm
        </Button>
      )}

      {product.status === 'SUSPENDED' && (
        <Button color="success" onClick={() => unsuspendProduct(product.id)}>
          Mở khóa sản phẩm
        </Button>
      )}
    </>
  );
};
```

---

## API Reference

### Supplier Endpoints

#### Toggle Product Visibility
```http
PATCH /api/products/{id}/visibility?makeActive=true
Authorization: Bearer {token}
```

**Response:**
```json
{
  "status": "SUCCESS",
  "message": "Product visibility updated successfully",
  "data": {
    "productId": "uuid",
    "name": "Product Name",
    "status": "ACTIVE",
    ...
  }
}
```

#### Delete Product
```http
DELETE /api/products/{id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "status": "SUCCESS",
  "message": "Product deleted successfully and images removed from cloud storage",
  "data": null
}
```

---

### Admin Endpoints

#### Suspend Product
```http
PATCH /api/products/{id}/suspend?reason=Policy+violation
Authorization: Bearer {token}
```

**Response:**
```json
{
  "status": "SUCCESS",
  "message": "Product suspended successfully",
  "data": {
    "productId": "uuid",
    "status": "SUSPENDED",
    "suspensionReason": "Policy violation",
    ...
  }
}
```

#### Unsuspend Product
```http
PATCH /api/products/{id}/unsuspend
Authorization: Bearer {token}
```

**Response:**
```json
{
  "status": "SUCCESS",
  "message": "Product unsuspended successfully",
  "data": {
    "productId": "uuid",
    "status": "ACTIVE",  // or SOLD_OUT/EXPIRED if auto-checked
    "suspensionReason": null,
    ...
  }
}
```

---

## Database Schema Changes

### Product Table

```sql
ALTER TABLE products
ADD COLUMN sold_out_since DATE,
ADD COLUMN expired_since DATE,
ADD COLUMN suspension_reason VARCHAR(500);

-- Update default status for new products
ALTER TABLE products
MODIFY COLUMN status VARCHAR(20) DEFAULT 'ACTIVE';
```

### Migration Script

```sql
-- Set existing PENDING_APPROVAL products to ACTIVE
UPDATE products
SET status = 'ACTIVE'
WHERE status = 'PENDING_APPROVAL';

-- Set existing APPROVED products to ACTIVE
UPDATE products
SET status = 'ACTIVE'
WHERE status = 'APPROVED';

-- Set existing REJECTED products to INACTIVE
UPDATE products
SET status = 'INACTIVE'
WHERE status = 'REJECTED';
```

---

## Testing Checklist

### Unit Tests
- [ ] Product.getTotalInventory() calculates correctly
- [ ] Product.hasExpiredVariant() detects expired variants
- [ ] Product.shouldAutoSetInactive() returns true after 1 day
- [ ] toggleProductVisibility() validates ownership
- [ ] toggleProductVisibility() blocks if SUSPENDED
- [ ] suspendProduct() stores suspension reason
- [ ] deleteProduct() collects all image URLs
- [ ] checkAndUpdateProductStatus() sets correct status

### Integration Tests
- [ ] Create product → status is ACTIVE
- [ ] Create product with 0 inventory → status is SOLD_OUT
- [ ] Create product with expired variant → status is EXPIRED
- [ ] Toggle to INACTIVE → status changes
- [ ] Toggle to ACTIVE with 0 inventory → stays SOLD_OUT
- [ ] Suspend product → status is SUSPENDED
- [ ] Try toggle while SUSPENDED → throws error
- [ ] Unsuspend product → status is ACTIVE (or auto-checked)
- [ ] Delete product → Cloudinary files deleted

### Scheduler Tests
- [ ] Scheduler runs at 3 AM
- [ ] Products SOLD_OUT for 2 days → set to INACTIVE
- [ ] Products EXPIRED for 2 days → set to INACTIVE
- [ ] Products SOLD_OUT for < 1 day → remain SOLD_OUT

---

## Monitoring & Alerts

### Metrics to Track
- **Auto SOLD_OUT Count**: How many products run out of stock daily
- **Auto EXPIRED Count**: How many products expire daily
- **Auto INACTIVE Count**: How many products auto-hidden daily
- **Suspension Count**: How many products suspended by admins
- **Deletion Count**: How many products deleted by suppliers
- **Cloudinary Cleanup Success Rate**: % of image deletions that succeed

### Log Examples
```
INFO - Product abc123 auto-set to SOLD_OUT (inventory = 0)
INFO - Product def456 auto-set to EXPIRED (variants have passed expiry date)
INFO - Product ghi789 auto-set to INACTIVE (old SOLD_OUT/EXPIRED)
INFO - Product jkl012 suspended by admin. Reason: Misleading description
INFO - Product mno345 soft deleted by supplier with 5 images cleaned up
ERROR - Failed to delete image from Cloudinary: https://...
```

---

## Breaking Changes

### Removed Endpoints
- `PATCH /api/products/{id}/approve` ❌ (no longer needed)
- `PATCH /api/products/{id}/reject` ❌ (no longer needed)
- `PATCH /api/products/{id}/status` ❌ (replaced by `/visibility`)

### Removed Status Values
- `PENDING_APPROVAL` ❌
- `APPROVED` ❌
- `REJECTED` ❌

### New Endpoints
- `PATCH /api/products/{id}/visibility` ✅
- `PATCH /api/products/{id}/suspend` ✅
- `PATCH /api/products/{id}/unsuspend` ✅

---

## Migration Guide

### Backend Migration
1. Run database schema updates (add new columns)
2. Run data migration script (convert old statuses)
3. Deploy new code with updated ProductServiceImpl
4. Verify scheduler is registered in SchedulingConfig

### Frontend Migration
1. Remove approval workflow UI
2. Update product creation message (no "waiting for approval")
3. Add visibility toggle button for suppliers
4. Add suspension UI for admins
5. Update product listing filters (remove PENDING_APPROVAL)
6. Add status badges for SOLD_OUT, EXPIRED, SUSPENDED
7. Gray out purchase button for SOLD_OUT/EXPIRED products

---

## FAQ

**Q: What happens if inventory is restocked?**
A: When supplier adds inventory (future feature), checkAndUpdateProductStatus() will auto-restore product from SOLD_OUT to ACTIVE.

**Q: Can suppliers delete suspended products?**
A: Yes, deletion works regardless of status.

**Q: Are deleted products permanently removed?**
A: No, soft delete keeps product in database with DELETED status. Only images are removed from Cloudinary.

**Q: Can admins unsuspend DELETED products?**
A: No, DELETED is final (unless manually restored in database).

**Q: What if Cloudinary deletion fails?**
A: The system logs the error and continues deleting other images. Product status is still set to DELETED.

**Q: How do I restore accidentally deleted products?**
A: Contact admin to manually update status in database. Images cannot be restored.
