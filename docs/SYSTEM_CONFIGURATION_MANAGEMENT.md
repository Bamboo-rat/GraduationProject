# SYSTEM CONFIGURATION MANAGEMENT

## 📋 Tổng quan

Hệ thống quản lý cấu hình (System Configuration) cho phép admin cấu hình các thông số quan trọng của hệ thống thông qua giao diện web, thay vì phải hardcode trong code. Điều này giúp việc điều chỉnh các thông số trở nên linh hoạt và không cần deploy lại ứng dụng.

## 🎯 Mục đích

- **Tỷ lệ tích điểm động**: Admin có thể thay đổi tỷ lệ % tích điểm khi khách hàng hoàn thành đơn hàng
- **Hoa hồng linh hoạt**: Cấu hình tỷ lệ hoa hồng cho từng danh mục sản phẩm
- **Ngưỡng hạng thành viên**: Điều chỉnh điểm cần đạt để lên các hạng Silver, Gold, Platinum, Diamond
- **Cài đặt đơn hàng**: Giá trị tối thiểu, tự động hủy sau X giờ, số lượng tối đa
- **Ví điện tử**: Số tiền rút tối thiểu, phí rút tiền, thời gian chờ
- **Bật/tắt tính năng**: Feature flags cho các chức năng của hệ thống

## 🏗️ Kiến trúc

### Backend Components

#### 1. Entity: `SystemConfig.java`
```java
@Entity
@Table(name = "system_config")
public class SystemConfig {
    @Id
    private String configKey;           // Key duy nhất (e.g., "points.reward.percentage")
    private String configValue;         // Giá trị (e.g., "0.05")
    private String description;         // Mô tả cấu hình
    private String valueType;           // STRING | NUMBER | BOOLEAN | JSON
    private Boolean isPublic;           // Public = có thể expose cho frontend
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String updatedBy;           // Admin userId
}
```

#### 2. Repository: `SystemConfigRepository.java`
```java
public interface SystemConfigRepository extends JpaRepository<SystemConfig, String> {
    Optional<SystemConfig> findByConfigKey(String configKey);
    List<SystemConfig> findByIsPublicTrue();
    boolean existsByConfigKey(String configKey);
}
```

#### 3. Service: `SystemConfigService.java`
```java
public interface SystemConfigService {
    String getConfigValue(String key);
    BigDecimal getConfigValueAsDecimal(String key, BigDecimal defaultValue);
    Integer getConfigValueAsInteger(String key, Integer defaultValue);
    Boolean getConfigValueAsBoolean(String key, Boolean defaultValue);
    SystemConfigResponse updateConfig(String key, String value, String updatedBy);
    List<SystemConfigResponse> getAllConfigs();
    List<SystemConfigResponse> getPublicConfigs();
    SystemConfigResponse createOrUpdateConfig(...);
    void deleteConfig(String key);
}
```

**Implementation Features:**
- **Caching**: Sử dụng `@Cacheable` để cache config values
- **Cache Eviction**: Tự động xóa cache khi update/delete
- **Type Conversion**: Helper methods để convert sang BigDecimal, Integer, Boolean
- **Default Values**: Fallback về giá trị mặc định nếu config không tồn tại

#### 4. Controller: `SystemConfigController.java`
```java
@RestController
@RequestMapping("/api/system-config")
public class SystemConfigController {
    @GetMapping                                    // Get all (SUPER_ADMIN only)
    @GetMapping("/public")                         // Get public configs
    @GetMapping("/{key}")                          // Get by key
    @PutMapping("/{key}")                          // Update config
    @PostMapping                                   // Create/Update
    @DeleteMapping("/{key}")                       // Delete config
}
```

**Security:**
- Chỉ `SUPER_ADMIN` mới có quyền quản lý configs
- Public endpoint `/api/system-config/public` không cần authentication

### Frontend Components

