# SaveFood - Hướng dẫn Deploy lên Render Free Tier

## 📋 Tổng quan

Hướng dẫn này cung cấp các bước và tối ưu hóa cần thiết để deploy hệ thống SaveFood lên Render miễn phí với những hạn chế về resources.

---

## 🎯 Kiến trúc Deployment được đề xuất

```
┌─────────────────────────────────────────────────────────────┐
│                    RENDER FREE TIER                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Frontend   │  │   Frontend   │  │   Backend    │      │
│  │    Admin     │  │   Supplier   │  │  Web Service │      │
│  │ Static Site  │  │ Static Site  │  │  (512MB RAM) │      │
│  └──────────────┘  └──────────────┘  └──────┬───────┘      │
│                                              │               │
│  ┌──────────────┐  ┌──────────────┐        │               │
│  │  PostgreSQL  │  │    Redis     │◄───────┘               │
│  │  (256MB/1GB) │  │   (25MB)     │                        │
│  └──────────────┘  └──────────────┘                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌──────────────┐     ┌──────────────┐
│  Cloudinary  │     │   SendGrid   │
│  (File SaaS) │     │  (Email SaaS)│
└──────────────┘     └──────────────┘

⚠️  KEYCLOAK → Loại bỏ (thay bằng Custom JWT)
```

---

## 🔧 1. Tối ưu hóa Backend

### A. **LOẠI BỎ KEYCLOAK** ⚠️ (Quan trọng nhất)

Keycloak quá nặng (1-2GB RAM) → **Không khả thi cho free tier**

**Giải pháp: Chuyển hoàn toàn sang Custom JWT**

#### Các thay đổi cần thiết:

**1.1. Cập nhật User Authentication**

Hiện tại hệ thống đã có `HybridJwtDecoder` và Custom JWT cho Customer. Cần mở rộng cho Admin/Supplier:

```java
// backend/src/main/java/com/example/backend/config/SecurityConfig.java

// XÓA BỎ:
- Keycloak OAuth2 Resource Server
- spring.security.oauth2.resourceserver.jwt.issuer-uri

// THÊM VÀO:
- Sử dụng CustomJwtDecoder cho TẤT CẢ user types
- Lưu roles trong database thay vì Keycloak
```

**1.2. Role Management trong Database**

Tạo bảng `user_roles` để thay thế Keycloak roles:

```sql
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, role),
    FOREIGN KEY (user_id) REFERENCES user(user_id)
);
```

**1.3. Loại bỏ KeycloakService**

- Xóa `KeycloakService.java`
- Cập nhật `AuthService` để tạo user trực tiếp trong database
- Password hashing sử dụng `BCryptPasswordEncoder`

**1.4. Cập nhật Registration Flow**

```java
// Admin/Supplier registration - KHÔNG cần Keycloak
public SupplierResponseDto createSupplier(SupplierRegistrationStep1Dto dto) {
    // 1. Hash password
    String hashedPassword = passwordEncoder.encode(dto.getPassword());

    // 2. Create supplier entity
    Supplier supplier = new Supplier();
    supplier.setPassword(hashedPassword);
    supplier.setStatus(UserStatus.PENDING_VERIFICATION);

    // 3. Assign role in database
    assignRole(supplier.getUserId(), "SUPPLIER");

    // 4. Send OTP
    otpService.sendEmailOtp(dto.getEmail());

    return mapperService.map(supplier, SupplierResponseDto.class);
}
```

#### Files cần chỉnh sửa:

```
backend/src/main/java/com/example/backend/
├── config/
│   ├── SecurityConfig.java           # Loại bỏ Keycloak config
│   └── JwtConfig.java                # Chỉ giữ Custom JWT
├── service/
│   ├── AuthService.java              # Xóa Keycloak calls
│   ├── SupplierService.java          # Đơn giản hóa registration
│   └── AdminService.java             # Đơn giản hóa creation
└── entity/
    └── UserRole.java                 # Tạo mới để lưu roles
```

---

### B. Tối ưu hóa JVM và Spring Boot

**1. Giảm JVM Heap Size**

Tạo file `backend/.env` cho Render:

