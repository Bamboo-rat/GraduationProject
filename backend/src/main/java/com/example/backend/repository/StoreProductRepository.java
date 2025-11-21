package com.example.backend.repository;

import com.example.backend.entity.StoreProduct;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

@Repository
public interface StoreProductRepository extends JpaRepository<StoreProduct, String> {

    // Find by store and variant
    Optional<StoreProduct> findByStoreStoreIdAndVariantVariantId(String storeStoreId, String variantVariantId);

    // Find all inventory for a store (without pagination - used for internal
    // operations)
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
     * Find all StoreProduct records for a specific store with core relationships
     * eagerly loaded
     * Uses JOIN FETCH to prevent LazyInitializationException
     * Loads: variant -> product -> category (no collections to avoid Cartesian
     * product)
     * Note: DISTINCT is needed when using JOIN FETCH with pagination
     */
    @Query(value = "SELECT DISTINCT sp FROM StoreProduct sp " +
            "JOIN FETCH sp.variant v " +
            "JOIN FETCH v.product p " +
            "LEFT JOIN FETCH p.category " +
            "WHERE sp.store.storeId = :storeId", countQuery = "SELECT COUNT(DISTINCT sp) FROM StoreProduct sp WHERE sp.store.storeId = :storeId")
    Page<StoreProduct> findByStoreStoreIdWithDetails(@Param("storeId") String storeId, Pageable pageable);

    /**
     * Find StoreProduct IDs for a store (for pagination)
     * This is used for the two-query approach to avoid JOIN FETCH + pagination
     * issues
     * Supports sorting by StoreProduct fields: createdAt, updatedAt, stockQuantity,
     * priceOverride
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
     * Count low stock products for a specific store
     */
    @Query("SELECT COUNT(sp) FROM StoreProduct sp WHERE sp.store.storeId = :storeId AND sp.stockQuantity > 0 AND sp.stockQuantity <= :threshold")
    long countLowStockProductsByStore(@Param("storeId") String storeId, @Param("threshold") int threshold);

    /**
     * Count expiring products for a specific store
     */
    @Query("SELECT COUNT(sp) FROM StoreProduct sp JOIN sp.variant v WHERE sp.store.storeId = :storeId AND v.expiryDate IS NOT NULL AND v.expiryDate <= :expiryThreshold")
    long countExpiringProductsByStore(@Param("storeId") String storeId, @Param("expiryThreshold") java.time.LocalDate expiryThreshold);

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
     * Find StoreProduct IDs for a store filtered by category and availability (for
     * mobile customers)
     * Availability rules:
     * - Store is ACTIVE
     * - Product is ACTIVE
     * - Stock quantity > 0 at this store
     * - Variant not expired (expiry is null or >= today)
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
            "AND (v.expiryDate IS NULL OR v.expiryDate >= CURRENT_DATE)", countQuery = "SELECT COUNT(sp) FROM StoreProduct sp "
                    +
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
                    p.name,
                    v.variantId,
                    v.name,
                    c.name,
                    sup.businessName,
                    s.storeName,
                    sp.stockQuantity,
                    sp.stockQuantity,
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
     * Find waste metrics by category (JPQL-safe version)
     */
    @Query("""
                SELECT
                    c.categoryId,
                    c.name,
                    c.imageUrl,
                    COUNT(DISTINCT p.productId),
                    SUM(CASE WHEN sp.stockQuantity > 0 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN v.expiryDate IS NOT NULL AND v.expiryDate < CURRENT_DATE THEN 1 ELSE 0 END),
                    SUM(CASE WHEN v.expiryDate IS NOT NULL AND v.expiryDate BETWEEN CURRENT_DATE AND :nearExpiryDate THEN 1 ELSE 0 END),
                    COALESCE(SUM(sp.stockQuantity), 0),
                    COALESCE(SUM(CASE WHEN sp.stockQuantity > 0 THEN sp.stockQuantity ELSE 0 END), 0),
                    COALESCE(SUM(CASE WHEN v.expiryDate IS NOT NULL AND v.expiryDate < CURRENT_DATE THEN sp.stockQuantity ELSE 0 END), 0),
                    COALESCE(SUM(sp.stockQuantity * COALESCE(v.originalPrice, 0)), 0),
                    COALESCE(SUM(CASE WHEN sp.stockQuantity > 0 THEN sp.stockQuantity * COALESCE(v.originalPrice, 0) ELSE 0 END), 0)
                FROM StoreProduct sp
                JOIN sp.variant v
                JOIN v.product p
                LEFT JOIN p.category c
                WHERE c IS NOT NULL
                GROUP BY c.categoryId, c.name, c.imageUrl
                ORDER BY COALESCE(SUM(CASE WHEN sp.stockQuantity > 0 THEN sp.stockQuantity * COALESCE(v.originalPrice, 0) ELSE 0 END), 0) DESC
            """)
    List<Object[]> findWasteByCategory(@Param("nearExpiryDate") LocalDate nearExpiryDate);

