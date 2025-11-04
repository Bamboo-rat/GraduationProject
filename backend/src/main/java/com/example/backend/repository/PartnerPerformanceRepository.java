package com.example.backend.repository;

import com.example.backend.entity.Supplier;
import com.example.backend.entity.enums.ProductStatus;
import com.example.backend.entity.enums.StoreStatus;
import com.example.backend.entity.enums.OrderStatus;
import com.example.backend.entity.enums.SupplierStatus;
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
            SUM(CASE WHEN st.status = com.example.backend.entity.enums.StoreStatus.ACTIVE THEN 1 ELSE 0 END) as activeStores,
            SUM(CASE WHEN st.status != com.example.backend.entity.enums.StoreStatus.ACTIVE THEN 1 ELSE 0 END) as inactiveStores,
            COUNT(DISTINCT p.productId) as totalProducts,
            SUM(CASE WHEN p.status = com.example.backend.entity.enums.ProductStatus.ACTIVE THEN 1 ELSE 0 END) as activeProducts,
            SUM(CASE WHEN p.status = com.example.backend.entity.enums.ProductStatus.SOLD_OUT THEN 1 ELSE 0 END) as outOfStockProducts,
            COUNT(DISTINCT o.orderId) as totalOrders,
            SUM(CASE WHEN o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED THEN 1 ELSE 0 END) as completedOrders,
            SUM(CASE WHEN o.status = com.example.backend.entity.enums.OrderStatus.CANCELED THEN 1 ELSE 0 END) as cancelledOrders
        FROM Supplier s
        LEFT JOIN s.stores st
        LEFT JOIN s.products p
        LEFT JOIN st.orders o
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
            SUM(CASE WHEN st.status = com.example.backend.entity.enums.StoreStatus.ACTIVE THEN 1 ELSE 0 END) as activeStores,
            SUM(CASE WHEN st.status != com.example.backend.entity.enums.StoreStatus.ACTIVE THEN 1 ELSE 0 END) as inactiveStores,
            COUNT(DISTINCT p.productId) as totalProducts,
            SUM(CASE WHEN p.status = com.example.backend.entity.enums.ProductStatus.ACTIVE THEN 1 ELSE 0 END) as activeProducts,
            SUM(CASE WHEN p.status = com.example.backend.entity.enums.ProductStatus.SOLD_OUT THEN 1 ELSE 0 END) as outOfStockProducts,
            COUNT(DISTINCT o.orderId) as totalOrders,
            SUM(CASE WHEN o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED THEN 1 ELSE 0 END) as completedOrders,
            SUM(CASE WHEN o.status = com.example.backend.entity.enums.OrderStatus.CANCELED THEN 1 ELSE 0 END) as cancelledOrders
        FROM Supplier s
        LEFT JOIN s.stores st
        LEFT JOIN s.products p
        LEFT JOIN st.orders o
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
            SUM(CASE WHEN st.status = com.example.backend.entity.enums.StoreStatus.ACTIVE THEN 1 ELSE 0 END) as activeStores,
            SUM(CASE WHEN st.status != com.example.backend.entity.enums.StoreStatus.ACTIVE THEN 1 ELSE 0 END) as inactiveStores,
            COUNT(DISTINCT p.productId) as totalProducts,
            SUM(CASE WHEN p.status = com.example.backend.entity.enums.ProductStatus.ACTIVE THEN 1 ELSE 0 END) as activeProducts,
            SUM(CASE WHEN p.status = com.example.backend.entity.enums.ProductStatus.SOLD_OUT THEN 1 ELSE 0 END) as outOfStockProducts,
            COUNT(DISTINCT o.orderId) as totalOrders,
            SUM(CASE WHEN o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED THEN 1 ELSE 0 END) as completedOrders,
            SUM(CASE WHEN o.status = com.example.backend.entity.enums.OrderStatus.CANCELED THEN 1 ELSE 0 END) as cancelledOrders
        FROM Supplier s
        LEFT JOIN s.stores st
        LEFT JOIN s.products p
        LEFT JOIN st.orders o
        WHERE s.status = com.example.backend.entity.enums.SupplierStatus.ACTIVE
        GROUP BY s.userId, s.businessName, s.avatarUrl
    """)
    Page<Map<String, Object>> getAllPerformanceMetrics(Pageable pageable);

    /**
     * Get summary statistics for all partners
     */
    @Query("""
        SELECT
            COUNT(DISTINCT s.userId) as totalPartners,
            SUM(CASE WHEN s.status = com.example.backend.entity.enums.SupplierStatus.ACTIVE THEN 1 ELSE 0 END) as activePartners,
            SUM(CASE WHEN s.status = com.example.backend.entity.enums.SupplierStatus.PAUSE THEN 1 ELSE 0 END) as inactivePartners,
            SUM(CASE WHEN s.status = com.example.backend.entity.enums.SupplierStatus.SUSPENDED THEN 1 ELSE 0 END) as suspendedPartners,
            COUNT(DISTINCT st.storeId) as totalStores,
            SUM(CASE WHEN st.status = com.example.backend.entity.enums.StoreStatus.ACTIVE THEN 1 ELSE 0 END) as totalActiveStores,
            COUNT(DISTINCT p.productId) as totalProducts,
            SUM(CASE WHEN p.status = com.example.backend.entity.enums.ProductStatus.ACTIVE THEN 1 ELSE 0 END) as totalActiveProducts,
            COUNT(DISTINCT o.orderId) as totalOrders,
            SUM(CASE WHEN o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED THEN 1 ELSE 0 END) as totalCompletedOrders,
            SUM(CASE WHEN o.status = com.example.backend.entity.enums.OrderStatus.CANCELED THEN 1 ELSE 0 END) as totalCancelledOrders
        FROM Supplier s
        LEFT JOIN s.stores st
        LEFT JOIN s.products p
        LEFT JOIN st.orders o
    """)
    Map<String, Object> getPerformanceSummary();

    /**
     * Get suppliers ordered by total orders (for ranking)
     */
    @Query("""
        SELECT s
        FROM Supplier s
        LEFT JOIN s.stores st
        LEFT JOIN st.orders o
        WHERE s.status = com.example.backend.entity.enums.SupplierStatus.ACTIVE
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
    LEFT JOIN s.stores st
    LEFT JOIN st.orders o
    WHERE s.status = com.example.backend.entity.enums.SupplierStatus.ACTIVE
    GROUP BY s.userId
    ORDER BY
        (CAST(SUM(CASE WHEN o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED THEN 1 ELSE 0 END) AS double) /
        CAST(NULLIF(COUNT(o.orderId), 0) AS double)) DESC
""")
    Page<Supplier> findSuppliersOrderedByCompletionRate(Pageable pageable);
}
