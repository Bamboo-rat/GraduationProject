# Hướng dẫn Deploy lên Render

## Tổng quan
Dự án bao gồm 3 services chính:
- Backend API (Spring Boot + Java 21)
- Frontend Admin (React Router v7)
- Frontend Supplier (React Router v7)

## Bước 1: Chuẩn bị

### 1.1. Push code lên GitHub
```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

### 1.2. Tạo tài khoản Render
- Truy cập: https://render.com
- Sign up bằng GitHub account

## Bước 2: Deploy Redis (Private Service)

1. Vào Render Dashboard → Click "New +" → Chọn "Redis"
2. Cấu hình:
   - **Name**: `graduation-project-redis`
   - **Region**: Singapore (hoặc gần bạn nhất)
   - **Plan**: Starter ($7/month) hoặc Free (25MB - có giới hạn)
3. Click **"Create Redis"**
4. Sau khi tạo xong, copy:
   - **Internal Redis URL**: `redis://...`
   - **Host**, **Port**, **Password**

## Bước 3: Deploy Backend API

### Option A: Deploy thủ công

1. Click "New +" → "Web Service"
2. Connect repository GitHub
3. Cấu hình:
   - **Name**: `graduation-project-backend`
   - **Region**: Singapore
   - **Branch**: main
   - **Root Directory**: `backend`
   - **Environment**: Docker
   - **Dockerfile Path**: `backend/Dockerfile`
   - **Docker Command**: (để trống)

4. **Environment Variables** - Click "Advanced" và thêm:

```env
# Database
DB_URL=jdbc:mysql://foodsave.cbqgwoyam2lh.ap-southeast-2.rds.amazonaws.com:3306/foodsave?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
SPRING_DATASOURCE_PASSWORD=E0MvlgcXl1UD2nBpf5A9

# Keycloak (cần update URL sau khi deploy Keycloak)
KEYCLOAK_AUTH_SERVER_URL=http://your-keycloak-url:8081
KEYCLOAK_REALM=SaveFood
KEYCLOAK_RESOURCE=savefood-client
KEYCLOAK_CLIENT_SECRET=your-client-secret
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=admin
KEYCLOAK_ADMIN_CLIENT_ID=admin-cli

# SendGrid
SENDGRID_API_KEY=YOUR_SENDGRID_API_KEY
SENDGRID_FROM_EMAIL=noreply@savefood.com
SENDGRID_FROM_NAME=SaveFood Platform

# CORS & Frontend URLs (update sau khi deploy frontend)
FRONTEND_URL=https://graduation-project-admin.onrender.com
CORS_ALLOWED_ORIGINS=https://graduation-project-admin.onrender.com,https://graduation-project-supplier.onrender.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Redis (từ bước 2)
REDIS_HOST=red-xxx.singapore-postgres.render.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# JWT Secret
JWT_SECRET=12507b0ad6ed822538d789fba5dd4129ed344a636eab0d97c1d70586c9e242c9

# Node Environment
NODE_ENV=production
```

5. **Health Check Path**: `/actuator/health` (optional)
6. **Instance Type**: 
   - Free (512MB RAM - có giới hạn)
   - Starter ($7/month - 512MB)
   - Standard ($25/month - 2GB) - Recommended cho production

7. Click **"Create Web Service"**

### Option B: Deploy bằng Blueprint (render.yaml)

1. Upload file `render.yaml` đã tạo lên root repository
2. Vào Render Dashboard → "New +" → "Blueprint"
3. Connect repository và chọn `render.yaml`
4. Điền các Environment Variables cần thiết
5. Click "Apply"

## Bước 4: Deploy Frontend Admin

1. Click "New +" → "Web Service"
2. Connect repository GitHub
3. Cấu hình:
   - **Name**: `graduation-project-admin`
   - **Region**: Singapore
   - **Branch**: main
   - **Root Directory**: `website/fe_admin`
   - **Environment**: Docker
   - **Dockerfile Path**: `website/fe_admin/Dockerfile`

4. **Environment Variables**:
```env
VITE_API_URL=https://graduation-project-backend.onrender.com
NODE_ENV=production
```

5. **Instance Type**: Starter hoặc Free
6. Click **"Create Web Service"**

## Bước 5: Deploy Frontend Supplier

Tương tự Frontend Admin:
- **Name**: `graduation-project-supplier`
- **Root Directory**: `website/fe_supplier`
- **Dockerfile Path**: `website/fe_supplier/Dockerfile`

Environment Variables:
```env
VITE_API_URL=https://graduation-project-backend.onrender.com
NODE_ENV=production
```

## Bước 6: Deploy Keycloak (Optional)

### Option A: Deploy trên Render

