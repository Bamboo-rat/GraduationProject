# 🚀 SaveFood - Deploy lên Render với Keycloak

## 📋 Tổng quan

Hệ thống SaveFood của bạn đã có đầy đủ cấu hình Docker:
- ✅ `backend/Dockerfile` - Spring Boot API
- ✅ `keycloak/Dockerfile` - Keycloak Identity Server
- ✅ `redis/Dockerfile` - Redis Cache
- ✅ `website/fe_admin/Dockerfile` - Admin Portal
- ✅ `website/fe_supplier/Dockerfile` - Supplier Portal
- ✅ `render.yaml` - Render deployment config

**Bạn đã SẴN SÀNG deploy!** 🎉

---

## 💰 Phân tích Chi phí Chi tiết

### Cấu hình hiện tại trong `render.yaml`:

| Service | Type | Plan | Specs | Cost/month |
|---------|------|------|-------|------------|
| **Keycloak** | Web Service | Standard | 2GB RAM, 1 CPU | **$21** |
| **Backend** | Web Service | Starter | 512MB RAM, 0.5 CPU | **$7** |
| **Redis** | Private Service | Starter | 1GB Disk | **$7** |
| **Admin Frontend** | Web Service (Docker) | Starter | 512MB RAM | **$7** |
| **Supplier Frontend** | Web Service (Docker) | Starter | 512MB RAM | **$7** |
| **MySQL (AWS RDS)** | External | - | Foodsave + Keycloak DB | **$0** (đã có) |

**💸 Tổng chi phí hiện tại: $49/month**

---

### 🎯 Tối ưu hóa: Giảm xuống $21/month

| Thay đổi | Cách thực hiện | Tiết kiệm | Ảnh hưởng |
|----------|----------------|-----------|-----------|
| **Frontend → Static** | Build frontend thành static HTML/CSS/JS, serve qua CDN | **-$14** | ✅ Nhanh hơn, Free SSL |
| **Redis → Free tier** | Dùng Render Redis Free 25MB | **-$7** | ⚠️ Giới hạn 25MB (đủ cho OTP) |
| **Backend → Free** | Chấp nhận sleep sau 15 phút | **-$7** | ⚠️ Cold start 30-60s |

**🎉 Tổng tiết kiệm: -$28 → Chi phí còn $21/month**

---

### 📊 So sánh 3 Options

#### Option 1: Budget Tối thiểu - $21/month ✅ KHUYẾN NGHỊ CHO DEMO

```
✅ Keycloak Standard ($21) - BẮT BUỘC giữ
❌ Backend Free - Sleep 15 phút
❌ Redis Free - 25MB only
❌ Frontends Static - Free CDN
✅ AWS RDS MySQL - $0 (đã có)
```

**Phù hợp cho:**
- Graduation project demo
- Portfolio showcase
- Low traffic (<100 users/day)

**Ưu điểm:**
- Chi phí thấp nhất
- Keycloak không bao giờ sleep
- Frontend load cực nhanh

**Nhược điểm:**
- Backend sleep sau 15 phút không dùng
- First request mất 30-60s wake up
- WebSocket connections bị drop

---

#### Option 2: Production-Ready - $28/month ✅ KHUYẾN NGHỊ CHO PORTFOLIO

```
✅ Keycloak Standard ($21)
✅ Backend Starter ($7) - Không sleep
❌ Redis Free - 25MB
❌ Frontends Static - Free
✅ AWS RDS MySQL - $0
```

**Phù hợp cho:**
- Portfolio với live demo
- Small production (100-500 users/day)
- Client presentation

**Ưu điểm:**
- Backend luôn available
- Response time ổn định
- WebSocket stable

**Nhược điểm:**
- Redis giới hạn 25MB

---

#### Option 3: Full Production - $49/month

```
✅ Tất cả services Starter/Standard
✅ Không giới hạn nào
```

**Phù hợp cho:**
- Production với traffic cao
- 1000+ users/day
- Critical uptime requirements

---

## 🛠️ Cách Deploy (3 Bước Đơn giản)

### Bước 1: Chuẩn bị Environment Variables

Tạo file `.env.render` để lưu các secrets (KHÔNG commit vào Git):