```bash
# JVM Memory Settings cho 512MB RAM
JAVA_TOOL_OPTIONS=-Xmx300m -Xms128m -XX:MaxMetaspaceSize=128m -XX:+UseG1GC -XX:MaxGCPauseMillis=100

# Spring Boot optimizations
SPRING_PROFILES_ACTIVE=prod
SERVER_TOMCAT_THREADS_MAX=50
SERVER_TOMCAT_THREADS_MIN=10
SPRING_JPA_SHOW_SQL=false
SPRING_JPA_PROPERTIES_HIBERNATE_FORMAT_SQL=false
```

**2. Tạo application-prod.properties**

```properties
# backend/src/main/resources/application-prod.properties

# Tắt features không cần thiết
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false
spring.devtools.restart.enabled=false

# Giảm connection pool
spring.datasource.hikari.maximum-pool-size=5
spring.datasource.hikari.minimum-idle=2

# Cache optimization
spring.jpa.properties.hibernate.cache.use_second_level_cache=true
spring.jpa.properties.hibernate.cache.region.factory_class=org.hibernate.cache.jcache.JCacheRegionFactory

# Logging
logging.level.root=WARN
logging.level.com.example.backend=INFO
logging.level.org.hibernate.SQL=ERROR
```

**3. Tối ưu Scheduled Tasks**

Scheduled tasks có thể không chạy khi service sleep. Giải pháp:

```java
// backend/src/main/java/com/example/backend/config/SchedulingConfig.java

@Configuration
@EnableScheduling
@ConditionalOnProperty(name = "scheduler.enabled", havingValue = "true", matchIfMissing = false)
public class SchedulingConfig {
    // Chỉ enable scheduling khi set SCHEDULER_ENABLED=true
}
```

Trong Render environment variables:
```bash
SCHEDULER_ENABLED=false  # Tắt schedulers cho free tier
```

**Workaround cho critical tasks:**
- Sử dụng external cron service (cron-job.org) để ping endpoint mỗi ngày
- Tạo REST endpoint để trigger cleanup manually:

```java
@RestController
@RequestMapping("/api/admin/maintenance")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class MaintenanceController {

    @PostMapping("/cleanup")
    public ResponseEntity<?> runCleanup() {
        cleanupScheduler.cleanupOldPendingAccounts();
        return ResponseEntity.ok("Cleanup completed");
    }
}
```

---

### C. Chuyển sang PostgreSQL

Render free tier cung cấp PostgreSQL (không có MySQL miễn phí).

**1. Thêm dependency trong pom.xml** (đã có rồi ✅)

```xml
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <scope>runtime</scope>
</dependency>
```

**2. Cập nhật application-prod.properties**

```properties
# PostgreSQL configuration cho Render
spring.datasource.url=${DATABASE_URL}  # Render tự động inject
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.hibernate.ddl-auto=update

# Connection pool cho free tier
spring.datasource.hikari.maximum-pool-size=5
spring.datasource.hikari.minimum-idle=2
spring.datasource.hikari.connection-timeout=20000
spring.datasource.hikari.max-lifetime=300000
```

**3. Migration từ MySQL sang PostgreSQL**

Một số SQL syntax khác nhau cần chỉnh:

```java
// Nếu có raw SQL queries, check:
// MySQL: LIMIT offset, count
// PostgreSQL: LIMIT count OFFSET offset

// MySQL: AUTO_INCREMENT
// PostgreSQL: SERIAL / BIGSERIAL

// MySQL: DATETIME
// PostgreSQL: TIMESTAMP
```

---

### D. Tối ưu Redis Usage

Render Redis free: 25MB only → Cần tối ưu.

**1. Giảm TTL cho OTP cache**

```java
// backend/src/main/java/com/example/backend/service/impl/OtpServiceImpl.java

// Giảm từ 3 phút → 2 phút
private static final long OTP_EXPIRATION_MINUTES = 2L;
```

**2. Cleanup Redis định kỳ**

```java
// Xóa expired keys ngay lập tức
redisTemplate.expire(key, duration.toMillis(), TimeUnit.MILLISECONDS);
```

**3. Giảm token storage**

Xem xét lưu refresh tokens trong PostgreSQL thay vì Redis nếu 25MB không đủ:

```java
// Lưu refresh token vào database
@Entity
public class RefreshToken {
    @Id
    private String token;
    private Long userId;
    private LocalDateTime expiryDate;
}
```

