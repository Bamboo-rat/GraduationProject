# SaveFood - Food Waste Reduction Platform

Nền tảng kết nối nhà cung cấp thực phẩm với khách hàng để giảm thiểu lãng phí thực phẩm gần hết hạn.

## Tech Stack

**Backend:** Spring Boot 3.5.6 (Java 21) | Keycloak OAuth2 | PostgreSQL (Supabase) | SendGrid
**Frontend:** React + TypeScript | Vite | React Router
**Storage:** Supabase Storage (S3-compatible)

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

📁 Structure

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

## Authentication

### Roles & Methods

- **CUSTOMER**: Phone OTP, Google/Facebook OAuth
- **SUPPLIER**: Email/Password (4-step registration với email OTP)
- **ADMIN**: Email/Password (Keycloak JWT)