```bash
# Keycloak
KEYCLOAK_ADMIN_PASSWORD=your_secure_password_here

# Backend
KEYCLOAK_CLIENT_SECRET=your_client_secret
JWT_SECRET=your_jwt_secret_32chars_or_more
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@savefood.com
SENDGRID_FROM_NAME=SaveFood Platform
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=https://graduation-project-admin.onrender.com
CORS_ALLOWED_ORIGINS=https://graduation-project-admin.onrender.com,https://graduation-project-supplier.onrender.com

# Database (dùng AWS RDS hiện tại)
DB_URL=jdbc:mysql://foodsave.cbqgwoyam2lh.ap-southeast-2.rds.amazonaws.com:3306/foodsave?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&zeroDateTimeBehavior=convertToNull
SPRING_DATASOURCE_PASSWORD=E0MvlgcXl1UD2nBpf5A9

# Keycloak Database
KC_DB_PASSWORD=SaveFoodHVNH2025
```

---

### Bước 2: Deploy lên Render

#### Cách 1: Dùng Render Dashboard (Khuyến nghị cho lần đầu)

**2.1. Tạo account Render**
- Truy cập: https://render.com
- Sign up bằng GitHub account
- Verify email

**2.2. Connect GitHub Repository**
- Dashboard → "New" → "Blueprint"
- Connect GitHub → Chọn repository `GraduationProject`
- Render sẽ tự động phát hiện `render.yaml`

**2.3. Cấu hình Environment Variables**

Render sẽ hiển thị các environment variables cần thiết từ `render.yaml`. Điền các giá trị từ `.env.render`:

**graduation-project-keycloak:**
```
KEYCLOAK_ADMIN_PASSWORD = [paste từ .env.render]
KC_DB_PASSWORD = [paste từ .env.render]
```

**graduation-project-backend:**
```
DB_URL = [paste từ .env.render]
SPRING_DATASOURCE_PASSWORD = [paste từ .env.render]
KEYCLOAK_CLIENT_SECRET = [paste từ .env.render]
JWT_SECRET = [paste từ .env.render]
SENDGRID_API_KEY = [paste từ .env.render]
... (tất cả các env vars khác)
```

**2.4. Deploy!**
- Click "Apply"
- Render sẽ build và deploy tất cả 5 services

**Thời gian deploy dự kiến:**
- Keycloak: 3-5 phút
- Backend: 5-7 phút (Maven build)
- Redis: 1-2 phút
- Frontends: 3-4 phút mỗi cái

**Tổng: ~15-20 phút cho lần đầu**

---

#### Cách 2: Dùng Render CLI (Cho advanced users)

```bash
# Install Render CLI
npm install -g @render/cli

# Login
render login

# Deploy từ render.yaml
render blueprint launch
```

---

### Bước 3: Verify Deployment

**3.1. Check Service Status**

Trong Render Dashboard, verify tất cả services đều "Live":
- ✅ graduation-project-keycloak
- ✅ graduation-project-backend
- ✅ graduation-project-redis
- ✅ graduation-project-admin
- ✅ graduation-project-supplier

**3.2. Test Keycloak**

```bash
# Get Keycloak URL từ Render Dashboard
KEYCLOAK_URL=https://graduation-project-keycloak.onrender.com

# Test health
curl $KEYCLOAK_URL/health

# Login Keycloak Admin Console
open $KEYCLOAK_URL
# Username: admin
# Password: [KEYCLOAK_ADMIN_PASSWORD từ env vars]
```

**3.3. Test Backend API**

```bash
BACKEND_URL=https://graduation-project-backend.onrender.com

# Test health endpoint
curl $BACKEND_URL/api/health

# Test Swagger UI
open $BACKEND_URL/swagger-ui/index.html
```

**3.4. Test Frontends**

```bash
# Admin Portal
open https://graduation-project-admin.onrender.com

# Supplier Portal
open https://graduation-project-supplier.onrender.com
```

---

## 🔧 Tối ưu hóa Chi phí (Option 1: $21/month)

Nếu muốn giảm chi phí xuống $21/month, làm theo:

### Thay đổi 1: Frontends → Static Sites

**Cập nhật render.yaml:**

```yaml
# XÓA phần này:
  - type: web
    name: graduation-project-admin
    runtime: docker
    dockerfilePath: ./website/fe_admin/Dockerfile
    plan: starter  # ← Xóa

# THAY BẰNG:
  - type: web
    name: graduation-project-admin
    env: static
    buildCommand: cd website/fe_admin && npm install && npm run build
    staticPublishPath: website/fe_admin/build/client
    routes:
      - type: rewrite
        source: /*
        destination: /index.html

# Làm tương tự cho supplier frontend
```