---

## 🎨 2. Tối ưu hóa Frontend

### A. Build Optimization

**1. Environment Variables**

Tạo `website/fe_admin/.env.production`:

```bash
VITE_API_BASE_URL=https://savefood-api.onrender.com/api
```

Tạo `website/fe_supplier/.env.production`:

```bash
VITE_API_BASE_URL=https://savefood-api.onrender.com/api
```

**2. Vite Build Configuration**

Cập nhật `vite.config.ts` cho cả 2 frontend:

```typescript
import { defineConfig } from 'vite';
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],

  build: {
    // Tối ưu bundle size
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Xóa console.log
        drop_debugger: true
      }
    },

    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router'],
          'ui-vendor': ['lucide-react', 'recharts'],
        }
      }
    },

    // Giảm chunk size warning
    chunkSizeWarningLimit: 1000
  }
});
```

**3. Lazy Loading Components**

```typescript
// app/routes.ts - lazy load pages
import { lazy } from 'react';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProductListPage = lazy(() => import('./pages/ProductListPage'));
```

---

### B. WebSocket Optimization

Service sleep sẽ drop WebSocket connections → Cần fallback.

**1. Auto-reconnect khi service wake up**

```typescript
// app/service/chatService.ts

class ChatService {
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    this.stompClient.onWebSocketClose = () => {
      console.log('WebSocket closed, attempting reconnect...');

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect();
        }, 2000 * this.reconnectAttempts); // Exponential backoff
      }
    };
  }
}
```

**2. Fallback to polling khi WebSocket fail**

```typescript
// Nếu WebSocket không connect được sau 5 lần, dùng HTTP polling
async pollMessages(conversationId: string) {
  const messages = await axios.get(`/api/chat/conversations/${conversationId}/messages`);
  return messages.data;
}
```

---

## 📦 3. Deployment Steps

### Step 1: Chuẩn bị Backend

**1.1. Tạo `render.yaml` trong root project**

```yaml
services:
  # Backend API
  - type: web
    name: savefood-api
    env: java
    buildCommand: cd backend && mvn clean package -DskipTests
    startCommand: cd backend && java -jar target/backend-0.0.1-SNAPSHOT.jar
    envVars:
      - key: JAVA_TOOL_OPTIONS
        value: -Xmx300m -Xms128m -XX:MaxMetaspaceSize=128m -XX:+UseG1GC
      - key: SPRING_PROFILES_ACTIVE
        value: prod
      - key: DATABASE_URL
        fromDatabase:
          name: savefood-db
          property: connectionString
      - key: REDIS_URL
        fromDatabase:
          name: savefood-redis
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: CLOUDINARY_CLOUD_NAME
        sync: false
      - key: CLOUDINARY_API_KEY
        sync: false
      - key: CLOUDINARY_API_SECRET
        sync: false
      - key: SENDGRID_API_KEY
        sync: false
      - key: SENDGRID_FROM_EMAIL
        sync: false
      - key: SENDGRID_FROM_NAME
        value: SaveFood
      - key: FRONTEND_URL
        value: https://savefood-admin.onrender.com
      - key: CORS_ALLOWED_ORIGINS
        value: https://savefood-admin.onrender.com,https://savefood-supplier.onrender.com
      - key: SCHEDULER_ENABLED
        value: false

  # Admin Frontend
  - type: web
    name: savefood-admin
    env: static
    buildCommand: cd website/fe_admin && npm install && npm run build
    staticPublishPath: website/fe_admin/build/client

  # Supplier Frontend
  - type: web
    name: savefood-supplier
    env: static
    buildCommand: cd website/fe_supplier && npm install && npm run build
    staticPublishPath: website/fe_supplier/build/client

databases:
  - name: savefood-db
    databaseName: savefood
    user: savefood_user
    plan: free  # PostgreSQL 256MB/1GB

  - name: savefood-redis
    plan: free  # Redis 25MB
```

### Step 2: Deploy từ GitHub

**2.1. Push code lên GitHub**

```bash
git add .
git commit -m "Optimize for Render deployment"
git push origin main
```

**2.2. Tạo account Render và connect GitHub**

