# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SaveFood** is a food waste reduction platform that connects suppliers (restaurants, supermarkets) with customers to sell near-expiry food products at discounted prices. This is a full-stack monorepo with:

- **Backend**: Spring Boot 3.5.6 + Java 21 REST API
- **Frontend Admin Portal**: React Router 7 + TypeScript admin dashboard
- **Frontend Supplier Portal**: React Router 7 + TypeScript supplier dashboard
- **Authentication**: Keycloak OAuth2/JWT
- **Database**: PostgreSQL (production) / MySQL (dev) / H2 (test)
- **Storage**: Cloudinary for file uploads
- **Cache/OTP**: Redis

## Repository Structure

```
.
├── backend/                    # Spring Boot backend
│   ├── src/main/java/com/example/backend/
│   │   ├── config/            # Spring configuration
│   │   ├── controller/        # REST controllers
│   │   ├── dto/              # Request/Response DTOs
│   │   ├── entity/           # JPA entities
│   │   ├── repository/       # JPA repositories
│   │   ├── service/          # Business logic
│   │   ├── mapper/           # MapStruct mappers
│   │   ├── exception/        # Custom exceptions
│   │   └── utils/            # Utility classes
│   ├── pom.xml
│   ├── run.ps1               # Windows startup script
│   └── CLAUDE.md             # Backend-specific guide
├── website/
│   ├── fe_admin/             # Admin dashboard
│   │   └── app/
│   │       ├── component/    # Reusable UI components
│   │       ├── config/       # Axios, API config
│   │       ├── pages/        # Page components
│   │       ├── routes/       # React Router routes
│   │       ├── service/      # API service layer
│   │       └── utils/        # Frontend utilities
│   └── fe_supplier/          # Supplier dashboard (similar structure)
├── docker-compose.yml        # Keycloak + Redis
└── README.md                 # Project documentation
```

---

## Build & Run Commands

### Backend

```bash
# Navigate to backend
cd backend

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

# Clean build
mvn clean
```

Backend runs at: **http://localhost:8080**
Swagger UI: **http://localhost:8080/swagger-ui/index.html**

### Frontend Admin

```bash
# Navigate to admin portal
cd website/fe_admin

# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck

# Start production server
npm start
```

Frontend runs at: **http://localhost:5173** (default Vite dev server)

### Frontend Supplier

```bash
# Navigate to supplier portal
cd website/fe_supplier

# Same commands as admin portal
npm install
npm run dev
npm run build
```

### Infrastructure

```bash
# Start Keycloak + Redis
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker logs -f keycloak-savefood
docker logs -f redis
```

Keycloak Admin Console: **http://localhost:8081** (admin/admin)
Redis: **localhost:6379**

---

## Backend Architecture

### User Entity Hierarchy (JOINED Inheritance)

The application uses JPA's `InheritanceType.JOINED` for polymorphic user types:

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
- Created by SUPER_ADMIN only via admin dashboard
- Immediately set to ACTIVE (not PENDING_APPROVAL)
- Status and active flag must stay synchronized

### OTP System (Redis-based)

- **Storage**: Redis with TTL (3 minutes expiry)
- **Rate Limiting**: Max 3 OTP requests per hour per phone/email (Redis counters)
- **Delivery**: SMS via eSMS API, Email via SendGrid
- **Keys**:
  - `otp:phone:{phone}` or `otp:email:{email}` - stores OTP code
  - `otp:ratelimit:phone:{phone}` or `otp:ratelimit:email:{email}` - rate limit counter

### Key Backend Services

- **AuthService**: Login, logout, token refresh, registration
- **KeycloakService**: User management in Keycloak (create, update, assign roles, reset password)
- **OtpService**: OTP generation, verification, rate limiting
- **EmailService**: SendGrid integration for transactional emails
- **FileStorageService**: Cloudinary integration for file uploads (supports both images and documents with explicit resource type detection)
- **SupplierService**: Supplier registration, approval, profile management
- **AdminService**: Admin CRUD operations
- **CustomerService**: Customer registration, profile management
- **ProductService**: Product CRUD with variants, images, attributes
- **PromotionService**: Promotion management with validation
- **CategoryService**: Category management with image upload
- **StoreService**: Store management with pending updates approval, suspend/unsuspend operations
- **BannerService**: Banner/ads management for homepage and promotions
- **PartnerPerformanceService**: Reporting metrics for suppliers
- **CartService**: Multi-store cart management with real-time inventory sync
- **OrderService**: Complete order lifecycle from checkout to delivery
- **WalletService**: Supplier wallet management with commission deduction
- **InAppNotificationService**: Real-time notification system for order updates
- **AutomatedSuspensionService**: Customer violation tracking and automated suspension

