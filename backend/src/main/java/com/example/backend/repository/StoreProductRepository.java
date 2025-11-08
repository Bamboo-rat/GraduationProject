package com.example.backend.repository;

import com.example.backend.entity.StoreProduct;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

@Repository
public interface StoreProductRepository extends JpaRepository<StoreProduct, String> {

    // Find by store and variant
    Optional<StoreProduct> findByStoreStoreIdAndVariantVariantId(String storeStoreId, String variantVariantId);

    // Find all inventory for a store (without pagination - used for internal operations)
    List<StoreProduct> findAllByStoreStoreId(String storeStoreId);

    // Find all stores that have a specific variant
    List<StoreProduct> findByVariantVariantId(String variantVariantId);

    // Check if store has variant
    boolean existsByStoreStoreIdAndVariantVariantId(String storeStoreId, String variantVariantId);

    /**
     * Find all StoreProduct records for a specific store with pagination
     * Uses Spring Data JPA derived query method - simplest and safest approach
     * The @Transactional in service layer ensures lazy loading works properly
     */
    Page<StoreProduct> findByStoreStoreId(String storeId, Pageable pageable);

    /**
     * Find all StoreProduct records for a specific store with core relationships eagerly loaded
     * Uses JOIN FETCH to prevent LazyInitializationException
     * Loads: variant -> product -> category (no collections to avoid Cartesian product)
     * Note: DISTINCT is needed when using JOIN FETCH with pagination
     */
    @Query(value = "SELECT DISTINCT sp FROM StoreProduct sp " +
            "JOIN FETCH sp.variant v " +
            "JOIN FETCH v.product p " +
            "LEFT JOIN FETCH p.category " +
            "WHERE sp.store.storeId = :storeId",
            countQuery = "SELECT COUNT(DISTINCT sp) FROM StoreProduct sp WHERE sp.store.storeId = :storeId")
    Page<StoreProduct> findByStoreStoreIdWithDetails(@Param("storeId") String storeId, Pageable pageable);

    /**
     * Find StoreProduct IDs for a store (for pagination)
     * This is used for the two-query approach to avoid JOIN FETCH + pagination issues
     * Supports sorting by StoreProduct fields: createdAt, updatedAt, stockQuantity, priceOverride
     */
    @Query("SELECT sp.storeProductId FROM StoreProduct sp WHERE sp.store.storeId = :storeId")
    Page<String> findIdsByStoreId(@Param("storeId") String storeId, Pageable pageable);

    /**
     * Find StoreProducts by IDs with all relationships loaded
     * This is the second query in the two-query approach
     * Note: Does not include ORDER BY - sorting is preserved in service layer
     * by reordering results based on the input ID list order from Query 1
     */
    @Query("SELECT sp FROM StoreProduct sp " +
            "JOIN FETCH sp.variant v " +
            "JOIN FETCH v.product p " +
            "LEFT JOIN FETCH p.category " +
            "WHERE sp.storeProductId IN :ids")
    List<StoreProduct> findByIdsWithDetails(@Param("ids") List<String> ids);

    /**
     * Find products with highest discount percentage
     * Only returns products from ACTIVE stores with positive stock
     */
    @Query("SELECT sp FROM StoreProduct sp " +
           "JOIN FETCH sp.variant v " +
           "JOIN FETCH v.product p " +
           "LEFT JOIN FETCH p.category " +
           "JOIN FETCH sp.store s " +
           "WHERE s.status = 'ACTIVE' " +
           "AND p.status = 'ACTIVE' " +
           "AND sp.stockQuantity > 0 " +
           "AND v.discountPrice IS NOT NULL " +
           "AND v.originalPrice > v.discountPrice " +
            "ORDER BY ((v.originalPrice - v.discountPrice) / v.originalPrice) DESC, " +
            "p.name ASC")
    List<StoreProduct> findProductsWithHighestDiscount(Pageable pageable);

    /**
     * Find new products on sale today (created today with discount)
     */
    @Query("SELECT sp FROM StoreProduct sp " +
           "JOIN FETCH sp.variant v " +
           "JOIN FETCH v.product p " +
           "LEFT JOIN FETCH p.category " +
           "JOIN FETCH sp.store s " +
           "WHERE s.status = 'ACTIVE' " +
           "AND p.status = 'ACTIVE' " +
           "AND sp.stockQuantity > 0 " +
           "AND FUNCTION('DATE', p.createdAt) = CURRENT_DATE " +
           "AND v.discountPrice IS NOT NULL " +
           "AND v.originalPrice > v.discountPrice " +
           "ORDER BY p.createdAt DESC")
    List<StoreProduct> findNewProductsOnSaleToday(Pageable pageable);

