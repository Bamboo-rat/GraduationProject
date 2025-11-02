# Tính năng Tạm dừng và Đình chỉ Nhà cung cấp

## Tổng quan

Hệ thống hỗ trợ 2 loại trạng thái tạm ngưng hoạt động cho nhà cung cấp:

### 1. **PAUSE** - Tạm dừng (Supplier tự thực hiện)
- Nhà cung cấp tự tạm dừng hoạt động kinh doanh
- **Hạn chế một phần**:
  - ❌ Cửa hàng bị ẩn khỏi tìm kiếm công khai
  - ❌ Không nhận đơn hàng mới
  - ✅ Vẫn truy cập được backend để chuẩn bị dữ liệu
  - ✅ Có thể tự kích hoạt lại bất cứ lúc nào

### 2. **SUSPENDED** - Đình chỉ (Admin thực hiện)
- Admin đình chỉ do vi phạm chính sách
- **Khóa toàn bộ hoạt động**:
  - ❌ Cửa hàng bị ẩn khỏi hệ thống
  - ❌ Tất cả sản phẩm bị ẩn
  - ❌ Không thể truy cập hệ thống vận hành
  - ❌ Không thể tự gỡ bỏ, phải chờ admin đánh giá

---

## Backend Implementation

### 1. Enum Status (SupplierStatus.java)

```java
public enum SupplierStatus {
    PENDING_VERIFICATION("Chờ xác thực"),
    PENDING_DOCUMENTS("Chờ tải tài liệu"),
    PENDING_STORE_INFO("Chờ thông tin cửa hàng"),
    PENDING_APPROVAL("Chờ phê duyệt"),
    ACTIVE("Đang hoạt động"),
    SUSPENDED("Tạm ngưng"),      // Admin khóa
    PAUSE("Tạm dừng"),            // Supplier tự dừng
    REJECTED("Từ chối");
}
```

### 2. API Endpoints

#### **Supplier APIs (Supplier tự quản lý)**

**Tạm dừng hoạt động:**
```http
PATCH /api/suppliers/me/pause?reason={reason}
Authorization: Bearer {token}
Role: SUPPLIER

Response: SupplierResponse
```

**Tiếp tục hoạt động:**
```http
PATCH /api/suppliers/me/resume
Authorization: Bearer {token}
Role: SUPPLIER

Response: SupplierResponse
```

#### **Admin APIs (Admin quản lý)**

**Đình chỉ nhà cung cấp:**
```http
PATCH /api/suppliers/{userId}/suspend?reason={reason}
Authorization: Bearer {token}
Role: SUPER_ADMIN, MODERATOR

Response: SupplierResponse
```

**Gỡ bỏ đình chỉ:**
```http
PATCH /api/suppliers/{userId}/unsuspend
Authorization: Bearer {token}
Role: SUPER_ADMIN, MODERATOR

Response: SupplierResponse
```

### 3. Business Logic

#### **pauseOperations() - Supplier tự tạm dừng**
```java
@Override
@Transactional
public SupplierResponse pauseOperations(String keycloakId, String reason) {
    // 1. Kiểm tra status phải là ACTIVE
    if (supplier.getStatus() != SupplierStatus.ACTIVE) {
        throw new BadRequestException("Can only pause when status is ACTIVE");
    }
    
    // 2. Set status = PAUSE
    supplier.setStatus(SupplierStatus.PAUSE);
    
    // 3. Giữ nguyên active = true (vẫn truy cập backend được)
    
    // 4. Cửa hàng bị ẩn khỏi public search (kiểm tra trong API)
    
    // 5. Gửi thông báo cho supplier
    
    return supplierMapper.toResponse(supplier);
}
```

#### **resumeOperations() - Tiếp tục từ PAUSE**
```java
@Override
@Transactional
public SupplierResponse resumeOperations(String keycloakId) {
    // 1. Kiểm tra status phải là PAUSE
    if (supplier.getStatus() != SupplierStatus.PAUSE) {
        throw new BadRequestException("Can only resume from PAUSE status");
    }
    
    // 2. Set status = ACTIVE
    supplier.setStatus(SupplierStatus.ACTIVE);
    
    // 3. Khôi phục hiển thị cửa hàng
    
    // 4. Gửi thông báo
    
    return supplierMapper.toResponse(supplier);
}
```

