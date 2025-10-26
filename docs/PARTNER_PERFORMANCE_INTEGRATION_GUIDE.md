# Partner Performance Integration Guide

## Overview

This guide provides step-by-step instructions for testing and deploying the Partner Performance Reporting feature that connects the frontend Admin Portal with the backend API.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  PartnersPerformance Page                                  │ │
│  │  - Summary cards (4 metrics)                               │ │
│  │  - Performance table with sorting                          │ │
│  │  - Pagination controls                                     │ │
│  └─────────────────────┬──────────────────────────────────────┘ │
│                        │                                          │
│  ┌─────────────────────▼──────────────────────────────────────┐ │
│  │  partnerPerformanceService.ts                              │ │
│  │  - getPerformanceSummary()                                 │ │
│  │  - getAllPartnerPerformance()                              │ │
│  │  - getPartnerPerformance()                                 │ │
│  │  - getPartnerPerformanceByPeriod()                         │ │
│  └─────────────────────┬──────────────────────────────────────┘ │
└────────────────────────┼─────────────────────────────────────────┘
                         │ HTTP Requests (Axios)
                         │
┌────────────────────────▼─────────────────────────────────────────┐
│                    Backend API (Spring Boot)                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  PartnerPerformanceController                              │ │
│  │  GET /api/partners/performance/summary                     │ │
│  │  GET /api/partners/performance                             │ │
│  │  GET /api/partners/performance/{id}                        │ │
│  │  GET /api/partners/performance/{id}/period                 │ │
│  └─────────────────────┬──────────────────────────────────────┘ │
│                        │                                          │
│  ┌─────────────────────▼──────────────────────────────────────┐ │
│  │  PartnerPerformanceService                                 │ │
│  │  - Business logic                                          │ │
│  │  - Rate calculations                                       │ │
│  │  - Data mapping                                            │ │
│  └─────────────────────┬──────────────────────────────────────┘ │
│                        │                                          │
│  ┌─────────────────────▼──────────────────────────────────────┐ │
│  │  PartnerPerformanceRepository                              │ │
│  │  - JPQL Queries                                            │ │
│  │  - Aggregations                                            │ │
│  │  - JOIN operations                                         │ │
│  └─────────────────────┬──────────────────────────────────────┘ │
└────────────────────────┼─────────────────────────────────────────┘
                         │
                    ┌────▼────┐
                    │ Database │
                    │ (MySQL)  │
                    └──────────┘
```

---

## Prerequisites

### Backend Requirements
- Java 21
- Maven 3.8+
- MySQL/PostgreSQL database running
- Keycloak server running
- Backend application compiled and running

### Frontend Requirements
- Node.js 18+
- npm or yarn
- Frontend development server running

### Test Data Requirements
To see meaningful performance metrics, you need:
- At least 1-2 suppliers created and approved
- Each supplier should have:
  - 1-3 stores created
  - 10-50 products created
  - 10-100 orders placed (with various statuses)

---

## Step-by-Step Integration Testing

### Step 1: Build Backend

```bash
cd backend

# Clean and compile
mvn clean compile -DskipTests

# Run tests (optional)
mvn test

# Package the application
mvn package -DskipTests