       /**
        * Fetch a StoreProduct with a pessimistic write lock for stock update scenarios
        */
       @Lock(LockModeType.PESSIMISTIC_WRITE)
       @Query("SELECT sp FROM StoreProduct sp WHERE sp.storeProductId = :id")
       Optional<StoreProduct> findByStoreProductIdForUpdate(@Param("id") String id);

    /**
     * Count low stock products (stock quantity < threshold)
     */
    @Query("SELECT COUNT(DISTINCT p.productId) FROM StoreProduct sp " +
           "JOIN sp.variant v " +
           "JOIN v.product p " +
           "WHERE p.status = 'ACTIVE' " +
           "AND sp.stockQuantity > 0 " +
           "AND sp.stockQuantity < :threshold")
    Long countLowStockProducts(@Param("threshold") int threshold);

    /**
     * Count out of stock products
     */
    @Query("SELECT COUNT(DISTINCT p.productId) FROM StoreProduct sp " +
           "JOIN sp.variant v " +
           "JOIN v.product p " +
           "WHERE p.status = 'ACTIVE' " +
           "AND sp.stockQuantity = 0")
    Long countOutOfStockProducts();

    /**
     * Count active products
     */
    @Query("SELECT COUNT(DISTINCT p.productId) FROM StoreProduct sp " +
           "JOIN sp.variant v " +
           "JOIN v.product p " +
           "WHERE p.status = 'ACTIVE'")
    Long countActiveProducts();

       /**
        * Find StoreProduct IDs for a store filtered by category and availability (for mobile customers)
        * Availability rules:
        *  - Store is ACTIVE
        *  - Product is ACTIVE
        *  - Stock quantity > 0 at this store
        *  - Variant not expired (expiry is null or >= today)
        */
       @Query(value = "SELECT sp.storeProductId FROM StoreProduct sp " +
                     "JOIN sp.variant v " +
                     "JOIN v.product p " +
                     "JOIN sp.store s " +
                     "WHERE s.storeId = :storeId " +
                     "AND s.status = 'ACTIVE' " +
                     "AND p.status = 'ACTIVE' " +
                     "AND p.category.categoryId = :categoryId " +
                     "AND sp.stockQuantity > 0 " +
                     "AND (v.expiryDate IS NULL OR v.expiryDate >= CURRENT_DATE)",
                     countQuery = "SELECT COUNT(sp) FROM StoreProduct sp " +
                                   "JOIN sp.variant v " +
                                   "JOIN v.product p " +
                                   "JOIN sp.store s " +
                                   "WHERE s.storeId = :storeId " +
                                   "AND s.status = 'ACTIVE' " +
                                   "AND p.status = 'ACTIVE' " +
                                   "AND p.category.categoryId = :categoryId " +
                                   "AND sp.stockQuantity > 0 " +
                                   "AND (v.expiryDate IS NULL OR v.expiryDate >= CURRENT_DATE)")
       Page<String> findAvailableIdsByStoreIdAndCategoryId(@Param("storeId") String storeId,
                                                                                                  @Param("categoryId") String categoryId,
                                                                                                  Pageable pageable);

    // ==================== WASTE REPORT QUERIES ====================

    /**
     * Find unsold inventory (products with stock remaining)
     * Returns detailed inventory for waste tracking
     */
    @Query("""
        SELECT
            p.productId,
            p.name as productName,
            v.variantId,
            v.name as variantName,
            c.name as categoryName,
            sup.businessName as supplierName,
            s.storeName,
            sp.stockQuantity,
            sp.initialStock,
            v.expiryDate,
            v.originalPrice,
            v.discountPrice,
            p.status
        FROM StoreProduct sp
        JOIN sp.variant v
        JOIN v.product p
        JOIN sp.store s
        JOIN s.supplier sup
        LEFT JOIN p.category c
        WHERE sp.stockQuantity > 0
            AND p.status != com.example.backend.entity.enums.ProductStatus.SOLD_OUT
        ORDER BY v.expiryDate ASC NULLS LAST
    """)
    List<Object[]> findUnsoldInventory();