#### 1. Service: `systemConfigService.ts`
```typescript
class SystemConfigService {
  async getAllConfigs(): Promise<SystemConfigResponse[]>
  async getPublicConfigs(): Promise<SystemConfigResponse[]>
  async getConfigByKey(key: string): Promise<string>
  async updateConfig(key: string, request: UpdateSystemConfigRequest)
  async createOrUpdateConfig(request, valueType?, isPublic?)
  async deleteConfig(key: string): Promise<void>
}
```

#### 2. UI Component: `SystemSettings.tsx`
**Features:**
- Hiển thị configs theo nhóm (Points, Tier, Commission, Order, Wallet, Promotion, Features, Support)
- Inline editing cho từng config
- Format hiển thị thông minh:
  - Percentage: `0.05` → `5%`
  - Currency: `100000` → `100,000 VNĐ`
  - Boolean: `true` → `Bật`, `false` → `Tắt`
- Toast notification cho success/error
- Real-time update

## 📊 Database Schema

```sql
CREATE TABLE system_config (
    config_key VARCHAR(100) PRIMARY KEY,
    config_value TEXT NOT NULL,
    description TEXT,
    value_type VARCHAR(20) NOT NULL DEFAULT 'STRING',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(36),
    INDEX idx_is_public (is_public),
    INDEX idx_updated_at (updated_at)
);
```

## 🔧 Default Configurations

### 1. Điểm thưởng & Tích lũy (Points & Rewards)
| Key | Value | Description |
|-----|-------|-------------|
| `points.reward.percentage` | `0.05` | Tỷ lệ % tích điểm khi hoàn thành đơn (5%) |
| `points.review.bonus` | `10` | Điểm thưởng khi đánh giá sản phẩm |
| `points.referral.bonus` | `50` | Điểm thưởng khi giới thiệu bạn bè |

### 2. Hạng thành viên (Customer Tiers)
| Key | Value | Description |
|-----|-------|-------------|
| `tier.silver.threshold` | `500` | Điểm cần đạt để lên Silver |
| `tier.gold.threshold` | `2000` | Điểm cần đạt để lên Gold |
| `tier.platinum.threshold` | `5000` | Điểm cần đạt để lên Platinum |
| `tier.diamond.threshold` | `10000` | Điểm cần đạt để lên Diamond |

### 3. Hoa hồng (Commission Rates)
| Key | Value | Description |
|-----|-------|-------------|
| `commission.rate.default` | `0.10` | Hoa hồng mặc định (10%) |
| `commission.rate.food` | `0.08` | Hoa hồng danh mục Thực phẩm (8%) |
| `commission.rate.beverage` | `0.12` | Hoa hồng danh mục Đồ uống (12%) |

### 4. Đơn hàng (Order Settings)
| Key | Value | Description |
|-----|-------|-------------|
| `order.auto_cancel.hours` | `24` | Tự động hủy đơn sau 24h nếu không xác nhận |
| `order.min_amount` | `10000` | Giá trị đơn hàng tối thiểu (10,000 VNĐ) |
| `order.max_quantity_per_item` | `100` | Số lượng tối đa mỗi sản phẩm |

### 5. Ví điện tử (Wallet Settings)
| Key | Value | Description |
|-----|-------|-------------|
| `wallet.min_withdrawal` | `100000` | Số tiền rút tối thiểu (100,000 VNĐ) |
| `wallet.withdrawal_fee` | `0.01` | Phí rút tiền (1%) |
| `wallet.pending_days` | `7` | Số ngày chờ trước khi chuyển pending → available |

### 6. Khuyến mãi (Promotion Settings)
| Key | Value | Description |
|-----|-------|-------------|
| `promotion.max_usage_per_customer` | `5` | Số lần tối đa 1 khách dùng 1 mã |
| `promotion.max_discount_amount` | `500000` | Số tiền giảm tối đa (500,000 VNĐ) |

### 7. Tính năng hệ thống (Feature Flags)
| Key | Value | Description |
|-----|-------|-------------|
| `feature.auto_suspension.enabled` | `true` | Tự động khóa tài khoản vi phạm |
| `feature.otp.enabled` | `true` | Xác thực OTP qua điện thoại |
| `feature.email_notification.enabled` | `true` | Gửi email thông báo |

