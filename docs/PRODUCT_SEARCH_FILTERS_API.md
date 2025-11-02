# Product Search & Filter API Documentation

## Overview

The Product Search API provides comprehensive filtering capabilities for the customer shopping experience. It supports keyword search, price range filtering, expiry date filtering, and location-based/distance filtering.

---

## Table of Contents

1. [Features](#features)
2. [API Endpoints](#api-endpoints)
3. [Filter Parameters](#filter-parameters)
4. [Usage Examples](#usage-examples)
5. [Integration Guide](#integration-guide)
6. [Performance Considerations](#performance-considerations)

---

## Features

### ✅ Keyword Search
- Search by product name or description
- Case-insensitive search
- Partial matching support

### ✅ Price Range Filter
- Filter by minimum and maximum price
- Uses discounted price if available, otherwise original price
- Supports any price range combination

### ✅ Expiry Date Filter
- Filter by expiry date range (from-to dates)
- Filter by "expiring within X days" (e.g., products expiring in next 7 days)
- Perfect for finding near-expiry discounted products

### ✅ Location-Based Filter
- Filter by province, district, and ward
- Filter by distance from user location using GPS coordinates
- Uses Haversine formula for accurate distance calculation

### ✅ Standard Filters
- Filter by product status (ACTIVE, SOLD_OUT, EXPIRED, etc.)
- Filter by category
- Filter by supplier

---

## API Endpoints

### Advanced Product Search

**Endpoint:**
```http
GET /api/products/search
```

**Query Parameters:** See [Filter Parameters](#filter-parameters) section below

**Response:**
```json
{
  "status": "SUCCESS",
  "message": "Products searched successfully",
  "data": {
    "content": [
      {
        "productId": "prod-uuid-123",
        "name": "Fresh Vegetables Bundle",
        "description": "Mixed vegetables near expiry",
        "status": "ACTIVE",
        "category": {
          "categoryId": "cat-123",
          "name": "Vegetables"
        },
        "supplier": {
          "userId": "supplier-123",
          "businessName": "Fresh Foods Co."
        },
        "variants": [
          {
            "variantId": "var-123",
            "name": "Small Bundle",
            "sku": "VEG-001-SMALL",
            "originalPrice": 50000,
            "discountPrice": 30000,
            "expiryDate": "2025-12-10",
            "storeProducts": [
              {
                "store": {
                  "storeId": "store-123",
                  "storeName": "Fresh Foods - District 1",
                  "address": "123 Nguyen Hue St, District 1, Ho Chi Minh City",
                  "latitude": 10.7769,
                  "longitude": 106.7009,
                  "distance": 2.5
                },
                "stockQuantity": 50
              }
            ]
          }
        ],
        "images": [
          {
            "imageUrl": "https://cloudinary.com/...",
            "primary": true
          }
        ]
      }
    ],
    "totalElements": 150,
    "totalPages": 8,
    "number": 0,
    "size": 20
  }
}
```

---

## Filter Parameters

### Basic Filters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `status` | ProductStatus | Filter by product status | `ACTIVE` |
| `categoryId` | String (UUID) | Filter by category | `cat-uuid-123` |
| `supplierId` | String (UUID) | Filter by supplier | `supplier-uuid-123` |
| `search` | String | Search in product name/description | `fresh vegetables` |

### Price Range Filters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `minPrice` | BigDecimal | Minimum price (VND) | `10000` |
| `maxPrice` | BigDecimal | Maximum price (VND) | `100000` |

**Notes:**
- Prices are compared against variant prices
- Uses `discountPrice` if available, otherwise `originalPrice`
- Both parameters are optional and can be used independently

**Examples:**
- `minPrice=10000` - Products priced at 10,000 VND and above
- `maxPrice=50000` - Products priced at 50,000 VND and below
- `minPrice=10000&maxPrice=50000` - Products between 10,000 and 50,000 VND

### Expiry Date Filters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `expiryDateFrom` | LocalDate (ISO) | Products expiring from this date onwards | `2025-12-01` |
| `expiryDateTo` | LocalDate (ISO) | Products expiring until this date | `2025-12-31` |
| `expiringWithinDays` | Integer | Products expiring within X days from today | `7` |

**Notes:**
- Date format: `YYYY-MM-DD` (ISO 8601)
- `expiringWithinDays` is a shortcut for finding near-expiry products
- Filters apply to product variant expiry dates

**Examples:**
- `expiringWithinDays=7` - Products expiring in next 7 days
- `expiringWithinDays=30` - Products expiring in next 30 days
- `expiryDateFrom=2025-12-01&expiryDateTo=2025-12-31` - Products expiring in December 2025

### Location Filters

#### Text-based Location

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `province` | String | Filter by province/city | `Ho Chi Minh City` |
| `district` | String | Filter by district | `District 1` |
| `ward` | String | Filter by ward | `Ben Nghe` |

**Notes:**
- Case-insensitive matching
- Exact match required
- Filters based on store locations

#### Distance-based Location

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `userLatitude` | Double | User's GPS latitude | `10.7769` |
| `userLongitude` | Double | User's GPS longitude | `106.7009` |
| `maxDistanceKm` | Double | Maximum distance in kilometers | `5.0` |

**Notes:**
- All three parameters required for distance filtering
- Uses Haversine formula for accurate distance calculation
- Filters products available at stores within the specified distance
- Earth radius used: 6371 km

**Examples:**
- `userLatitude=10.7769&userLongitude=106.7009&maxDistanceKm=5` - Products within 5km of Ben Thanh Market, HCMC
- `userLatitude=21.0285&userLongitude=105.8542&maxDistanceKm=10` - Products within 10km of Hoan Kiem Lake, Hanoi

### Pagination & Sorting

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | Integer | 0 | Page number (0-indexed) |
| `size` | Integer | 20 | Items per page |
| `sort` | String | `name,asc` | Sort field and direction |

**Sort Options:**
- `name,asc` or `name,desc` - Sort by product name
- `createdAt,desc` - Sort by newest first
- Multiple sort fields supported: `name,asc&sort=createdAt,desc`

---

## Usage Examples

### Example 1: Find Cheap Products Near Me

**Request:**
```http
GET /api/products/search?userLatitude=10.7769&userLongitude=106.7009&maxDistanceKm=5&maxPrice=50000&sort=discountPrice,asc
```

**Use Case:** Customer wants cheap products within 5km

### Example 2: Find Products Expiring Soon for Big Discounts

**Request:**
```http
GET /api/products/search?expiringWithinDays=7&status=ACTIVE&sort=expiryDate,asc
```

**Use Case:** Customer looking for heavily discounted near-expiry products

### Example 3: Search Vegetables in District 1

**Request:**
```http
GET /api/products/search?search=vegetables&district=District%201&province=Ho%20Chi%20Minh%20City&status=ACTIVE
```

**Use Case:** Customer searching for specific product in a specific area

### Example 4: Find Products in Price Range Expiring This Month

**Request:**
```http
GET /api/products/search?minPrice=20000&maxPrice=100000&expiryDateFrom=2025-12-01&expiryDateTo=2025-12-31
```

**Use Case:** Customer looking for specific price range with specific expiry window

### Example 5: Find Near-Expiry Bakery Products Nearby

**Request:**
```http
GET /api/products/search?categoryId=bakery-cat-id&expiringWithinDays=3&userLatitude=10.7769&userLongitude=106.7009&maxDistanceKm=2&sort=expiryDate,asc
```

**Use Case:** Customer wants fresh bakery items expiring soon from nearby stores

---

## Integration Guide

### Frontend Integration (TypeScript/JavaScript)

#### 1. Create Service Method

```typescript
// productService.ts
import axiosInstance from '../config/axios';

interface ProductSearchFilters {
  // Basic filters
  status?: string;
  categoryId?: string;
  supplierId?: string;
  search?: string;

  // Price filters
  minPrice?: number;
  maxPrice?: number;

  // Expiry filters
  expiryDateFrom?: string; // YYYY-MM-DD
  expiryDateTo?: string;
  expiringWithinDays?: number;

  // Location filters
  userLatitude?: number;
  userLongitude?: number;
  maxDistanceKm?: number;
  province?: string;
  district?: string;
  ward?: string;

  // Pagination
  page?: number;
  size?: number;
  sort?: string;
}

class ProductService {
  async searchProducts(filters: ProductSearchFilters) {
    const response = await axiosInstance.get('/products/search', {
      params: filters
    });
    return response.data.data;
  }
}

export default new ProductService();
```

#### 2. Use in Component

```typescript
// ProductSearchPage.tsx
import { useState, useEffect } from 'react';
import productService from '../service/productService';

function ProductSearchPage() {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    minPrice: null,
    maxPrice: null,
    expiringWithinDays: null,
    userLatitude: null,
    userLongitude: null,
    maxDistanceKm: 5,
    page: 0,
    size: 20
  });

  useEffect(() => {
    loadProducts();
  }, [filters]);

  const loadProducts = async () => {
    try {
      const data = await productService.searchProducts(filters);
      setProducts(data.content);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handleSearchChange = (search: string) => {
    setFilters({ ...filters, search, page: 0 });
  };

  const handlePriceRangeChange = (minPrice: number, maxPrice: number) => {
    setFilters({ ...filters, minPrice, maxPrice, page: 0 });
  };

  const handleNearMeFilter = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFilters({
          ...filters,
          userLatitude: position.coords.latitude,
          userLongitude: position.coords.longitude,
          maxDistanceKm: 5,
          page: 0
        });
      });
    }
  };

  const handleExpiryFilter = (days: number) => {
    setFilters({ ...filters, expiringWithinDays: days, page: 0 });
  };

  return (
    <div>
      <h1>Search Products</h1>

      {/* Search input */}
      <input
        type="text"
        placeholder="Search products..."
        onChange={(e) => handleSearchChange(e.target.value)}
      />

      {/* Quick filters */}
      <button onClick={handleNearMeFilter}>
        📍 Near Me (5km)
      </button>
      <button onClick={() => handleExpiryFilter(7)}>
        ⏰ Expiring in 7 days
      </button>

      {/* Price range filter */}
      <div>
        <input
          type="number"
          placeholder="Min price"
          onChange={(e) => setFilters({...filters, minPrice: Number(e.target.value)})}
        />
        <input
          type="number"
          placeholder="Max price"
          onChange={(e) => setFilters({...filters, maxPrice: Number(e.target.value)})}
        />
      </div>

      {/* Products display */}
      <div className="products-grid">
        {products.map(product => (
          <ProductCard key={product.productId} product={product} />
        ))}
      </div>
    </div>
  );
}
```

#### 3. Advanced Filter Panel

```typescript
// FilterPanel.tsx
interface FilterPanelProps {
  onFilterChange: (filters: ProductSearchFilters) => void;
}

function FilterPanel({ onFilterChange }: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<ProductSearchFilters>({});

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLocalFilters({
          ...localFilters,
          userLatitude: position.coords.latitude,
          userLongitude: position.coords.longitude
        });
      });
    }
  };

  return (
    <div className="filter-panel">
      <h3>Filters</h3>

      {/* Price Range */}
      <div className="filter-section">
        <h4>Price Range</h4>
        <input
          type="number"
          placeholder="Min (VND)"
          value={localFilters.minPrice || ''}
          onChange={(e) => setLocalFilters({
            ...localFilters,
            minPrice: Number(e.target.value)
          })}
        />
        <input
          type="number"
          placeholder="Max (VND)"
          value={localFilters.maxPrice || ''}
          onChange={(e) => setLocalFilters({
            ...localFilters,
            maxPrice: Number(e.target.value)
          })}
        />
      </div>

      {/* Expiry Date */}
      <div className="filter-section">
        <h4>Expiring Soon</h4>
        <select
          value={localFilters.expiringWithinDays || ''}
          onChange={(e) => setLocalFilters({
            ...localFilters,
            expiringWithinDays: Number(e.target.value)
          })}
        >
          <option value="">Any time</option>
          <option value="1">Today</option>
          <option value="3">Within 3 days</option>
          <option value="7">Within 1 week</option>
          <option value="14">Within 2 weeks</option>
          <option value="30">Within 1 month</option>
        </select>
      </div>

      {/* Distance */}
      <div className="filter-section">
        <h4>Distance</h4>
        <button onClick={handleGetLocation}>
          Get My Location
        </button>
        {localFilters.userLatitude && (
          <div>
            <label>Max Distance (km):</label>
            <input
              type="number"
              value={localFilters.maxDistanceKm || 5}
              onChange={(e) => setLocalFilters({
                ...localFilters,
                maxDistanceKm: Number(e.target.value)
              })}
            />
          </div>
        )}
      </div>

      <button onClick={handleApplyFilters}>
        Apply Filters
      </button>
    </div>
  );
}
```

---

## Performance Considerations

### Database Indexes

The following indexes are already in place for optimal query performance:

```sql
-- Product indexes
CREATE INDEX idx_product_status ON products(status);
CREATE INDEX idx_product_supplier ON products(supplier_id);
CREATE INDEX idx_product_category ON products(category_id);
CREATE INDEX idx_product_name ON products(name);
CREATE INDEX idx_product_supplier_status ON products(supplier_id, status);
CREATE INDEX idx_product_category_status ON products(category_id, status);

-- Store indexes for location queries
CREATE INDEX idx_store_location ON stores(latitude, longitude);
CREATE INDEX idx_store_supplier_status ON stores(supplier_id, status);
```

### Query Optimization Tips

1. **Use Pagination**: Always specify page size to limit result sets
2. **Limit Filter Combinations**: Too many filters can slow down queries
3. **Cache Popular Searches**: Implement Redis caching for common filter combinations
4. **Distance Calculation**: Distance filtering is computationally expensive - combine with other filters to reduce dataset first

### Best Practices

1. **Debounce Search Input**: Delay search requests by 300-500ms after user stops typing
2. **Progressive Filtering**: Apply basic filters first (status, category), then advanced filters
3. **Location Permissions**: Request location permission early in user journey
4. **Default Sorting**: Use appropriate default sorting (e.g., distance for location-based, expiry date for near-expiry products)

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Invalid date format | Wrong date string format | Use `YYYY-MM-DD` format |
| Invalid coordinates | Latitude/longitude out of range | Validate GPS coordinates before sending |
| Missing distance parameters | Only partial location data provided | Require all 3 parameters for distance filtering |

### Example Error Response

```json
{
  "status": "ERROR",
  "message": "Invalid date format for expiryDateFrom",
  "errorCode": "1001",
  "timestamp": "2025-11-02T10:30:00"
}
```

---

## Future Enhancements

### Planned Features

1. **Saved Searches**: Allow users to save filter combinations
2. **Search History**: Track and suggest previous searches
3. **Smart Recommendations**: ML-based product recommendations based on search patterns
4. **Multi-Store Comparison**: Show price/distance comparison across multiple stores for same product
5. **Real-time Inventory**: WebSocket updates for stock changes during search
6. **Map View**: Display search results on interactive map

---

## Summary

The Product Search & Filter API provides a comprehensive solution for customer product discovery with:

- ✅ **Keyword search** in product names and descriptions
- ✅ **Price range filtering** with support for discounted prices
- ✅ **Expiry date filtering** for finding near-expiry deals
- ✅ **Location-based filtering** with GPS distance calculation
- ✅ **Text-based location** filtering by province/district/ward
- ✅ **Flexible pagination** and sorting options
- ✅ **Optimized performance** with proper database indexes

This API enables a rich shopping experience where customers can easily find products that match their budget, location, and urgency preferences.

---

**Last Updated**: 2025-11-02
**Version**: 1.0.0
**Author**: SaveFood Development Team
