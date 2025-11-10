# ✅ Checklist Deploy Render

## 📋 Trước khi deploy

- [ ] Code đã push lên GitHub
- [ ] Tất cả Dockerfiles đã có:
  - [ ] `backend/Dockerfile`
  - [ ] `website/fe_admin/Dockerfile`
  - [ ] `website/fe_supplier/Dockerfile`
  - [ ] `redis/Dockerfile`
  - [ ] `keycloak/Dockerfile`
- [ ] File `render.yaml` ở root directory
- [ ] Database MySQL trên AWS RDS đang chạy

## 🔑 Environment Variables cần chuẩn bị

### Backend Secrets:
```bash
DB_URL=jdbc:mysql://foodsave.cbqgwoyam2lh.ap-southeast-2.rds.amazonaws.com:3306/foodsave?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
SPRING_DATASOURCE_PASSWORD=E0MvlgcXl1UD2nBpf5A9
KEYCLOAK_CLIENT_SECRET=<get-from-keycloak-admin>
KEYCLOAK_ADMIN_PASSWORD=admin
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=SaveFood
CLOUDINARY_CLOUD_NAME=xxxxx
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx
JWT_SECRET=12507b0ad6ed822538d789fba5dd4129ed344a636eab0d97c1d70586c9e242c9
FRONTEND_URL=https://graduation-project-admin.onrender.com
CORS_ALLOWED_ORIGINS=https://graduation-project-admin.onrender.com,https://graduation-project-supplier.onrender.com
```

### Keycloak Secrets:
```bash
KC_DB_PASSWORD=SaveFoodHVNH2025
```

## 🚀 Deploy Steps

### Bước 1: Login Render
- [ ] Truy cập https://dashboard.render.com
- [ ] Login bằng GitHub account

### Bước 2: Deploy bằng Blueprint
- [ ] Click "New +" → "Blueprint"
- [ ] Connect GitHub repository
- [ ] Select repository: `GraduationProject`
- [ ] Render tự động detect `render.yaml`
- [ ] Click "Continue"

### Bước 3: Fill Environment Variables
- [ ] Điền tất cả secrets (ở bên trên)
- [ ] Double check tất cả values
- [ ] Click "Apply"

### Bước 4: Đợi Build & Deploy (~20-30 phút)
Render sẽ build theo thứ tự:
- [ ] Redis (~2 phút)
- [ ] Keycloak (~5 phút) 
- [ ] Backend (~10 phút)
- [ ] Frontend Admin (~5 phút)
- [ ] Frontend Supplier (~5 phút)

### Bước 5: Verify URLs
Sau khi deploy xong, check:
- [ ] Redis: `graduation-project-redis.singapore.render.internal` (private)
- [ ] Keycloak: `https://graduation-project-keycloak.onrender.com`
- [ ] Backend: `https://graduation-project-backend.onrender.com`
- [ ] Admin: `https://graduation-project-admin.onrender.com`
- [ ] Supplier: `https://graduation-project-supplier.onrender.com`

### Bước 6: Health Checks
```bash
# Backend API
curl https://graduation-project-backend.onrender.com/actuator/health
# Expected: {"status":"UP"}

# Keycloak
curl https://graduation-project-keycloak.onrender.com/health
# Expected: {"status":"UP"}

# Frontend Admin
curl https://graduation-project-admin.onrender.com
# Expected: HTML response

# Frontend Supplier
curl https://graduation-project-supplier.onrender.com
# Expected: HTML response
```

### Bước 7: Test Application
- [ ] Mở Admin Portal: `https://graduation-project-admin.onrender.com`
- [ ] Test login
- [ ] Test API calls
- [ ] Mở Supplier Portal: `https://graduation-project-supplier.onrender.com`
- [ ] Test login
- [ ] Test WebSocket (chat)

## 🔧 Nếu có lỗi

### Redis không kết nối được
```bash
# Check Redis logs
Dashboard → graduation-project-redis → Logs

# Common fix:
- Verify REDIS_PASSWORD được generate
- Check Backend environment có REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
```

### Keycloak không start
```bash
# Check Keycloak logs
Dashboard → graduation-project-keycloak → Logs

# Common fix:
- Verify database connection (KC_DB_URL)
- Check KC_DB_PASSWORD
- Upgrade to Standard plan (cần 1GB+ RAM)
```

### Backend build failed
```bash
# Check build logs
Dashboard → graduation-project-backend → Events → Build

# Common fix:
- Maven dependency timeout → Rebuild
- Test failures → Check test logs
- Out of memory → Upgrade plan
```

### Frontend build failed
```bash
# Check build logs
Dashboard → graduation-project-admin → Events → Build

# Common fix:
- Node version mismatch → Update Dockerfile
- npm install failed → Check package-lock.json
```

## 📊 Monitoring

### View Logs
```
Dashboard → Select Service → Logs tab
```

### View Metrics
```
Dashboard → Select Service → Metrics tab
- CPU Usage
- Memory Usage
- Request Count
- Response Time
```

### Setup Alerts
```
Settings → Notifications
- Add email/Slack for alerts
```

## 💰 Chi phí

| Service | Plan | Cost/Month |
|---------|------|------------|
| Redis | Starter | $7 |
| Keycloak | Standard | $25 |
| Backend | Starter | $7 |
| Frontend Admin | Starter | $7 |
| Frontend Supplier | Starter | $7 |
| **TOTAL** | | **$53** |

## 📝 Notes

- Services sẽ auto-deploy khi push code lên GitHub
- Redis data được persist với 1GB disk
- Free tier services sleep sau 15 phút không hoạt động
- SSL/HTTPS được enable tự động
- Có thể scale services lên/xuống bất cứ lúc nào

## 🎉 Deploy xong rồi!

URLs của bạn:
- Admin Portal: `https://graduation-project-admin.onrender.com`
- Supplier Portal: `https://graduation-project-supplier.onrender.com`
- Backend API: `https://graduation-project-backend.onrender.com`
- Keycloak: `https://graduation-project-keycloak.onrender.com`