    /**
     * Find waste metrics by category
     */
    @Query("""
        SELECT
            c.categoryId,
            c.name as categoryName,
            c.imageUrl,
            COUNT(DISTINCT p.productId) as totalProducts,
            COUNT(DISTINCT CASE WHEN sp.stockQuantity > 0 THEN p.productId END) as unsoldProducts,
            COUNT(DISTINCT CASE WHEN v.expiryDate < CURRENT_DATE THEN p.productId END) as expiredProducts,
            COUNT(DISTINCT CASE WHEN v.expiryDate BETWEEN CURRENT_DATE AND CURRENT_DATE + 7 THEN p.productId END) as nearExpiryProducts,
            SUM(sp.stockQuantity) as totalStockQuantity,
            SUM(CASE WHEN sp.stockQuantity > 0 THEN sp.stockQuantity ELSE 0 END) as unsoldQuantity,
            SUM(CASE WHEN v.expiryDate < CURRENT_DATE THEN sp.stockQuantity ELSE 0 END) as expiredQuantity,
            SUM(sp.stockQuantity * v.originalPrice) as totalStockValue,
            SUM(CASE WHEN sp.stockQuantity > 0 THEN sp.stockQuantity * v.originalPrice ELSE 0 END) as unsoldValue
        FROM StoreProduct sp
        JOIN sp.variant v
        JOIN v.product p
        LEFT JOIN p.category c
        WHERE c IS NOT NULL
        GROUP BY c.categoryId, c.name, c.imageUrl
        ORDER BY unsoldValue DESC
    """)
    List<Object[]> findWasteByCategory();

    /**
     * Find waste metrics by supplier
     */
    @Query("""
        SELECT
            sup.userId as supplierId,
            sup.businessName as supplierName,
            sup.avatarUrl,
            COUNT(DISTINCT p.productId) as totalProducts,
            COUNT(DISTINCT CASE WHEN p.status = com.example.backend.entity.enums.ProductStatus.ACTIVE THEN p.productId END) as activeProducts,
            COUNT(DISTINCT CASE WHEN sp.stockQuantity > 0 THEN p.productId END) as unsoldProducts,
            COUNT(DISTINCT CASE WHEN v.expiryDate < CURRENT_DATE THEN p.productId END) as expiredProducts,
            COUNT(DISTINCT s.storeId) as totalStores,
            COUNT(DISTINCT CASE WHEN s.status = com.example.backend.entity.enums.StoreStatus.ACTIVE THEN s.storeId END) as activeStores,
            SUM(sp.stockQuantity) as totalStockQuantity,
            SUM(sp.initialStock - sp.stockQuantity) as soldQuantity,
            SUM(CASE WHEN sp.stockQuantity > 0 THEN sp.stockQuantity ELSE 0 END) as unsoldQuantity,
            SUM(CASE WHEN v.expiryDate < CURRENT_DATE THEN sp.stockQuantity ELSE 0 END) as expiredQuantity
        FROM StoreProduct sp
        JOIN sp.variant v
        JOIN v.product p
        JOIN sp.store s
        JOIN s.supplier sup
        GROUP BY sup.userId, sup.businessName, sup.avatarUrl
        ORDER BY unsoldQuantity DESC
    """)
    List<Object[]> findWasteBySupplier();

    /**
     * Get waste summary statistics
     */
    @Query("""
        SELECT
            COUNT(DISTINCT p.productId) as totalProducts,
            COUNT(DISTINCT CASE WHEN p.status = com.example.backend.entity.enums.ProductStatus.ACTIVE THEN p.productId END) as activeProducts,
            COUNT(DISTINCT CASE WHEN p.status = com.example.backend.entity.enums.ProductStatus.SOLD_OUT THEN p.productId END) as soldOutProducts,
            COUNT(DISTINCT CASE WHEN v.expiryDate < CURRENT_DATE THEN p.productId END) as expiredProducts,
            COUNT(DISTINCT CASE WHEN v.expiryDate BETWEEN CURRENT_DATE AND CURRENT_DATE + 7 THEN p.productId END) as nearExpiryProducts,
            SUM(sp.stockQuantity) as totalStockQuantity,
            SUM(sp.initialStock - sp.stockQuantity) as soldQuantity,
            SUM(CASE WHEN sp.stockQuantity > 0 THEN sp.stockQuantity ELSE 0 END) as unsoldQuantity,
            SUM(CASE WHEN v.expiryDate < CURRENT_DATE THEN sp.stockQuantity ELSE 0 END) as expiredQuantity,
            SUM(sp.stockQuantity * v.originalPrice) as totalStockValue,
            SUM((sp.initialStock - sp.stockQuantity) * v.discountPrice) as soldValue,
            SUM(CASE WHEN sp.stockQuantity > 0 THEN sp.stockQuantity * v.originalPrice ELSE 0 END) as unsoldValue,
            SUM(CASE WHEN v.expiryDate < CURRENT_DATE THEN sp.stockQuantity * v.originalPrice ELSE 0 END) as wasteValue
        FROM StoreProduct sp
        JOIN sp.variant v
        JOIN v.product p
    """)
    Object[] findWasteSummary();
}
