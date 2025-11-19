# 📋 Phân Quyền Admin - SaveFood Platform

## 🎯 Tổng Quan Cấp Bậc

```
┌─────────────────────────────────────────────────────────┐
│                     SUPER_ADMIN                          │
│              🔴 Quản trị viên cấp cao                    │
│                   Toàn quyền hệ thống                    │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                      MODERATOR                           │
│              🔵 Kiểm soát viên (Cấp trung)              │
│        Giám sát, kiểm tra, phát hiện vi phạm            │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                        STAFF                             │
│              🟡 Nhân viên vận hành (Cấp thấp)           │
│              Thực hiện công việc hàng ngày              │
└─────────────────────────────────────────────────────────┘
```

---

## 🔴 SUPER_ADMIN (Quản trị viên cấp cao)

### Đặc quyền
- ✅ **Toàn quyền** trên toàn bộ hệ thống
- ✅ Quyết định cuối cùng cho mọi thao tác quan trọng
- ✅ Quản lý tài khoản admin khác (MODERATOR, STAFF)
- ✅ Truy cập tất cả dữ liệu tài chính
- ✅ Cấu hình hệ thống và phân quyền

### Chi tiết chức năng

#### 📊 Dashboard
- ✅ Xem tất cả chỉ số chi tiết
- ✅ Phân tích sâu về doanh thu, đơn hàng, khách hàng
- ✅ Theo dõi real-time performance

#### 👥 Quản lý Nhân viên (`/employees`)
- ✅ **Xem** danh sách admin, staff, MODERATOR
- ✅ **Tạo** tài khoản admin mới
- ✅ **Chỉnh sửa** thông tin và phân quyền
- ✅ **Xóa/khóa** tài khoản admin
- ✅ **Xem** lịch sử hoạt động của tất cả admin

#### 🤝 Quản lý Đối tác (`/partners`)
- ✅ **Xem** tất cả supplier và store
- ✅ **Duyệt/từ chối** supplier pending
- ✅ **Duyệt/từ chối** store approval
- ✅ **Chỉnh sửa** thông tin supplier/store
- ✅ **Khóa vĩnh viễn** tài khoản vi phạm
- ✅ **Xóa** tài khoản
- ✅ **Xem** performance chi tiết
- ✅ **Chat** với supplier
- ✅ **Xem** business updates

#### 👤 Quản lý Khách hàng (`/customers`)
- ✅ **Xem** danh sách và chi tiết
- ✅ **Xem** dữ liệu tài chính nhạy cảm
- ✅ **Chỉnh sửa** thông tin
- ✅ **Thay đổi** tier membership
- ✅ **Khóa vĩnh viễn** tài khoản
- ✅ **Xóa** tài khoản
- ✅ **Xử lý** support tickets

#### 📦 Quản lý Sản phẩm (`/products`)
- ✅ **Xem** tất cả sản phẩm
- ✅ **Chỉnh sửa** thông tin sản phẩm
- ✅ **Xóa** sản phẩm vi phạm
- ✅ **Phê duyệt** sản phẩm mới
- ✅ **Quản lý** danh mục (create, edit, delete)
- ✅ **Duyệt/từ chối** category suggestions

#### 💰 Quản lý Tài chính (`/finance`)
- ✅ **Xem** tất cả giao dịch
- ✅ **Thực hiện** đối soát
- ✅ **Xử lý** hoàn tiền
- ✅ **Chuyển tiền** cho supplier
- ✅ **Phát hiện** giao dịch bất thường

#### 🎯 Marketing (`/marketing`)
- ✅ **Tạo/sửa/xóa** banner
- ✅ **Tạo** khuyến mãi platform-wide lớn
- ✅ **Duyệt** khuyến mãi của supplier
- ✅ **Chỉnh sửa/xóa** khuyến mãi

#### 📈 Báo cáo (`/reports`)
- ✅ **Xem** tất cả báo cáo (doanh thu, lãng phí, hành vi)
- ✅ **Xuất** báo cáo Excel/PDF
- ✅ **Phân tích** sâu dữ liệu

#### 🔧 Cài đặt (`/settings`)
- ✅ **Cấu hình** hệ thống
- ✅ **Quản lý** phân quyền
- ✅ **Xem** audit log
- ✅ **Thay đổi** chính sách platform

#### 💬 Hỗ trợ (`/support`)
- ✅ **Xử lý** ticket phức tạp
- ✅ **Chat** với customer và supplier
- ✅ **Đánh giá** chất lượng xử lý của staff

---

