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
     * Find all orders by customer (no pagination)
     */
    List<Order> findByCustomer(Customer customer);

       /**
     * Find orders by customer id with pagination
     */
    Page<Order> findByCustomerUserId(String customerId, Pageable pageable);

    /**
     * Find recent orders by customer (last 20)
     */
    List<Order> findTop20ByCustomerOrderByCreatedAtDesc(Customer customer);

    /**
     * Find orders by customer and status
     */
    Page<Order> findByCustomerAndStatus(Customer customer, OrderStatus status, Pageable pageable);

     /**
     * Find orders by customer id and status with pagination
     */
    Page<Order> findByCustomerUserIdAndStatus(String customerId, OrderStatus status, Pageable pageable);

    /**
     * Count orders by shipping address string (searches for substring match)
     */
    @Query("SELECT COUNT(o) FROM Order o WHERE o.shippingAddress LIKE CONCAT('%', :addressPart, '%')")
    long countByShippingAddressContaining(@Param("addressPart") String addressPart);

    /**
     * Find orders by store with pagination
     */
    Page<Order> findByStore(Store store, Pageable pageable);

    /**
     * Find orders by store and status
     */
    Page<Order> findByStoreAndStatus(Store store, OrderStatus status, Pageable pageable);

    /**
     * Find orders by store ID (using property path)
     */
    Page<Order> findByStoreStoreId(String storeId, Pageable pageable);

    /**
     * Find orders by store ID and status (using property path)
     */
    Page<Order> findByStoreStoreIdAndStatus(String storeId, OrderStatus status, Pageable pageable);

    /**
     * Find orders by multiple store IDs (for supplier with multiple stores)
     */
    Page<Order> findByStoreStoreIdIn(List<String> storeIds, Pageable pageable);

    /**
     * Find orders by multiple store IDs and status
     */
    Page<Order> findByStoreStoreIdInAndStatus(List<String> storeIds, OrderStatus status, Pageable pageable);

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
     * Count orders by customer and status (for promotion eligibility check)
     */
    long countByCustomerAndStatus(Customer customer, OrderStatus status);

    /**
     * Count orders by store
     */
    long countByStore(Store store);

    /**
     * Check if order code exists
     */
    boolean existsByOrderCode(String orderCode);

    /**
     * Check if idempotency key exists
     */
    boolean existsByIdempotencyKey(String idempotencyKey);

    /**
     * Find order by idempotency key (for duplicate checkout prevention)
     */
    Optional<Order> findByIdempotencyKey(String idempotencyKey);

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
           "ORDER BY FUNCTION('DATE', o.createdAt) ASC")
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

    // ==================== REVENUE REPORT QUERIES ====================

    /**
     * Get revenue breakdown by supplier
     * Returns: supplierId, supplierName, avatarUrl, orderCount, totalRevenue
     */
    @Query("""
        SELECT
            s.userId,
            s.businessName,
            s.avatarUrl,
            COUNT(DISTINCT o.orderId),
            SUM(o.totalAmount),
            COUNT(DISTINCT p.productId),
            COUNT(DISTINCT st.storeId)
        FROM Order o
        JOIN o.store st
        JOIN st.supplier s
        LEFT JOIN st.storeProducts sp
        LEFT JOIN sp.product p
        WHERE o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED
            AND o.createdAt BETWEEN :startDate AND :endDate
        GROUP BY s.userId, s.businessName, s.avatarUrl
        ORDER BY SUM(o.totalAmount) DESC
    """)
    List<Object[]> findRevenueBySupplier(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * Get revenue time series (daily/weekly/monthly aggregation)
     */
    @Query("""
        SELECT
            FUNCTION('DATE', o.createdAt),
            COUNT(DISTINCT o.orderId),
            SUM(o.totalAmount),
            AVG(o.totalAmount)
        FROM Order o
        WHERE o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED
            AND o.createdAt BETWEEN :startDate AND :endDate
        GROUP BY FUNCTION('DATE', o.createdAt)
        ORDER BY FUNCTION('DATE', o.createdAt) ASC
    """)
    List<Object[]> findRevenueTimeSeries(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * Get revenue summary for date range
     */
    @Query("""
        SELECT
            COALESCE(SUM(CASE WHEN o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED THEN o.totalAmount ELSE 0 END), 0),
            COUNT(DISTINCT CASE WHEN o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED THEN o.orderId ELSE NULL END),
            COUNT(DISTINCT CASE WHEN o.status = com.example.backend.entity.enums.OrderStatus.CANCELED THEN o.orderId ELSE NULL END),
            COUNT(DISTINCT o.orderId),
            AVG(CASE WHEN o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED THEN o.totalAmount ELSE NULL END)
        FROM Order o
        WHERE o.createdAt BETWEEN :startDate AND :endDate
    """)
    Object[] findRevenueSummary(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    // ==================== CUSTOMER BEHAVIOR REPORT QUERIES ====================

    /**
     * Get customer segmentation by tier
     */
    @Query("""
        SELECT
            c.tier,
            COUNT(DISTINCT c.userId),
            COUNT(DISTINCT o.orderId),
            SUM(o.totalAmount),
            AVG(o.totalAmount)
        FROM Customer c
        LEFT JOIN c.orders o
        WHERE o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED
            AND o.createdAt BETWEEN :startDate AND :endDate
        GROUP BY c.tier
    """)
    List<Object[]> findCustomerSegmentation(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * Get customer lifetime value data
     */
    @Query("""
        SELECT
            c.userId,
            c.fullName,
            c.email,
            c.phoneNumber,
            c.tier,
            c.createdAt,
            COUNT(DISTINCT o.orderId),
            COUNT(DISTINCT CASE WHEN o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED THEN o.orderId ELSE NULL END),
            COUNT(DISTINCT CASE WHEN o.status = com.example.backend.entity.enums.OrderStatus.CANCELED THEN o.orderId ELSE NULL END),
            COALESCE(SUM(CASE WHEN o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED THEN o.totalAmount ELSE 0 END), 0),
            COALESCE(AVG(CASE WHEN o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED THEN o.totalAmount ELSE NULL END), 0)
        FROM Customer c
        LEFT JOIN c.orders o
        GROUP BY c.userId, c.fullName, c.email, c.phoneNumber, c.tier, c.createdAt
        HAVING COUNT(DISTINCT o.orderId) > 0
        ORDER BY COALESCE(SUM(CASE WHEN o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED THEN o.totalAmount ELSE 0 END), 0) DESC
    """)
    List<Object[]> findCustomerLifetimeValue(Pageable pageable);

    /**
     * Count new vs returning customers in period
     */
    @Query("""
        SELECT
            COUNT(DISTINCT CASE WHEN c.createdAt BETWEEN :startDate AND :endDate THEN c.userId ELSE NULL END),
            COUNT(DISTINCT CASE WHEN c.createdAt < :startDate AND o.createdAt BETWEEN :startDate AND :endDate THEN c.userId ELSE NULL END)
        FROM Customer c
        LEFT JOIN c.orders o
    """)
    Object[] findNewVsReturningCustomers(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}