#### **suspendSupplier() - Admin đình chỉ**
```java
@Override
@Transactional
public SupplierResponse suspendSupplier(String userId, String reason) {
    // 1. Set status = SUSPENDED
    supplier.setStatus(SupplierStatus.SUSPENDED);
    
    // 2. Set active = false (khóa hoàn toàn)
    supplier.setActive(false);
    
    // 3. Suspend tất cả stores
    supplier.getStores().forEach(store -> {
        if (store.getStatus() == StoreStatus.ACTIVE) {
            store.setStatus(StoreStatus.SUSPENDED);
        }
    });
    
    // 4. Gửi email và in-app notification
    
    return supplierMapper.toResponse(supplier);
}
```

#### **unsuspendSupplier() - Admin gỡ đình chỉ**
```java
@Override
@Transactional
public SupplierResponse unsuspendSupplier(String userId) {
    // 1. Kiểm tra status phải là SUSPENDED
    if (supplier.getStatus() != SupplierStatus.SUSPENDED) {
        throw new BadRequestException("Supplier is not suspended");
    }
    
    // 2. Set status = ACTIVE
    supplier.setStatus(SupplierStatus.ACTIVE);
    supplier.setActive(true);
    
    // 3. Khôi phục stores
    supplier.getStores().forEach(store -> {
        if (store.getStatus() == StoreStatus.SUSPENDED) {
            store.setStatus(StoreStatus.ACTIVE);
        }
    });
    
    // 4. Gửi thông báo
    
    return supplierMapper.toResponse(supplier);
}
```

### 4. Ẩn cửa hàng khi supplier PAUSE/SUSPENDED

**StoreServiceImpl.java - getNearbyStores():**
```java
public Page<StoreResponse> getNearbyStores(...) {
    List<Store> allActiveStores = storeRepository.findByStatus(StoreStatus.ACTIVE, ...);
    
    // Filter by supplier status
    List<StoreResponse> nearbyStores = allActiveStores.stream()
        .filter(store -> {
            // Hide stores if supplier is SUSPENDED or PAUSE
            Supplier supplier = store.getSupplier();
            if (supplier.getStatus() == SupplierStatus.SUSPENDED || 
                supplier.getStatus() == SupplierStatus.PAUSE) {
                return false;
            }
            
            // Check distance...
            return distance <= radiusKm;
        })
        .map(storeMapper::toResponse)
        .collect(Collectors.toList());
}
```

---

## Frontend Implementation

### 1. Supplier Frontend - Tạm dừng hoạt động

**File:** `website/fe_supplier/app/pages/profile/PauseOperations.tsx`

**Route:** `/profile/pause-operations`

**Tính năng:**
- Hiển thị trạng thái hiện tại (ACTIVE, PAUSE, SUSPENDED)
- Button "Tạm dừng hoạt động" khi ACTIVE
- Button "Tiếp tục hoạt động" khi PAUSE
- Không thể thao tác khi SUSPENDED (phải liên hệ admin)
- Modal nhập lý do tạm dừng

**Service:** `supplierService.ts`
```typescript
async pauseOperations(reason?: string): Promise<SupplierResponse>
async resumeOperations(): Promise<SupplierResponse>
```

### 2. Admin Frontend - Đình chỉ nhà cung cấp

**File:** `website/fe_admin/app/pages/partners/PartnersList.tsx`

**Tính năng:**
- Button "Đình chỉ" hiển thị khi supplier status = ACTIVE
- Button "Gỡ đình chỉ" hiển thị khi supplier status = SUSPENDED
- Modal nhập lý do đình chỉ (required)
- Modal xác nhận gỡ đình chỉ

**Service:** `supplierService.ts`
```typescript
async suspendSupplier(userId: string, reason: string): Promise<Supplier>
async unsuspendSupplier(userId: string): Promise<Supplier>
```

---

## UI/UX Flow

### Supplier Flow - Tạm dừng

```
1. Supplier vào trang "Quản lý hoạt động"
2. Thấy trạng thái hiện tại: "Đang hoạt động"
3. Click button "Tạm dừng hoạt động"
4. Nhập lý do (required): "Nghỉ lễ", "Chuẩn bị hàng hóa"...
5. Xác nhận
6. Hệ thống:
   - Set status = PAUSE
   - Ẩn cửa hàng khỏi tìm kiếm
   - Gửi thông báo
7. Supplier vẫn truy cập backend để chuẩn bị dữ liệu
8. Khi sẵn sàng, click "Tiếp tục hoạt động"
9. Cửa hàng hiển thị trở lại ngay lập tức
```

### Admin Flow - Đình chỉ

```
1. Admin vào trang "Danh sách Đối tác"
2. Thấy supplier vi phạm (status = ACTIVE)
3. Click button "Đình chỉ"
4. Nhập lý do (required): "Vi phạm chính sách", "Bán hàng giả"...
5. Xác nhận
6. Hệ thống:
   - Set status = SUSPENDED
   - Set active = false
   - Suspend tất cả stores
   - Gửi email + in-app notification
7. Supplier không thể login/truy cập
8. Admin đánh giá lại
9. Click "Gỡ đình chỉ" nếu đủ điều kiện
10. Supplier được khôi phục hoạt động
```