1. Click "New +" → "Web Service"
2. Không connect repository, chọn "Deploy from Docker registry"
3. Cấu hình:
   - **Name**: `graduation-project-keycloak`
   - **Docker Image**: `quay.io/keycloak/keycloak:25.0`
   - **Region**: Singapore
   
4. Environment Variables:
```env
KC_HTTP_ENABLED=true
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=admin
KC_DB=mysql
KC_DB_URL=jdbc:mysql://keycloak-db.cbqgwoyam2lh.ap-southeast-2.rds.amazonaws.com:3306/keycloakdb?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
KC_DB_USERNAME=admin
KC_DB_PASSWORD=SaveFoodHVNH2025
```

5. **Docker Command**: `start-dev --http-port=8081 --hostname-strict=false`
6. **Instance Type**: Standard (Keycloak khá nặng)

### Option B: Sử dụng Keycloak service khác
- Deploy trên AWS EC2
- Sử dụng Keycloak Cloud
- Hoặc giữ nguyên local/AWS hiện tại

## Bước 7: Cập nhật lại Environment Variables

Sau khi có URL của các services:

1. Update Backend `CORS_ALLOWED_ORIGINS`:
```
https://graduation-project-admin.onrender.com,https://graduation-project-supplier.onrender.com
```

2. Update Frontend `VITE_API_URL`:
```
https://graduation-project-backend.onrender.com
```

3. Update Backend `KEYCLOAK_AUTH_SERVER_URL`:
```
https://graduation-project-keycloak.onrender.com
```

## Bước 8: Kiểm tra

1. Truy cập Backend health check:
   - https://graduation-project-backend.onrender.com/actuator/health

2. Truy cập Frontend Admin:
   - https://graduation-project-admin.onrender.com

3. Truy cập Frontend Supplier:
   - https://graduation-project-supplier.onrender.com

4. Test các chức năng chính:
   - Login
   - Register
   - API calls
   - WebSocket (chat)

## Lưu ý quan trọng

### 1. Free Plan Limitations
- **Spin down sau 15 phút không hoạt động**
- Cold start có thể mất 30-60 giây
- 750 giờ/tháng (được reset đầu tháng)
- 512MB RAM

→ Recommend: Dùng Starter plan ($7/month) cho production

### 2. Database
- RDS MySQL của bạn ở AWS Singapore → OK
- Đảm bảo Security Group cho phép Render IPs kết nối
- Hoặc có thể migrate sang Render PostgreSQL

### 3. Redis
- Free plan: 25MB, giới hạn connections
- Starter plan: 256MB, no limits
- Nếu dùng nhiều caching → upgrade

### 4. Build Time
- Backend (Maven): ~5-10 phút
- Frontend: ~3-5 phút
- Auto deploy khi push code lên GitHub

### 5. Logs và Monitoring
- Xem logs: Service → "Logs" tab
- Metrics: Service → "Metrics" tab
- Alerts: Settings → "Notifications"

### 6. Custom Domain (Optional)
- Có thể add custom domain
- Settings → "Custom Domain"
- Cần verify DNS records

### 7. SSL/TLS
- Render tự động cấp SSL certificate
- HTTPS mặc định cho tất cả services

## Chi phí ước tính

### Free Plan (Development)
- Backend: Free
- Frontend Admin: Free
- Frontend Supplier: Free
- Redis: Free (25MB)
- **Total: $0/month**

**Limitations**: Services sleep sau 15 phút, cold start chậm

### Starter Plan (Production)
- Backend: $7/month
- Frontend Admin: $7/month
- Frontend Supplier: $7/month
- Redis: $7/month
- Keycloak: $25/month (Standard - cần nhiều RAM)
- **Total: ~$53/month**

### Optimization
Nếu muốn tiết kiệm:
- Dùng 1 service cho cả Admin + Supplier frontend
- Keycloak deploy ở external service
- **Total có thể: ~$21/month**

## Troubleshooting

### Backend không start được
1. Check logs: `[ERROR]` messages
2. Verify database connection
3. Check environment variables
4. Verify Redis connection

### Frontend không connect được Backend
1. Check CORS settings
2. Verify `VITE_API_URL`
3. Check network tab trong browser
4. Verify backend health

### Keycloak connection failed
1. Check `KEYCLOAK_AUTH_SERVER_URL`
2. Verify Keycloak service đang chạy
3. Check realm và client configuration

### Redis connection timeout
1. Verify Redis service đang chạy
2. Check Redis host/port/password
3. Check connection limits (Free plan)

## Liên hệ & Support
- Render Docs: https://render.com/docs
- Render Community: https://community.render.com
- Support: support@render.com