1. Đăng ký tại: https://render.com
2. Connect GitHub repository
3. Render tự động phát hiện `render.yaml`

**2.3. Set Environment Variables**

Vào dashboard Render → Environment → Thêm:

```
CLOUDINARY_CLOUD_NAME=your_value
CLOUDINARY_API_KEY=your_value
CLOUDINARY_API_SECRET=your_value
SENDGRID_API_KEY=your_value
SENDGRID_FROM_EMAIL=noreply@savefood.com
```

### Step 3: Deploy Manual Alternative (không dùng render.yaml)

Nếu không dùng `render.yaml`, làm theo:

**3.1. Tạo PostgreSQL Database**
- Dashboard → New PostgreSQL → Free plan
- Copy Internal Database URL

**3.2. Tạo Redis Instance**
- Dashboard → New Redis → Free plan
- Copy Internal Redis URL

**3.3. Deploy Backend**
- Dashboard → New Web Service
- Connect repository → chọn `backend/`
- Build command: `mvn clean package -DskipTests`
- Start command: `java -jar target/backend-0.0.1-SNAPSHOT.jar`
- Environment: Java 21
- Paste environment variables
- Deploy

**3.4. Deploy Admin Frontend**
- Dashboard → New Static Site
- Connect repository → chọn `website/fe_admin/`
- Build command: `npm install && npm run build`
- Publish directory: `build/client`
- Deploy

**3.5. Deploy Supplier Frontend**
- Dashboard → New Static Site
- Connect repository → chọn `website/fe_supplier/`
- Build command: `npm install && npm run build`
- Publish directory: `build/client`
- Deploy

---

## ⚠️ 4. Hạn chế của Free Tier và Workarounds

### A. Service Sleep (15 phút không hoạt động)

**Vấn đề:**
- Backend sleep sau 15 phút
- First request sau khi sleep mất 30-60s để wake up
- WebSocket connections bị drop

**Giải pháp:**

**1. Keep-Alive Ping (External Cron)**

Sử dụng https://cron-job.org (miễn phí):

```
Schedule: */14 * * * * (mỗi 14 phút)
URL: https://savefood-api.onrender.com/api/health
Method: GET
```

Tạo health endpoint trong backend:

```java
@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }
}
```

**2. Loading State cho Frontend**

```typescript
// app/component/common/LoadingOverlay.tsx
export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg">
        <p>Server đang khởi động, vui lòng đợi 30s...</p>
        <div className="animate-spin">⏳</div>
      </div>
    </div>
  );
}
```

---

### B. Scheduled Tasks không chạy khi sleep

**Giải pháp:**

**1. Tắt auto-scheduling, chạy manual**

```java
@Configuration
public class SchedulingConfig {

    @Bean
    @ConditionalOnProperty(name = "scheduler.enabled", havingValue = "true")
    public TaskScheduler taskScheduler() {
        return new ThreadPoolTaskScheduler();
    }
}
```

**2. Tạo Admin UI để trigger tasks**

```typescript
// Admin Portal - Maintenance Page
<button onClick={() => triggerCleanup()}>
  Run Database Cleanup
</button>

<button onClick={() => triggerPromotionUpdate()}>
  Update Promotion Status
</button>
```

**3. External Cron Jobs**

Dùng cron-job.org để call API endpoints:

```
Daily 3:00 AM: POST /api/admin/maintenance/cleanup
Daily 1:00 AM: POST /api/admin/maintenance/promotion-status
```

---

### C. PostgreSQL Storage Limit (1GB)

**Monitoring:**

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('savefood'));

-- Check table sizes
SELECT
  relname AS table_name,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

**Cleanup strategies:**

```java
// Tự động xóa dữ liệu cũ
@Scheduled(cron = "0 0 2 * * ?")
public void cleanupOldData() {
    // Xóa notifications > 30 ngày
    LocalDateTime cutoff = LocalDateTime.now().minusDays(30);
    notificationRepository.deleteByCreatedAtBefore(cutoff);

    // Xóa expired OTPs
    // Xóa pending users > 7 ngày
    // ...
}
```

---

### D. Redis Memory Limit (25MB)

**Tối ưu:**

