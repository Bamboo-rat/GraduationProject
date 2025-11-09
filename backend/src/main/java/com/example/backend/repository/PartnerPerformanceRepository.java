package com.example.backend.repository;

import com.example.backend.entity.Supplier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Map;

@Repository
public interface PartnerPerformanceRepository extends JpaRepository<Supplier, String> {

    /**
     * Get performance metrics for a specific supplier
     */
    @Query("""
        SELECT
            s.userId AS supplierId,
            s.businessName AS businessName,
            s.avatarUrl AS avatarUrl,
            (SELECT COUNT(DISTINCT st2.storeId) FROM Store st2 WHERE st2.supplier.userId = s.userId) AS totalStores,
            (SELECT COUNT(DISTINCT st3.storeId) FROM Store st3 WHERE st3.supplier.userId = s.userId AND st3.status = com.example.backend.entity.enums.StoreStatus.ACTIVE) AS activeStores,
            (SELECT COUNT(DISTINCT st4.storeId) FROM Store st4 WHERE st4.supplier.userId = s.userId AND st4.status != com.example.backend.entity.enums.StoreStatus.ACTIVE) AS inactiveStores,
            (SELECT COUNT(DISTINCT p2.productId) FROM Product p2 WHERE p2.supplier.userId = s.userId) AS totalProducts,
            (SELECT COUNT(DISTINCT p3.productId) FROM Product p3 WHERE p3.supplier.userId = s.userId AND p3.status = com.example.backend.entity.enums.ProductStatus.ACTIVE) AS activeProducts,
            (SELECT COUNT(DISTINCT p4.productId) FROM Product p4 WHERE p4.supplier.userId = s.userId AND p4.status = com.example.backend.entity.enums.ProductStatus.SOLD_OUT) AS outOfStockProducts,
            (SELECT COUNT(DISTINCT o2.orderId) FROM Order o2 WHERE o2.store.supplier.userId = s.userId) AS totalOrders,
            (SELECT COUNT(DISTINCT o3.orderId) FROM Order o3 WHERE o3.store.supplier.userId = s.userId AND o3.status = com.example.backend.entity.enums.OrderStatus.DELIVERED) AS completedOrders,
            (SELECT COUNT(DISTINCT o4.orderId) FROM Order o4 WHERE o4.store.supplier.userId = s.userId AND o4.status = com.example.backend.entity.enums.OrderStatus.CANCELED) AS cancelledOrders,
            (SELECT COALESCE(SUM(o5.totalAmount - o5.discount + o5.shippingFee), 0.0) FROM Order o5 WHERE o5.store.supplier.userId = s.userId AND o5.status = com.example.backend.entity.enums.OrderStatus.DELIVERED) AS totalRevenue,
            (SELECT COALESCE(SUM((o6.totalAmount - o6.discount + o6.shippingFee) * s.commissionRate), 0.0) FROM Order o6 WHERE o6.store.supplier.userId = s.userId AND o6.status = com.example.backend.entity.enums.OrderStatus.DELIVERED) AS commission
        FROM Supplier s
        WHERE s.userId = :supplierId
    """)
    Map<String, Object> getPerformanceMetrics(@Param("supplierId") String supplierId);