---

## Notifications

### 1. Supplier Pause
**In-app + Email:**
```
Tiêu đề: "Đã tạm dừng hoạt động"
Nội dung: "Bạn đã tạm dừng hoạt động kinh doanh. [Lý do: {reason}]. 
          Cửa hàng sẽ được ẩn khỏi tìm kiếm và không nhận đơn mới."
```

### 2. Supplier Resume
**In-app:**
```
Tiêu đề: "Đã tiếp tục hoạt động"
Nội dung: "Bạn đã tiếp tục hoạt động kinh doanh. 
          Cửa hàng và sản phẩm đã được hiển thị trở lại."
```

### 3. Admin Suspend
**In-app + Email:**
```
Tiêu đề: "Tài khoản bị đình chỉ"
Nội dung: "Tài khoản của bạn đã bị đình chỉ. Lý do: {reason}. 
          Vui lòng liên hệ admin để được hỗ trợ."
Type: ACCOUNT_SUSPENDED
```

### 4. Admin Unsuspend
**In-app + Email:**
```
Tiêu đề: "Tài khoản đã được kích hoạt lại"
Nội dung: "Tài khoản của bạn đã được gỡ bỏ lệnh đình chỉ 
          và hoạt động trở lại bình thường."
Type: ACCOUNT_ACTIVATED
```

---

## Testing Checklist

### Supplier Self-Pause
- [ ] Chỉ ACTIVE supplier mới pause được
- [ ] Phải nhập lý do (frontend validation)
- [ ] Status chuyển ACTIVE → PAUSE
- [ ] active vẫn = true
- [ ] Cửa hàng bị ẩn khỏi getNearbyStores
- [ ] Gửi notification thành công
- [ ] Resume chuyển PAUSE → ACTIVE
- [ ] Cửa hàng hiện lại sau resume

### Admin Suspend
- [ ] Chỉ admin/moderator mới suspend được
- [ ] Phải nhập lý do (frontend validation)
- [ ] Status chuyển ACTIVE → SUSPENDED
- [ ] active chuyển thành false
- [ ] Tất cả stores = SUSPENDED
- [ ] Cửa hàng bị ẩn khỏi tìm kiếm
- [ ] Gửi email + in-app notification
- [ ] Supplier không login được (nếu implement)
- [ ] Unsuspend khôi phục SUSPENDED → ACTIVE
- [ ] active = true, stores = ACTIVE

### Edge Cases
- [ ] Không thể pause khi đã SUSPENDED
- [ ] Không thể suspend khi đã SUSPENDED
- [ ] Không thể resume khi không phải PAUSE
- [ ] Không thể unsuspend khi không phải SUSPENDED
- [ ] Supplier không tự unsuspend được

---

## Database Migration (nếu cần)

Nếu enum đã có PAUSE và SUSPENDED thì không cần migration.

---

## Security Notes

1. **Authorization:**
   - `/me/pause`, `/me/resume` - Chỉ SUPPLIER
   - `/{userId}/suspend`, `/{userId}/unsuspend` - Chỉ SUPER_ADMIN, MODERATOR

2. **Validation:**
   - Kiểm tra status transition hợp lệ
   - Kiểm tra lý do không rỗng (backend + frontend)
   - Kiểm tra keycloakId khớp với supplier (pause/resume)

3. **Audit:**
   - Log tất cả hành động suspend/unsuspend
   - Lưu lý do trong notification
   - Track admin nào suspend (qua keycloakId)

---

## Performance Considerations

1. **Caching:**
   - Cache supplier status để kiểm tra nhanh
   - Invalidate cache khi status thay đổi

2. **Query Optimization:**
   - Index trên `Supplier.status`
   - Filter supplier status trong query thay vì memory

3. **Notification:**
   - Send async để không block API response

---

## Future Enhancements

1. **History Tracking:**
   - Lưu lịch sử suspend/unsuspend
   - Hiển thị số lần bị suspend

2. **Auto-resume:**
   - Supplier đặt thời gian tự động resume
   - Cron job kiểm tra và kích hoạt

3. **Partial Suspension:**
   - Suspend chỉ một số stores
   - Suspend chỉ một số sản phẩm

4. **Warning System:**
   - Cảnh cáo trước khi suspend
   - Cho supplier thời gian sửa chữa

---

## Liên hệ

Nếu có vấn đề khi implement, liên hệ team backend/frontend.