# Or run directly
mvn spring-boot:run
```

**Expected Output:**
```
INFO  - Started BackendApplication in 12.345 seconds
INFO  - Tomcat started on port(s): 8080 (http)
```

**Verify Backend is Running:**
```bash
curl http://localhost:8080/actuator/health
```

**Expected Response:**
```json
{
  "status": "UP"
}
```

---

### Step 2: Test Backend APIs with Swagger

1. **Open Swagger UI:**
   ```
   http://localhost:8080/swagger-ui/index.html
   ```

2. **Authenticate:**
   - Click "Authorize" button
   - Login with admin credentials to get JWT token
   - Paste the token in the "Bearer Authentication" field

3. **Test Summary Endpoint:**
   - Navigate to "Partner Performance" section
   - Expand `GET /api/partners/performance/summary`
   - Click "Try it out" → "Execute"
   - **Expected Response (200 OK):**
     ```json
     {
       "status": "SUCCESS",
       "message": "Performance summary retrieved successfully",
       "data": {
         "totalPartners": 5,
         "activePartners": 4,
         "totalStores": 12,
         "totalActiveStores": 10,
         "totalProducts": 450,
         "totalActiveProducts": 380,
         "totalOrders": 1250,
         "totalCompletedOrders": 1150,
         "totalCancelledOrders": 50,
         "averageCompletionRate": 92.0,
         "averageCancellationRate": 4.0
       }
     }
     ```

4. **Test List Endpoint:**
   - Expand `GET /api/partners/performance`
   - Click "Try it out"
   - Set parameters:
     - page: 0
     - size: 20
     - sortBy: totalOrders
     - sortDirection: DESC
   - Click "Execute"
   - **Expected Response (200 OK):** Paginated list of partner metrics

5. **Test Detail Endpoint:**
   - Expand `GET /api/partners/performance/{supplierId}`
   - Enter a valid supplier ID
   - Click "Execute"
   - **Expected Response (200 OK):** Detailed metrics for that supplier

6. **Test Period Endpoint:**
   - Expand `GET /api/partners/performance/{supplierId}/period`
   - Enter:
     - supplierId: (valid supplier ID)
     - startDate: 2025-01-01T00:00:00
     - endDate: 2025-01-31T23:59:59
   - Click "Execute"
   - **Expected Response (200 OK):** Metrics filtered by date range

---

### Step 3: Test Backend with cURL

#### Test Summary Endpoint
```bash
# Replace YOUR_JWT_TOKEN with actual token
curl -X GET "http://localhost:8080/api/partners/performance/summary" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Test List Endpoint
```bash
curl -X GET "http://localhost:8080/api/partners/performance?page=0&size=20&sortBy=totalOrders&sortDirection=DESC" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Test Detail Endpoint
```bash
# Replace SUPPLIER_ID with actual supplier ID
curl -X GET "http://localhost:8080/api/partners/performance/SUPPLIER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Test Period Endpoint
```bash
curl -X GET "http://localhost:8080/api/partners/performance/SUPPLIER_ID/period?startDate=2025-01-01T00:00:00&endDate=2025-01-31T23:59:59" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

---

### Step 4: Start Frontend

```bash
cd website/fe_admin

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in 1234 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

### Step 5: Test Frontend Integration

1. **Open Browser:**
   ```
   http://localhost:5173
   ```

2. **Login as Admin:**
   - Use admin credentials (SUPER_ADMIN, MODERATOR, or STAFF role)
   - Verify successful login

3. **Navigate to Performance Page:**
   - Click on "Partners" in sidebar
   - Click on "Performance" sub-menu
   - URL should be: `http://localhost:5173/partners/performance`

4. **Verify Summary Cards Load:**
   - Check that 4 summary cards appear at the top:
     1. Total Partners (blue)
     2. Active Stores (green)
     3. Active Products (purple)
     4. Average Completion Rate (yellow)
   - Numbers should match backend data

5. **Verify Performance Table:**
   - Table should display list of partners
   - Each row should show:
     - Rank number
     - Partner avatar and name
     - Store counts (active/total)
     - Product counts (active/total)
     - Order counts (total, completed, cancelled)
     - Completion rate with progress bar
     - Cancellation rate with progress bar
     - Rating badge (Excellent, Good, etc.)

6. **Test Sorting:**
   - Click on column headers to sort:
     - "Đối tác" - Sort by business name
     - "Cửa hàng" - Sort by total stores
     - "Sản phẩm" - Sort by total products
     - "Đơn hàng" - Sort by total orders
     - "Tỷ lệ hoàn thành" - Sort by completion rate
     - "Tỷ lệ hủy" - Sort by cancellation rate
   - Verify data reorders correctly
   - Arrow icon should indicate sort direction

7. **Test Pagination:**
   - If more than 20 partners exist, pagination should appear
   - Click "Next" and "Previous" buttons
   - Click page numbers
   - Verify data changes correctly

8. **Test Refresh:**
   - Click the "Làm mới" (Refresh) button
   - Verify data reloads (spinner appears, then data updates)

---

### Step 6: Test Error Handling

#### Test Backend Not Running
1. Stop the backend server
2. In frontend, click refresh button
3. **Expected:** Red error banner appears with message
4. Click "Thử lại" (Retry) link in error banner
5. **Expected:** Error persists

#### Test Invalid Token
1. Logout and login again
2. Wait for token to expire (or manually remove token)
3. Navigate to performance page
4. **Expected:** Redirected to login page (401 error)

#### Test No Data
1. Empty the database (or use a fresh database)
2. Navigate to performance page
3. **Expected:** Empty state message:
   - "Chưa có dữ liệu hiệu suất"
   - "Chưa có đối tác nào hoặc chưa có đơn hàng nào được xử lý"

---

## Troubleshooting

### Issue: Backend API returns 404

**Problem:** Endpoint not found

**Solutions:**
1. Verify backend is running: `curl http://localhost:8080/actuator/health`
2. Check if PartnerPerformanceController is loaded:
   ```bash
   grep -r "PartnerPerformanceController" backend/logs/
   ```
