# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **SaveFood** e-commerce backend application built with Spring Boot 3.5.6 and Java 21. It's a food marketplace platform that connects suppliers with customers, with multi-role authentication via Keycloak.

## Build & Run Commands

```bash
# Build (skip tests)
mvn clean compile -DskipTests

# Run tests
mvn test

# Run specific test
mvn test -Dtest=ClassName#methodName

# Package application
mvn clean package -DskipTests

# Run application (Windows with .env)
./run.ps1

# Run application (Maven)
mvn spring-boot:run

# Clean build directory
mvn clean
```

The application runs on port 8080 with Swagger UI available at: http://localhost:8080/swagger-ui/index.html

## Architecture Overview

### User Entity Hierarchy (JOINED Inheritance)

The application uses JPA's `InheritanceType.JOINED` strategy for user types:

```
User (abstract base class)
├── Customer (2-step registration: phone + OTP)
├── Supplier (4-step registration flow)
└── Admin (created by SUPER_ADMIN only)
```

All user types share common fields (userId, username, email, phoneNumber, keycloakId, avatarUrl, active, timestamps) but have separate tables for type-specific fields.

### Role-Based Access Control (RBAC)

Managed via Keycloak with Spring Security OAuth2 Resource Server:
- **SUPER_ADMIN**: Full system access, creates other admins, manages promotions
- **MODERATOR**: Approve/reject suppliers, manage users, manages promotions
- **STAFF**: Limited admin operations, can create/update promotions (cannot delete)
- **SUPPLIER**: Manage products, stores, orders (cannot use promotions)
- **CUSTOMER**: Browse products, place orders, use promotions

### Authentication Flow

1. **Keycloak** handles authentication and JWT issuance
2. **Spring Security** validates JWT tokens and enforces role-based access
3. All users created in **Keycloak first**, then synced to local database with `keycloakId`

### Registration Flows

**Customer (2 steps):**
1. Step 1: Basic info (phone, email, fullName) → PENDING_VERIFICATION
2. Step 2: SMS OTP verification → ACTIVE

**Supplier (4 steps):**
1. Step 1: Account info + password → PENDING_VERIFICATION → Keycloak user created → Email OTP sent
2. Step 2: Email OTP verification → PENDING_DOCUMENTS
3. Step 3: Upload documents (business license, food safety certificate required; avatar optional) → PENDING_STORE_INFO
4. Step 4: Business + store info → PENDING_APPROVAL (awaits admin approval)

**Admin:**
- Created by SUPER_ADMIN only
- Immediately set to ACTIVE (not PENDING_APPROVAL)
- Status and active flag must stay synchronized

### OTP System (Redis-based)

- **Storage**: Redis with TTL (3 minutes expiry)
- **Rate Limiting**: Max 3 OTP requests per hour per phone/email (Redis counters)
- **Delivery**: SMS via eSMS API, Email via SendGrid
- **Keys**:
  - `otp:phone:{phone}` or `otp:email:{email}` - stores OTP code
  - `otp:ratelimit:phone:{phone}` or `otp:ratelimit:email:{email}` - rate limit counter

### Key Services & Integrations

- **KeycloakService**: User management in Keycloak (create, update, assign roles, reset password)
- **OtpService**: OTP generation, verification, rate limiting
- **EmailService**: SendGrid integration for transactional emails
- **EsmsService**: SMS delivery via eSMS API
- **FileStorageService**: Cloudinary integration for file uploads (business licenses, certificates, avatars, product images)

### Database Configuration

- **Production**: AWS RDS MySQL (primary)
- **Development**: PostgreSQL/MySQL (configurable)
- **Testing**: H2 in-memory database
- **OTP & Caching**: Redis (local or hosted)

Connection details in `application.properties` use environment variables for sensitive data.

### Important Implementation Rules

**1. Supplier Registration Step 4:**
- Always save `Supplier` entity BEFORE creating `Store` entity
- Store requires persisted Supplier with valid ID for foreign key relationship

**2. Admin Status Management:**
- Keep `status` field and `active` boolean synchronized
- Only ACTIVE status should have `active=true`
- Admins created by SUPER_ADMIN are immediately ACTIVE (not PENDING_APPROVAL)

**3. Document Requirements (Supplier Step 3):**
- Business license: REQUIRED (number + URL)
- Food safety certificate: REQUIRED (number + URL)
- Avatar: OPTIONAL
- These documents are set in Step 3, NOT updated in Step 4

**4. Default Avatar:**
- All users (admin, supplier, customer) get a default avatar on registration
- Default URL: `https://res.cloudinary.com/dk7coitah/image/upload/v1760668372/avatar_cflwdp.jpg`
- Users can update their avatar via profile update endpoints
- Avatar is editable from profile pages (pen icon available)

**5. OTP Rate Limiting:**
- Check rate limit BEFORE generating OTP
- Throw `OTP_RATE_LIMIT_EXCEEDED` error if limit reached
- Increment counter AFTER successful OTP send

**6. Keycloak Synchronization:**
- Always create Keycloak user BEFORE saving to local DB
- Store `keycloakId` in local User entity for linking
- If Keycloak creation fails, rollback local transaction

### Error Handling

The application uses a centralized error code system (`ErrorCode` enum) with:
- Unique error codes (e.g., "2015" for OTP_RATE_LIMIT_EXCEEDED)
- English and Vietnamese messages
- Proper HTTP status codes
- Categories: 1xxx (validation), 2xxx (auth), 3xxx (users), 4xxx (products), 5xxx (orders), 9xxx (server), K3xxx (Keycloak)

### DTO & Validation

- **Request DTOs**: Use Jakarta validation annotations (`@NotBlank`, `@Size`, `@Pattern`, etc.)
- **Response DTOs**: Use MapStruct for entity-to-DTO mapping
- **Password validation**: Min 8 chars, must contain uppercase, lowercase, digit, special character
- **Phone validation**: Vietnam format (via `ValidationUtils.validatePhoneNumber()`)

### MapStruct Configuration

MapStruct processors configured with Lombok compatibility:
- Annotation processor order: Lombok → Lombok-MapStruct binding → MapStruct
- Mapper interfaces in `com.example.backend.mapper` package
- Use `@Mapper(componentModel = "spring")` for Spring injection

### Configuration Classes

- **SecurityConfig**: OAuth2 resource server, CORS, endpoint security
- **KeycloakConfig**: Admin client for user management
- **RedisConfig**: Connection factory and RedisTemplate for OTP storage
- **CloudinaryConfig**: File storage configuration
- **CorsConfig**: Cross-origin resource sharing rules

### Testing

- Use `@SpringBootTest` for integration tests
- Use `application-test.properties` for test configuration
- H2 database automatically used in test scope
- Mock external services (Keycloak, SendGrid, eSMS) in unit tests

## File Upload Flow

1. Frontend uploads file to `/api/storage/upload` with bucket type
2. Cloudinary stores file and returns secure URL
3. Frontend includes URL in registration/update request
4. Backend validates and stores URL in database

Supported buckets: `business-licenses`, `food-safety-certificates`, `banner`, `products`, `category-images`, `avatar-customer`, `avatar-admin`, `supplier-logo`

## Common Pitfalls

- **Do NOT** create Store before saving Supplier (foreign key constraint violation)
- **Do NOT** skip Keycloak user creation in registration flows
- **Do NOT** forget to set both `status` and `active` fields for Admin/Supplier
- **Do NOT** update business documents in Supplier Step 4 (they're set in Step 3)
- **Do NOT** forget to check OTP rate limits before sending
- **Do NOT** use `@Transactional` on methods that call external APIs without proper rollback handling