## 🔵 MODERATOR (Kiểm soát viên - Cấp trung)

### Đặc quyền
- ⚠️ **Giám sát và kiểm soát** chất lượng
- ⚠️ **Phát hiện và cảnh báo** vi phạm
- ⚠️ **Tạm khóa** tài khoản (pending SUPER_ADMIN xác nhận)
- ⚠️ **Full access** báo cáo và phân tích
- ⚠️ **Xem** hoạt động của STAFF
- ❌ **KHÔNG** được quản lý admin khác
- ❌ **KHÔNG** thực hiện giao dịch tài chính

### Chi tiết chức năng

#### 📊 Dashboard
- ✅ Xem tất cả chỉ số chi tiết (giống SUPER_ADMIN)
- ✅ Phân tích performance
- ✅ MODERATOR real-time

#### 👥 Quản lý Nhân viên
- ⚠️ **Xem** hoạt động của STAFF
- ⚠️ **Đánh giá** hiệu suất STAFF
- ❌ **KHÔNG** tạo/sửa/xóa admin

#### 🤝 Quản lý Đối tác
- ✅ **Xem** tất cả supplier và store
- ✅ **Xem** performance chi tiết
- ⚠️ **Cảnh báo** vi phạm
- ⚠️ **Tạm khóa** tài khoản (pending review)
- ✅ **Chat** với supplier
- ❌ **KHÔNG** duyệt supplier mới
- ❌ **KHÔNG** khóa vĩnh viễn hoặc xóa

#### 👤 Quản lý Khách hàng
- ✅ **Xem** danh sách và chi tiết đầy đủ
- ✅ **Xem** dữ liệu tài chính
- ⚠️ **Cảnh báo** khách hàng vi phạm
- ⚠️ **Tạm khóa** tài khoản đáng ngờ
- ✅ **Xử lý** support tickets phức tạp
- ❌ **KHÔNG** xóa tài khoản
- ❌ **KHÔNG** thay đổi tier

#### 📦 Quản lý Sản phẩm
- ✅ **Xem** tất cả sản phẩm
- ✅ **Xóa** sản phẩm vi phạm
- ✅ **Phê duyệt** sản phẩm mới
- ✅ **Duyệt/từ chối** category suggestions
- ❌ **KHÔNG** tạo/sửa danh mục chính

#### 💰 Quản lý Tài chính
- ✅ **Xem** tất cả giao dịch
- ⚠️ **Phát hiện** và đánh dấu giao dịch bất thường
- ⚠️ **Yêu cầu** đối soát (không thực hiện)
- ❌ **KHÔNG** thực hiện hoàn tiền
- ❌ **KHÔNG** chuyển tiền

#### 🎯 Marketing
- ✅ **Xem** tất cả campaign
- ✅ **Tạo/sửa/xóa** banner
- ✅ **Duyệt/từ chối** khuyến mãi của supplier
- ❌ **KHÔNG** tạo khuyến mãi platform-wide lớn

#### 📈 Báo cáo
- ✅ **Full access** - Xem tất cả báo cáo
- ✅ **Xuất** báo cáo
- ✅ **Phân tích** sâu dữ liệu tài chính

#### 🔧 Cài đặt
- ✅ **Xem** audit log của tất cả user
- ✅ **Theo dõi** hoạt động STAFF
- ❌ **KHÔNG** thay đổi cấu hình hệ thống
- ❌ **KHÔNG** quản lý phân quyền

#### 💬 Hỗ trợ
- ✅ **Xử lý** ticket phức tạp
- ✅ **Chat** với customer và supplier
- ✅ **Đánh giá** chất lượng xử lý của STAFF

---

## 🟡 STAFF (Nhân viên vận hành - Cấp thấp)

### Đặc quyền
- ✅ **Thực hiện** công việc hàng ngày
- ✅ **Hỗ trợ** khách hàng
- ✅ **Duyệt** các yêu cầu đơn giản
- ❌ **KHÔNG** xem dữ liệu tài chính nhạy cảm
- ❌ **KHÔNG** khóa/xóa tài khoản
- ❌ **KHÔNG** xem audit log

### Chi tiết chức năng

#### 📊 Dashboard
- ⚠️ **Xem** chỉ số cơ bản liên quan công việc
- ⚠️ **Không** xem dữ liệu tài chính chi tiết

#### 👥 Quản lý Nhân viên
- ❌ **KHÔNG** có quyền

