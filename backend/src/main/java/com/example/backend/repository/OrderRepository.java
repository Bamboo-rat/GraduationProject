package com.example.backend.repository;

import com.example.backend.entity.Customer;
import com.example.backend.entity.Order;
import com.example.backend.entity.Store;
import com.example.backend.entity.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, String> {

    /**
     * Find order by order code
     */
    Optional<Order> findByOrderCode(String orderCode);

    /**
     * Find orders by customer with pagination
     */
    Page<Order> findByCustomer(Customer customer, Pageable pageable);

    /**
     * Find orders by customer and status
     */
    Page<Order> findByCustomerAndStatus(Customer customer, OrderStatus status, Pageable pageable);

    /**
     * Find orders by store with pagination
     */
    Page<Order> findByStore(Store store, Pageable pageable);

    /**
     * Find orders by store and status
     */
    Page<Order> findByStoreAndStatus(Store store, OrderStatus status, Pageable pageable);

    /**
     * Find orders by status
     */
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);

    /**
     * Find orders by customer ID
     */
    @Query("SELECT o FROM Order o WHERE o.customer.userId = :customerId ORDER BY o.createdAt DESC")
    List<Order> findByCustomerId(@Param("customerId") String customerId);

    /**
     * Find orders by store ID
     */
    @Query("SELECT o FROM Order o WHERE o.store.storeId = :storeId ORDER BY o.createdAt DESC")
    List<Order> findByStoreId(@Param("storeId") String storeId);

    /**
     * Find orders created within date range
     */
    @Query("SELECT o FROM Order o WHERE o.createdAt BETWEEN :startDate AND :endDate ORDER BY o.createdAt DESC")
    List<Order> findByCreatedAtBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * Count orders by status
     */
    long countByStatus(OrderStatus status);

    /**
     * Count orders by customer
     */
    long countByCustomer(Customer customer);

    /**
     * Count orders by store
     */
    long countByStore(Store store);

    /**
     * Check if order code exists
     */
    boolean existsByOrderCode(String orderCode);

    /**
     * Find recent orders for customer (for cancellation tracking)
     */
    @Query("SELECT o FROM Order o WHERE o.customer.userId = :customerId AND o.createdAt >= :since ORDER BY o.createdAt DESC")
    List<Order> findRecentOrdersByCustomer(@Param("customerId") String customerId, @Param("since") LocalDateTime since);

    /**
     * Find stores with most purchases (completed orders)
     * Returns list of Store IDs ordered by order count
     */
    @Query("SELECT o.store.storeId, COUNT(o) as orderCount, o.store.storeName " +
           "FROM Order o " +
           "WHERE o.status = 'DELIVERED' " +
           "GROUP BY o.store.storeId, o.store.storeName " +
           "ORDER BY orderCount DESC, o.store.storeName ASC")
    List<Object[]> findTopStoresByOrderCount(Pageable pageable);

    /**
     * Get sales trends (daily) within date range
     * Returns: date, orderCount, revenue, avgOrderValue
     */
    @Query("SELECT FUNCTION('DATE', o.createdAt) as date, " +
           "COUNT(o) as orderCount, " +
           "SUM(o.totalAmount) as revenue, " +
           "AVG(o.totalAmount) as avgOrderValue " +
           "FROM Order o " +
           "WHERE o.status = 'DELIVERED' " +
           "AND o.createdAt BETWEEN :startDate AND :endDate " +
           "GROUP BY FUNCTION('DATE', o.createdAt) " +
           "ORDER BY date ASC")
    List<Object[]> findSalesTrendsByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * Calculate total revenue within date range
     */
    @Query("SELECT SUM(o.totalAmount) FROM Order o " +
           "WHERE o.status = 'DELIVERED' " +
           "AND o.createdAt BETWEEN :startDate AND :endDate")
    Double calculateRevenueByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * Count orders within date range
     */
    @Query("SELECT COUNT(o) FROM Order o " +
           "WHERE o.createdAt BETWEEN :startDate AND :endDate")
    Long countOrdersByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * Count orders by status and date range
     */
    @Query("SELECT COUNT(o) FROM Order o " +
           "WHERE o.status = :status " +
           "AND o.createdAt BETWEEN :startDate AND :endDate")
    Long countByStatusAndDateRange(@Param("status") OrderStatus status, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * Count orders by supplier ID and date range (for wallet summary)
     */
    @Query("SELECT COUNT(o) FROM Order o " +
           "WHERE o.store.supplier.userId = :supplierId " +
           "AND o.createdAt BETWEEN :startDate AND :endDate")
    Long countBySupplierIdAndCreatedAtBetween(@Param("supplierId") String supplierId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * Find delivered orders that are eligible for balance release (delivered more than 7 days ago)
     * and have not been released yet
     */
    @Query("SELECT o FROM Order o " +
           "WHERE o.status = 'DELIVERED' " +
           "AND o.deliveredAt IS NOT NULL " +
           "AND o.deliveredAt <= :beforeDate " +
           "AND o.balanceReleased = false " +
           "ORDER BY o.deliveredAt ASC")
    List<Order> findDeliveredOrdersEligibleForRelease(@Param("beforeDate") LocalDateTime beforeDate);

    /**
     * Find orders by status and shipping provider (for shipping partner demo)
     * Returns orders in SHIPPING status assigned to specific provider
     */
    Page<Order> findByStatusAndShipment_ShippingProvider(OrderStatus status, String shippingProvider, Pageable pageable);
}