```java
// 1. Giảm OTP TTL
private static final long OTP_EXPIRATION_MINUTES = 2L; // Từ 3 → 2

// 2. Lưu refresh tokens vào PostgreSQL thay vì Redis
@Entity
public class RefreshToken {
    @Id private String token;
    private Long userId;
    private LocalDateTime expiryDate;
}

// 3. Monitor Redis memory
@Scheduled(cron = "0 */6 * * * ?") // Mỗi 6 giờ
public void monitorRedisMemory() {
    RedisServerCommands commands = redisTemplate.getConnectionFactory()
        .getConnection().serverCommands();
    Properties info = commands.info("memory");
    log.info("Redis memory used: {}", info.get("used_memory_human"));
}
```

---

## 🔍 5. Testing và Monitoring

### A. Pre-deployment Testing

**1. Test với PostgreSQL locally**

```bash
# Start PostgreSQL in Docker
docker run -d \
  --name postgres-test \
  -e POSTGRES_DB=savefood \
  -e POSTGRES_USER=test \
  -e POSTGRES_PASSWORD=test \
  -p 5432:5432 \
  postgres:15

# Update application-dev.properties
spring.datasource.url=jdbc:postgresql://localhost:5432/savefood
```

**2. Test memory usage**

```bash
# Run với memory constraint
java -Xmx300m -Xms128m -jar target/backend-0.0.1-SNAPSHOT.jar

# Monitor memory
jconsole # Attach to process
```

**3. Load testing**

```bash
# Sử dụng Apache Bench
ab -n 1000 -c 10 http://localhost:8080/api/products

# Hoặc k6
k6 run loadtest.js
```

---

### B. Post-deployment Monitoring

**1. Render Dashboard Metrics**
- CPU usage
- Memory usage
- Response time
- Error rate

**2. Application Logs**

```java
// Custom logging cho performance
@Aspect
@Component
public class PerformanceLogger {

    @Around("@annotation(org.springframework.web.bind.annotation.GetMapping)")
    public Object logPerformance(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.currentTimeMillis();
        Object result = joinPoint.proceed();
        long duration = System.currentTimeMillis() - start;

        if (duration > 1000) {
            log.warn("Slow endpoint: {} took {}ms",
                joinPoint.getSignature(), duration);
        }

        return result;
    }
}
```

**3. Error tracking**

Sử dụng Sentry (free tier):

```xml
<dependency>
    <groupId>io.sentry</groupId>
    <artifactId>sentry-spring-boot-starter</artifactId>
    <version>6.30.0</version>
</dependency>
```

```properties
sentry.dsn=${SENTRY_DSN}
sentry.traces-sample-rate=1.0
```

---

## 📊 6. Performance Benchmarks

**Expected Performance trên Free Tier:**

| Metric | Local Dev | Render Free | Notes |
|--------|-----------|-------------|-------|
| Cold start | - | 30-60s | Service wake từ sleep |
| API response | 50-200ms | 200-500ms | Depend on DB query |
| Memory usage | 400-600MB | 300-450MB | Sau optimization |
| Concurrent users | 50+ | 10-20 | 0.1 CPU limit |
| DB queries/sec | 100+ | 20-50 | Free tier DB |

**Load Test Results (dự kiến):**

```
Concurrent Users: 10
Average Response: 350ms
95th percentile: 800ms
Error rate: <1%
```

---

## 🚀 7. Upgrade Path

Khi cần scale, ưu tiên upgrade:

**Level 1: Backend performance ($7/month)**
- Starter plan: 512MB → 2GB RAM, 0.5 CPU
- Tắt auto-sleep
- → Improve response time, hỗ trợ 50+ concurrent users

**Level 2: Database ($7/month)**
- PostgreSQL Starter: 1GB → 10GB storage, better performance
- → Hỗ trợ nhiều data, faster queries

**Level 3: Redis ($10/month)**
- Redis Starter: 25MB → 256MB
- → Nhiều sessions, tokens, cache

**Level 4: Dedicated Keycloak ($21/month)**
- Deploy Keycloak riêng trên Standard plan (2GB RAM)
- → Professional IAM, SSO, social login

---

## ✅ 8. Checklist trước khi Deploy

### Code Changes

