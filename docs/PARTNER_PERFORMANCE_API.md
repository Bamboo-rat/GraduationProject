# Partner Performance Reporting API

## Overview

This document describes the Partner Performance Reporting API implementation that provides comprehensive metrics and analytics for supplier partners in the SaveFood platform.

## Architecture

### Components

1. **DTOs** (Data Transfer Objects)
   - `PartnerPerformanceMetrics` - Individual partner performance data
   - `PartnerPerformanceSummary` - Aggregated summary for all partners

2. **Repository**
   - `PartnerPerformanceRepository` - Custom JPQL queries for performance metrics

3. **Service**
   - `PartnerPerformanceService` - Business logic interface
   - `PartnerPerformanceServiceImpl` - Implementation with calculations

4. **Controller**
   - `PartnerPerformanceController` - REST API endpoints

---

## API Endpoints

### 1. Get Performance Summary

**Endpoint**: `GET /api/partners/performance/summary`

**Description**: Returns aggregated performance metrics for all partners.

**Authorization**: Requires `SUPER_ADMIN`, `MODERATOR`, or `STAFF` role

**Response**:
```json
{
  "status": "SUCCESS",
  "message": "Performance summary retrieved successfully",
  "data": {
    "totalPartners": 150,
    "activePartners": 120,
    "inactivePartners": 20,
    "suspendedPartners": 10,
    "totalStores": 450,
    "totalActiveStores": 380,
    "totalProducts": 12500,
    "totalActiveProducts": 10200,
    "totalOrders": 45000,
    "totalCompletedOrders": 40500,
    "totalCancelledOrders": 2250,
    "averageCompletionRate": 90.0,
    "averageCancellationRate": 5.0,
    "totalRevenue": null,
    "totalCommission": null
  },
  "timestamp": "2025-01-24T10:30:00"
}
```

---

### 2. Get All Partner Performance

**Endpoint**: `GET /api/partners/performance`

**Description**: Returns paginated list of performance metrics for all active partners.

**Authorization**: Requires `SUPER_ADMIN`, `MODERATOR`, or `STAFF` role

**Query Parameters**:
- `page` (int, default: 0) - Page number
- `size` (int, default: 20) - Page size
- `sortBy` (string, default: "totalOrders") - Field to sort by
  - Valid values: `totalOrders`, `completedOrders`, `orderCompletionRate`, `orderCancellationRate`, `totalStores`, `activeStores`, `totalProducts`, `activeProducts`, `businessName`
- `sortDirection` (string, default: "DESC") - Sort direction (ASC/DESC)

**Example Request**:
```
GET /api/partners/performance?page=0&size=20&sortBy=orderCompletionRate&sortDirection=DESC
```

**Response**:
```json
{
  "status": "SUCCESS",
  "message": "Retrieved 20 partner performance metrics",
  "data": {
    "content": [
      {
        "supplierId": "uuid-123",
        "businessName": "Fresh Market Store",
        "avatarUrl": "https://cloudinary.com/...",
        "totalStores": 3,
        "activeStores": 3,
        "inactiveStores": 0,
        "totalProducts": 450,
        "activeProducts": 420,
        "outOfStockProducts": 30,
        "totalOrders": 1250,
        "completedOrders": 1150,
        "cancelledOrders": 50,
        "orderCompletionRate": 92.0,
        "orderCancellationRate": 4.0,
        "totalRevenue": null,
        "commission": null,
        "periodStart": null,
        "periodEnd": null,
        "lastUpdated": "2025-01-24T10:30:00"
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 20,
      "sort": {
        "sorted": true,
        "unsorted": false,
        "empty": false
      }
    },
    "totalElements": 120,
    "totalPages": 6,
    "last": false,
    "size": 20,
    "number": 0,
    "first": true,
    "numberOfElements": 20,
    "empty": false
  },
  "timestamp": "2025-01-24T10:30:00"
}
```

---

### 3. Get Partner Performance by ID

**Endpoint**: `GET /api/partners/performance/{supplierId}`

**Description**: Returns detailed performance metrics for a specific supplier.

**Authorization**: Requires `SUPER_ADMIN`, `MODERATOR`, or `STAFF` role

**Path Parameters**:
- `supplierId` (string, required) - Supplier's user ID

**Example Request**:
```
GET /api/partners/performance/uuid-123
```

**Response**:
```json
{
  "status": "SUCCESS",
  "message": "Partner performance metrics retrieved successfully",
  "data": {
    "supplierId": "uuid-123",
    "businessName": "Fresh Market Store",
    "avatarUrl": "https://cloudinary.com/...",
    "totalStores": 3,
    "activeStores": 3,
    "inactiveStores": 0,
    "totalProducts": 450,
    "activeProducts": 420,
    "outOfStockProducts": 30,
    "totalOrders": 1250,
    "completedOrders": 1150,
    "cancelledOrders": 50,
    "orderCompletionRate": 92.0,
    "orderCancellationRate": 4.0,
    "totalRevenue": null,
    "commission": null,
    "periodStart": null,
    "periodEnd": null,
    "lastUpdated": "2025-01-24T10:30:00"
  },
  "timestamp": "2025-01-24T10:30:00"
}
```

