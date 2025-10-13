# FoodSave - Food Waste Reduction Platform

## 📋 Giới Thiệu

FoodSave là nền tảng kết nối nhà cung cấp thực phẩm với khách hàng nhằm giảm thiểu lãng phí thực phẩm. Hệ thống cho phép các nhà hàng, siêu thị, cửa hàng bán lẻ đăng bán các sản phẩm thực phẩm gần hết hạn với giá ưu đãi.

## 🏗️ Kiến Trúc Hệ Thống

### Backend

- **Framework**: Spring Boot 3.5.6
- **Language**: Java 21
- **Authentication**: Keycloak OAuth2/JWT
- **Database**: PostgreSQL (Supabase)
- **Storage**: Supabase Storage (S3-compatible)
- **Email**: SendGrid API
- **Build Tool**: Maven

### Frontend

- **Framework**: (To be specified)
- **URL**: http://localhost:3000

## 🚀 Quick Start

### Prerequisites

- Java 21 or later
- Maven 3.8+
- Docker & Docker Compose (for Keycloak)
- PostgreSQL (hoặc sử dụng Supabase)
- Supabase account (for Storage & Database)
- SendGrid account (for Email)

### 1. Clone Repository

```bash
git clone https://github.com/your-org/foodsave.git
cd foodsave
```

### 2. Setup Environment Variables

```bash
cd backend
cp .env.example .env
```

Mở file `.env` và điền các credentials:

```properties
# Database
DB_URL=jdbc:postgresql://your-db-host:6543/postgres?user=...&password=...

# Keycloak
KEYCLOAK_SERVER_URL=http://localhost:8081
KEYCLOAK_CLIENT_SECRET=your_client_secret

# SendGrid
SENDGRID_API_KEY=SG.your_api_key
SENDGRID_FROM_EMAIL=noreply@foodsave.com

# Supabase Storage
SUPABASE_STORAGE_URL=https://your-project.supabase.co
SUPABASE_STORAGE_ACCESS_KEY=your_access_key
SUPABASE_STORAGE_SECRET_KEY=your_secret_key
```

**Chi tiết**: Xem [SECURITY_SETUP.md](backend/SECURITY_SETUP.md)

### 3. Start Keycloak (OAuth2 Server)

```bash
docker-compose up -d
```

**Keycloak Admin Console**: http://localhost:8081
**Login**: admin / admin

### 4. Configure Keycloak

1. Truy cập http://localhost:8081
2. Login với admin/admin
3. Tạo realm: `foodsave`
4. Tạo client: `backend-fs`
5. Copy **Client Secret** và paste vào `.env`

### 5. Setup Supabase Storage Buckets

Truy cập Supabase Dashboard và tạo các buckets sau:

| Bucket Name           | Purpose                | File Types     | Size Limit |
| --------------------- | ---------------------- | -------------- | ---------- |
| `business-licenses` | Giấy phép kinh doanh | PDF            | 10MB       |
| `banners`           | Banner quảng cáo     | JPG, PNG       | 5MB        |
| `products`          | Ảnh sản phẩm        | JPG, PNG, WEBP | 5MB        |
| `avatar-customer`   | Avatar khách hàng    | JPG, PNG       | 2MB        |

**Chi tiết**: Xem [FILE_STORAGE_SETUP.md](backend/FILE_STORAGE_SETUP.md)

### 6. Run Backend

```bash
cd backend
./mvnw spring-boot:run
```

**Backend API**: http://localhost:8080
**Swagger UI**: http://localhost:8080/swagger-ui/index.html

### 7. Run Frontend

```bash
cd website
# (Frontend setup commands here)
```

## 📚 Tài Liệu

### Core Documentation

- [SECURITY_SETUP.md](backend/SECURITY_SETUP.md) - Hướng dẫn cấu hình bảo mật với Environment Variables
- [FILE_STORAGE_SETUP.md](backend/FILE_STORAGE_SETUP.md) - Hướng dẫn cấu hình File Storage với Supabase
- [RE_REGISTRATION_IMPROVEMENTS.md](backend/RE_REGISTRATION_IMPROVEMENTS.md) - Chi tiết cải tiến authentication system

### API Documentation

- **Swagger UI**: http://localhost:8080/swagger-ui/index.html
- **OpenAPI Spec**: http://localhost:8080/v3/api-docs

### Key Features Documentation

#### Authentication & Authorization

- OAuth2/JWT authentication với Keycloak
- Role-based access control (CUSTOMER, SUPPLIER, ADMIN)
- Email verification với SendGrid
- Auto-cleanup pending accounts (7 days grace period)
- Re-registration support cho pending accounts

#### File Storage

- Multi-bucket support (business licenses, banners, products, avatars)
- UUID-based unique file naming
- S3-compatible API với Supabase Storage
- File upload/delete operations

#### Database

- PostgreSQL với Supabase
- JPA/Hibernate ORM
- Connection pooling
- Transaction management

## 🔧 Development

### Project Structure

