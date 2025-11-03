# Customer-Facing API Endpoints

This document describes the public-facing API endpoints designed for customer browsing and shopping experience.

## Overview

All endpoints listed below are **PUBLIC** and do not require authentication. They are designed to be called by the customer-facing mobile app or website.

---

## Product Endpoints

### 1. Get Products Near Customer

**Already Existing**: `GET /api/products/search`

Search products with location filters.

**Query Parameters:**
- `userLatitude` (optional) - Customer's latitude
- `userLongitude` (optional) - Customer's longitude
- `maxDistanceKm` (optional) - Maximum distance in kilometers
- `province` (optional) - Filter by province
- `district` (optional) - Filter by district
- `ward` (optional) - Filter by ward
- `minPrice` (optional) - Minimum price filter
- `maxPrice` (optional) - Maximum price filter
- `expiryDateFrom` (optional) - Filter by expiry date from
- `expiryDateTo` (optional) - Filter by expiry date to
- `categoryId` (optional) - Filter by category
- `search` (optional) - Keyword search
- `page` (default: 0)
- `size` (default: 20)
- `sort` (default: "name,asc")

**Response:** Paginated list of `ProductResponse`

**Example:**
```
GET /api/products/search?userLatitude=10.762622&userLongitude=106.660172&maxDistanceKm=5&page=0&size=20
```

---

### 2. Get Best-Selling Products

**NEW**: `GET /api/products/best-selling`

Returns top 10 products based on total quantity sold from DELIVERED orders.

**Query Parameters:**
- `page` (default: 0)
- `size` (default: 10)

**Response:** Paginated list of `ProductResponse`

**Use Case:** Homepage "Best Sellers" section

**Example:**
```
GET /api/products/best-selling?page=0&size=10
```

---

### 3. Get Cheapest Products (Highest Discount)

**NEW**: `GET /api/products/cheapest`

Returns top 5 products with highest discount percentage.
- Only returns ACTIVE products from ACTIVE stores
- Only products with positive stock
- Discount calculated as: `(originalPrice - discountPrice) / originalPrice`

**Query Parameters:**
- `page` (default: 0)
- `size` (default: 5)

**Response:** Paginated list of `ProductResponse`

**Use Case:** Homepage "Best Deals" section

**Example:**
```
GET /api/products/cheapest?page=0&size=5
```

---

### 4. Get New Products On Sale Today

**NEW**: `GET /api/products/new-on-sale`

Returns products created today that have discount.
- Only returns ACTIVE products from ACTIVE stores
- Only products with positive stock
- Products must have `discountPrice < originalPrice`

**Query Parameters:**
- `page` (default: 0)
- `size` (default: 20)

**Response:** Paginated list of `ProductResponse`

**Use Case:** Homepage "New Today" section

**Example:**
```
GET /api/products/new-on-sale?page=0&size=20
```

---

### 5. Get All Products

**Already Existing**: `GET /api/products`

Get all products with optional filters.

**Query Parameters:**
- `status` (optional) - Filter by ProductStatus
- `categoryId` (optional) - Filter by category
- `supplierId` (optional) - Filter by supplier
- `search` (optional) - Keyword search
- `page` (default: 0)
- `size` (default: 20)
- `sort` (default: "name,asc")

**Response:** Paginated list of `ProductResponse`

**Example:**
```
GET /api/products?categoryId=cat123&page=0&size=20
```

---

## Store Endpoints

### 6. Get All Active Stores

**NEW**: `GET /api/stores/public`

Returns all ACTIVE stores with optional province filter.

**Query Parameters:**
- `province` (optional) - Filter by province name (case-insensitive)
- `page` (default: 0)
- `size` (default: 20)
- `sort` (default: "storeName,asc")

**Response:** Paginated list of `StoreResponse`

**Use Case:** Browse all stores, filter by province

**Examples:**
```
GET /api/stores/public?page=0&size=20
GET /api/stores/public?province=Hồ Chí Minh&page=0&size=20
```

---

### 7. Get Top Stores by Purchase Count

**NEW**: `GET /api/stores/top-stores`

Returns top 5 stores based on number of DELIVERED orders.

**Query Parameters:**
- `page` (default: 0)
- `size` (default: 5)

**Response:** Paginated list of `StoreResponse`

**Use Case:** Homepage "Popular Stores" section

**Example:**
```
GET /api/stores/top-stores?page=0&size=5
```

---

### 8. Get Nearby Stores

**Already Existing**: `GET /api/stores/nearby`

Find stores within specified radius from customer's location.

**Query Parameters:**
- `latitude` (required) - Customer's latitude
- `longitude` (required) - Customer's longitude
- `radiusKm` (default: 5.0) - Search radius in kilometers
- `page` (default: 0)
- `size` (default: 20)
- `sort` (default: "storeName,asc")

**Response:** Paginated list of `StoreResponse`

**Use Case:** "Near Me" feature

**Example:**
```
GET /api/stores/nearby?latitude=10.762622&longitude=106.660172&radiusKm=5&page=0&size=20
```

---

### 9. Get Store Products

**Already Existing**: `GET /api/stores/{storeId}/products`

Get all product variants available at a specific store.

**Path Parameters:**
- `storeId` (required) - Store ID

**Query Parameters:**
- `page` (default: 0)
- `size` (default: 20)
- `sort` (default: "createdAt,desc")