**Error Response** (Supplier not found):
```json
{
  "status": "ERROR",
  "message": "Supplier not found with ID: uuid-123",
  "data": null,
  "timestamp": "2025-01-24T10:30:00"
}
```

---

### 4. Get Partner Performance by Period

**Endpoint**: `GET /api/partners/performance/{supplierId}/period`

**Description**: Returns performance metrics for a specific supplier filtered by date range.

**Authorization**: Requires `SUPER_ADMIN`, `MODERATOR`, or `STAFF` role

**Path Parameters**:
- `supplierId` (string, required) - Supplier's user ID

**Query Parameters**:
- `startDate` (ISO DateTime, required) - Start date/time
- `endDate` (ISO DateTime, required) - End date/time

**Example Request**:
```
GET /api/partners/performance/uuid-123/period?startDate=2025-01-01T00:00:00&endDate=2025-01-31T23:59:59
```

**Response**:
```json
{
  "status": "SUCCESS",
  "message": "Partner performance metrics for period retrieved successfully",
  "data": {
    "supplierId": "uuid-123",
    "businessName": "Fresh Market Store",
    "avatarUrl": "https://cloudinary.com/...",
    "totalStores": 3,
    "activeStores": 3,
    "inactiveStores": 0,
    "totalProducts": 450,
    "activeProducts": 420,
    "outOfStockProducts": 30,
    "totalOrders": 350,
    "completedOrders": 320,
    "cancelledOrders": 15,
    "orderCompletionRate": 91.43,
    "orderCancellationRate": 4.29,
    "totalRevenue": null,
    "commission": null,
    "periodStart": "2025-01-01T00:00:00",
    "periodEnd": "2025-01-31T23:59:59",
    "lastUpdated": "2025-01-24T10:30:00"
  },
  "timestamp": "2025-01-24T10:30:00"
}
```

**Error Response** (Invalid date range):
```json
{
  "status": "ERROR",
  "message": "End date must be after start date",
  "data": null,
  "timestamp": "2025-01-24T10:30:00"
}
```

---

## Performance Metrics Explained

### Store Metrics
- **totalStores**: Total number of stores owned by the supplier
- **activeStores**: Number of stores with `status = ACTIVE`
- **inactiveStores**: Number of stores with `status != ACTIVE`

### Product Metrics
- **totalProducts**: Total number of products created by the supplier
- **activeProducts**: Number of products with `status = ACTIVE` or `status = AVAILABLE`
- **outOfStockProducts**: Number of products with `status = OUT_OF_STOCK`

### Order Metrics
- **totalOrders**: Total number of orders placed at supplier's stores
- **completedOrders**: Number of orders with `status = COMPLETED`
- **cancelledOrders**: Number of orders with `status = CANCELLED`
- **orderCompletionRate**: Percentage of completed orders = `(completedOrders / totalOrders) * 100`
- **orderCancellationRate**: Percentage of cancelled orders = `(cancelledOrders / totalOrders) * 100`

### Revenue Metrics (Future Implementation)
- **totalRevenue**: Total revenue generated by the supplier
- **commission**: Total commission earned by the platform

---

## Database Queries

### Key Query Logic

The performance metrics are calculated using JPQL queries with aggregations:

```sql
SELECT
    s.userId as supplierId,
    s.businessName as businessName,
    s.avatarUrl as avatarUrl,
    COUNT(DISTINCT st.storeId) as totalStores,
    COUNT(DISTINCT CASE WHEN st.status = 'ACTIVE' THEN st.storeId END) as activeStores,
    COUNT(DISTINCT CASE WHEN st.status != 'ACTIVE' THEN st.storeId END) as inactiveStores,
    COUNT(DISTINCT p.productId) as totalProducts,
    COUNT(DISTINCT CASE WHEN p.status IN ('ACTIVE', 'AVAILABLE') THEN p.productId END) as activeProducts,
    COUNT(DISTINCT CASE WHEN p.status = 'OUT_OF_STOCK' THEN p.productId END) as outOfStockProducts,
    COUNT(DISTINCT o.orderId) as totalOrders,
    COUNT(DISTINCT CASE WHEN o.status = 'COMPLETED' THEN o.orderId END) as completedOrders,
    COUNT(DISTINCT CASE WHEN o.status = 'CANCELLED' THEN o.orderId END) as cancelledOrders
FROM Supplier s
LEFT JOIN Store st ON st.supplier.userId = s.userId
LEFT JOIN Product p ON p.supplier.userId = s.userId
LEFT JOIN Order o ON o.store.storeId = st.storeId
WHERE s.userId = :supplierId
GROUP BY s.userId, s.businessName, s.avatarUrl
```