3. Rebuild backend: `mvn clean package -DskipTests`
4. Check Swagger UI for available endpoints

---

### Issue: Frontend shows "CORS Error"

**Problem:** Cross-Origin Request Blocked

**Solutions:**
1. Check `CorsConfig.java` in backend
2. Verify allowed origins include `http://localhost:5173`
3. Restart backend after making changes

**Example CorsConfig:**
```java
@Override
public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/api/**")
        .allowedOrigins("http://localhost:5173", "http://localhost:5174")
        .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH")
        .allowedHeaders("*")
        .allowCredentials(true);
}
```

---

### Issue: Performance Page Shows No Data

**Problem:** Empty result from backend

**Possible Causes:**
1. **No suppliers in database**
   - Solution: Create test suppliers via admin portal

2. **No orders in database**
   - Solution: Create test orders via customer portal

3. **All suppliers have status != ACTIVE**
   - Solution: Approve pending suppliers
   - Check supplier status in database

4. **Query returns empty due to JOIN issues**
   - Solution: Check logs for SQL errors
   - Verify relationships: Supplier → Store → Order

**Debug Query:**
```sql
-- Check if data exists
SELECT COUNT(*) FROM supplier WHERE status = 'ACTIVE';
SELECT COUNT(*) FROM store;
SELECT COUNT(*) FROM product;
SELECT COUNT(*) FROM order_table;
```

---

### Issue: Metrics Don't Add Up

**Problem:** Numbers seem incorrect

**Debug Steps:**
1. **Check a specific supplier manually:**
   ```sql
   SELECT
       s.business_name,
       COUNT(DISTINCT st.store_id) as total_stores,
       COUNT(DISTINCT CASE WHEN st.status = 'ACTIVE'
           THEN st.store_id END) as active_stores,
       COUNT(DISTINCT o.order_id) as total_orders
   FROM supplier s
   LEFT JOIN store st ON st.supplier_id = s.user_id
   LEFT JOIN order_table o ON o.store_id = st.store_id
   WHERE s.user_id = 'SUPPLIER_ID'
   GROUP BY s.business_name;
   ```

2. **Compare with backend calculation**

3. **Check for duplicate JOINs**

4. **Verify DISTINCT is used correctly**

---

### Issue: Sorting Doesn't Work

**Problem:** Clicking column headers doesn't sort

**Debug:**
1. Open browser console (F12)
2. Click a column header
3. Check Network tab for API request
4. Verify `sortBy` and `sortDirection` parameters are sent
5. Check backend logs for query execution

**Expected Request:**
```
GET /api/partners/performance?page=0&size=20&sortBy=totalOrders&sortDirection=DESC
```

---

### Issue: Slow Performance

**Problem:** Page takes long to load

**Solutions:**

1. **Add Database Indexes:**
   ```sql
   CREATE INDEX idx_store_supplier ON store(supplier_id);
   CREATE INDEX idx_store_status ON store(status);
   CREATE INDEX idx_product_supplier ON product(supplier_id);
   CREATE INDEX idx_product_status ON product(status);
   CREATE INDEX idx_order_store ON order_table(store_id);
   CREATE INDEX idx_order_status ON order_table(status);
   ```

2. **Enable Query Logging:**
   ```properties
   # application.properties
   spring.jpa.show-sql=true
   spring.jpa.properties.hibernate.format_sql=true
   logging.level.org.hibernate.SQL=DEBUG
   ```

3. **Check Query Execution Time:**
   ```sql
   EXPLAIN SELECT ... -- your query here
   ```

4. **Add Caching (Optional):**
   ```java
   @Cacheable(value = "performanceSummary")
   public PartnerPerformanceSummary getPerformanceSummary() { ... }
   ```

---

## Performance Optimization

### 1. Database Optimization

**Create Indexes:**
```sql
-- Primary indexes for JOINs
CREATE INDEX idx_store_supplier_id ON store(supplier_id);
CREATE INDEX idx_product_supplier_id ON product(supplier_id);
CREATE INDEX idx_order_store_id ON order_table(store_id);

-- Indexes for WHERE clauses
CREATE INDEX idx_supplier_status ON supplier(status);
CREATE INDEX idx_store_status ON store(status);
CREATE INDEX idx_product_status ON product(status);
CREATE INDEX idx_order_status ON order_table(status);

-- Index for period queries
CREATE INDEX idx_order_created_at ON order_table(created_at);

-- Composite indexes for better performance
CREATE INDEX idx_store_supplier_status ON store(supplier_id, status);
CREATE INDEX idx_product_supplier_status ON product(supplier_id, status);
```

**Verify Indexes:**
```sql
SHOW INDEXES FROM store;
SHOW INDEXES FROM product;
SHOW INDEXES FROM order_table;
```