    /**
     * Get performance metrics for a specific supplier within a time period
     */
    @Query("""
        SELECT
            s.userId AS supplierId,
            s.businessName AS businessName,
            s.avatarUrl AS avatarUrl,
            (SELECT COUNT(DISTINCT st2.storeId) FROM Store st2 WHERE st2.supplier.userId = s.userId) AS totalStores,
            (SELECT COUNT(DISTINCT st3.storeId) FROM Store st3 WHERE st3.supplier.userId = s.userId AND st3.status = com.example.backend.entity.enums.StoreStatus.ACTIVE) AS activeStores,
            (SELECT COUNT(DISTINCT st4.storeId) FROM Store st4 WHERE st4.supplier.userId = s.userId AND st4.status != com.example.backend.entity.enums.StoreStatus.ACTIVE) AS inactiveStores,
            (SELECT COUNT(DISTINCT p2.productId) FROM Product p2 WHERE p2.supplier.userId = s.userId) AS totalProducts,
            (SELECT COUNT(DISTINCT p3.productId) FROM Product p3 WHERE p3.supplier.userId = s.userId AND p3.status = com.example.backend.entity.enums.ProductStatus.ACTIVE) AS activeProducts,
            (SELECT COUNT(DISTINCT p4.productId) FROM Product p4 WHERE p4.supplier.userId = s.userId AND p4.status = com.example.backend.entity.enums.ProductStatus.SOLD_OUT) AS outOfStockProducts,
            (SELECT COUNT(DISTINCT o2.orderId) FROM Order o2 WHERE o2.store.supplier.userId = s.userId AND o2.createdAt >= :startDate AND o2.createdAt <= :endDate) AS totalOrders,
            (SELECT COUNT(DISTINCT o3.orderId) FROM Order o3 WHERE o3.store.supplier.userId = s.userId AND o3.createdAt >= :startDate AND o3.createdAt <= :endDate AND o3.status = com.example.backend.entity.enums.OrderStatus.DELIVERED) AS completedOrders,
            (SELECT COUNT(DISTINCT o4.orderId) FROM Order o4 WHERE o4.store.supplier.userId = s.userId AND o4.createdAt >= :startDate AND o4.createdAt <= :endDate AND o4.status = com.example.backend.entity.enums.OrderStatus.CANCELED) AS cancelledOrders,
            (SELECT COALESCE(SUM(o5.totalAmount - o5.discount + o5.shippingFee), 0.0) FROM Order o5 WHERE o5.store.supplier.userId = s.userId AND o5.createdAt >= :startDate AND o5.createdAt <= :endDate AND o5.status = com.example.backend.entity.enums.OrderStatus.DELIVERED) AS totalRevenue,
            (SELECT COALESCE(SUM((o6.totalAmount - o6.discount + o6.shippingFee) * s.commissionRate), 0.0) FROM Order o6 WHERE o6.store.supplier.userId = s.userId AND o6.createdAt >= :startDate AND o6.createdAt <= :endDate AND o6.status = com.example.backend.entity.enums.OrderStatus.DELIVERED) AS commission
        FROM Supplier s
        WHERE s.userId = :supplierId
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
            s.userId AS supplierId,
            s.businessName AS businessName,
            s.avatarUrl AS avatarUrl,
            (SELECT COUNT(DISTINCT st2.storeId) FROM Store st2 WHERE st2.supplier.userId = s.userId) AS totalStores,
            (SELECT COUNT(DISTINCT st3.storeId) FROM Store st3 WHERE st3.supplier.userId = s.userId AND st3.status = com.example.backend.entity.enums.StoreStatus.ACTIVE) AS activeStores,
            (SELECT COUNT(DISTINCT st4.storeId) FROM Store st4 WHERE st4.supplier.userId = s.userId AND st4.status != com.example.backend.entity.enums.StoreStatus.ACTIVE) AS inactiveStores,
            (SELECT COUNT(DISTINCT p2.productId) FROM Product p2 WHERE p2.supplier.userId = s.userId) AS totalProducts,
            (SELECT COUNT(DISTINCT p3.productId) FROM Product p3 WHERE p3.supplier.userId = s.userId AND p3.status = com.example.backend.entity.enums.ProductStatus.ACTIVE) AS activeProducts,
            (SELECT COUNT(DISTINCT p4.productId) FROM Product p4 WHERE p4.supplier.userId = s.userId AND p4.status = com.example.backend.entity.enums.ProductStatus.SOLD_OUT) AS outOfStockProducts,
            (SELECT COUNT(DISTINCT o2.orderId) FROM Order o2 WHERE o2.store.supplier.userId = s.userId) AS totalOrders,
            (SELECT COUNT(DISTINCT o3.orderId) FROM Order o3 WHERE o3.store.supplier.userId = s.userId AND o3.status = com.example.backend.entity.enums.OrderStatus.DELIVERED) AS completedOrders,
            (SELECT COUNT(DISTINCT o4.orderId) FROM Order o4 WHERE o4.store.supplier.userId = s.userId AND o4.status = com.example.backend.entity.enums.OrderStatus.CANCELED) AS cancelledOrders,
            (SELECT COALESCE(SUM(o5.totalAmount - o5.discount + o5.shippingFee), 0.0) FROM Order o5 WHERE o5.store.supplier.userId = s.userId AND o5.status = com.example.backend.entity.enums.OrderStatus.DELIVERED) AS totalRevenue,
            (SELECT COALESCE(SUM((o6.totalAmount - o6.discount + o6.shippingFee) * s.commissionRate), 0.0) FROM Order o6 WHERE o6.store.supplier.userId = s.userId AND o6.status = com.example.backend.entity.enums.OrderStatus.DELIVERED) AS commission
        FROM Supplier s
        WHERE s.status = com.example.backend.entity.enums.SupplierStatus.ACTIVE
    """)
    Page<Map<String, Object>> getAllPerformanceMetrics(Pageable pageable);

    /**
     * Get summary statistics for all partners
     */
    @Query("""
        SELECT
            COUNT(DISTINCT s.userId) AS totalPartners,
            SUM(CASE WHEN s.status = com.example.backend.entity.enums.SupplierStatus.ACTIVE THEN 1 ELSE 0 END) AS activePartners,
            SUM(CASE WHEN s.status = com.example.backend.entity.enums.SupplierStatus.PAUSE THEN 1 ELSE 0 END) AS inactivePartners,
            SUM(CASE WHEN s.status = com.example.backend.entity.enums.SupplierStatus.SUSPENDED THEN 1 ELSE 0 END) AS suspendedPartners,
            (SELECT COUNT(DISTINCT st2.storeId) FROM Store st2) AS totalStores,
            (SELECT COUNT(DISTINCT st3.storeId) FROM Store st3 WHERE st3.status = com.example.backend.entity.enums.StoreStatus.ACTIVE) AS totalActiveStores,
            (SELECT COUNT(DISTINCT p2.productId) FROM Product p2) AS totalProducts,
            (SELECT COUNT(DISTINCT p3.productId) FROM Product p3 WHERE p3.status = com.example.backend.entity.enums.ProductStatus.ACTIVE) AS totalActiveProducts,
            (SELECT COUNT(DISTINCT o2.orderId) FROM Order o2) AS totalOrders,
            (SELECT COUNT(DISTINCT o3.orderId) FROM Order o3 WHERE o3.status = com.example.backend.entity.enums.OrderStatus.DELIVERED) AS totalCompletedOrders,
            (SELECT COUNT(DISTINCT o4.orderId) FROM Order o4 WHERE o4.status = com.example.backend.entity.enums.OrderStatus.CANCELED) AS totalCancelledOrders
        FROM Supplier s
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
