# Admin Features Overview

Updated: 2025-11-05

This document summarizes the current features available to Admin roles (SUPER_ADMIN, MODERATOR, STAFF) across the system, based on the admin frontend (`website/fe_admin`) and backend controllers.

## Dashboard
- Dashboard Overview (`/dashboard/overview`)
  - Key KPIs and platform metrics
- Notification Monitor (`/dashboard/notification-monitor`)
  - Monitor email/in-app system notifications

## Partner Management
- Partner List (`/partners/list-partners`)
  - View/search partners, open partner detail
  - Suspend supplier (with reason)
- Approve Partners (`/partners/pending`)
  - Review and approve pending partner registrations
- Approve New Stores (`/partners/store-approval`)
  - Review and approve new store requests
- Partner Performance (`/partners/performance`)
  - Platform-side performance analytics for partners

## Product Management
- All Products (`/products/list-products`)
  - View/search/filter all products
  - View product detail
  - Suspend/Unsuspend product (with reason)
- Category Management (`/products/categories`)
  - Create, edit, deactivate/activate, and delete categories
- Category Suggestions (`/products/category-suggestions`)
  - Review, approve, or reject supplier-proposed categories

## Marketing: Banners & Promotions
- Promotions (`/marketing/promotions`)
  - Manage promotions (create/update, enable/disable)
- Banners (`/marketing/banners`)
  - Manage marketing banners (create/update, publish/unpublish)

## Customer Management
- Customer List (`/customers/list-customers`)
  - View/search customers, open customer detail
- Support & Complaints (`/support/tickets`)
  - Handle customer support tickets and inquiries

## Operations
- Orders (`/orders/list-orders`)
  - View and manage orders lifecycle
- Delivery Management (`/delivery/management`)
  - Coordinate shipments and delivery partners

## Finance
- Reconciliation & Commission (`/finance/reconciliation`)
  - Settlement, commissions, and payout checks
- Transactions (`/finance/transactions`)
  - View transaction history and details
- Wallets (`/finance/wallets`)
  - Monitor platform and partner wallets status

## Employees
- Admin & Staff Management (`/employees/admins`)
  - Manage administrator and staff accounts/roles

## Analysis & Reports
- Revenue Report (`/reports/revenue`)
  - Revenue tracking and summaries
- Customer Behavior (`/reports/behavior`)
  - Behavior analytics and cohorts
- Waste Report (`/reports/waste`)
  - Operational waste/inefficiency reporting

## System
- Roles & Permissions (`/settings/roles`)
  - Manage roles and permission assignments
- System Settings (`/settings/system-settings`)
  - Platform configuration (notifications, thresholds, etc.)
- Audit Log (`/settings/audit-log`)
  - Review administrative activity logs

---

## Key Moderation Capabilities (Admin)
- Suspend Product / Unsuspend Product
  - Backend: `ProductController` → `PATCH /api/products/{id}/suspend` (reason), `PATCH /api/products/{id}/unsuspend`
- Suspend Supplier
  - Backend: `SupplierController` → `PATCH /api/suppliers/{userId}/suspend` (reason)
- Category Governance
  - Backend: `CategoryController`, `CategorySuggestionController`
- Marketing Assets
  - Backend: `PromotionController`, `BannerController`
- System Governance
  - Backend: `AdminController`, `SystemConfigController`, `NotificationController`

Note: Access control is enforced via `@PreAuthorize` on backend controllers for roles `SUPER_ADMIN`, `MODERATOR`, and/or `STAFF` as applicable.