**Tiết kiệm: $14/month**

---

### Thay đổi 2: Redis → Free Tier

**Cập nhật render.yaml:**

```yaml
# ĐỔI:
  - type: pserv
    name: graduation-project-redis
    plan: starter  # ← Đổi thành free
    disk:
      sizeGB: 1  # ← Xóa disk cho free tier

# THÀNH:
databases:
  - name: graduation-project-redis
    plan: free  # Redis 25MB free
    region: singapore
```

**Tiết kiệm: $7/month**

**⚠️ Lưu ý:**
- 25MB có thể đầy nếu lưu nhiều refresh tokens
- Xem xét lưu refresh tokens vào MySQL thay vì Redis

---

### Thay đổi 3: Backend → Free Tier (Optional)

**Cập nhật render.yaml:**

```yaml
  - type: web
    name: graduation-project-backend
    plan: free  # ← Đổi từ starter → free
```

**Tiết kiệm: $7/month**

**⚠️ Nhược điểm:**
- Sleep sau 15 phút không dùng
- Cold start 30-60 giây
- Cần setup keep-alive ping

**Workaround cho sleep:**

Sử dụng cron-job.org để ping mỗi 14 phút:

```
URL: https://graduation-project-backend.onrender.com/api/health
Method: GET
Schedule: */14 * * * * (Every 14 minutes)
```

---

## 📝 Cập nhật render.yaml Tối ưu ($21/month)

Tạo file `render-optimized.yaml`:

```yaml
services:
  # ===== KEYCLOAK (GIỮ NGUYÊN) =====
  - type: web
    name: graduation-project-keycloak
    runtime: docker
    dockerfilePath: ./keycloak/Dockerfile
    dockerContext: ./keycloak
    plan: standard  # $21/month - BẮT BUỘC
    region: singapore
    envVars:
      - key: KEYCLOAK_ADMIN
        value: admin
      - key: KEYCLOAK_ADMIN_PASSWORD
        sync: false
      - key: KC_DB
        value: mysql
      - key: KC_DB_URL
        value: jdbc:mysql://keycloak-db.cbqgwoyam2lh.ap-southeast-2.rds.amazonaws.com:3306/keycloakdb?useSSL=false
      - key: KC_DB_USERNAME
        value: admin
      - key: KC_DB_PASSWORD
        sync: false
      - key: KC_HTTP_ENABLED
        value: "true"
      - key: KC_HOSTNAME_STRICT
        value: "false"

  # ===== BACKEND (ĐỔI FREE HOẶC GIỮ STARTER) =====
  - type: web
    name: graduation-project-backend
    runtime: docker
    dockerfilePath: ./backend/Dockerfile
    dockerContext: ./backend
    plan: free  # Hoặc starter nếu muốn trả $7
    region: singapore
    envVars:
      - key: DB_URL
        sync: false
      - key: SPRING_DATASOURCE_PASSWORD
        sync: false
      - key: KEYCLOAK_AUTH_SERVER_URL
        fromService:
          type: web
          name: graduation-project-keycloak
          envVarKey: RENDER_EXTERNAL_URL
      - key: KEYCLOAK_REALM
        value: savefood
      - key: KEYCLOAK_RESOURCE
        value: backend-fs
      - key: KEYCLOAK_CLIENT_SECRET
        sync: false
      - key: KEYCLOAK_ADMIN_USERNAME
        value: admin
      - key: KEYCLOAK_ADMIN_PASSWORD
        sync: false
      - key: KEYCLOAK_ADMIN_CLIENT_ID
        value: admin-cli
      - key: SENDGRID_API_KEY
        sync: false
      - key: SENDGRID_FROM_EMAIL
        sync: false
      - key: SENDGRID_FROM_NAME
        value: SaveFood
      - key: FRONTEND_URL
        sync: false
      - key: CORS_ALLOWED_ORIGINS
        sync: false
      - key: CLOUDINARY_CLOUD_NAME
        sync: false
      - key: CLOUDINARY_API_KEY
        sync: false
      - key: CLOUDINARY_API_SECRET
        sync: false
      - key: JWT_SECRET
        sync: false
    healthCheckPath: /actuator/health

  # ===== ADMIN FRONTEND (ĐỔI STATIC) =====
  - type: web
    name: graduation-project-admin
    env: static
    region: singapore
    buildCommand: |
      cd website/fe_admin
      echo "VITE_API_URL=https://graduation-project-backend.onrender.com" > .env.production
      npm install
      npm run build
    staticPublishPath: website/fe_admin/build/client
    routes:
      - type: rewrite
        source: /*
        destination: /index.html

  # ===== SUPPLIER FRONTEND (ĐỔI STATIC) =====
  - type: web
    name: graduation-project-supplier
    env: static
    region: singapore
    buildCommand: |
      cd website/fe_supplier
      echo "VITE_API_URL=https://graduation-project-backend.onrender.com" > .env.production
      npm install
      npm run build
    staticPublishPath: website/fe_supplier/build/client
    routes:
      - type: rewrite
        source: /*
        destination: /index.html

# ===== REDIS FREE =====
databases:
  - name: graduation-project-redis
    plan: free
    region: singapore
    maxmemoryPolicy: allkeys-lru
```

