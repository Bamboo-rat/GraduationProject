# ✅ Deploy Checklist - FREE Tier (Upstash Redis)

## 📋 Trước khi deploy

- [ ] Code đã push lên GitHub
- [ ] Tất cả Dockerfiles đã có:
  - [ ] `backend/Dockerfile`
  - [ ] `website/fe_admin/Dockerfile`
  - [ ] `website/fe_supplier/Dockerfile`
  - [ ] `keycloak/Dockerfile`
- [ ] File `render.yaml` ở root directory
- [ ] Database MySQL trên AWS RDS đang chạy

## 🔴 Bước 0: Setup Upstash Redis (FREE)

1. Truy cập: https://upstash.com/
2. Sign up với GitHub
3. Create Database:
   - Name: `graduation-project-redis`
   - Region: `ap-southeast-1` (Singapore)
   - TLS: ✅ Enabled
4. Copy connection info:
   ```bash
   REDIS_HOST=apn1-xxx.upstash.io
   REDIS_PORT=6379
   REDIS_PASSWORD=AaBbCc...xyz123
   ```

📖 Chi tiết: `docs/UPSTASH_REDIS_SETUP.md`

## 🔑 Environment Variables cần chuẩn bị

### Backend Secrets:
```bash
# Database
DB_URL=jdbc:mysql://foodsave.cbqgwoyam2lh.ap-southeast-2.rds.amazonaws.com:3306/foodsave?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
SPRING_DATASOURCE_PASSWORD=E0MvlgcXl1UD2nBpf5A9

# Upstash Redis (từ Upstash Dashboard)
REDIS_HOST=apn1-xxx.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=AaBbCc...xyz123

# Keycloak
KEYCLOAK_CLIENT_SECRET=<get-from-keycloak-admin>
KEYCLOAK_ADMIN_PASSWORD=admin

# SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=SaveFood

# Cloudinary
CLOUDINARY_CLOUD_NAME=xxxxx
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx

# JWT & URLs
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
- [ ] **Đặc biệt quan trọng**: REDIS_HOST, REDIS_PORT, REDIS_PASSWORD từ Upstash
- [ ] Double check tất cả values
- [ ] Click "Apply"

### Bước 4: Đợi Build & Deploy (~15-20 phút)
Render sẽ build theo thứ tự:
- [ ] Keycloak (~5 phút) 
- [ ] Backend (~10 phút)
- [ ] Frontend Admin (~5 phút)
- [ ] Frontend Supplier (~5 phút)

### Bước 5: Verify URLs
Sau khi deploy xong, check:
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
```

### Bước 7: Test Application
- [ ] Mở Admin Portal: `https://graduation-project-admin.onrender.com`
- [ ] Test login
- [ ] Test API calls
- [ ] Mở Supplier Portal: `https://graduation-project-supplier.onrender.com`
- [ ] Test login
- [ ] Test WebSocket (chat)
- [ ] Check Redis working (cache/session)

## 🔧 Nếu có lỗi

### Redis không kết nối được
```bash
# Check Backend logs
Dashboard → graduation-project-backend → Logs
Search for "redis" or "connection"

# Common fixes:
- Verify REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
- Check REDIS_SSL=true
- Test Upstash connection với redis-cli
```

### Keycloak không start
```bash
# Check Keycloak logs
Dashboard → graduation-project-keycloak → Logs

# Common fix:
- Verify database connection (KC_DB_URL)
- Check KC_DB_PASSWORD
- Keycloak free tier có thể chậm (512MB RAM)
- Đợi 2-3 phút cho Keycloak initialize
```

### Backend build failed
```bash
# Check build logs
Dashboard → graduation-project-backend → Events → Build

# Common fix:
- Maven dependency timeout → Rebuild
- Test failures → Check test logs
- Out of memory → Wait and retry (free tier limitation)
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

### Upstash Redis Monitoring
```
Upstash Dashboard → Your Database
- Commands executed
- Storage used
- Daily request count
```

## 💰 Chi phí - MIỄN PHÍ!

| Service | Plan | Cost/Month |
|---------|------|------------|
| Upstash Redis | Free | $0 |
| Keycloak | Free | $0 |
| Backend | Free | $0 |
| Frontend Admin | Free | $0 |
| Frontend Supplier | Free | $0 |
| **TOTAL** | | **$0** 🎉 |

### ⚠️ Free Tier Limitations:

**Render Free:**
- Services sleep sau **15 phút** không hoạt động
- Cold start: **30-60 giây**
- 750 giờ/tháng
- 512MB RAM

**Upstash Free:**
- **10,000 requests/day**
- 256MB storage
- 100 concurrent connections

→ **Hoàn toàn đủ cho graduation project testing!**

## 📝 Notes

- Services sẽ auto-deploy khi push code lên GitHub
- Upstash Redis persistent (data không mất khi restart)
- Free tier services sleep sau 15 phút → Cold start lần đầu chậm
- SSL/HTTPS được enable tự động
- Có thể upgrade services bất cứ lúc nào

## 🎉 Deploy xong rồi!

URLs của bạn:
- **Admin Portal**: `https://graduation-project-admin.onrender.com`
- **Supplier Portal**: `https://graduation-project-supplier.onrender.com`
- **Backend API**: `https://graduation-project-backend.onrender.com`
- **Keycloak**: `https://graduation-project-keycloak.onrender.com`
- **Redis**: Managed by Upstash (internal)

## 🚀 Next Steps (Optional)

- [ ] Setup Custom Domain
- [ ] Configure CDN (Cloudflare)
- [ ] Setup Error Tracking (Sentry)
- [ ] Configure Backup
- [ ] Load Testing
- [ ] Security Audit

## 💡 Tips

### Keep services warm (tránh cold start):
- Dùng UptimeRobot: https://uptimerobot.com/ (free)
- Ping services mỗi 5 phút

### Optimize Redis usage:
- Set TTL cho cache keys
- Monitor daily request count trong Upstash Dashboard
- Implement cache strategies (write-through, write-behind)

### Monitor costs:
- Upstash Dashboard → Usage
- Render Dashboard → Billing
- Nếu vượt free tier → Upgrade hoặc optimize