### 8. Bảo trì & Hỗ trợ (Maintenance & Support)
| Key | Value | Description |
|-----|-------|-------------|
| `maintenance.mode` | `false` | Chế độ bảo trì hệ thống |
| `maintenance.message` | `Hệ thống đang bảo trì...` | Thông báo bảo trì |
| `support.email` | `support@savefood.vn` | Email hỗ trợ |
| `support.phone` | `1900-xxxx` | Số điện thoại hỗ trợ |
| `business.hours.start` | `06:00` | Giờ mở cửa |
| `business.hours.end` | `22:00` | Giờ đóng cửa |

## 💻 Sử dụng trong Code

### Backend: OrderServiceImpl.java

**Trước đây (Hardcoded):**
```java
private static final BigDecimal POINTS_PERCENTAGE = new BigDecimal("0.05"); // 5%

BigDecimal points = orderAmount.multiply(POINTS_PERCENTAGE);
```

**Bây giờ (Dynamic Config):**
```java
private final SystemConfigService systemConfigService;

private BigDecimal getPointsPercentage() {
    return systemConfigService.getConfigValueAsDecimal(
        "points.reward.percentage",
        new BigDecimal("0.05") // fallback default
    );
}

BigDecimal points = orderAmount.multiply(getPointsPercentage());
```

### Các Service khác có thể sử dụng

**CommissionService:**
```java
BigDecimal commissionRate = systemConfigService.getConfigValueAsDecimal(
    "commission.rate." + category.toLowerCase(),
    new BigDecimal("0.10") // default 10%
);
```

**WalletService:**
```java
BigDecimal minWithdrawal = systemConfigService.getConfigValueAsDecimal(
    "wallet.min_withdrawal",
    new BigDecimal("100000")
);

if (amount.compareTo(minWithdrawal) < 0) {
    throw new BadRequestException("Số tiền rút tối thiểu: " + minWithdrawal);
}
```

**OrderService:**
```java
Integer autoCancelHours = systemConfigService.getConfigValueAsInteger(
    "order.auto_cancel.hours",
    24
);

// Schedule auto-cancel job after X hours
```

## 🎨 Frontend Admin UI

### Truy cập
- **URL**: `/settings/system-settings`
- **Quyền**: Chỉ `SUPER_ADMIN`
- **Menu**: Hệ thống → Cấu hình hệ thống

### Chức năng
1. **Xem danh sách configs** - Hiển thị tất cả configs theo nhóm
2. **Chỉnh sửa inline** - Click "Chỉnh sửa" để sửa giá trị trực tiếp
3. **Lưu thay đổi** - Lưu ngay lập tức và cập nhật timestamp
4. **Format thông minh** - Hiển thị giá trị dễ đọc (%, VNĐ, Bật/Tắt)

### UI Flow
```
1. Admin truy cập System Settings page
2. Hệ thống load tất cả configs từ API
3. Hiển thị configs theo 8 nhóm
4. Admin click "Chỉnh sửa" trên config muốn thay đổi
5. Input field hiện ra với giá trị hiện tại
6. Admin nhập giá trị mới và click "Lưu"
7. API call PUT /api/system-config/{key}
8. Toast notification "Cập nhật thành công"
9. Reload danh sách configs để cập nhật UI
```

## 🔐 Security

### Authorization
- **GET /api/system-config**: `@PreAuthorize("hasRole('SUPER_ADMIN')")`
- **PUT /api/system-config/{key}**: `@PreAuthorize("hasRole('SUPER_ADMIN')")`
- **POST /api/system-config**: `@PreAuthorize("hasRole('SUPER_ADMIN')")`
- **DELETE /api/system-config/{key}**: `@PreAuthorize("hasRole('SUPER_ADMIN')")`
- **GET /api/system-config/public**: No authentication (for public configs only)