### Database Configuration

- **Production**: AWS RDS MySQL (primary)
- **Development**: PostgreSQL/MySQL (configurable)
- **Testing**: H2 in-memory database
- **OTP & Caching**: Redis (local or hosted)

Connection details in `application.properties` use environment variables for sensitive data.

---

## Frontend Architecture

### Tech Stack

- **Framework**: React 19 with React Router 7 (file-based routing)
- **Language**: TypeScript
- **Styling**: TailwindCSS 4.1
- **HTTP Client**: Axios with interceptors
- **Icons**: Lucide React
- **Build Tool**: Vite 7

### Service Layer Pattern

All API calls are abstracted into service classes in `app/service/`:

```typescript
// Example: supplierService.ts
class SupplierService {
  async getAllSuppliers(page, size, status?, search?, sortBy, sortDirection) {
    const response = await axiosInstance.get('/suppliers', { params });
    return response.data.data;
  }
}
export default new SupplierService();
```

**Key Services:**
- `authService.ts` - Login, logout, token refresh, user info
- `adminService.ts` - Admin CRUD operations
- `supplierService.ts` - Supplier management
- `productService.ts` - Product CRUD
- `promotionService.ts` - Promotion management
- `categoryService.ts` - Category CRUD
- `fileStorageService.ts` - File uploads to Cloudinary
- `partnerPerformanceService.ts` - Partner metrics and analytics
- `storeUpdateService.ts` - Store pending update approvals

### Axios Configuration (`app/config/axios.tsx`)

- **Base URL**: `http://localhost:8080/api` (configurable via `VITE_API_BASE_URL`)
- **Request Interceptor**: Automatically adds JWT token from localStorage
- **Response Interceptor**: Handles 401 errors with automatic token refresh
- **Token Refresh Queue**: Prevents multiple simultaneous refresh attempts

**Token Storage:**
- `access_token` - Short-lived JWT token
- `refresh_token` - Long-lived refresh token
- `user_info` - User profile data

### Authentication Context (`AuthContext.tsx`)

Global authentication state management using React Context:

```typescript
const { user, login, logout, isAuthenticated } = useAuth();
```

Automatically redirects to login on 401 errors. Persists authentication across page reloads.

### Routing Structure

File-based routing via React Router 7. Routes defined in `app/routes.ts`:

**Admin Portal Routes:**
- `/` - Auth/Login page
- `/dashboard/overview` - Main dashboard
- `/partners/list` - All suppliers
- `/partners/pending` - Pending approval suppliers
- `/partners/store-pending-updates` - Store update approvals
- `/partners/performance` - Partner performance metrics
- `/products/list` - All products
- `/products/categories` - Category management
- `/customers/list` - Customer management
- `/employees/admins` - Admin management
- `/profile` - Current user profile

**Supplier Portal Routes:**
- Similar structure but supplier-focused (products, orders, finance, store profile)

### Component Organization

**Common Components** (`app/component/common/`):
- Layout components (Header, Sidebar, DashboardLayout)
- Reusable UI (ConfirmModal, Toast, ProtectedRoute)

**Feature Components** (`app/component/features/`):
- Feature-specific components

**Pages** (`app/pages/`):
- Full page components imported by routes

---

## Critical Implementation Rules

### Backend Rules

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

**5. OTP Rate Limiting:**
- Check rate limit BEFORE generating OTP
- Throw `OTP_RATE_LIMIT_EXCEEDED` error if limit reached
- Increment counter AFTER successful OTP send