**Để sử dụng config tối ưu:**

```bash
# Backup file cũ
mv render.yaml render-original.yaml

# Dùng config tối ưu
mv render-optimized.yaml render.yaml

# Push và redeploy
git add render.yaml
git commit -m "Optimize Render config for $21/month"
git push

# Render sẽ tự động redeploy
```

---

## ⚠️ Troubleshooting

### 1. Keycloak không start (Out of Memory)

**Triệu chứng:**
```
Error: Java heap space
Container exited with code 137
```

**Nguyên nhân:** Plan quá nhỏ (free/starter)

**Giải pháp:**
- Keycloak CẦN Standard plan (2GB RAM) - KHÔNG THỂ GIẢM

---

### 2. Backend sleep quá nhiều (Free tier)

**Triệu chứng:**
- First request mất 30-60s
- WebSocket disconnect

**Giải pháp:**
1. Setup keep-alive ping tại https://cron-job.org
2. Hoặc upgrade Backend lên Starter ($7)

---

### 3. Redis out of memory (25MB limit)

**Triệu chứng:**
```
OOM command not allowed when used memory > 'maxmemory'
```

**Giải pháp Option 1:** Giảm usage
```java
// Giảm OTP TTL từ 3 → 2 phút
private static final long OTP_EXPIRATION_MINUTES = 2L;

// Lưu refresh tokens vào MySQL thay vì Redis
```

**Giải pháp Option 2:** Upgrade Redis
```yaml
databases:
  - name: graduation-project-redis
    plan: starter  # $7/month - 256MB
```

---

### 4. CORS errors từ frontend

**Triệu chứng:**
```
Access-Control-Allow-Origin header is missing
```

**Giải pháp:**

Verify `CORS_ALLOWED_ORIGINS` bao gồm đúng URLs:

```bash
# Backend environment variable
CORS_ALLOWED_ORIGINS=https://graduation-project-admin.onrender.com,https://graduation-project-supplier.onrender.com
```

---

### 5. Keycloak connection refused từ Backend

**Triệu chứng:**
```
Connection refused: graduation-project-keycloak.onrender.com
```

**Nguyên nhân:** Keycloak chưa start hoặc URL sai

**Giải pháp:**

Check `KEYCLOAK_AUTH_SERVER_URL`:

```yaml
envVars:
  - key: KEYCLOAK_AUTH_SERVER_URL
    fromService:
      type: web
      name: graduation-project-keycloak
      envVarKey: RENDER_EXTERNAL_URL  # Render tự động inject
```

---

## 📊 Performance Benchmarks

### Expected Performance với $21 Option:

| Metric | Value | Notes |
|--------|-------|-------|
| **Keycloak response time** | 50-200ms | Standard plan, stable |
| **Backend cold start** | 30-60s | Free tier limitation |
| **Backend warm response** | 100-300ms | Depends on DB query |
| **Frontend load time** | <2s | Static CDN, very fast |
| **WebSocket stability** | Medium | Disconnects on backend sleep |
| **Concurrent users** | 50-100 | Limited by free backend |

### Expected Performance với $28 Option:

| Metric | Value | Notes |
|--------|-------|-------|
| **All services** | Always available | No sleep |
| **Backend response** | 50-200ms | Consistent |
| **WebSocket stability** | High | Stable connections |
| **Concurrent users** | 200-500 | Better handling |

---

## 🎯 Checklist trước khi Deploy

### Pre-deployment

