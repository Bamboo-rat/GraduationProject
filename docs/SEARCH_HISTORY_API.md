# Search History API Documentation

## Overview

The Search History API allows customers to track their search queries and provides functionality to view, manage, and delete their search history. Admins can also view customer search patterns for analytics.

---

## Table of Contents

1. [Features](#features)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Customer Endpoints](#customer-endpoints)
5. [Admin Endpoints](#admin-endpoints)
6. [Integration Guide](#integration-guide)
7. [Privacy & Data Retention](#privacy--data-retention)

---

## Features

### For Customers
- ✅ **View search history** - See all past searches with timestamps
- ✅ **Recent searches** - Quick access to last 30 days
- ✅ **Unique queries** - Get distinct search terms for autocomplete suggestions
- ✅ **Delete specific search** - Remove individual search entries
- ✅ **Delete all history** - Clear entire search history
- ✅ **Delete old searches** - Remove searches older than X days
- ✅ **Search count** - View total number of searches performed

### For Admins
- ✅ **View customer searches** - Monitor search patterns for analytics
- ✅ **Search count analytics** - Understand customer behavior
- ✅ **Privacy compliance** - Delete customer data on request

---

## Database Schema

### SearchHistory Table

```sql
CREATE TABLE search_histories (
    search_id VARCHAR(36) PRIMARY KEY,
    search_query VARCHAR(255) NOT NULL,
    searched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    customer_id VARCHAR(36) NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_customer_searched_at (customer_id, searched_at DESC),
    INDEX idx_search_query (search_query)
);
```

### Entity Fields

| Field | Type | Description |
|-------|------|-------------|
| `searchId` | UUID | Unique identifier for search record |
| `searchQuery` | String | The search query text |
| `searchedAt` | LocalDateTime | Timestamp when search was performed |
| `customer` | Customer | Reference to customer who searched |

---

## API Endpoints

### Base URL
```
/api/search-history
```

### Authentication
All endpoints require JWT authentication via Bearer token.

---

## Customer Endpoints

### 1. Get My Search History

Get paginated search history for authenticated customer.

**Endpoint:**
```http
GET /api/search-history/me?page=0&size=20
Authorization: Bearer {customer_token}
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 0 | Page number (0-indexed) |
| `size` | int | 20 | Items per page |

**Response:**
```json
{
  "status": "SUCCESS",
  "data": {
    "content": [
      {
        "searchId": "uuid-1234",
        "searchQuery": "fresh vegetables",
        "searchedAt": "2025-11-02T14:30:00",
        "customerId": "customer-uuid",
        "customerName": "Nguyen Van A"
      },
      {
        "searchId": "uuid-5678",
        "searchQuery": "organic fruits",
        "searchedAt": "2025-11-02T10:15:00",
        "customerId": "customer-uuid",
        "customerName": "Nguyen Van A"
      }
    ],
    "totalElements": 45,
    "totalPages": 3,
    "number": 0,
    "size": 20
  }
}
```

---

### 2. Get Recent Search History

Get searches from last 30 days.

**Endpoint:**
```http
GET /api/search-history/me/recent?page=0&size=20
Authorization: Bearer {customer_token}
```

**Response:** Same format as above, filtered to last 30 days.

---

### 3. Get Unique Search Queries

Get distinct search queries for autocomplete suggestions.

**Endpoint:**
```http
GET /api/search-history/me/unique-queries
Authorization: Bearer {customer_token}
```

**Response:**
```json
{
  "status": "SUCCESS",
  "data": [
    "fresh vegetables",
    "organic fruits",
    "bread bakery",
    "discount food",
    "near expiry deals"
  ]
}
```

**Use Case:** Display as search suggestions/autocomplete options.

---

### 4. Get Search Count

Get total number of searches performed.

**Endpoint:**
```http
GET /api/search-history/me/count
Authorization: Bearer {customer_token}
```

**Response:**
```json
{
  "status": "SUCCESS",
  "data": 127
}
```

---

### 5. Record a Search

Record a new search query when customer performs search.

**Endpoint:**
```http
POST /api/search-history/record?query=fresh+vegetables
Authorization: Bearer {customer_token}
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | String | Yes | The search query text |

**Response:**
```json
{
  "status": "SUCCESS",
  "data": "Search recorded successfully"
}
```

**Notes:**
- Empty/blank queries are ignored
- Automatically trims whitespace
- Creates timestamp automatically

---

### 6. Delete Specific Search

Delete a single search history entry.

**Endpoint:**
```http
DELETE /api/search-history/{searchId}
Authorization: Bearer {customer_token}
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `searchId` | UUID | The search history ID to delete |

**Response (Success):**
```json
{
  "status": "SUCCESS",
  "data": "Search history deleted successfully"
}
```

**Response (Not Found):**
```json
{
  "status": "ERROR",
  "data": "Search history not found or unauthorized"
}
```

**Authorization:** Can only delete own searches.

---

### 7. Delete All Search History

Clear entire search history for authenticated customer.

**Endpoint:**
```http
DELETE /api/search-history/me/all
Authorization: Bearer {customer_token}
```

**Response:**
```json
{
  "status": "SUCCESS",
  "data": "All search history deleted successfully"
}
```

**Warning:** This action is irreversible!

---

### 8. Delete Old Search History

Delete searches older than specified days.

**Endpoint:**
```http
DELETE /api/search-history/me/old?daysOld=30
Authorization: Bearer {customer_token}
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `daysOld` | int | 30 | Delete searches older than this many days |

**Response:**
```json
{
  "status": "SUCCESS",
  "data": "Search history older than 30 days deleted successfully"
}
```

**Examples:**
- `daysOld=7` - Delete searches older than 1 week
- `daysOld=30` - Delete searches older than 1 month
- `daysOld=90` - Delete searches older than 3 months

---

## Admin Endpoints

### 1. Get Customer Search History (Admin)

View search history for any customer.

**Endpoint:**
```http
GET /api/search-history/customer/{customerId}?page=0&size=20
Authorization: Bearer {admin_token}
```

**Required Roles:** SUPER_ADMIN, MODERATOR, STAFF

**Response:** Same format as customer endpoint.

---

### 2. Get Customer Search Count (Admin)

Get total search count for analytics.

**Endpoint:**
```http
GET /api/search-history/customer/{customerId}/count
Authorization: Bearer {admin_token}
```

**Required Roles:** SUPER_ADMIN, MODERATOR, STAFF

**Response:**
```json
{
  "status": "SUCCESS",
  "data": 87
}
```

---

### 3. Delete Customer Search History (Admin)

Delete all search history for a customer (privacy compliance).

**Endpoint:**
```http
DELETE /api/search-history/customer/{customerId}/all
Authorization: Bearer {admin_token}
```

**Required Roles:** SUPER_ADMIN, MODERATOR

**Response:**
```json
{
  "status": "SUCCESS",
  "data": "Customer search history deleted successfully"
}
```

**Use Cases:**
- GDPR "Right to be Forgotten" requests
- Account deletion cleanup
- Privacy compliance

---

## Integration Guide

### Frontend Integration

#### 1. Recording Searches

**When to record:**
```typescript
// Record search when user submits search form
async function handleSearch(searchQuery: string) {
  // Perform the actual search
  const products = await productService.search(searchQuery);

  // Record the search in history
  try {
    await searchHistoryService.recordSearch(searchQuery);
  } catch (error) {
    // Don't block search if recording fails
    console.error('Failed to record search:', error);
  }

  return products;
}
```

**Don't record:**
- Empty searches
- Autocomplete/suggestions (only record final search)
- Pagination clicks (don't re-record same query)
- Filter changes (unless it changes the search query)

---

#### 2. Display Search History

```typescript
// In customer profile or search page
async function loadSearchHistory() {
  const history = await searchHistoryService.getMySearchHistory(0, 20);

  return history.content.map(item => ({
    id: item.searchId,
    query: item.searchQuery,
    timestamp: formatDate(item.searchedAt),
    onDelete: () => deleteSearch(item.searchId)
  }));
}
```

---

#### 3. Autocomplete with Search History

```typescript
// Search bar autocomplete
async function getSearchSuggestions(partialQuery: string) {
  // Get unique queries from history
  const historyQueries = await searchHistoryService.getUniqueQueries();

  // Filter by partial match
  const suggestions = historyQueries.filter(query =>
    query.toLowerCase().includes(partialQuery.toLowerCase())
  );

  return suggestions.slice(0, 5); // Top 5 suggestions
}
```

**UI Example:**
```
┌─────────────────────────────────┐
│ Search: fre_                    │
├─────────────────────────────────┤
│ 🕐 fresh vegetables             │ ← From history
│ 🕐 fresh fruits                 │ ← From history
│ 🕐 french bread                 │ ← From history
└─────────────────────────────────┘
```

---

#### 4. Delete Search History

**Single delete:**
```typescript
async function deleteSearch(searchId: string) {
  await searchHistoryService.deleteSearchHistory(searchId);
  // Refresh the list
  await loadSearchHistory();
}
```

**Clear all:**
```typescript
async function clearAllHistory() {
  const confirmed = await showConfirmDialog(
    'Are you sure?',
    'This will delete all your search history. This action cannot be undone.'
  );

  if (confirmed) {
    await searchHistoryService.deleteAllSearchHistory();
    showToast('Search history cleared successfully', 'success');
  }
}
```

---

### Backend Integration

#### In Product Search Service

```java
@Service
public class ProductServiceImpl implements ProductService {

    @Autowired
    private SearchHistoryService searchHistoryService;

    @Override
    public Page<Product> searchProducts(String query, String customerId, Pageable pageable) {
        // Perform the search
        Page<Product> products = productRepository.searchByQuery(query, pageable);

        // Record search history for logged-in customers
        if (customerId != null) {
            try {
                searchHistoryService.recordSearch(customerId, query);
            } catch (Exception e) {
                log.error("Failed to record search history", e);
                // Don't fail the search if recording fails
            }
        }

        return products;
    }
}
```

---

## Privacy & Data Retention

### Auto-Cleanup (Optional)

Create a scheduled job to auto-delete old searches:

```java
@Component
public class SearchHistoryCleanupScheduler {

    @Autowired
    private SearchHistoryRepository searchHistoryRepository;

    // Run monthly to delete searches older than 1 year
    @Scheduled(cron = "0 0 0 1 * *") // 1st day of each month at midnight
    public void cleanupOldSearchHistory() {
        LocalDateTime oneYearAgo = LocalDateTime.now().minusYears(1);

        searchHistoryRepository.deleteAll(
            searchHistoryRepository.findAll().stream()
                .filter(s -> s.getSearchedAt().isBefore(oneYearAgo))
                .toList()
        );

        log.info("Cleaned up search history older than 1 year");
    }
}
```

---

### GDPR Compliance

When customer requests account deletion:

```java
@Transactional
public void deleteCustomerAccount(String customerId) {
    // Delete search history
    searchHistoryService.deleteAllSearchHistory(customerId);

    // Delete other customer data...
    customerRepository.deleteById(customerId);
}
```

---

### Privacy Settings (Future Enhancement)

Allow customers to disable search history tracking:

```java
@Entity
public class Customer extends User {
    // ...
    private boolean trackSearchHistory = true; // Default: enabled
}

// In recording logic
public void recordSearch(String customerId, String query) {
    Customer customer = customerRepository.findById(customerId).orElseThrow();

    if (!customer.isTrackSearchHistory()) {
        return; // Don't record if disabled
    }

    // Record search...
}
```

---

## Analytics Use Cases

### Admin Dashboard - Top Searches

```java
@Query("SELECT s.searchQuery, COUNT(s) as count " +
       "FROM SearchHistory s " +
       "WHERE s.searchedAt >= :since " +
       "GROUP BY s.searchQuery " +
       "ORDER BY count DESC")
List<SearchQueryStats> getTopSearchQueries(@Param("since") LocalDateTime since, Pageable pageable);
```

**Dashboard widget:**
```
Top Searches (Last 30 Days)
1. fresh vegetables     (1,234 searches)
2. discount food        (987 searches)
3. near expiry          (756 searches)
4. organic fruits       (623 searches)
5. bakery bread         (541 searches)
```

---

### Search Trends Over Time

```java
@Query("SELECT DATE(s.searchedAt) as date, COUNT(s) as count " +
       "FROM SearchHistory s " +
       "WHERE s.searchedAt >= :since " +
       "GROUP BY DATE(s.searchedAt) " +
       "ORDER BY date")
List<DailySearchCount> getSearchTrends(@Param("since") LocalDateTime since);
```

---

## Error Handling

### Common Errors

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `USER_NOT_FOUND` | 404 | Customer not found |
| `SEARCH_NOT_FOUND` | 404 | Search history entry not found |
| `UNAUTHORIZED` | 403 | Trying to delete someone else's search |

### Example Error Response

```json
{
  "status": "ERROR",
  "message": "Search history not found",
  "errorCode": "SEARCH_NOT_FOUND",
  "timestamp": "2025-11-02T15:30:00"
}
```

---

## Best Practices

### For Frontend Developers

1. ✅ **Record after search completes** - Don't record failed searches
2. ✅ **Handle failures gracefully** - Don't block search if recording fails
3. ✅ **Debounce autocomplete** - Don't record every keystroke
4. ✅ **Confirm destructive actions** - Ask before clearing all history
5. ✅ **Show timestamps** - Display when searches were performed

### For Backend Developers

1. ✅ **Validate input** - Trim and validate search queries
2. ✅ **Handle nulls** - Ignore empty/null queries
3. ✅ **Use pagination** - Don't return all history at once
4. ✅ **Index properly** - Add indexes on (customer_id, searched_at)
5. ✅ **Log errors** - Log but don't fail main operations

---

## Testing

### Unit Tests

```java
@Test
public void testRecordSearch() {
    // Given
    String customerId = "customer-123";
    String query = "fresh vegetables";

    // When
    searchHistoryService.recordSearch(customerId, query);

    // Then
    List<SearchHistory> history = searchHistoryRepository
        .findByCustomerUserIdOrderBySearchedAtDesc(customerId);

    assertEquals(1, history.size());
    assertEquals(query, history.get(0).getSearchQuery());
}

@Test
public void testDeleteSearchHistory() {
    // Given
    SearchHistory search = createTestSearch();
    String searchId = search.getSearchId();
    String customerId = search.getCustomer().getUserId();

    // When
    boolean deleted = searchHistoryService.deleteSearchHistory(searchId, customerId);

    // Then
    assertTrue(deleted);
    assertFalse(searchHistoryRepository.existsById(searchId));
}
```

---

## Performance Considerations

### Indexing Strategy

```sql
-- Primary index for pagination
CREATE INDEX idx_customer_searched_at ON search_histories(customer_id, searched_at DESC);

-- For distinct query lookups
CREATE INDEX idx_customer_query ON search_histories(customer_id, search_query);

-- For analytics
CREATE INDEX idx_searched_at ON search_histories(searched_at);
```

### Pagination

Always use pagination for search history:
- Default: 20 items per page
- Max: 100 items per page
- Never load all history at once

---

## Summary

### Endpoints Overview

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/me` | CUSTOMER | Get my search history |
| GET | `/me/recent` | CUSTOMER | Get recent searches (30 days) |
| GET | `/me/unique-queries` | CUSTOMER | Get distinct queries |
| GET | `/me/count` | CUSTOMER | Get total search count |
| POST | `/record` | CUSTOMER | Record a new search |
| DELETE | `/{searchId}` | CUSTOMER | Delete specific search |
| DELETE | `/me/all` | CUSTOMER | Delete all my searches |
| DELETE | `/me/old` | CUSTOMER | Delete old searches |
| GET | `/customer/{id}` | ADMIN | View customer searches |
| GET | `/customer/{id}/count` | ADMIN | Customer search count |
| DELETE | `/customer/{id}/all` | ADMIN | Delete customer searches |

---

**Last Updated**: 2025-11-02
**Version**: 1.0.0
**Author**: SaveFood Development Team