    /**
     * Find waste metrics by supplier 
     * Index: 0: supplierId, 1: businessName, 2: avatarUrl
     * Index: 3: totalProducts, 4: activeProducts, 5: unsoldProducts, 6: expiredProducts
     * Index: 7: totalStores, 8: activeStores
     * Index: 9: totalInitialStock, 10: remainingStock (ACTIVE+INACTIVE), 11: allStock, 12: expiredStock
     * Index: 13: totalStockValue, 14: wasteValue
     */
    @Query("""
                SELECT
                    sup.userId,
                    sup.businessName,
                    sup.avatarUrl,
                    COUNT(DISTINCT p.productId),
                    SUM(CASE WHEN p.status = com.example.backend.entity.enums.ProductStatus.ACTIVE THEN 1 ELSE 0 END),
                    SUM(CASE WHEN sp.stockQuantity > 0 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN p.status = com.example.backend.entity.enums.ProductStatus.EXPIRED THEN 1 ELSE 0 END),
                    COUNT(DISTINCT s.storeId),
                    SUM(CASE WHEN s.status = com.example.backend.entity.enums.StoreStatus.ACTIVE THEN 1 ELSE 0 END),
                    COALESCE(SUM(sp.initialStock), 0),
                    COALESCE(SUM(CASE WHEN (p.status = com.example.backend.entity.enums.ProductStatus.ACTIVE OR p.status = com.example.backend.entity.enums.ProductStatus.INACTIVE) THEN sp.stockQuantity ELSE 0 END), 0),
                    COALESCE(SUM(sp.stockQuantity), 0),
                    COALESCE(SUM(CASE WHEN p.status = com.example.backend.entity.enums.ProductStatus.EXPIRED THEN sp.stockQuantity ELSE 0 END), 0),
                    COALESCE(SUM(sp.initialStock * COALESCE(v.originalPrice, 0)), 0),
                    COALESCE(SUM(CASE WHEN p.status = com.example.backend.entity.enums.ProductStatus.EXPIRED THEN sp.stockQuantity * COALESCE(v.originalPrice, 0) ELSE 0 END), 0)
                FROM StoreProduct sp
                JOIN sp.variant v
                JOIN v.product p
                JOIN sp.store s
                JOIN s.supplier sup
                GROUP BY sup.userId, sup.businessName, sup.avatarUrl
                ORDER BY COALESCE(SUM(CASE WHEN p.status = com.example.backend.entity.enums.ProductStatus.EXPIRED THEN sp.stockQuantity ELSE 0 END), 0) DESC
            """)
    List<Object[]> findWasteBySupplier();

    /**
     * Find global waste summary metrics
     * Index 0: totalProducts, 1: activeProducts, 2: soldOutProducts, 3: expiredProducts
     * Index 4: nearExpiryProducts, 5: totalInitialStock (tổng tồn kho ban đầu)
     * Index 6: remainingStock (ACTIVE + INACTIVE), 7: expiredStock (EXPIRED)
     * Index 8: totalStockValue, 9: unsoldValue, 10: wasteValue
     */
    @Query("""
                SELECT
                    COUNT(DISTINCT p.productId),
                    SUM(CASE WHEN p.status = com.example.backend.entity.enums.ProductStatus.ACTIVE THEN 1 ELSE 0 END),
                    SUM(CASE WHEN p.status = com.example.backend.entity.enums.ProductStatus.SOLD_OUT THEN 1 ELSE 0 END),
                    SUM(CASE WHEN p.status = com.example.backend.entity.enums.ProductStatus.EXPIRED THEN 1 ELSE 0 END),
                    SUM(CASE WHEN v.expiryDate IS NOT NULL AND v.expiryDate BETWEEN CURRENT_DATE AND :nearExpiryDate THEN 1 ELSE 0 END),
                    COALESCE(SUM(sp.initialStock), 0),
                    COALESCE(SUM(CASE WHEN (p.status = com.example.backend.entity.enums.ProductStatus.ACTIVE OR p.status = com.example.backend.entity.enums.ProductStatus.INACTIVE) THEN sp.stockQuantity ELSE 0 END), 0),
                    COALESCE(SUM(CASE WHEN p.status = com.example.backend.entity.enums.ProductStatus.EXPIRED THEN sp.stockQuantity ELSE 0 END), 0),
                    COALESCE(SUM(sp.initialStock * COALESCE(v.originalPrice, 0)), 0),
                    COALESCE(SUM(sp.stockQuantity * COALESCE(v.originalPrice, 0)), 0),
                    COALESCE(SUM(CASE WHEN p.status = com.example.backend.entity.enums.ProductStatus.EXPIRED THEN sp.stockQuantity * COALESCE(v.originalPrice, 0) ELSE 0 END), 0)
                FROM StoreProduct sp
                JOIN sp.variant v
                JOIN v.product p
            """)
    Object[] findWasteSummary(@Param("nearExpiryDate") LocalDate nearExpiryDate);

}