**Response:** Paginated list of `StoreProductVariantResponse`

**Use Case:** View all products in a specific store

**Example:**
```
GET /api/stores/store123/products?page=0&size=20
```

---

## Pagination

All endpoints return paginated results with the following structure:

```json
{
  "status": "SUCCESS",
  "message": "Data retrieved successfully",
  "data": {
    "content": [...],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 20,
      "sort": {...},
      "offset": 0,
      "paged": true,
      "unpaged": false
    },
    "totalPages": 5,
    "totalElements": 100,
    "last": false,
    "size": 20,
    "number": 0,
    "numberOfElements": 20,
    "first": true,
    "empty": false
  }
}
```

---

## Response Objects

### ProductResponse

```json
{
  "productId": "prod123",
  "name": "Fresh Milk 1L",
  "description": "Fresh dairy milk",
  "categoryId": "cat456",
  "categoryName": "Dairy Products",
  "status": "ACTIVE",
  "supplierId": "sup789",
  "supplierName": "ABC Dairy",
  "variants": [
    {
      "variantId": "var001",
      "name": "Full Cream",
      "sku": "MILK-FULL-001",
      "originalPrice": 50000,
      "discountPrice": 40000,
      "expiryDate": "2025-12-01",
      "available": true
    }
  ],
  "images": [...],
  "attributes": [...],
  "createdAt": "2025-11-03T10:00:00",
  "updatedAt": "2025-11-03T10:00:00"
}
```

### StoreResponse

```json
{
  "storeId": "store123",
  "storeName": "ABC Supermarket",
  "address": "123 Main St, District 1",
  "province": "Hồ Chí Minh",
  "district": "Quận 1",
  "ward": "Phường Bến Nghé",
  "latitude": 10.762622,
  "longitude": 106.660172,
  "phoneNumber": "0901234567",
  "imageUrl": "https://...",
  "openTime": "08:00:00",
  "closeTime": "22:00:00",
  "status": "ACTIVE",
  "supplierId": "sup789",
  "supplierName": "ABC Trading Co.",
  "createdAt": "2025-01-01T00:00:00"
}
```

### StoreProductVariantResponse

```json
{
  "storeProductId": "sp001",
  "productId": "prod123",
  "productName": "Fresh Milk 1L",
  "categoryName": "Dairy Products",
  "variantId": "var001",
  "variantName": "Full Cream",
  "sku": "MILK-FULL-001",
  "originalPrice": 50000,
  "discountPrice": 40000,
  "expiryDate": "2025-12-01",
  "available": true,
  "variantImages": [...],
  "stockQuantity": 100,
  "priceOverride": null
}
```

---

## Performance Considerations

### Pagination

- **Default page size**: 20 for general listings
- **Special page sizes**:
  - Best-selling products: 10
  - Cheapest products: 5
  - Top stores: 5
- Always use pagination to avoid long loading times
- Maximum recommended page size: 50

### Filtering

- Use province filter for stores to reduce result set
- Use location-based search (latitude/longitude + radius) for nearby results
- Combine multiple filters for more specific results

### Caching Recommendations

Consider caching these endpoints on the client side:
- Best-selling products: Cache for 1 hour
- Cheapest products: Cache for 30 minutes
- Top stores: Cache for 1 hour
- New products on sale: Cache for 15 minutes
- Store list by province: Cache for 30 minutes

---

## Example Mobile App Usage

### Homepage Sections

```javascript
// 1. Best Sellers Section
GET /api/products/best-selling?size=10

// 2. Best Deals Section
GET /api/products/cheapest?size=5

// 3. New Today Section
GET /api/products/new-on-sale?size=10

// 4. Popular Stores Section
GET /api/stores/top-stores?size=5

// 5. Near Me Section (requires user location)
GET /api/stores/nearby?latitude={lat}&longitude={lon}&radiusKm=5&size=10
```

### Browse Stores Page

```javascript
// All stores
GET /api/stores/public?page=0&size=20

// Stores in specific province
GET /api/stores/public?province=Hồ Chí Minh&page=0&size=20
```

### Store Detail Page

```javascript
// Get store info
GET /api/stores/{storeId}

// Get products in this store
GET /api/stores/{storeId}/products?page=0&size=20
```

### Search Page

```javascript
// Search products near customer
GET /api/products/search?userLatitude={lat}&userLongitude={lon}&maxDistanceKm=10&search=milk&page=0&size=20

// Search by category
GET /api/products?categoryId={catId}&page=0&size=20
```

---

## Error Responses

All endpoints follow the standard error response format:

```json
{
  "status": "ERROR",
  "message": "Error description",
  "errorCode": "4001",
  "timestamp": "2025-11-03T10:30:00"
}
```

Common error codes:
- `4001`: Resource not found
- `1001`: Invalid request parameters
- `9001`: Server error

---

## Notes

1. **All endpoints are public** - No authentication required for customer browsing
2. **Only ACTIVE stores** - Only stores with status=ACTIVE are returned in public endpoints
3. **Only ACTIVE products** - Only products with status=ACTIVE and positive stock are returned
4. **Real-time data** - All data is fetched in real-time, no pre-aggregation
5. **Performance** - Queries are optimized with proper indexing and JOIN FETCH to avoid N+1 problems

---

**Last Updated**: 2025-11-03
**Version**: 1.0
