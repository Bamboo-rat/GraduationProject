# Deploy Full Stack lên Render với Docker

## Tổng quan kiến trúc

Toàn bộ dự án sẽ được deploy bằng **Docker containers**:

```
┌─────────────────────────────────────────────────┐
│                  Render Cloud                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐      ┌──────────────┐       │
│  │   Redis      │◄─────┤   Backend    │       │
│  │  (Docker)    │      │ Spring Boot  │       │
│  └──────────────┘      │  (Docker)    │       │
│   Private Service      └───────▲──────┘       │
│                                │               │
│  ┌──────────────┐             │                │
│  │  Keycloak    │◄────────────┘                │
│  │  (Docker)    │                              │
│  └──────────────┘                              │
│   Web Service                                  │
│                                                 │
│  ┌──────────────┐      ┌──────────────┐       │
│  │ Frontend     │      │ Frontend     │       │
│  │ Admin        │      │ Supplier     │       │
│  │ (Docker)     │      │ (Docker)     │       │
│  └──────────────┘      └──────────────┘       │
│   Web Service           Web Service           │
└─────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────┐
│    AWS RDS MySQL    │
│  (External DB)      │
└─────────────────────┘
```

## Cấu trúc Dockerfiles

### 1. Redis (`redis/Dockerfile`)
- Base image: `redis:7-alpine`
- Persistent storage: `/data` (1GB disk)
- Password protected
- Type: **Private Service** (chỉ internal services truy cập)

### 2. Keycloak (`keycloak/Dockerfile`)
- Base image: `quay.io/keycloak/keycloak:25.0`
- Connect to MySQL RDS
- Public URL để frontend/backend authenticate
- Type: **Web Service**

### 3. Backend (`backend/Dockerfile`)
- Multi-stage build với Maven
- Java 21 runtime
- Connect to: Redis, Keycloak, MySQL RDS
- Type: **Web Service**

### 4. Frontend Admin & Supplier (`website/fe_*/Dockerfile`)
- Node 20 Alpine
- React Router v7 SSR
- Type: **Web Service**

## Bước 1: Chuẩn bị Repository

```bash
# Đảm bảo có đầy đủ các Dockerfile
git add redis/ keycloak/ backend/ website/
git add render.yaml
git commit -m "Add Docker configuration for Render deployment"
git push origin main
```

## Bước 2: Deploy bằng Blueprint

### Option A: Tự động (Recommended)

