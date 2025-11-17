# SaveFood - Food Waste Reduction Platform

Nền tảng kết nối nhà cung cấp thực phẩm với khách hàng để giảm thiểu lãng phí thực phẩm gần hết hạn.

## 🌐 Live Demo

- **Backend API:** https://graduationproject-81or.onrender.com
- **Swagger API:** https://graduationproject-81or.onrender.com/swagger-ui/index.html
- **Admin Dashboard:** https://savefood-admin.onrender.com
- **Supplier Portal:** https://savefood-supplier.onrender.com
- **Keycloak OAuth:** https://savefood-keycloak.onrender.com

## 🏗️ Tech Stack

**Backend:** Spring Boot 3.5.6 (Java 21) | Keycloak OAuth2 | PostgreSQL (Supabase) | SendGrid  
**Frontend:** React + TypeScript | Vite | React Router  
**Storage:** Supabase Storage (S3-compatible)

## 🚀 Quick Start

### Prerequisites
- Java 21, Maven 3.8+, Docker Compose
- Supabase account (Database + Storage)
- SendGrid account (Email)

### Setup

1. **Clone & Configure**
```bash
git clone <repo-url>
cd SaveFood/backend
cp .env.example .env  # Điền credentials vào .env
```

2. **Start Keycloak**
```bash
docker-compose up -d  # Keycloak: http://localhost:8081 (admin/admin)
```

3. **Configure Keycloak**
- Tạo realm: `SaveFood`
- Tạo client: `backend-fs` 
- Copy Client Secret vào `.env`
- Configure Identity Providers: Google, Facebook (cho social login)

4. **Setup Supabase**
- Tạo buckets: `business-licenses`, `banners`, `products`, `avatar-customer`
- Copy credentials vào `.env`

5. **Run**
```bash
# Backend (Local)
cd backend
./mvnw spring-boot:run  # http://localhost:8080

# Frontend Admin (Local)
cd website/fe_admin
npm install && npm run dev  # http://localhost:5173

# Frontend Supplier (Local)
cd website/fe_supplier
npm install && npm run dev  # http://localhost:5174
```

**Local Swagger:** http://localhost:8080/swagger-ui/index.html  
**Production:** Xem [Live Demo](#-live-demo) section

## 📁 Structure

```
backend/src/main/java/com/example/backend/
├── config/       # Security, JWT, CORS
├── controller/   # REST endpoints
├── service/      # Business logic
├── entity/       # JPA models
├── dto/          # Request/Response
└── repository/   # Data access

website/
├── fe_admin/     # Admin dashboard
└── fe_supplier/  # Supplier portal
```

## 🔐 Authentication

### Roles & Methods
- **CUSTOMER**: Phone OTP, Google/Facebook OAuth
- **SUPPLIER**: Email/Password (4-step registration với email OTP)
- **ADMIN**: Email/Password (Keycloak JWT)

### Key Endpoints
```
POST /api/auth/customer/phone-auth/step1  # Gửi OTP
POST /api/auth/customer/phone-auth/step2  # Verify OTP & login
POST /api/auth/customer/login/google      # Google OAuth
POST /api/auth/customer/login/facebook    # Facebook OAuth
POST /api/auth/login                       # Supplier/Admin login
POST /api/auth/refresh                     # Refresh token
POST /api/auth/logout                      # Logout
```

## 🧪 Testing

```bash
./mvnw test              # Unit tests
./mvnw verify            # Integration tests
./mvnw clean package     # Build JAR
```

## 📦 Deployment

### Production (Render)

**Current Deployment:**
- Backend: https://graduationproject-81or.onrender.com
- Admin Frontend: https://savefood-admin.onrender.com
- Supplier Frontend: https://savefood-supplier.onrender.com
- Keycloak: https://savefood-keycloak.onrender.com

**Docker Build:**
```bash
# Build images
docker build -t savefood-backend ./backend
docker build -t savefood-admin ./website/fe_admin
docker build -t savefood-supplier ./website/fe_supplier

# Run locally
docker run -d -p 8080:8080 --env-file ./backend/.env savefood-backend
```

**Production Checklist:**
- ✅ Environment variables configured on Render
- ✅ Keycloak realm + Identity Providers setup
- ✅ Supabase buckets created with RLS policies
- ✅ SendGrid sender verified
- ✅ SSL/TLS enabled (automatic on Render)
- ✅ Backup strategy active

## 🔧 Configuration Files

- **[SECURITY_SETUP.md](backend/SECURITY_SETUP.md)** - Environment variables & credentials
- **[FILE_STORAGE_SETUP.md](backend/FILE_STORAGE_SETUP.md)** - Supabase Storage buckets
- **[.env.example](backend/.env.example)** - Template cho local setup

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Database connection failed | Check `DB_URL` trong `.env` |
| Keycloak 401 Unauthorized | Verify `KEYCLOAK_CLIENT_SECRET` |
| File upload failed | Check Supabase Storage credentials + RLS policies |
| Email not sending | Verify `SENDGRID_API_KEY` và sender email |
| No default constructor (deploy) | Add `@Autowired` to constructors |

**Debug Mode:**
```bash
./mvnw spring-boot:run -Dspring-boot.run.arguments=--logging.level.com.example.backend=DEBUG
```

---

**Version:** 1.0.0 | **Last Updated:** November 17, 2025