#### 🤝 Quản lý Đối tác
- ✅ **Xem** danh sách supplier và store
- ✅ **Duyệt/từ chối** supplier pending (công việc routine)
- ✅ **Duyệt/từ chối** store approval
- ✅ **Chat** với supplier
- ✅ **Xem** business updates
- ❌ **KHÔNG** khóa tài khoản
- ❌ **KHÔNG** sửa thông tin nhạy cảm
- ❌ **KHÔNG** xem performance chi tiết

#### 👤 Quản lý Khách hàng
- ✅ **Xem** danh sách và chi tiết cơ bản
- ✅ **Xử lý** support tickets đơn giản
- ❌ **KHÔNG** xem dữ liệu tài chính
- ❌ **KHÔNG** khóa tài khoản
- ❌ **KHÔNG** thay đổi thông tin quan trọng

#### 📦 Quản lý Sản phẩm
- ✅ **Xem** sản phẩm
- ✅ **Duyệt** category suggestions đơn giản
- ❌ **KHÔNG** xóa sản phẩm
- ❌ **KHÔNG** sửa danh mục

#### 💰 Quản lý Tài chính
- ❌ **KHÔNG** có quyền truy cập

#### 🎯 Marketing
- ✅ **Xem** campaign
- ✅ **Tạo/sửa** banner nhỏ
- ✅ **Xem** khuyến mãi
- ❌ **KHÔNG** tạo/duyệt khuyến mãi

#### 📈 Báo cáo
- ⚠️ **Xem** báo cáo cơ bản (không bao gồm tài chính)
- ❌ **KHÔNG** xuất báo cáo
- ❌ **KHÔNG** xem báo cáo doanh thu, lãng phí, hành vi

#### 🔧 Cài đặt
- ❌ **KHÔNG** có quyền

#### 💬 Hỗ trợ
- ✅ **Xử lý** ticket đơn giản
- ✅ **Chat** với customer và supplier
- ❌ **KHÔNG** xử lý ticket phức tạp (escalate to MODERATOR)

---

## 📋 Bảng So Sánh Chi Tiết

| Chức năng | SUPER_ADMIN | MODERATOR | STAFF |
|-----------|-------------|---------|-------|
| **Quản lý Admin** | ✅ Full | ⚠️ View STAFF only | ❌ |
| **Duyệt Supplier** | ✅ | ❌ View only | ✅ |
| **Duyệt Store** | ✅ | ❌ View only | ✅ |
| **Khóa tài khoản vĩnh viễn** | ✅ | ❌ | ❌ |
| **Tạm khóa tài khoản** | ✅ | ✅ | ❌ |
| **Cảnh báo vi phạm** | ✅ | ✅ | ❌ |
| **Xóa sản phẩm** | ✅ | ✅ | ❌ |
| **Xem dữ liệu tài chính** | ✅ Full | ✅ Full | ❌ |
| **Đối soát tài chính** | ✅ | ⚠️ Request only | ❌ |
| **Hoàn tiền** | ✅ | ❌ | ❌ |
| **Tạo khuyến mãi lớn** | ✅ | ❌ | ❌ |
| **Duyệt khuyến mãi** | ✅ | ✅ | ❌ |
| **Xem báo cáo đầy đủ** | ✅ | ✅ | ⚠️ Basic only |
| **Xuất báo cáo** | ✅ | ✅ | ❌ |
| **Xem audit log** | ✅ | ✅ | ❌ |
| **Cấu hình hệ thống** | ✅ | ❌ | ❌ |
| **Chat/Support** | ✅ Complex | ✅ Complex | ⚠️ Simple only |
| **Đánh giá STAFF** | ✅ | ✅ | ❌ |

---

## 🛣️ Phân Quyền Route

### 📊 Dashboard
- `/dashboard/overview` → ✅ ALL ROLES
- `/dashboard/MODERATOR` → ✅ ALL ROLES
- `/dashboard/notification-MODERATOR` → ⚠️ SUPER_ADMIN, MODERATOR

### 👥 Nhân viên
- `/employees/admins` → 🔴 SUPER_ADMIN ONLY

### 🤝 Đối tác
- `/partners/list-partners` → ✅ ALL ROLES
- `/partners/pending` → ✅ ALL ROLES
- `/partners/store-approval` → ✅ ALL ROLES
- `/partners/performance` → ⚠️ SUPER_ADMIN, MODERATOR
- `/partners/business-updates` → ✅ ALL ROLES
- `/partners/chat` → ✅ ALL ROLES

### 👤 Khách hàng
- `/customers/list-customers` → ✅ ALL ROLES
- `/customers/:userId` → ✅ ALL ROLES
- `/customers/supportTickets` → ✅ ALL ROLES