```
.
├── backend/                      # Spring Boot Backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/example/backend/
│   │   │   │   ├── config/       # Configuration classes
│   │   │   │   ├── controller/   # REST Controllers
│   │   │   │   ├── dto/          # Data Transfer Objects
│   │   │   │   ├── entity/       # JPA Entities
│   │   │   │   ├── exception/    # Custom Exceptions
│   │   │   │   ├── mapper/       # DTO Mappers
│   │   │   │   ├── repository/   # JPA Repositories
│   │   │   │   ├── service/      # Business Logic
│   │   │   │   └── utils/        # Utility classes
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/                 # Unit & Integration Tests
│   ├── .env.example              # Environment variables template
│   ├── .gitignore
│   ├── pom.xml
│   ├── SECURITY_SETUP.md
│   ├── FILE_STORAGE_SETUP.md
│   └── RE_REGISTRATION_IMPROVEMENTS.md
├── website/                      # Frontend
├── docker-compose.yml            # Keycloak setup
└── README.md
```

### Build & Test

```bash
# Build
cd backend
./mvnw clean install

# Run tests
./mvnw test

# Run with specific profile
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# Package
./mvnw clean package
```

### Code Quality

```bash
# Run checkstyle
./mvnw checkstyle:check

# Run PMD
./mvnw pmd:check

# Run SpotBugs
./mvnw spotbugs:check
```

## 🧪 Testing

### Unit Tests

```bash
./mvnw test
```

### Integration Tests

```bash
./mvnw verify
```

### Manual Testing

Xem hướng dẫn chi tiết trong:

- [FILE_STORAGE_SETUP.md](backend/FILE_STORAGE_SETUP.md) - Test file upload
- Authentication endpoints với Swagger UI

## 📦 Deployment

### Docker

```bash
# Build Docker image
docker build -t foodsave-backend:latest ./backend

# Run container
docker run -d \
  -p 8080:8080 \
  --env-file ./backend/.env \
  foodsave-backend:latest
```

### Docker Compose

```bash
docker-compose up -d
```

### Production Checklist

- [ ] All environment variables set on production server
- [ ] Database migrations applied
- [ ] Keycloak realm & client configured
- [ ] Supabase Storage buckets created
- [ ] SendGrid email templates configured
- [ ] SSL/TLS certificates installed
- [ ] Firewall rules configured
- [ ] Backup strategy implemented
- [ ] Monitoring & logging setup
- [ ] Load balancer configured (if needed)

## 🔐 Security

### Environment Variables

**⚠️ QUAN TRỌNG**: File `.env` chứa credentials và **KHÔNG BAO GIỜ** được commit lên Git.

- ✅ File `.env` đã được thêm vào `.gitignore`
- ✅ File `.env.example` cung cấp template (safe to commit)
- ✅ Tất cả credentials được lưu trong `.env`
- ✅ `application.properties` chỉ dùng `${ENV_VAR}` syntax

**Chi tiết**: Xem [SECURITY_SETUP.md](backend/SECURITY_SETUP.md)

### Best Practices

- Never hardcode credentials in source code
- Use strong, unique passwords for all services
- Rotate credentials regularly (90-180 days)
- Enable audit logging for sensitive operations
- Implement rate limiting for API endpoints
- Validate all user inputs
- Use HTTPS in production
- Keep dependencies up to date

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Failed

```
Caused by: java.sql.SQLException: Connection refused
```

**Solution**: Kiểm tra `DB_URL` trong `.env` có đúng không.

#### 2. Keycloak Authentication Failed

```
401 Unauthorized: Client authentication failed
```

**Solution**: Verify `KEYCLOAK_CLIENT_SECRET` trong `.env` và Keycloak Admin Console.

#### 3. File Upload Failed

```
AccessDeniedException: Access Denied
```

**Solution**:

- Kiểm tra Supabase Storage credentials
- Verify Storage Policies (RLS) trong Supabase Dashboard
- Xem chi tiết trong [FILE_STORAGE_SETUP.md](backend/FILE_STORAGE_SETUP.md)

#### 4. Email Not Sending

```
SendGridException: Unauthorized
```

**Solution**:

- Verify `SENDGRID_API_KEY` trong `.env`
- Kiểm tra API key status trong SendGrid Dashboard
- Verify sender email (`SENDGRID_FROM_EMAIL`) đã được verify

### Debug Mode

```bash
# Enable debug logging
./mvnw spring-boot:run -Dspring-boot.run.arguments=--logging.level.com.example.backend=DEBUG

# Profile SQL queries
./mvnw spring-boot:run -Dspring-boot.run.arguments=--logging.level.org.hibernate.SQL=DEBUG
```

### Logs

```bash
# View application logs
tail -f backend/logs/application.log

# View Keycloak logs
docker logs -f keycloak

# View database logs (if using Docker)
docker logs -f postgres
```

## 🤝 Contributing

### Git Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -m "feat: add new feature"`
3. Push to remote: `git push origin feature/your-feature`
4. Create Pull Request

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

### Code Review Checklist

- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] No hardcoded credentials
- [ ] No sensitive data in logs
- [ ] Performance considerations addressed
- [ ] Security best practices followed

## 📞 Support

### Team Contact

- **Backend Lead**: [Your Name] - [email@example.com]
- **Frontend Lead**: [Name] - [email@example.com]
- **DevOps**: [Name] - [email@example.com]

### Resources

- **Project Wiki**: [Link to wiki]
- **Issue Tracker**: [Link to issues]
- **Slack Channel**: #foodsave-dev
- **Design Docs**: [Link to design docs]

## 📄 License

This project is proprietary and confidential.

---

**Last Updated**: 2025-10-11
**Version**: 1.0.0
**Maintained by**: Backend Team
