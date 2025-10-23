package com.example.backend.repository;

import com.example.backend.entity.Supplier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Repository
public interface PartnerPerformanceRepository extends JpaRepository<Supplier, String> {

    /**
     * Get performance metrics for a specific supplier
     */
    @Query("""
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
    """)
    Map<String, Object> getPerformanceMetrics(@Param("supplierId") String supplierId);

    /**
     * Get performance metrics for a specific supplier within a time period
     */
    @Query("""
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
            AND (o.createdAt IS NULL OR (o.createdAt >= :startDate AND o.createdAt <= :endDate))
        GROUP BY s.userId, s.businessName, s.avatarUrl
    """)
    Map<String, Object> getPerformanceMetricsByPeriod(
        @Param("supplierId") String supplierId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    /**
     * Get performance metrics for all suppliers with pagination
     */
    @Query("""
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
        WHERE s.status = 'ACTIVE'
        GROUP BY s.userId, s.businessName, s.avatarUrl
    """)
    Page<Map<String, Object>> getAllPerformanceMetrics(Pageable pageable);

    /**
     * Get summary statistics for all partners
     */
    @Query("""
        SELECT
            COUNT(DISTINCT s.userId) as totalPartners,
            COUNT(DISTINCT CASE WHEN s.status = 'ACTIVE' THEN s.userId END) as activePartners,
            COUNT(DISTINCT CASE WHEN s.status = 'INACTIVE' THEN s.userId END) as inactivePartners,
            COUNT(DISTINCT CASE WHEN s.status = 'SUSPENDED' THEN s.userId END) as suspendedPartners,
            COUNT(DISTINCT st.storeId) as totalStores,
            COUNT(DISTINCT CASE WHEN st.status = 'ACTIVE' THEN st.storeId END) as totalActiveStores,
            COUNT(DISTINCT p.productId) as totalProducts,
            COUNT(DISTINCT CASE WHEN p.status IN ('ACTIVE', 'AVAILABLE') THEN p.productId END) as totalActiveProducts,
            COUNT(DISTINCT o.orderId) as totalOrders,
            COUNT(DISTINCT CASE WHEN o.status = 'COMPLETED' THEN o.orderId END) as totalCompletedOrders,
            COUNT(DISTINCT CASE WHEN o.status = 'CANCELLED' THEN o.orderId END) as totalCancelledOrders
        FROM Supplier s
        LEFT JOIN Store st ON st.supplier.userId = s.userId
        LEFT JOIN Product p ON p.supplier.userId = s.userId
        LEFT JOIN Order o ON o.store.storeId = st.storeId
    """)
    Map<String, Object> getPerformanceSummary();

    /**
     * Get suppliers ordered by total orders (for ranking)
     */
    @Query("""
        SELECT s
        FROM Supplier s
        LEFT JOIN Store st ON st.supplier.userId = s.userId
        LEFT JOIN Order o ON o.store.storeId = st.storeId
        WHERE s.status = 'ACTIVE'
        GROUP BY s.userId
        ORDER BY COUNT(o.orderId) DESC
    """)
    Page<Supplier> findSuppliersOrderedByTotalOrders(Pageable pageable);

    /**
     * Get suppliers ordered by completion rate
     */
    @Query("""
        SELECT s
        FROM Supplier s
        LEFT JOIN Store st ON st.supplier.userId = s.userId
        LEFT JOIN Order o ON o.store.storeId = st.storeId
        WHERE s.status = 'ACTIVE'
        GROUP BY s.userId
        ORDER BY
            CAST(COUNT(CASE WHEN o.status = 'COMPLETED' THEN 1 END) AS double) /
            NULLIF(COUNT(o.orderId), 0) DESC
    """)
    Page<Supplier> findSuppliersOrderedByCompletionRate(Pageable pageable);
}