### 📦 Sản phẩm
- `/products/list-products` → ✅ ALL ROLES
- `/products/categories` → ✅ ALL ROLES
- `/products/category-suggestions` → ✅ ALL ROLES

### 💰 Tài chính
- `/finance/transactions` → ⚠️ SUPER_ADMIN, MODERATOR
- `/finance/reconciliation` → 🔴 SUPER_ADMIN ONLY

### 🎯 Marketing
- `/marketing/banners` → ✅ ALL ROLES
- `/marketing/promotions` → ✅ ALL ROLES (view), ⚠️ SUPER_ADMIN, MODERATOR (approve)

### 📈 Báo cáo
- `/reports/revenue` → ⚠️ SUPER_ADMIN, MODERATOR
- `/reports/waste` → ⚠️ SUPER_ADMIN, MODERATOR
- `/reports/behavior` → ⚠️ SUPER_ADMIN, MODERATOR

### 🔧 Cài đặt
- `/settings/system-settings` → 🔴 SUPER_ADMIN ONLY
- `/settings/roles` → 🔴 SUPER_ADMIN ONLY
- `/settings/audit` → ⚠️ SUPER_ADMIN, MODERATOR

---

## 💡 Hướng Dẫn Sử Dụng

### Trong Code

#### 1. Sử dụng ProtectedRoute
```tsx
import ProtectedRoute from '~/component/common/ProtectedRoute';

// Chỉ SUPER_ADMIN
<ProtectedRoute requiredRoles={['SUPER_ADMIN']}>
  <Component />
</ProtectedRoute>

// SUPER_ADMIN và MODERATOR
<ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR']}>
  <Component />
</ProtectedRoute>

// Tất cả roles
<ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR', 'STAFF']}>
  <Component />
</ProtectedRoute>
```

#### 2. Sử dụng usePermissions Hook
```tsx
import { usePermissions } from '~/hooks/usePermissions';

function Component() {
  const { can, isSuperAdmin, isMODERATOR, isStaff } = usePermissions();

  return (
    <>
      {can('products.delete') && (
        <button>Xóa sản phẩm</button>
      )}
      
      {isSuperAdmin && (
        <button>Chức năng chỉ SUPER_ADMIN</button>
      )}
      
      {(isSuperAdmin || isMODERATOR) && (
        <button>Xem báo cáo</button>
      )}
    </>
  );
}
```

#### 3. Check Multiple Permissions
```tsx
const { canAny, canAll } = usePermissions();

// Có ít nhất 1 quyền
if (canAny(['products.edit', 'products.delete'])) {
  // Show actions menu
}

// Có tất cả các quyền
if (canAll(['finance.view_all', 'finance.reconciliation'])) {
  // Show reconciliation button
}
```

---

## 🔐 Best Practices

### 1. Luôn kiểm tra quyền ở cả Frontend và Backend
- Frontend: Ẩn UI, disable button
- Backend: Validate request trước khi thực hiện

### 2. Sử dụng Principle of Least Privilege
- Chỉ cấp quyền tối thiểu cần thiết
- STAFF không cần xem dữ liệu tài chính
- MODERATOR không được thực hiện giao dịch

### 3. Audit Trail
- Log tất cả hành động quan trọng
- MODERATOR và SUPER_ADMIN xem audit log
- Theo dõi ai làm gì, khi nào

### 4. Escalation Flow
```
STAFF (gặp vấn đề) 
  ↓
MODERATOR (xử lý và giám sát)
  ↓
SUPER_ADMIN (quyết định cuối cùng)
```

---

## 📝 Ghi Chú Quan Trọng

1. **SUPER_ADMIN luôn có toàn quyền** - Bypass mọi role check
2. **MODERATOR là vai trò giám sát** - Không thực hiện thao tác quan trọng, chỉ cảnh báo và yêu cầu
3. **STAFF là vai trò thực thi** - Làm việc routine, không truy cập dữ liệu nhạy cảm
4. **Tạm khóa vs Khóa vĩnh viễn**:
   - MODERATOR: Tạm khóa (có thể mở lại)
   - SUPER_ADMIN: Khóa vĩnh viễn (quyết định cuối)
5. **Báo cáo**:
   - STAFF: Không xem báo cáo tài chính
   - MODERATOR: Full access báo cáo + export
   - SUPER_ADMIN: Toàn bộ

---

**Cập nhật lần cuối**: 19/11/2025  
**Người tạo**: SaveFood Development Team

