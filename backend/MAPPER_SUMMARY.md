# MapStruct Mapper Summary

This document lists all MapStruct mappers in the SaveFood backend application.

## Overview

MapStruct is used for entity-to-DTO conversions throughout the application. All mappers use `@Mapper(componentModel = "spring")` for Spring dependency injection.

---

## Existing Mappers

### 1. AdminMapper

**File**: `/backend/src/main/java/com/example/backend/mapper/AdminMapper.java`

**Purpose**: Convert Admin entity to AdminResponse DTO

**Methods**:
- `AdminResponse toResponse(Admin admin)` - Single entity conversion
- `List<AdminResponse> toResponseList(List<Admin> admins)` - List conversion

**Custom Mappings**:
- `roleToString()` - Converts Role enum to String
- `adminStatusToString()` - Converts AdminStatus enum to String

**Usage**:
```java
@Autowired
private AdminMapper adminMapper;

AdminResponse response = adminMapper.toResponse(admin);
```

---

### 2. CustomerMapper

**File**: `/backend/src/main/java/com/example/backend/mapper/CustomerMapper.java`

**Purpose**: Convert Customer entity to CustomerResponse DTO

**Methods**:
- `CustomerResponse toResponse(Customer customer)` - Single entity conversion
- `List<CustomerResponse> toResponseList(List<Customer> customers)` - List conversion

**Custom Mappings**:
- Handles customer-specific fields (tier, totalPoints, membershipStartDate)

---

### 3. SupplierMapper

**File**: `/backend/src/main/java/com/example/backend/mapper/SupplierMapper.java`

**Purpose**: Convert Supplier entity to SupplierResponse DTO and handle profile updates

**Methods**:
- `SupplierResponse toResponse(Supplier supplier)` - Full supplier info
- `SupplierResponse toPublicResponse(Supplier supplier)` - Public-facing supplier info (hides sensitive data)
- `List<SupplierResponse> toResponseList(List<Supplier> suppliers)` - List conversion
- `void updateBankInfo(@MappingTarget Supplier supplier, SupplierBankUpdateRequest request)` - Update bank details
- `void updateCommissionRate(@MappingTarget Supplier supplier, SupplierCommissionUpdateRequest request)` - Update commission

**Custom Mappings**:
- Excludes sensitive fields in `toPublicResponse()` (e.g., tax code, bank info)

**Usage**:
```java
// Full info (admin only)
SupplierResponse fullInfo = supplierMapper.toResponse(supplier);

// Public info (customer-facing)
SupplierResponse publicInfo = supplierMapper.toPublicResponse(supplier);

// Update bank info
supplierMapper.updateBankInfo(supplier, bankRequest);
```

---

### 4. CategoryMapper ✨ (NEW)

**File**: `/backend/src/main/java/com/example/backend/mapper/CategoryMapper.java`

**Purpose**: Convert Category entity to CategoryResponse DTO

**Methods**:
- `CategoryResponse toResponse(Category category)` - Single entity conversion
- `List<CategoryResponse> toResponseList(List<Category> categories)` - List conversion

**Custom Mappings**:
- `productCount` - Computed from `category.getProducts().size()`

**Usage**:
```java
@Autowired
private CategoryMapper categoryMapper;

CategoryResponse response = categoryMapper.toResponse(category);
```

**Implementation**:
```java
@Mapper(componentModel = "spring")
public interface CategoryMapper {
    @Mapping(target = "productCount", expression = "java(category.getProducts() != null ? category.getProducts().size() : 0)")
    CategoryResponse toResponse(Category category);

    List<CategoryResponse> toResponseList(List<Category> categories);
}
```

---

### 5. PromotionMapper ✨ (NEW)

**File**: `/backend/src/main/java/com/example/backend/mapper/PromotionMapper.java`

**Purpose**: Convert Promotion entity to PromotionResponse DTO with computed fields

**Methods**:
- `PromotionResponse toResponse(Promotion promotion)` - Single entity conversion with computed fields
- `List<PromotionResponse> toResponseList(List<Promotion> promotions)` - List conversion

**Custom Mappings**:
- `isActive` - Computed: status=ACTIVE AND current date within start/end dates
- `isExpired` - Computed: current date is after end date

**Helper Methods**:
- `boolean isPromotionActive(Promotion promotion)` - Check if promotion is currently active
- `boolean isPromotionExpired(Promotion promotion)` - Check if promotion has expired

**Usage**:
```java
@Autowired
private PromotionMapper promotionMapper;

PromotionResponse response = promotionMapper.toResponse(promotion);
// response.isActive() = true if status=ACTIVE and within date range
// response.isExpired() = true if endDate < today
```

**Implementation**:
```java
@Mapper(componentModel = "spring")
public interface PromotionMapper {
    @Mapping(target = "isActive", expression = "java(isPromotionActive(promotion))")
    @Mapping(target = "isExpired", expression = "java(isPromotionExpired(promotion))")
    PromotionResponse toResponse(Promotion promotion);

    List<PromotionResponse> toResponseList(List<Promotion> promotions);

    default boolean isPromotionActive(Promotion promotion) {
        LocalDate today = LocalDate.now();
        return promotion.getStatus() == PromotionStatus.ACTIVE &&
               !promotion.getStartDate().isAfter(today) &&
               !promotion.getEndDate().isBefore(today);
    }

    default boolean isPromotionExpired(Promotion promotion) {
        return promotion.getEndDate().isBefore(LocalDate.now());
    }
}
```

