# Frontend Services Documentation

Complete API documentation for all frontend services implemented in both admin and supplier portals.

---

## Table of Contents

1. [Admin Portal Services](#admin-portal-services)
   - [Customer Service](#customer-service-admin)
   - [Notification Service](#notification-service)
   - [Store Service (Admin)](#store-service-admin)
   - [Existing Services](#existing-admin-services)

2. [Supplier Portal Services](#supplier-portal-services)
   - [Store Service (Supplier)](#store-service-supplier)
   - [Existing Services](#existing-supplier-services)

3. [Common Components](#common-components)
   - [Protected Route](#protected-route)

---

## Admin Portal Services

### Customer Service (Admin)

**Location:** `/website/fe_admin/app/service/customerService.ts`

**Description:** Admin operations for viewing and managing customers.

#### Methods

##### Get Customer by ID
```typescript
getCustomerById(userId: string): Promise<CustomerResponse>
```

**Example:**
```typescript
import customerService from '~/service/customerService';

const customer = await customerService.getCustomerById('customer-uuid-123');
console.log(customer.fullName, customer.status, customer.tier);
```

##### Get All Customers (Paginated)
```typescript
getAllCustomers(params: {
  page?: number;
  size?: number;
  status?: string;
  tier?: string;
  search?: string;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}): Promise<PageResponse<CustomerResponse>>
```

**Example:**
```typescript
const customers = await customerService.getAllCustomers({
  page: 0,
  size: 20,
  status: 'ACTIVE',
  tier: 'GOLD',
  search: 'john',
  sortBy: 'createdAt',
  sortDirection: 'DESC'
});

console.log(`Total: ${customers.totalElements}`);
customers.content.forEach(c => console.log(c.fullName));
```

##### Set Customer Active Status
```typescript
setActiveStatus(userId: string, active: boolean): Promise<CustomerResponse>
```

**Example:**
```typescript
// Suspend customer
const updated = await customerService.setActiveStatus('customer-uuid-123', false);
console.log('Customer suspended:', updated.active);
```

##### Get Customer Statistics
```typescript
getCustomerStats(): Promise<{
  total: number;
  active: number;
  pending: number;
  suspended: number;
  byTier: { tier: string; count: number }[];
}>
```

**Example:**
```typescript
const stats = await customerService.getCustomerStats();
console.log(`Total customers: ${stats.total}`);
console.log(`Active: ${stats.active}`);
```

---

### Notification Service

**Location:** `/website/fe_admin/app/service/notificationService.ts`

**Description:** Admin operations for monitoring and managing email notifications.

#### Methods

##### Get Failed Notifications
```typescript
getFailedNotifications(): Promise<PendingNotification[]>
```

**Example:**
```typescript
import notificationService from '~/service/notificationService';

const failed = await notificationService.getFailedNotifications();
failed.forEach(n => console.log(`Failed: ${n.recipientEmail} - ${n.lastError}`));
```

##### Get Pending Notifications
```typescript
getPendingNotifications(): Promise<PendingNotification[]>
```

**Example:**
```typescript
const pending = await notificationService.getPendingNotifications();
console.log(`${pending.length} notifications waiting to be sent`);
```

##### Get Notification Statistics
```typescript
getNotificationStats(): Promise<NotificationStats>
```

**Example:**
```typescript
const stats = await notificationService.getNotificationStats();
console.log(`Pending: ${stats.pending}, Sent: ${stats.sent}, Failed: ${stats.failed}`);
```

##### Retry Failed Notification
```typescript
retryNotification(notificationId: string): Promise<string>
```

**Example:**
```typescript
const result = await notificationService.retryNotification('notif-uuid-123');
console.log(result); // "Notification sent successfully"
```

##### Process All Pending Notifications (Super Admin Only)
```typescript
processPendingNotifications(): Promise<{ processedCount: number }>
```

**Example:**
```typescript
const result = await notificationService.processPendingNotifications();
console.log(`Processed ${result.processedCount} notifications`);
```

---

### Store Service (Admin)

**Location:** `/website/fe_admin/app/service/storeService.ts`

**Description:** Admin operations for managing stores and pending updates.

#### Methods

##### Get Store by ID
```typescript
getStoreById(storeId: string): Promise<StoreResponse>
```

**Example:**
```typescript
import storeService from '~/service/storeService';

const store = await storeService.getStoreById('store-uuid-123');
console.log(store.name, store.status, store.address);
```

##### Get All Stores (Admin View)
```typescript
getAllStores(params: {
  page?: number;
  size?: number;
  status?: string;
  supplierId?: string;
  search?: string;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}): Promise<PageResponse<StoreResponse>>
```

**Example:**
```typescript
const stores = await storeService.getAllStores({
  page: 0,
  size: 20,
  status: 'PENDING',
  search: 'restaurant',
});

stores.content.forEach(s => console.log(`${s.name} - ${s.status}`));
```

##### Approve Pending Store
```typescript
approveStore(storeId: string, adminNotes?: string): Promise<StoreResponse>
```

**Example:**
```typescript
const approved = await storeService.approveStore(
  'store-uuid-123',
  'All documents verified'
);
console.log('Store approved:', approved.name);
```

##### Reject Pending Store
```typescript
rejectStore(storeId: string, adminNotes: string): Promise<StoreResponse>
```

**Example:**
```typescript
const rejected = await storeService.rejectStore(
  'store-uuid-123',
  'Business license expired'
);
console.log('Store rejected');
```

##### Get All Pending Store Updates
```typescript
getAllPendingUpdates(params: {
  page?: number;
  size?: number;
  status?: string;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}): Promise<PageResponse<StorePendingUpdateResponse>>
```

**Example:**
```typescript
const updates = await storeService.getAllPendingUpdates({
  page: 0,
  size: 20,
  status: 'PENDING',
});

console.log(`${updates.totalElements} pending updates`);
```

##### Approve Store Update
```typescript
approveStoreUpdate(updateId: string, adminNotes?: string): Promise<StorePendingUpdateResponse>
```

**Example:**
```typescript
const approved = await storeService.approveStoreUpdate(
  'update-uuid-123',
  'Update approved'
);
console.log('Update applied:', approved.status);
```

##### Reject Store Update
```typescript
rejectStoreUpdate(updateId: string, adminNotes: string): Promise<StorePendingUpdateResponse>
```

**Example:**
```typescript
const rejected = await storeService.rejectStoreUpdate(
  'update-uuid-123',
  'New address not verified'
);
```

---

### Existing Admin Services

#### Admin Service
**Location:** `/website/fe_admin/app/service/adminService.ts`
- Admin CRUD operations
- Admin registration, update, delete

#### Auth Service
**Location:** `/website/fe_admin/app/service/authService.ts`
- Login, logout, token refresh
- Get current user info

#### Category Service
**Location:** `/website/fe_admin/app/service/categoryService.ts`
- Category CRUD with image upload

#### Category Suggestion Service
**Location:** `/website/fe_admin/app/service/categorySuggestionService.ts`
- Supplier category suggestions approval

#### File Storage Service
**Location:** `/website/fe_admin/app/service/fileStorageService.ts`
- Upload files to Cloudinary

#### Partner Performance Service
**Location:** `/website/fe_admin/app/service/partnerPerformanceService.ts`
- Supplier performance metrics

#### Product Service
**Location:** `/website/fe_admin/app/service/productService.ts`
- Product CRUD operations
- Product approval/rejection

#### Promotion Service
**Location:** `/website/fe_admin/app/service/promotionService.ts`
- Promotion CRUD operations (admin only)
- Create, update, delete promotions

#### Supplier Service
**Location:** `/website/fe_admin/app/service/supplierService.ts`
- Supplier management
- Approval/rejection

#### Store Update Service
**Location:** `/website/fe_admin/app/service/storeUpdateService.ts`
- Store pending update management

---

## Supplier Portal Services

**Note:** Suppliers do NOT have access to promotion management or usage. Promotions are exclusively for customer incentives and are managed by admins only.

---

### Store Service (Supplier)

**Location:** `/website/fe_supplier/app/service/storeService.ts`

**Description:** Supplier's store management operations.

#### Methods

##### Get My Stores
```typescript
getMyStores(params: {
  page?: number;
  size?: number;
  status?: StoreStatus;
  search?: string;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}): Promise<PageResponse<StoreResponse>>
```

**Example:**
```typescript
import storeService from '~/service/storeService';

const myStores = await storeService.getMyStores({
  page: 0,
  size: 10,
  status: 'ACTIVE',
});

myStores.content.forEach(store => {
  const address = storeService.formatFullAddress(store);
  console.log(`${store.name} - ${address}`);
});
```

##### Get Store by ID
```typescript
getStoreById(storeId: string): Promise<StoreResponse>
```

**Example:**
```typescript
const store = await storeService.getStoreById('store-uuid-123');
console.log(store.name, store.status);
```

##### Create New Store
```typescript
createStore(data: StoreCreateRequest): Promise<StoreResponse>
```

**Example:**
```typescript
const newStore = await storeService.createStore({
  name: 'My Restaurant',
  address: '123 Main St',
  ward: 'Ward 1',
  district: 'District 1',
  city: 'Ho Chi Minh',
  phoneNumber: '0912345678',
  email: 'restaurant@example.com',
  imageUrls: ['https://cloudinary.com/image1.jpg'],
  openingHours: '8:00 AM - 10:00 PM',
});

console.log('Store created, status:', newStore.status); // PENDING
```

##### Update Store Information
```typescript
updateStore(storeId: string, data: StoreUpdateRequest): Promise<StoreUpdateResponse>
```

**Example:**
```typescript
const result = await storeService.updateStore('store-uuid-123', {
  description: 'Updated description', // IMMEDIATE
  openingHours: '9:00 AM - 11:00 PM', // IMMEDIATE
});

if (result.updateType === 'IMMEDIATE') {
  console.log('Changes applied immediately');
} else {
  console.log('Changes pending admin approval');
}

// Check if update requires approval
const changes = { name: 'New Name', address: 'New Address' };
if (storeService.requiresApproval(changes)) {
  console.log('This update will require admin approval');
}
```

##### Get Pending Updates for Store
```typescript
getPendingUpdatesByStore(storeId: string, params: {
  page?: number;
  size?: number;
}): Promise<PageResponse<StorePendingUpdateResponse>>
```

**Example:**
```typescript
const updates = await storeService.getPendingUpdatesByStore('store-uuid-123', {
  page: 0,
  size: 10,
});

updates.content.forEach(update => {
  console.log('Status:', update.status);
  console.log('Requested changes:', update.requestedChanges);
  if (update.adminNotes) {
    console.log('Admin notes:', update.adminNotes);
  }
});
```

##### Get Pending Update by ID
```typescript
getPendingUpdateById(updateId: string): Promise<StorePendingUpdateResponse>
```

**Example:**
```typescript
const update = await storeService.getPendingUpdateById('update-uuid-123');
console.log('Current name:', update.currentValues.name);
console.log('Requested name:', update.requestedChanges.name);
```

##### Utility Methods

```typescript
// Get Vietnamese status label
storeService.getStatusLabel('ACTIVE'); // "Hoạt động"
storeService.getStatusLabel('PENDING'); // "Chờ duyệt"

// Get CSS class for status badge
storeService.getStatusColorClass('ACTIVE'); // "bg-green-100 text-green-800"

// Format full address
const fullAddress = storeService.formatFullAddress(store);
// "123 Main St, Ward 1, District 1, Ho Chi Minh"

// Check if changes require approval
const needsApproval = storeService.requiresApproval({
  name: 'New Name', // Major change - needs approval
  description: 'New description', // Minor change - immediate
});
```

---

### Existing Supplier Services

#### Auth Service
**Location:** `/website/fe_supplier/app/service/authService.ts`
- Supplier registration (4 steps)
- Login, logout

#### Category Service
**Location:** `/website/fe_supplier/app/service/categoryService.ts`
- View categories (read-only)

#### Category Suggestion Service
**Location:** `/website/fe_supplier/app/service/categorySuggestionService.ts`
- Submit category suggestions

#### File Storage Service
**Location:** `/website/fe_supplier/app/service/fileStorageService.ts`
- Upload files to Cloudinary

#### Product Service
**Location:** `/website/fe_supplier/app/service/productService.ts`
- Product CRUD operations
- View product review status

#### Supplier Service
**Location:** `/website/fe_supplier/app/service/supplierService.ts`
- Supplier profile management

---

## Common Components

### Protected Route

**Location (Admin):** `/website/fe_admin/app/component/common/ProtectedRoute.tsx`
**Location (Supplier):** `/website/fe_supplier/app/component/common/ProtectedRoute.tsx`

**Description:** Component to protect routes with authentication and role-based access control.

#### Features
- ✅ Redirects to login if not authenticated
- ✅ Shows loading spinner while checking auth
- ✅ Role-based access control with multiple format support
- ✅ Shows "Access Denied" UI when unauthorized
- ✅ Development mode debug logging

#### Usage

**Basic Protection (Authentication Only)**
```typescript
import ProtectedRoute from '~/component/common/ProtectedRoute';

<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>
```

**With Role Requirements**
```typescript
// Admin Portal - require SUPER_ADMIN or MODERATOR
<ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR']}>
  <AdminPanel />
</ProtectedRoute>

// Supplier Portal - require SUPPLIER role
<ProtectedRoute requiredRoles={['SUPPLIER']}>
  <SupplierDashboard />
</ProtectedRoute>
```

#### Role Format Support

The component supports multiple role formats:
- `ROLE_SUPER_ADMIN`
- `SUPER_ADMIN`
- `super-admin`
- `super_admin`

All formats are normalized for comparison, so you can use any format consistently.

#### Props

```typescript
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[]; // Optional array of required roles
}
```

---

## API Response Types

### Common Types

```typescript
// Standard API Response
interface ApiResponse<T> {
  status: string;       // "SUCCESS" or "ERROR"
  message: string;      // Response message
  data: T;             // Response data
  timestamp: string;   // ISO timestamp
}

// Paginated Response
interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;      // Current page (0-indexed)
  first: boolean;      // Is first page
  last: boolean;       // Is last page
  empty: boolean;      // Is empty
}
```

---

## Error Handling

All services throw errors with user-friendly Vietnamese messages:

```typescript
try {
  const result = await customerService.getCustomerById('invalid-id');
} catch (error: any) {
  console.error(error.message); // "Không thể tải thông tin khách hàng"

  // Display to user
  showToast(error.message, 'error');
}
```

---

## Best Practices

### 1. Always Handle Errors
```typescript
try {
  const data = await service.someMethod();
  // Handle success
} catch (error: any) {
  // Handle error with user-friendly message
  showToast(error.message, 'error');
}
```

### 2. Use Pagination for Lists
```typescript
const [page, setPage] = useState(0);
const [data, setData] = useState<PageResponse<any>>();

useEffect(() => {
  const fetchData = async () => {
    const result = await service.getAll({ page, size: 20 });
    setData(result);
  };
  fetchData();
}, [page]);
```

### 3. Debounce Search Inputs
```typescript
import { debounce } from 'lodash';

const handleSearch = debounce(async (query: string) => {
  const results = await service.search({ search: query });
  setResults(results);
}, 500);
```

### 4. Show Loading States
```typescript
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    await service.create(data);
    showToast('Success!', 'success');
  } catch (error: any) {
    showToast(error.message, 'error');
  } finally {
    setLoading(false);
  }
};
```

### 5. Use Protected Routes for Sensitive Pages
```typescript
<ProtectedRoute requiredRoles={['SUPER_ADMIN']}>
  <SensitivePage />
</ProtectedRoute>
```

---

## Summary of New Services

### Admin Portal (fe_admin)
- ✅ **customerService.ts** - Customer management (view, update status)
- ✅ **notificationService.ts** - Email notification monitoring
- ✅ **storeService.ts** - Store and pending update management

### Supplier Portal (fe_supplier)
- ✅ **storeService.ts** - Complete store CRUD operations
- ❌ **promotionService.ts** - Removed (suppliers cannot use promotions)

### Both Portals
- ✅ **ProtectedRoute.tsx** - Synchronized authentication component

---

## Migration Guide

If you're migrating from old code, replace:

### Old Pattern
```typescript
const response = await axios.get('/api/customers/123');
const customer = response.data.data;
```

### New Pattern
```typescript
import customerService from '~/service/customerService';
const customer = await customerService.getCustomerById('123');
```

---

## Support

For questions or issues:
1. Check this documentation first
2. Review backend API documentation in `/backend/CLAUDE.md`
3. Check backend controller files for endpoint details
4. Review service implementation files for examples

---

## Changelog

**2025-01-26:**
- ❌ Removed promotionService.ts from fe_supplier (promotions are customer-only)
- ✅ Updated documentation to reflect promotion access rules

**2025-01-25:**
- ✅ Created customerService.ts for fe_admin
- ✅ Created notificationService.ts for fe_admin
- ✅ Created storeService.ts for fe_admin
- ✅ Updated storeService.ts for fe_supplier with all endpoints
- ✅ Synchronized ProtectedRoute components
- ✅ Created comprehensive documentation