- [ ] Loại bỏ tất cả Keycloak dependencies
- [ ] Chuyển sang Custom JWT cho tất cả user types
- [ ] Tạo `application-prod.properties` với PostgreSQL config
- [ ] Set `JAVA_TOOL_OPTIONS` cho memory limit
- [ ] Tắt schedulers hoặc tạo manual trigger endpoints
- [ ] Implement auto-reconnect cho WebSocket
- [ ] Thêm loading states cho cold start
- [ ] Build optimization cho frontend
- [ ] Environment variables cho production

### Testing

- [ ] Test với PostgreSQL locally
- [ ] Test memory usage với 300MB heap
- [ ] Load test với 10 concurrent users
- [ ] Test frontend build size (<5MB initial bundle)
- [ ] Test WebSocket reconnection
- [ ] Verify CORS settings

### Deployment

- [ ] Push code to GitHub
- [ ] Create Render account
- [ ] Deploy PostgreSQL database
- [ ] Deploy Redis instance
- [ ] Deploy backend web service
- [ ] Deploy admin frontend static site
- [ ] Deploy supplier frontend static site
- [ ] Set all environment variables
- [ ] Configure custom domains (optional)

### Post-deployment

- [ ] Setup cron-job.org để keep service alive
- [ ] Setup cron jobs cho maintenance tasks
- [ ] Configure error tracking (Sentry)
- [ ] Monitor logs và metrics
- [ ] Test end-to-end flows
- [ ] Document API endpoints

---

## 🆘 9. Troubleshooting

### Backend không start

```bash
# Check logs trong Render dashboard
# Common issues:

# 1. Out of memory
Error: Java heap space
→ Giảm Xmx xuống 250m

# 2. Database connection failed
Connection refused: postgres
→ Check DATABASE_URL environment variable

# 3. Port binding
Port 8080 already in use
→ Render tự động inject PORT env var, đảm bảo:
server.port=${PORT:8080}
```

### Frontend không connect backend

```bash
# Check CORS settings
Access-Control-Allow-Origin error
→ Verify CORS_ALLOWED_ORIGINS includes frontend URL

# Check API base URL
404 Not Found
→ Verify VITE_API_BASE_URL trong .env.production
```

### Service sleep quá nhiều

```bash
# Setup keep-alive ping
1. Vào cron-job.org
2. Tạo job: GET /api/health mỗi 14 phút
3. Verify logs trong Render
```

### Database đầy (1GB limit)

```sql
-- Check top tables
SELECT
  relname,
  pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 10;

-- Cleanup old data
DELETE FROM in_app_notification WHERE created_at < NOW() - INTERVAL '30 days';
DELETE FROM chat_message WHERE created_at < NOW() - INTERVAL '90 days';
VACUUM FULL;
```

---

## 📞 10. Support và Resources

**Render Documentation:**
- https://render.com/docs
- https://community.render.com

**Free Tier Limits:**
- https://render.com/docs/free

**External Services (Free Tier):**
- **Cron Jobs**: https://cron-job.org
- **Error Tracking**: https://sentry.io (50k events/month)
- **Uptime Monitoring**: https://uptimerobot.com (50 monitors)
- **Log Management**: https://papertrailapp.com (50MB/month)

---

## 🎯 Kết luận

Deploy SaveFood lên Render free tier **KHẢ THI** nhưng cần:

### ✅ Pros:
- Hoàn toàn miễn phí cho demo/MVP
- Auto SSL/HTTPS
- CI/CD tự động từ GitHub
- Đủ cho 10-20 concurrent users
- Frontend load nhanh (static CDN)

### ⚠️ Cons:
- Service sleep sau 15 phút
- Performance giới hạn (0.1 CPU)
- Cần loại bỏ Keycloak
- Schedulers phải chạy manual
- Database storage limit 1GB

### 🎓 Phù hợp cho:
- **Graduation project demo** ✅
- **Portfolio showcase** ✅
- **MVP testing** ✅
- **Production với nhiều users** ❌ (cần upgrade)

### 💰 Chi phí để scale production-ready:
- **$21/month**: Backend Standard + DB Starter + Redis Starter
- **$42/month**: + Keycloak Standard instance
- **Alternative**: Deploy lên VPS (Contabo, Hetzner) ~$5/month

---

**Thời gian dự kiến để implement tất cả changes: 2-3 ngày**

Good luck! 🚀