### Performance Considerations

1. **Indexing**: Ensure indexes exist on:
   - `Store.supplier_id`
   - `Store.status`
   - `Product.supplier_id`
   - `Product.status`
   - `Order.store_id`
   - `Order.status`
   - `Order.created_at` (for period queries)

2. **Caching**: Consider implementing Redis cache for:
   - Performance summary (cache for 1 hour)
   - Individual partner metrics (cache for 15 minutes)

3. **Pagination**: Always use pagination for list queries to avoid loading too much data

---

## Usage Examples

### Example 1: Get Dashboard Summary

```bash
curl -X GET "http://localhost:8080/api/partners/performance/summary" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Example 2: Get Top 10 Partners by Orders

```bash
curl -X GET "http://localhost:8080/api/partners/performance?page=0&size=10&sortBy=totalOrders&sortDirection=DESC" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Example 3: Get Top Partners by Completion Rate

```bash
curl -X GET "http://localhost:8080/api/partners/performance?page=0&size=10&sortBy=orderCompletionRate&sortDirection=DESC" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Example 4: Get Specific Partner Performance

```bash
curl -X GET "http://localhost:8080/api/partners/performance/uuid-123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Example 5: Get Monthly Performance

```bash
curl -X GET "http://localhost:8080/api/partners/performance/uuid-123/period?startDate=2025-01-01T00:00:00&endDate=2025-01-31T23:59:59" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Testing

### Unit Tests

Create tests for:
- `PartnerPerformanceServiceImpl` - Business logic
- `PartnerPerformanceController` - API endpoints

### Integration Tests

Test the full flow:
1. Create test suppliers with stores, products, and orders
2. Verify metrics calculations are correct
3. Test pagination and sorting
4. Test date range filtering

### Sample Test Data

```java
// Create supplier with:
- 3 stores (2 ACTIVE, 1 INACTIVE)
- 100 products (80 ACTIVE, 15 OUT_OF_STOCK, 5 INACTIVE)
- 50 orders (45 COMPLETED, 3 CANCELLED, 2 PENDING)

// Expected metrics:
- totalStores: 3
- activeStores: 2
- totalProducts: 100
- activeProducts: 80
- totalOrders: 50
- completedOrders: 45
- orderCompletionRate: 90.0%
- orderCancellationRate: 6.0%
```

---

## Security

### Authorization

All endpoints require authentication and specific roles:
- `SUPER_ADMIN` - Full access
- `MODERATOR` - Read access
- `STAFF` - Read access
- `SUPPLIER` - Not allowed (partners cannot see other partners' metrics)

### Rate Limiting

Consider implementing rate limiting:
- Summary endpoint: 10 requests/minute
- List endpoint: 30 requests/minute
- Detail endpoint: 60 requests/minute

---

## Future Enhancements

1. **Revenue Tracking**
   - Integrate with payment system
   - Calculate total revenue and commission
   - Add revenue-based sorting

2. **Advanced Analytics**
   - Average order value
   - Customer retention rate
   - Product popularity metrics
   - Delivery performance metrics

3. **Caching Layer**
   - Redis cache for frequently accessed data
   - Scheduled cache updates
   - Cache invalidation on order completion

4. **Export Features**
   - Export to CSV/Excel
   - PDF report generation
   - Email scheduled reports

5. **Real-time Updates**
   - WebSocket notifications for metric changes
   - Live dashboard updates
   - Alert system for poor performance

---

## Troubleshooting

### Common Issues

1. **Slow Query Performance**
   - Check database indexes
   - Reduce page size
   - Add caching layer

2. **Incorrect Metrics**
   - Verify order status values match enums
   - Check for duplicate relationships in JOIN
   - Validate test data

3. **Memory Issues**
   - Ensure pagination is used
   - Limit maximum page size
   - Optimize query projections

---

## API Testing with Swagger

Access the Swagger UI at: `http://localhost:8080/swagger-ui/index.html`

Navigate to the "Partner Performance" section to test all endpoints interactively.

---

## Maintenance

### Regular Tasks

1. **Performance Monitoring**
   - Monitor query execution times
   - Check cache hit rates
   - Review slow query logs

2. **Data Validation**
   - Verify metric accuracy weekly
   - Check for data anomalies
   - Validate against manual calculations

3. **Optimization**
   - Review and optimize queries monthly
   - Update indexes as needed
   - Adjust cache TTL based on usage patterns

---

## Support

For issues or questions:
- Check logs: `backend/logs/application.log`
- Review Swagger documentation
- Contact backend team

---

## Version History

- **v1.0.0** (2025-01-24) - Initial implementation
  - Basic performance metrics
  - Summary and detail endpoints
  - Period-based filtering
  - Pagination and sorting support