### Audit Trail
- Mỗi config lưu `updatedBy` (admin userId)
- Mỗi config lưu `updatedAt` (timestamp)
- Admin có thể xem lịch sử thay đổi

## 📝 API Documentation

### 1. Get All Configs
```http
GET /api/system-config
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "configKey": "points.reward.percentage",
      "configValue": "0.05",
      "description": "Tỷ lệ % tích điểm khi hoàn thành đơn hàng",
      "valueType": "NUMBER",
      "isPublic": false,
      "createdAt": "2025-01-01T00:00:00",
      "updatedAt": "2025-01-15T10:30:00",
      "updatedBy": "admin-123"
    }
  ]
}
```

### 2. Get Public Configs
```http
GET /api/system-config/public
```

**Response:** Same format, only returns configs with `isPublic = true`

### 3. Get Config by Key
```http
GET /api/system-config/points.reward.percentage
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "status": 200,
  "message": "Success",
  "data": "0.05"
}
```

### 4. Update Config
```http
PUT /api/system-config/points.reward.percentage
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "configKey": "points.reward.percentage",
  "configValue": "0.08",
  "description": "Tăng lên 8% để khuyến khích khách hàng"
}
```

**Response:**
```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "configKey": "points.reward.percentage",
    "configValue": "0.08",
    "description": "Tăng lên 8% để khuyến khích khách hàng",
    "valueType": "NUMBER",
    "isPublic": false,
    "updatedAt": "2025-01-15T14:20:00",
    "updatedBy": "admin-123"
  }
}
```

### 5. Create or Update Config
```http
POST /api/system-config?valueType=NUMBER&isPublic=false
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "configKey": "new.config.key",
  "configValue": "100",
  "description": "New configuration"
}
```

### 6. Delete Config
```http
DELETE /api/system-config/obsolete.config.key
Authorization: Bearer <admin_token>
```

## 🚀 Deployment & Migration

### Database Migration
File: `V1__Create_system_config_table.sql`
- Tạo bảng `system_config`
- Insert 30+ default configs
- Chạy tự động khi deploy qua Flyway

### Testing
```bash
# Test get all configs
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/system-config

# Test update config
curl -X PUT -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"configKey":"points.reward.percentage","configValue":"0.08"}' \
     http://localhost:8080/api/system-config/points.reward.percentage

# Test public configs (no auth)
curl http://localhost:8080/api/system-config/public
```

## 📈 Benefits

### Trước khi có System Config
❌ Phải hardcode tỷ lệ trong code  
❌ Muốn thay đổi phải sửa code và deploy lại  
❌ Không có audit trail  
❌ Khó quản lý nhiều configs  
❌ Rủi ro khi deploy  

### Sau khi có System Config
✅ Admin tự thay đổi qua UI  
✅ Không cần deploy, hiệu lực ngay lập tức  
✅ Có lịch sử thay đổi (updatedBy, updatedAt)  
✅ Quản lý tập trung, dễ tìm kiếm  
✅ An toàn, có caching, có default values  

## 🔄 Future Enhancements

1. **Config History Table**: Lưu lịch sử thay đổi chi tiết
2. **Config Validation**: Validate giá trị trước khi lưu (min, max, regex)
3. **Config Groups Management**: Quản lý nhóm configs
4. **Config Templates**: Templates cho các loại configs phổ biến
5. **Config Comparison**: So sánh configs giữa các môi trường (dev, staging, prod)
6. **Config Rollback**: Rollback về giá trị trước đó
7. **Config Notifications**: Thông báo khi configs quan trọng thay đổi
8. **Config Approval Workflow**: Yêu cầu approve trước khi áp dụng

## 📞 Support

Nếu có vấn đề với System Configuration:
1. Kiểm tra logs: `OrderServiceImpl`, `SystemConfigServiceImpl`
2. Verify database: `SELECT * FROM system_config WHERE config_key = 'points.reward.percentage'`
3. Check cache: Xóa cache nếu cần
4. Contact: Backend Team