1. Login vào [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Blueprint"**
3. Connect GitHub repository
4. Chọn `render.yaml` file
5. Điền các **Secret Environment Variables**:

```bash
# Backend
SPRING_DATASOURCE_PASSWORD=E0MvlgcXl1UD2nBpf5A9
KEYCLOAK_CLIENT_SECRET=your-keycloak-client-secret
KEYCLOAK_ADMIN_PASSWORD=admin-password
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
JWT_SECRET=12507b0ad6ed822538d789fba5dd4129ed344a636eab0d97c1d70586c9e242c9

# Keycloak
KC_DB_PASSWORD=SaveFoodHVNH2025
```

6. Click **"Apply"** → Render sẽ tự động:
   - Build 5 Docker images
   - Deploy 5 services
   - Setup networking giữa các services
   - Tạo Redis disk (1GB persistent storage)

### Option B: Thủ công (từng service)

#### 2.1. Deploy Redis (Private Service)

```yaml
Name: graduation-project-redis
Type: Private Service
Runtime: Docker
Dockerfile Path: redis/Dockerfile
Docker Context: redis/
Region: Singapore
Plan: Starter ($7/month)

Environment Variables:
- REDIS_PASSWORD: [auto-generate]

Disk:
- Name: redis-data
- Mount Path: /data
- Size: 1GB
```

#### 2.2. Deploy Keycloak (Web Service)

```yaml
Name: graduation-project-keycloak
Type: Web Service
Runtime: Docker
Dockerfile Path: keycloak/Dockerfile
Docker Context: keycloak/
Region: Singapore
Plan: Standard ($25/month) - Keycloak cần RAM

Environment Variables:
- KEYCLOAK_ADMIN=admin
- KEYCLOAK_ADMIN_PASSWORD=[secret]
- KC_DB=mysql
- KC_DB_URL=jdbc:mysql://keycloak-db.cbqgwoyam2lh.ap-southeast-2.rds.amazonaws.com:3306/keycloakdb?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
- KC_DB_USERNAME=admin
- KC_DB_PASSWORD=SaveFoodHVNH2025
- KC_HTTP_ENABLED=true
- KC_HOSTNAME_STRICT=false
```

#### 2.3. Deploy Backend (Web Service)

```yaml
Name: graduation-project-backend
Type: Web Service
Runtime: Docker
Dockerfile Path: backend/Dockerfile
Docker Context: backend/
Region: Singapore
Plan: Starter ($7/month)

Environment Variables:
# Database
- DB_URL=jdbc:mysql://foodsave.cbqgwoyam2lh.ap-southeast-2.rds.amazonaws.com:3306/foodsave?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
- SPRING_DATASOURCE_PASSWORD=E0MvlgcXl1UD2nBpf5A9

# Redis (auto-linked từ Redis service)
- REDIS_HOST=[from redis service]
- REDIS_PORT=[from redis service]
- REDIS_PASSWORD=[from redis service]

# Keycloak (auto-linked từ Keycloak service)
- KEYCLOAK_AUTH_SERVER_URL=[from keycloak service]
- KEYCLOAK_REALM=SaveFood
- KEYCLOAK_RESOURCE=savefood-client
- KEYCLOAK_CLIENT_SECRET=[secret]
- KEYCLOAK_ADMIN_USERNAME=admin
- KEYCLOAK_ADMIN_PASSWORD=[secret]
- KEYCLOAK_ADMIN_CLIENT_ID=admin-cli

# Other services
- SENDGRID_API_KEY=[secret]
- SENDGRID_FROM_EMAIL=noreply@savefood.com
- SENDGRID_FROM_NAME=SaveFood
- CLOUDINARY_CLOUD_NAME=[secret]
- CLOUDINARY_API_KEY=[secret]
- CLOUDINARY_API_SECRET=[secret]
- JWT_SECRET=[secret]

# Frontend URLs (update sau khi deploy frontend)
- FRONTEND_URL=https://graduation-project-admin.onrender.com
- CORS_ALLOWED_ORIGINS=https://graduation-project-admin.onrender.com,https://graduation-project-supplier.onrender.com
```

#### 2.4. Deploy Frontend Admin

```yaml
Name: graduation-project-admin
Type: Web Service
Runtime: Docker
Dockerfile Path: website/fe_admin/Dockerfile
Docker Context: website/fe_admin/
Region: Singapore
Plan: Starter ($7/month)

Environment Variables:
- VITE_API_URL=https://graduation-project-backend.onrender.com
- NODE_ENV=production
```

#### 2.5. Deploy Frontend Supplier

```yaml
Name: graduation-project-supplier
Type: Web Service
Runtime: Docker
Dockerfile Path: website/fe_supplier/Dockerfile
Docker Context: website/fe_supplier/
Region: Singapore
Plan: Starter ($7/month)

Environment Variables:
- VITE_API_URL=https://graduation-project-backend.onrender.com
- NODE_ENV=production
```

## Bước 3: Kiểm tra Services

Sau khi deploy xong, bạn sẽ có các URLs:

```
Redis: graduation-project-redis.singapore.render.internal:6379 (private)
Keycloak: https://graduation-project-keycloak.onrender.com
Backend: https://graduation-project-backend.onrender.com
Admin: https://graduation-project-admin.onrender.com
Supplier: https://graduation-project-supplier.onrender.com
```

### Health Checks:

```bash
# Backend
curl https://graduation-project-backend.onrender.com/actuator/health

# Keycloak
curl https://graduation-project-keycloak.onrender.com/health

# Frontend
curl https://graduation-project-admin.onrender.com
```

## Bước 4: Cập nhật URLs (nếu deploy thủ công)

Sau khi có URLs, cập nhật lại environment variables:

### Backend:
```bash
KEYCLOAK_AUTH_SERVER_URL=https://graduation-project-keycloak.onrender.com
FRONTEND_URL=https://graduation-project-admin.onrender.com
CORS_ALLOWED_ORIGINS=https://graduation-project-admin.onrender.com,https://graduation-project-supplier.onrender.com
```

### Frontend:
```bash
VITE_API_URL=https://graduation-project-backend.onrender.com
```

## Build Times (ước tính)

- **Redis**: ~1-2 phút (image nhỏ)
- **Keycloak**: ~3-5 phút (image lớn ~600MB)
- **Backend**: ~8-12 phút (Maven build + dependencies)
- **Frontend Admin**: ~4-6 phút (npm build)
- **Frontend Supplier**: ~4-6 phút (npm build)

**Tổng thời gian deploy lần đầu**: ~20-30 phút

## Ưu điểm của cách này

✅ **Toàn bộ là Docker** - dễ debug, dễ scale
✅ **Redis với persistent storage** - data không mất khi restart
✅ **Private Service cho Redis** - an toàn, không public
✅ **Keycloak riêng biệt** - có public URL để authenticate
✅ **Auto-networking** - Services tự connect với nhau
✅ **Blueprint deployment** - Deploy 1 lần, update environment variables dễ dàng

## Chi phí tháng

| Service | Type | Plan | Cost |
|---------|------|------|------|
| Redis | Private Service | Starter | $7 |
| Keycloak | Web Service | Standard | $25 |
| Backend | Web Service | Starter | $7 |
| Frontend Admin | Web Service | Starter | $7 |
| Frontend Supplier | Web Service | Starter | $7 |
| **TOTAL** | | | **$53/month** |

### Giảm chi phí:

1. **Dùng Free tier cho development** ($0/month)
   - Services sẽ sleep sau 15 phút
   - Cold start ~30-60s
   
2. **Optimize Keycloak** ($28/month)
   - Deploy Keycloak ở external service rẻ hơn
   - Hoặc dùng Keycloak Cloud
   
3. **Merge Frontend** ($46/month)
   - Combine Admin + Supplier vào 1 service

## Auto-Deploy với GitHub

Render tự động build + deploy khi:
- Push code lên branch `main`
- Merge Pull Request
- Manual trigger từ Dashboard

### Disable auto-deploy:
Settings → Build & Deploy → Auto-Deploy: **OFF**

## Monitoring & Logs

### View Logs:
```
Dashboard → Service → Logs tab
```

### View Metrics:
```
Dashboard → Service → Metrics tab
- CPU Usage
- Memory Usage
- Response Time
- Request Count
```

### Alerts:
```
Settings → Notifications
- Slack
- Email
- Discord
- PagerDuty
```

## Troubleshooting

### 1. Redis connection failed
```bash
# Check Redis service đang chạy
Dashboard → graduation-project-redis → Events

# Test connection từ backend logs
Backend Logs → Search "redis"
```

### 2. Keycloak không start
```bash
# Check memory - Keycloak cần ít nhất 1GB RAM
Upgrade to Standard plan

# Check database connection
Verify KC_DB_URL và credentials
```

### 3. Backend build failed
```bash
# Check Maven logs
Build logs → Search "[ERROR]"

# Common issues:
- Dependency download timeout → Rebuild
- Out of memory → Upgrade plan
- Test failures → Add -DskipTests
```

### 4. Frontend build failed
```bash
# Check npm logs
Build logs → Search "npm ERR!"

# Common issues:
- Node version mismatch → Check Dockerfile
- Dependency conflicts → Update package-lock.json
```

## Security Best Practices

1. **Environment Variables**: Dùng "sync: false" cho secrets
2. **Redis**: Private Service (không public)
3. **Database**: Dùng AWS RDS với SSL
4. **CORS**: Chỉ allow frontend URLs
5. **Keycloak**: Enable HTTPS strict mode khi production

## Next Steps

- [ ] Setup Custom Domain
- [ ] Configure CDN (Cloudflare)
- [ ] Setup Monitoring (Sentry, DataDog)
- [ ] Configure Backup for Redis
- [ ] Setup CI/CD với GitHub Actions
- [ ] Load Testing
- [ ] Security Audit

## Support

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com
- Discord: https://discord.gg/render