**6. Keycloak Synchronization:**
- Always create Keycloak user BEFORE saving to local DB
- Store `keycloakId` in local User entity for linking
- If Keycloak creation fails, rollback local transaction

**7. Product Creation Flow:**
- Product → ProductInfo → ProductVariants → ProductImages → ProductAttributes
- All are persisted in a single transaction
- StoreProduct entries created for each store that carries the product

**8. Promotion Validation:**
- Validate promotion applicability to product categories
- Check usage limits and expiry dates
- Track usage in `PromotionUsage` entity with PESSIMISTIC_WRITE lock
- Use transaction isolation SERIALIZABLE for promotion application

**9. Cart-to-Order Flow:**
- Multi-store cart: One cart per customer per store (constraint: `uk_cart_customer_store`)
- Cart validation syncs inventory and removes expired/invalid promotions
- Checkout uses `SERIALIZABLE` isolation to prevent race conditions
- Order statuses: PENDING → CONFIRMED → PREPARING → SHIPPING → DELIVERED
- Cancel operations restricted based on order status (customers can only cancel PENDING/CONFIRMED directly)

**10. Promotion Tier Eligibility:**
- `PromotionTier` defines customer tier requirements (GENERAL, BRONZE_PLUS, SILVER_PLUS, GOLD_PLUS, PLATINUM_PLUS, DIAMOND_ONLY)
- Special tiers: BIRTHDAY (checks current month), FIRST_TIME (checks order history)
- Use `isCustomerEligibleForPromotionTier()` helper method for validation
- Atomic promotion usage tracking with `incrementUsageCountIfAvailable()` to prevent race conditions

**11. Wallet System:**
- `WalletService.addPendingBalance()` handles commission deduction automatically
- `WalletService.refundOrder()` processes refunds with proper balance calculations
- Supplier ID is accessed via `supplier.getUserId()` (not `getSupplierId()`)
- End-of-day scheduler releases pending balance to available balance

**12. Entity Field Names (Common Mistakes):**
- Product expiry: `variant.getExpiryDate()` (NOT `product.getExpiryDate()`)
- Product images: `product.getImages()` (NOT `getProductImages()`)
- Variant price: Use `discountPrice` or `originalPrice` (NOT generic `price`)
- Promotion code: `promotion.getCode()` (NOT `getPromotionCode()`)
- Promotion tier: `promotion.getTier()` returns `PromotionTier` (NOT `CustomerTier`)
- Usage limit: `promotion.getTotalUsageLimit()` (NOT `getMaxUsageCount()`)
- Supplier ID: `supplier.getUserId()` (NOT `getSupplierId()`)
- Date comparisons: Use `LocalDate.now()` for dates (NOT `LocalDateTime.now()`)

**13. Repository Method Names:**
- Promotion: Use `findByCode()` (NOT `findByPromotionCode()`)
- PromotionUsage: Use `countByPromotionId()` for total count (NOT `countByPromotion()`)
- Use `countByPromotionAndCustomer()` for per-customer usage tracking

**14. Enum Values:**
- PaymentProvider: VNPAY, MOMO, ZALOPAY, SHOPEEPAY, INTERNAL (use INTERNAL for bank transfers and COD)
- ShipmentStatus: PREPARING, SHIPPING, DELIVERED, FAILED, CANCELED (use SHIPPING for in-transit)

### Frontend Rules

**1. Authentication Token Management:**
- Always store tokens in localStorage (not sessionStorage)
- Check token expiry before making API calls
- Let axios interceptor handle token refresh automatically
- On 401, redirect to login ONLY if token refresh fails

**2. API Service Pattern:**
- All API calls MUST go through service layer (never axios directly in components)
- Use TypeScript interfaces for request/response types
- Handle errors in service methods, throw meaningful messages
- Return typed data from services, not raw axios responses

**3. Form Validation:**
- Validate on client-side before submission
- Display backend validation errors from API responses
- Use loading states during async operations
- Disable submit buttons during submission

**4. Pagination & Filtering:**
- Always implement pagination for list views
- Use debouncing for search inputs (500ms recommended)
- Reset page to 0 when changing filters/search
- Preserve filter state in URL query params when possible