---

### 2. Add Caching Layer

**Add Redis Dependency:**
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-cache</artifactId>
</dependency>
```

**Enable Caching:**
```java
@SpringBootApplication
@EnableCaching
public class BackendApplication { ... }
```

**Add Cache Annotations:**
```java
@Service
public class PartnerPerformanceServiceImpl {

    @Cacheable(value = "performanceSummary", key = "'summary'")
    public PartnerPerformanceSummary getPerformanceSummary() { ... }

    @Cacheable(value = "partnerPerformance", key = "#supplierId")
    public PartnerPerformanceMetrics getPartnerPerformance(String supplierId) { ... }
}
```

**Configure Cache TTL:**
```properties
# application.properties
spring.cache.type=redis
spring.redis.host=localhost
spring.redis.port=6379
spring.cache.redis.time-to-live=900000  # 15 minutes
```

---

### 3. Scheduled Cache Updates

```java
@Component
public class PerformanceCacheScheduler {

    @Autowired
    private PartnerPerformanceService performanceService;

    @Autowired
    private CacheManager cacheManager;

    // Update cache every hour
    @Scheduled(fixedRate = 3600000)
    public void updatePerformanceCache() {
        log.info("Updating performance cache...");

        // Clear old cache
        cacheManager.getCache("performanceSummary").clear();

        // Refresh summary
        performanceService.getPerformanceSummary();

        log.info("Performance cache updated");
    }
}
```

---

## Production Deployment

### Backend Deployment

1. **Build Production JAR:**
   ```bash
   mvn clean package -DskipTests -Pprod
   ```

2. **Configure Production Properties:**
   ```properties
   # application-prod.properties
   spring.datasource.url=jdbc:mysql://production-db:3306/savefood
   spring.datasource.username=${DB_USERNAME}
   spring.datasource.password=${DB_PASSWORD}

   # Enable caching
   spring.cache.type=redis
   spring.redis.host=production-redis
   spring.redis.port=6379

   # Logging
   logging.level.root=INFO
   logging.level.com.example.backend=INFO
   ```

3. **Run Application:**
   ```bash
   java -jar -Dspring.profiles.active=prod target/backend-0.0.1-SNAPSHOT.jar
   ```

---

### Frontend Deployment

1. **Update API Base URL:**
   ```typescript
   // .env.production
   VITE_API_BASE_URL=https://api.savefood.com/api
   ```

2. **Build Production Bundle:**
   ```bash
   npm run build
   ```

3. **Deploy to Server:**
   ```bash
   # Copy dist folder to web server
   scp -r dist/* user@server:/var/www/html/admin
   ```

---

## Monitoring

### Backend Metrics

**Add Actuator Endpoints:**
```properties
management.endpoints.web.exposure.include=health,metrics,prometheus
management.endpoint.health.show-details=always
```

**Monitor Performance:**
```bash
# Check API response time
curl http://localhost:8080/actuator/metrics/http.server.requests

# Check JVM memory
curl http://localhost:8080/actuator/metrics/jvm.memory.used
```

---

### Frontend Monitoring

**Add Console Logging:**
```typescript
// In service calls
console.log('API Request:', endpoint);
console.time('API Response Time');
const response = await axios.get(endpoint);
console.timeEnd('API Response Time');
```

**Monitor Network Requests:**
- Open browser DevTools (F12)
- Go to Network tab
- Filter by "XHR" or "Fetch"
- Check response times and status codes

---

## Support & Resources

### Documentation
- Backend API: `backend/PARTNER_PERFORMANCE_API.md`
- Swagger UI: `http://localhost:8080/swagger-ui/index.html`
- Database Schema: `backend/DATABASE_SCHEMA_VIETNAMESE.md`

### Logs
- Backend: `backend/logs/application.log`
- Frontend: Browser Console (F12)

### Contact
- Backend Issues: Check backend logs and Swagger
- Frontend Issues: Check browser console and Network tab
- Database Issues: Check MySQL/PostgreSQL logs

---

## Conclusion

The Partner Performance Reporting feature is now fully integrated between frontend and backend. Follow this guide to test, troubleshoot, and deploy the feature successfully.

**Quick Checklist:**
- ✅ Backend compiled and running
- ✅ Database has test data (suppliers, stores, products, orders)
- ✅ APIs tested with Swagger/cURL
- ✅ Frontend compiled and running
- ✅ Login with admin credentials works
- ✅ Performance page loads with data
- ✅ Sorting and pagination work
- ✅ Error handling tested
- ✅ Performance optimizations applied (indexes, caching)

**Ready for Production! 🚀**
