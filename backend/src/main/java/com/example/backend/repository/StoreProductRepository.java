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
           "ORDER BY ((v.originalPrice - v.discountPrice) / v.originalPrice) DESC")
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
}
