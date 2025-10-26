# SKU Auto-Generation System

## Overview

The system automatically generates unique SKU (Stock Keeping Unit) codes for all ProductVariants when products are created. SKUs are no longer provided by users in the request.

## SKU Format

```
{SUPPLIER_CODE}-{CATEGORY_CODE}-{PRODUCT_ABBR}-{VARIANT_ABBR}-{UNIQUE_SUFFIX}
```

### Example SKUs

- `SUP1234-BEV-CCO-B15L-5678`
  - SUP1234: Supplier code (from tax code)
  - BEV: Beverages category
  - CCO: Coca Cola (product)
  - B15L: Bottle 1.5L (variant)
  - 5678: Random 4-digit unique suffix

- `SUP5678-FF-PIZZA-SM-1234`
  - SUP5678: Supplier code
  - FF: Fast Food category
  - PIZZA: Pizza product
  - SM: Size M (variant)
  - 1234: Random 4-digit unique suffix

## Components Breakdown

### 1. Supplier Code (Max 7 chars)
- **Format**: `SUP` + first 4 digits of tax code
- **Example**: Tax code "0123456789" → `SUP0123`
- **Fallback**: If no tax code, uses last 4 chars of user ID → `SUP` + userId substring

### 2. Category Code (Max 4 chars)
- **Single word**: Takes first 3-4 characters
  - "Beverages" → `BEV`
  - "Dairy" → `DAIR`
- **Multiple words**: Takes first letter of each word
  - "Fast Food" → `FF`
  - "Frozen Vegetables" → `FV`

### 3. Product Abbreviation (Max 5 chars)
- **Single word**: Consonants + vowels strategy
  - "Milk" → `MLK`
  - "Bread" → `BRD`
- **Multiple words**: First letter of each word
  - "Coca Cola Original" → `CCO`
  - "Apple Juice" → `AJ`

### 4. Variant Abbreviation (Max 6 chars)
Handles different variant types intelligently:

- **Size variants**:
  - "Size M" → `SM`
  - "Size Large" → `SL`

- **Volume/Weight variants**:
  - "Bottle 1.5L" → `B15L` (combines letter + number + unit)
  - "Can 330ml" → `C330M`
  - "Pack 500g" → `P500G`

- **Color variants**:
  - "Red Color" → `RC`
  - "Blue" → `BLUE`

- **Flavor variants**:
  - "Strawberry" → `STRW`
  - "Chocolate" → `CHCLT`

### 5. Unique Suffix (4 digits)
- Random 4-digit number (1000-9999)
- Ensures uniqueness even for identical product/variant combinations
- Automatically retries if collision detected

## Implementation Details

### File: `SkuGenerator.java`

Location: `/backend/src/main/java/com/example/backend/utils/SkuGenerator.java`

**Main Method:**
```java
public static String generateSku(Product product, String variantName)
```

**Features:**
- Vietnamese text normalization (removes accents)
- Intelligent word abbreviation
- Special handling for numbers and units
- Consistent uppercase formatting

### File: `ProductServiceImpl.java`

Location: `/backend/src/main/java/com/example/backend/service/impl/ProductServiceImpl.java`

**Method:** `generateUniqueSku()`

**Duplicate Handling:**
1. Generate SKU using `SkuGenerator.generateSku()`
2. Check database: `productVariantRepository.existsBySku(sku)`
3. If exists, retry with new random suffix
4. Max 10 attempts before throwing exception
5. Logs warnings on collisions for monitoring

**Code Flow:**
```java
private String generateUniqueSku(Product product, String variantName) {
    String sku;
    int attempts = 0;
    int maxAttempts = 10;

    do {
        sku = SkuGenerator.generateSku(product, variantName);

        if (!productVariantRepository.existsBySku(sku)) {
            return sku; // Unique SKU found
        }

        log.warn("SKU collision detected: {}. Retrying...", sku);
        attempts++;
        Thread.sleep(1); // Ensure different random seed

    } while (attempts < maxAttempts);

    throw new BadRequestException("Failed to generate unique SKU");
}
```

## Request/Response Changes

### ProductVariantRequest (DTO)

**REMOVED:**
```java
@NotBlank(message = "SKU is required")
private String sku;
```

