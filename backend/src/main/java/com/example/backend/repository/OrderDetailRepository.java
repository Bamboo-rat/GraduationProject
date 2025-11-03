package com.example.backend.repository;

import com.example.backend.entity.Order;
import com.example.backend.entity.OrderDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

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
}
