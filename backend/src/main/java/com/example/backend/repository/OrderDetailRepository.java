package com.example.backend.repository;

import com.example.backend.entity.Order;
import com.example.backend.entity.OrderDetail;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderDetailRepository extends JpaRepository<OrderDetail, String> {

    /**
     * Find all order details for a specific order
     */
    List<OrderDetail> findByOrder(Order order);

    /**
     * Find order details by order ID
     */
    @Query("SELECT od FROM OrderDetail od WHERE od.order.orderId = :orderId")
    List<OrderDetail> findByOrderId(@Param("orderId") String orderId);

    /**
     * Count order details in an order
     */
    long countByOrder(Order order);

    /**
     * Find order details without reviews (for review system)
     */
    @Query("SELECT od FROM OrderDetail od WHERE od.order.orderId = :orderId AND od.review IS NULL")
    List<OrderDetail> findUnreviewedByOrderId(@Param("orderId") String orderId);

    /**
     * Find best-selling products (variants) based on total quantity sold
     * Returns list of StoreProduct IDs ordered by total quantity sold
     */
    @Query("SELECT od.storeProduct.storeProductId, SUM(od.quantity) as totalSold " +
           "FROM OrderDetail od " +
           "WHERE od.order.status = 'DELIVERED' " +
           "GROUP BY od.storeProduct.storeProductId " +
           "ORDER BY totalSold DESC")
    List<Object[]> findBestSellingProducts(Pageable pageable);

    /**
     * Find top products by revenue
     * Returns: productId, productName, categoryName, supplierName, totalSold, revenue, imageUrl
     */
    @Query("SELECT p.productId, p.name, c.name, s.businessName, " +
           "SUM(od.quantity) as totalSold, " +
           "SUM(od.quantity * od.amount) as revenue, " +
           "CASE WHEN SIZE(p.images) > 0 THEN (SELECT MIN(pi.imageUrl) FROM ProductImage pi WHERE pi.product = p) ELSE NULL END " +
           "FROM OrderDetail od " +
           "JOIN od.storeProduct sp " +
           "JOIN sp.variant v " +
           "JOIN v.product p " +
           "LEFT JOIN p.category c " +
           "JOIN p.supplier s " +
           "WHERE od.order.status = 'DELIVERED' " +
           "GROUP BY p.productId, p.name, c.name, s.businessName " +
           "ORDER BY revenue DESC")
    List<Object[]> findTopProductsByRevenue(Pageable pageable);

    /**
     * Find revenue by category
     * Returns: categoryId, categoryName, revenue, orderCount, productCount
     */
    @Query("SELECT c.categoryId, c.name, " +
           "SUM(od.quantity * od.amount) as revenue, " +
           "COUNT(DISTINCT od.order.orderId) as orderCount, " +
           "COUNT(DISTINCT p.productId) as productCount " +
           "FROM OrderDetail od " +
           "JOIN od.storeProduct sp " +
           "JOIN sp.variant v " +
           "JOIN v.product p " +
           "LEFT JOIN p.category c " +
           "WHERE od.order.status = 'DELIVERED' " +
           "AND c IS NOT NULL " +
           "GROUP BY c.categoryId, c.name " +
           "ORDER BY revenue DESC")
    List<Object[]> findRevenueByCategory();

    /**
     * Calculate total revenue from delivered orders within date range
     */
    @Query("SELECT SUM(od.quantity * od.amount) " +
           "FROM OrderDetail od " +
           "WHERE od.order.status = 'DELIVERED' " +
           "AND od.order.createdAt BETWEEN :startDate AND :endDate")
    Double calculateRevenueByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}