---

## Mapper Configuration

All mappers are configured in `pom.xml` with Lombok compatibility:

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-compiler-plugin</artifactId>
    <version>3.11.0</version>
    <configuration>
        <annotationProcessorPaths>
            <!-- Lombok must be first -->
            <path>
                <groupId>org.projectlombok</groupId>
                <artifactId>lombok</artifactId>
                <version>${lombok.version}</version>
            </path>
            <!-- Lombok-MapStruct binding -->
            <path>
                <groupId>org.projectlombok</groupId>
                <artifactId>lombok-mapstruct-binding</artifactId>
                <version>0.2.0</version>
            </path>
            <!-- MapStruct must be last -->
            <path>
                <groupId>org.mapstruct</groupId>
                <artifactId>mapstruct-processor</artifactId>
                <version>${mapstruct.version}</version>
            </path>
        </annotationProcessorPaths>
    </configuration>
</plugin>
```

---

## Common Patterns

### 1. Simple Entity-to-DTO Conversion

```java
@Mapper(componentModel = "spring")
public interface EntityMapper {
    EntityResponse toResponse(Entity entity);
    List<EntityResponse> toResponseList(List<Entity> entities);
}
```

### 2. With Computed Fields

```java
@Mapper(componentModel = "spring")
public interface EntityMapper {
    @Mapping(target = "computedField", expression = "java(calculateValue(entity))")
    EntityResponse toResponse(Entity entity);

    default int calculateValue(Entity entity) {
        // Custom logic
        return entity.getItems().size();
    }
}
```

### 3. With Enum Conversion

```java
@Mapper(componentModel = "spring")
public interface EntityMapper {
    @Mapping(target = "status", source = "status", qualifiedByName = "statusToString")
    EntityResponse toResponse(Entity entity);

    @Named("statusToString")
    default String statusToString(Status status) {
        return status != null ? status.name() : null;
    }
}
```

### 4. With Update Methods

```java
@Mapper(componentModel = "spring")
public interface EntityMapper {
    EntityResponse toResponse(Entity entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    void updateEntity(@MappingTarget Entity entity, UpdateRequest request);
}
```

---

## Benefits of Using MapStruct

1. **Type Safety**: Compile-time checking of mappings
2. **Performance**: No reflection, pure Java method calls
3. **Maintainability**: Automatic updates when entity/DTO fields change
4. **Lombok Integration**: Works seamlessly with Lombok's `@Data`, `@Builder`, etc.
5. **Custom Logic**: Supports complex mapping with custom methods
6. **Spring Integration**: Mappers are Spring beans, can be autowired

---

## Best Practices

1. **Always use `componentModel = "spring"`** for Spring DI
2. **Use `expression` for complex computed fields** (like productCount, isActive)
3. **Use `@Named` methods for reusable conversions** (like enum to string)
4. **Use `@MappingTarget` for update operations** to modify existing entities
5. **Create separate methods for public vs private responses** (like `toPublicResponse()`)
6. **Always handle null checks** in custom mapping methods
7. **Use `ignore = true`** for fields that shouldn't be mapped in updates

---

## Testing Mappers

### Unit Test Example

```java
@SpringBootTest
class CategoryMapperTest {

    @Autowired
    private CategoryMapper categoryMapper;

    @Test
    void testToResponse() {
        // Given
        Category category = new Category();
        category.setCategoryId("123");
        category.setName("Vegetables");
        category.setActive(true);
        category.setProducts(List.of(new Product(), new Product()));

        // When
        CategoryResponse response = categoryMapper.toResponse(category);

        // Then
        assertEquals("123", response.getCategoryId());
        assertEquals("Vegetables", response.getName());
        assertTrue(response.isActive());
        assertEquals(2, response.getProductCount());
    }
}
```

---

## Troubleshooting

### Issue: Mapper not found / Cannot autowire

**Solution**:
1. Run `mvn clean compile` to regenerate mappers
2. Check `@Mapper(componentModel = "spring")` is present
3. Verify annotation processors are configured in `pom.xml`

### Issue: Computed field returns null

**Solution**:
1. Check null safety in custom mapping methods
2. Use ternary operator: `entity.getItems() != null ? entity.getItems().size() : 0`

### Issue: Circular reference error

**Solution**:
1. Use `@Mapping(target = "childEntity", ignore = true)` to break cycles
2. Create separate DTOs for parent and child to avoid bidirectional mapping

---

## Summary

| Mapper | Entity | Response DTO | Special Features |
|--------|--------|--------------|------------------|
| AdminMapper | Admin | AdminResponse | Enum converters |
| CustomerMapper | Customer | CustomerResponse | Tier/points fields |
| SupplierMapper | Supplier | SupplierResponse | Public/private responses, update methods |
| CategoryMapper | Category | CategoryResponse | Product count computation |
| PromotionMapper | Promotion | PromotionResponse | Active/expired computation |

**Total Mappers**: 5
**Total Methods**: 18+