**5. File Uploads:**
- Upload files to Cloudinary FIRST via FileStorageService
- Then submit form with Cloudinary URLs
- Show upload progress when possible
- Validate file types and sizes on client-side

**6. Error Handling:**
- Display user-friendly error messages (not raw API errors)
- Show toast notifications for success/error states
- Log detailed errors to console for debugging
- Provide retry options for failed operations

---

## Error Handling

### Backend Error Codes

The application uses a centralized error code system (`ErrorCode` enum):

- **1xxx**: Validation errors
- **2xxx**: Authentication/Authorization errors
- **3xxx**: User-related errors
- **4xxx**: Product/Category errors
- **5xxx**: Order/Transaction errors
- **9xxx**: Server errors
- **K3xxx**: Keycloak errors

Example:
```json
{
  "status": "ERROR",
  "message": "OTP rate limit exceeded. Please try again after 1 hour.",
  "errorCode": "2015",
  "timestamp": "2025-01-24T10:30:00"
}
```

### Frontend Error Display

```typescript
try {
  await service.someOperation();
  showToast('Success!', 'success');
} catch (error: any) {
  const message = error.response?.data?.message || 'Operation failed';
  showToast(message, 'error');
  console.error('Detailed error:', error);
}
```

---

## File Upload Flow

1. Frontend selects file via `<input type="file">`
2. Frontend uploads to `/api/files/upload/{bucket}` via FileStorageService
3. Cloudinary stores file and returns secure URL
4. Frontend includes URL in subsequent form submission
5. Backend validates and stores URL in database

**Supported Buckets:**
- `category` - Category images
- `product` - Product images (single)
- `product/multiple` - Multiple product images
- `business-license` - Supplier business licenses
- `food-safety-certificate` - Supplier certificates
- `avatar-admin` - Admin avatars
- `avatar-supplier` - Supplier avatars
- `avatar-customer` - Customer avatars

---

## MapStruct & Lombok Configuration

MapStruct processors configured with Lombok compatibility in `pom.xml`:

```xml
<annotationProcessorPaths>
  <path>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
  </path>
  <path>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok-mapstruct-binding</artifactId>
  </path>
  <path>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct-processor</artifactId>
  </path>
</annotationProcessorPaths>
```

**Processing Order**: Lombok → Lombok-MapStruct binding → MapStruct

**Mapper Usage:**
- Place in `com.example.backend.mapper` package
- Use `@Mapper(componentModel = "spring")` for Spring injection
- MapStruct generates implementation classes at compile time

---

## Common Pitfalls

### Backend