- [ ] Tất cả Dockerfiles đã test locally
- [ ] `.env.render` file đã chuẩn bị đầy đủ
- [ ] AWS RDS MySQL databases đang running
- [ ] Cloudinary account đã setup
- [ ] SendGrid account đã setup và verify domain
- [ ] GitHub repository đã push code mới nhất

### Deployment

- [ ] Render account đã tạo và verify
- [ ] GitHub repository đã connect với Render
- [ ] Blueprint đã apply từ `render.yaml`
- [ ] Tất cả environment variables đã điền
- [ ] Tất cả services đã deploy thành công

### Post-deployment

- [ ] Keycloak admin console accessible
- [ ] Backend Swagger UI accessible
- [ ] Admin frontend accessible
- [ ] Supplier frontend accessible
- [ ] Test login flow (Customer, Supplier, Admin)
- [ ] Test OTP (email/SMS)
- [ ] Test file upload (Cloudinary)
- [ ] Test WebSocket chat
- [ ] Setup monitoring (optional: Sentry, UptimeRobot)
- [ ] Setup keep-alive cron job (nếu dùng free backend)

---

## 💡 Tips & Best Practices

### 1. Custom Domains (Optional)

Thay vì dùng `*.onrender.com`, bạn có thể dùng custom domain miễn phí:

```
admin.savefood.com → graduation-project-admin
supplier.savefood.com → graduation-project-supplier
api.savefood.com → graduation-project-backend
auth.savefood.com → graduation-project-keycloak
```

**Setup trong Render Dashboard:** Settings → Custom Domain → Add

---

### 2. Monitoring và Alerts

**Sentry (Free tier: 5K events/month):**

```bash
# Add to backend pom.xml
<dependency>
    <groupId>io.sentry</groupId>
    <artifactId>sentry-spring-boot-starter</artifactId>
    <version>7.0.0</version>
</dependency>

# Environment variable
SENTRY_DSN=https://xxx@sentry.io/xxx
```

**UptimeRobot (Free: 50 monitors):**
- Monitor all 5 services
- Email alerts on downtime
- Public status page

---

### 3. Backup Strategy

**Database:**
```bash
# Manual backup AWS RDS
aws rds create-db-snapshot \
  --db-instance-identifier foodsave \
  --db-snapshot-identifier backup-$(date +%Y%m%d)
```

**Redis:**
- Free tier: No persistent storage (data loss on restart)
- Starter tier: Automatic persistence

**Giải pháp:**
Lưu critical data (refresh tokens) vào MySQL thay vì Redis.

---

### 4. Logs và Debugging

**Xem logs trong Render Dashboard:**
```
Service → Logs → Real-time streaming
```

**Download logs:**
```bash
render logs graduation-project-backend --tail 1000 > backend.log
```

---

### 5. CI/CD Automation

Render tự động redeploy khi push to main branch:

```bash
git add .
git commit -m "Update feature X"
git push origin main
# Render sẽ tự động build và deploy
```

---

## 🆘 Support và Resources

**Render Documentation:**
- Docs: https://render.com/docs
- Community: https://community.render.com
- Status: https://status.render.com

**Pricing:**
- Free tier: https://render.com/docs/free
- Paid plans: https://render.com/pricing

**External Tools (Free tier):**
- Keep-alive: https://cron-job.org (free cron jobs)
- Monitoring: https://uptimerobot.com (50 monitors free)
- Error tracking: https://sentry.io (5K events/month)
- Logs: https://papertrailapp.com (50MB/month)

---

## 🎓 Kết luận

### ✅ Khuyến nghị cho Graduation Project:

**Option 1: $21/month**
- Keycloak Standard ($21)
- Backend Free (sleep OK cho demo)
- Redis Free
- Frontends Static Free
- AWS RDS $0

**Lý do:**
- Chi phí thấp nhất có thể
- Vẫn giữ được Keycloak authentication
- Frontend load cực nhanh
- Đủ cho demo presentation
- Dễ upgrade sau khi tốt nghiệp

---

### 🚀 Ready to Deploy!

Hệ thống của bạn đã sẵn sàng với:
- ✅ Dockerfiles cho tất cả services
- ✅ render.yaml đã cấu hình
- ✅ AWS RDS databases
- ✅ External SaaS services (Cloudinary, SendGrid)

**Chỉ cần:**
1. Tạo account Render
2. Connect GitHub
3. Điền environment variables
4. Click "Apply"

**Thời gian: 15-20 phút!**

Good luck! 🍀