**Current Structure:**
```json
{
  "name": "Bottle 1.5L",
  "originalPrice": 25000,
  "discountPrice": 20000,
  "manufacturingDate": "2025-01-15",
  "expiryDate": "2025-03-15"
}
```

### Product Creation Request Example

```json
{
  "product": {
    "name": "Coca Cola Original",
    "description": "Refreshing cola drink",
    "categoryId": "category-uuid-123"
  },
  "variants": [
    {
      "name": "Bottle 1.5L",
      "originalPrice": 25000,
      "discountPrice": 20000,
      "manufacturingDate": "2025-01-15",
      "expiryDate": "2025-03-15"
    },
    {
      "name": "Can 330ml",
      "originalPrice": 12000,
      "discountPrice": 10000,
      "manufacturingDate": "2025-01-15",
      "expiryDate": "2025-03-15"
    }
  ],
  "images": [...],
  "attributes": [...],
  "storeInventory": [...]
}
```

### Product Creation Response

```json
{
  "status": "SUCCESS",
  "data": {
    "productId": "prod-uuid-456",
    "name": "Coca Cola Original",
    "variants": [
      {
        "variantId": "var-uuid-789",
        "name": "Bottle 1.5L",
        "sku": "SUP1234-BEV-CCO-B15L-5678",  // Auto-generated
        "originalPrice": 25000,
        "discountPrice": 20000
      },
      {
        "variantId": "var-uuid-012",
        "name": "Can 330ml",
        "sku": "SUP1234-BEV-CCO-C330M-9012",  // Auto-generated
        "originalPrice": 12000,
        "discountPrice": 10000
      }
    ]
  }
}
```

## Benefits

1. **Consistency**: All SKUs follow the same format
2. **Uniqueness**: Automatic collision detection and retry mechanism
3. **Readability**: SKUs are human-readable and contain meaningful information
4. **Traceability**: Can identify supplier, category, product from SKU
5. **Automation**: No manual SKU management needed
6. **Internationalization**: Handles Vietnamese product names with accent removal

## Error Handling

### Scenarios

**SKU Collision (Rare):**
```
WARN - SKU collision detected: SUP1234-BEV-CCO-B15L-5678. Retrying... (attempt 1/10)
INFO - Generated unique SKU: SUP1234-BEV-CCO-B15L-7890 for variant: Bottle 1.5L
```

**Max Attempts Exceeded (Extremely Rare):**
```
ERROR - Failed to generate unique SKU after 10 attempts. Please try again.
HTTP 400 - "Failed to generate unique SKU after 10 attempts. Please try again."
```

## Testing Examples

### Test Case 1: Single Word Product
**Input:**
- Product: "Milk"
- Category: "Dairy"
- Variant: "1L"

**Expected SKU:** `SUP1234-DAIR-MLK-V1L-5678`

### Test Case 2: Multi-Word Product
**Input:**
- Product: "Fresh Orange Juice"
- Category: "Beverages"
- Variant: "Bottle 2L"

**Expected SKU:** `SUP1234-BEV-FOJ-B2L-5678`

### Test Case 3: Vietnamese Product
**Input:**
- Product: "Bánh mì thịt" (Vietnamese sandwich)
- Category: "Thức ăn nhanh" (Fast food)
- Variant: "Size lớn" (Large size)

**Expected SKU:** `SUP1234-TAN-BMT-SL-5678`
(Accents removed: "Banh mi thit", "Thuc an nhanh", "Size lon")

## Monitoring & Logging

The system logs the following events:

1. **Successful SKU Generation:**
   ```
   INFO - Generated unique SKU: SUP1234-BEV-CCO-B15L-5678 for variant: Bottle 1.5L
   ```

2. **SKU Collision (Warning):**
   ```
   WARN - SKU collision detected: SUP1234-BEV-CCO-B15L-5678. Retrying... (attempt 1/10)
   ```

3. **Product Creation:**
   ```
   INFO - Product saved successfully with ID: prod-uuid-456
   INFO - Product created successfully: Coca Cola Original with 2 variants and 3 attributes
   ```

## Future Enhancements

1. **Analytics Dashboard**: Track SKU patterns and collision rates
2. **Custom Rules**: Allow admin to configure SKU format per category
3. **Batch Import**: Generate SKUs for bulk product imports
4. **SKU Validation**: API endpoint to validate/preview SKU before creation
5. **Smart Abbreviations**: ML-based abbreviation learning from existing products