- **Do NOT** create Store before saving Supplier (foreign key constraint violation)
- **Do NOT** skip Keycloak user creation in registration flows
- **Do NOT** forget to set both `status` and `active` fields for Admin/Supplier
- **Do NOT** update business documents in Supplier Step 4 (they're set in Step 3)
- **Do NOT** forget to check OTP rate limits before sending
- **Do NOT** use `@Transactional` on methods that call external APIs without proper rollback handling
- **Do NOT** use LAZY loading for entities that will be serialized to JSON (use EAGER or JOIN FETCH)
- **Do NOT** use `product.getExpiryDate()` - expiry is on ProductVariant (use `variant.getExpiryDate()`)
- **Do NOT** compare `PromotionTier` with `CustomerTier` - they are different enum types
- **Do NOT** use `LocalDateTime.now()` for date-only comparisons - use `LocalDate.now()`
- **Do NOT** access supplier ID with `getSupplierId()` - use `getUserId()` (Supplier extends User)
- **Do NOT** call `walletService.recordTransaction()` - use `addPendingBalance()` or `refundOrder()`
- **Do NOT** allow customers to cancel orders in PREPARING/SHIPPING status directly - require cancel request workflow
- **Do NOT** skip atomic promotion usage checks - use `incrementUsageCountIfAvailable()` with pessimistic locks

### Frontend

- **Do NOT** make API calls directly with axios in components (use service layer)
- **Do NOT** store sensitive data in component state (use Context or secure storage)
- **Do NOT** forget to unsubscribe from effects/intervals on component unmount
- **Do NOT** mutate state directly (use setState or immutable updates)
- **Do NOT** skip error handling on async operations
- **Do NOT** hardcode API URLs (use environment variables)
- **Do NOT** forget to add loading states for async operations

---

## Testing

### Backend Testing

```bash
# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=SupplierServiceTest

# Run specific test method
mvn test -Dtest=SupplierServiceTest#testCreateSupplier

# Integration tests
mvn verify
```

- Use `@SpringBootTest` for integration tests
- Use `application-test.properties` for test configuration
- H2 database automatically used in test scope
- Mock external services (Keycloak, SendGrid, Cloudinary) in unit tests

### Frontend Testing

Currently no automated tests configured. Recommended approach:

- Unit tests: Vitest (compatible with Vite)
- Component tests: React Testing Library
- E2E tests: Playwright or Cypress

---

## Development Workflow

### Working on Backend Features

1. Define/update entity in `entity/` package
2. Create/update repository in `repository/` package
3. Create DTO request/response classes in `dto/` package
4. Create MapStruct mapper in `mapper/` package
5. Implement service interface and implementation in `service/` and `service/impl/`
6. Create REST controller in `controller/` package
7. Add Swagger annotations (`@Operation`, `@Tag`)
8. Add security annotations (`@PreAuthorize`)
9. Test endpoints via Swagger UI
10. Write unit/integration tests

### Working on Frontend Features

1. Define TypeScript interfaces in service file or `types.ts`
2. Create/update service method in `app/service/`
3. Create page component in `app/pages/`
4. Create route file in `app/routes/`
5. Add route to `app/routes.ts`
6. Test in browser with backend running
7. Handle loading states, errors, empty states
8. Add success/error notifications

### Full-Stack Feature Development

1. Start with backend API implementation
2. Test backend via Swagger UI or Postman
3. Document API in backend markdown files
4. Implement frontend service layer
5. Build frontend UI components
6. Integrate frontend with backend
7. Test end-to-end flow
8. Handle edge cases and errors

---

## Key Documentation Files

- `README.md` - Project overview and setup
- `backend/CLAUDE.md` - Backend-specific guidance
- `backend/PARTNER_PERFORMANCE_API.md` - Partner performance reporting API
- `backend/PRODUCT_CREATION_FLOW.md` - Product creation implementation
- `backend/PROMOTION_VALIDATION_TRACKING_AND_CATEGORY_PROTECTION.md` - Promotion system
- `backend/WALLET_SYSTEM_FLOW.md` - Wallet and payment system
- `backend/ADMIN_BACKEND_API_REFERENCE.md` - Admin API documentation
- `PARTNER_PERFORMANCE_INTEGRATION_GUIDE.md` - Frontend-backend integration guide
- `DATABASE_SCHEMA_VIETNAMESE.md` - Database schema documentation
- `BUSINESS_FUNCTIONS_BY_ROLE.md` - Business requirements by user role

---

## Environment Variables

Backend requires `.env` file in `backend/` directory:

```properties
# Database
DB_URL=jdbc:postgresql://host:port/db?user=...&password=...

# Keycloak
KEYCLOAK_SERVER_URL=http://localhost:8081
KEYCLOAK_CLIENT_SECRET=your_client_secret

# SendGrid
SENDGRID_API_KEY=SG.your_api_key
SENDGRID_FROM_EMAIL=noreply@savefood.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# eSMS
ESMS_API_KEY=your_esms_key
ESMS_SECRET_KEY=your_esms_secret
```

Frontend uses `.env` files in `website/fe_admin/` and `website/fe_supplier/`:

```properties
VITE_API_BASE_URL=http://localhost:8080/api
```

**IMPORTANT**: Never commit `.env` files to Git. Use `.env.example` as templates.

---

## Useful Resources

- **Backend API Docs**: http://localhost:8080/swagger-ui/index.html
- **Keycloak Admin**: http://localhost:8081
- **React Router 7 Docs**: https://reactrouter.com/
- **Spring Boot Docs**: https://spring.io/projects/spring-boot
- **Keycloak Docs**: https://www.keycloak.org/documentation
- **MapStruct Docs**: https://mapstruct.org/
- **TailwindCSS Docs**: https://tailwindcss.com/
