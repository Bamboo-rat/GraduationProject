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

    Optional<Order> findByOrderCode(String orderCode);
    Page<Order> findByCustomer(Customer customer, Pageable pageable);
    List<Order> findByCustomer(Customer customer);
    Page<Order> findByCustomerUserId(String customerId, Pageable pageable);
    List<Order> findTop20ByCustomerOrderByCreatedAtDesc(Customer customer);
    Page<Order> findByCustomerAndStatus(Customer customer, OrderStatus status, Pageable pageable);
    Page<Order> findByCustomerUserIdAndStatus(String customerId, OrderStatus status, Pageable pageable);
    @Query("SELECT COUNT(o) FROM Order o WHERE o.shippingAddress LIKE CONCAT('%', :addressPart, '%')")
    long countByShippingAddressContaining(@Param("addressPart") String addressPart);
    Page<Order> findByStore(Store store, Pageable pageable);
    Page<Order> findByStoreAndStatus(Store store, OrderStatus status, Pageable pageable);
    Page<Order> findByStoreStoreId(String storeId, Pageable pageable);
    Page<Order> findByStoreStoreIdAndStatus(String storeId, OrderStatus status, Pageable pageable);
    Page<Order> findByStoreStoreIdIn(List<String> storeIds, Pageable pageable);
    Page<Order> findByStoreStoreIdInAndStatus(List<String> storeIds, OrderStatus status, Pageable pageable);
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);

    // Search orders by order code or shipping address
    @Query("SELECT o FROM Order o WHERE o.store.storeId = :storeId " +
            "AND (LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(o.shippingAddress) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Order> searchStoreOrders(@Param("storeId") String storeId, @Param("search") String search, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.store.storeId = :storeId AND o.status = :status " +
            "AND (LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(o.shippingAddress) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Order> searchStoreOrdersByStatus(@Param("storeId") String storeId, @Param("status") OrderStatus status,
                                          @Param("search") String search, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.store.storeId IN :storeIds " +
            "AND (LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(o.shippingAddress) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Order> searchStoreOrdersIn(@Param("storeIds") List<String> storeIds, @Param("search") String search, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.store.storeId IN :storeIds AND o.status = :status " +
            "AND (LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(o.shippingAddress) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Order> searchStoreOrdersInByStatus(@Param("storeIds") List<String> storeIds, @Param("status") OrderStatus status,
                                            @Param("search") String search, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.customer.userId = :customerId ORDER BY o.createdAt DESC")
    List<Order> findByCustomerId(@Param("customerId") String customerId);

    @Query("SELECT o FROM Order o WHERE o.store.storeId = :storeId ORDER BY o.createdAt DESC")
    List<Order> findByStoreId(@Param("storeId") String storeId);

    @Query("SELECT o FROM Order o WHERE o.createdAt BETWEEN :startDate AND :endDate ORDER BY o.createdAt DESC")
    List<Order> findByCreatedAtBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT o FROM Order o WHERE o.status = 'DELIVERED' AND o.deliveredAt BETWEEN :startDate AND :endDate ORDER BY o.deliveredAt DESC")
    List<Order> findByDeliveredAtBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    long countByStatus(OrderStatus status);
    long countByCustomer(Customer customer);
    long countByCustomerAndStatus(Customer customer, OrderStatus status);
    long countByStore(Store store);
    long countByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    long countByStatusAndCreatedAtBetween(OrderStatus status, LocalDateTime startDate, LocalDateTime endDate);
    long countByDeliveredAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    long countByStatusAndDeliveredAtBetween(OrderStatus status, LocalDateTime startDate, LocalDateTime endDate);
    boolean existsByOrderCode(String orderCode);
    boolean existsByIdempotencyKey(String idempotencyKey);
    Optional<Order> findByIdempotencyKey(String idempotencyKey);

    @Query("SELECT o FROM Order o WHERE o.customer.userId = :customerId AND o.createdAt >= :since ORDER BY o.createdAt DESC")
    List<Order> findRecentOrdersByCustomer(@Param("customerId") String customerId, @Param("since") LocalDateTime since);

    @Query("""
        SELECT o.store.storeId, COUNT(o) AS orderCount, o.store.storeName
        FROM Order o
        WHERE o.status = 'DELIVERED'
        GROUP BY o.store.storeId, o.store.storeName
        ORDER BY orderCount DESC, o.store.storeName ASC
    """)
    List<Object[]> findTopStoresByOrderCount(Pageable pageable);

    @Query("""
        SELECT o.store.storeId, 
               o.store.storeName, 
               o.store.supplier.businessName,
               COUNT(o) AS orderCount, 
               SUM(o.totalAmount) AS totalRevenue
        FROM Order o
        WHERE o.status = 'DELIVERED'
        GROUP BY o.store.storeId, o.store.storeName, o.store.supplier.businessName
        ORDER BY totalRevenue DESC
    """)
    List<Object[]> findTopStoresByRevenue(Pageable pageable);

    @Query("""
                SELECT FUNCTION('DATE', o.deliveredAt), COUNT(o), 
                             SUM(o.totalAmount), 
                             AVG(o.totalAmount)
                FROM Order o
                WHERE o.status = 'DELIVERED'
                    AND o.deliveredAt BETWEEN :startDate AND :endDate
                GROUP BY FUNCTION('DATE', o.deliveredAt)
                ORDER BY FUNCTION('DATE', o.deliveredAt)
    """)
    List<Object[]> findSalesTrendsByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("""
        SELECT SUM(o.totalAmount)
        FROM Order o
        WHERE o.status = 'DELIVERED'
          AND o.deliveredAt BETWEEN :startDate AND :endDate
    """)
    Double calculateRevenueByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("""
        SELECT COUNT(o)
        FROM Order o
        WHERE o.createdAt BETWEEN :startDate AND :endDate
    """)
    Long countOrdersByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("""
        SELECT COUNT(o)
        FROM Order o
        WHERE o.status = :status
          AND o.createdAt BETWEEN :startDate AND :endDate
    """)
    Long countByStatusAndDateRange(@Param("status") OrderStatus status, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("""
        SELECT COUNT(o)
        FROM Order o
        WHERE o.store.supplier.userId = :supplierId
          AND o.createdAt BETWEEN :startDate AND :endDate
    """)
    Long countBySupplierIdAndCreatedAtBetween(@Param("supplierId") String supplierId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("""
        SELECT o
        FROM Order o
        WHERE o.status = 'DELIVERED'
          AND o.deliveredAt IS NOT NULL
          AND o.deliveredAt <= :beforeDate
          AND o.balanceReleased = false
        ORDER BY o.deliveredAt ASC
    """)
    List<Order> findDeliveredOrdersEligibleForRelease(@Param("beforeDate") LocalDateTime beforeDate);

    Page<Order> findByStatusAndShipment_ShippingProvider(OrderStatus status, String shippingProvider, Pageable pageable);


    @Query("""
                SELECT
                        s.userId,
                        s.businessName,
                        s.avatarUrl,
                        COUNT(DISTINCT o.orderId),
                        COALESCE(SUM(o.totalAmount + o.shippingFee), 0),
                        COALESCE(SUM(o.totalAmount), 0),
                        COALESCE(SUM(o.shippingFee), 0),
                        COALESCE(SUM(o.totalAmount * s.commissionRate), 0),
                        COALESCE(SUM(o.totalAmount * (1 - s.commissionRate) + o.shippingFee), 0),
                        (SELECT COUNT(DISTINCT sp2.variant.product.productId) 
                         FROM StoreProduct sp2 
                         WHERE sp2.store.supplier.userId = s.userId),
                        COUNT(DISTINCT st.storeId),
                        s.commissionRate
                FROM Order o
                JOIN o.store st
                JOIN st.supplier s
                WHERE o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED
                    AND o.deliveredAt IS NOT NULL
                    AND o.deliveredAt BETWEEN :startDate AND :endDate
                GROUP BY s.userId, s.businessName, s.avatarUrl, s.commissionRate
                ORDER BY COALESCE(SUM(o.totalAmount * (1 - s.commissionRate) + o.shippingFee), 0) DESC
    """)
    List<Object[]> findRevenueBySupplier(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);


    @Query("""
                SELECT
                        FUNCTION('DATE', o.deliveredAt),
                        COUNT(DISTINCT o.orderId),
                        SUM(o.totalAmount),
                        SUM(o.totalAmount * s.commissionRate),
                        AVG(o.totalAmount)
                FROM Order o
                JOIN o.store st
                JOIN st.supplier s
                WHERE o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED
                    AND o.deliveredAt IS NOT NULL
                    AND o.deliveredAt BETWEEN :startDate AND :endDate
                GROUP BY FUNCTION('DATE', o.deliveredAt)
                ORDER BY FUNCTION('DATE', o.deliveredAt) ASC
    """)
    List<Object[]> findRevenueTimeSeries(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);


    @Query("""
        SELECT
            COALESCE(SUM(CASE WHEN o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED 
                              AND o.deliveredAt IS NOT NULL 
                              AND o.deliveredAt BETWEEN :startDate AND :endDate 
                         THEN o.totalAmount + o.shippingFee ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED 
                              AND o.deliveredAt IS NOT NULL 
                              AND o.deliveredAt BETWEEN :startDate AND :endDate 
                         THEN o.totalAmount ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED 
                              AND o.deliveredAt IS NOT NULL 
                              AND o.deliveredAt BETWEEN :startDate AND :endDate 
                         THEN o.shippingFee ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED 
                              AND o.deliveredAt IS NOT NULL 
                              AND o.deliveredAt BETWEEN :startDate AND :endDate 
                         THEN o.totalAmount * s.commissionRate ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED 
                              AND o.deliveredAt IS NOT NULL 
                              AND o.deliveredAt BETWEEN :startDate AND :endDate 
                         THEN o.totalAmount * (1 - s.commissionRate) + o.shippingFee ELSE 0 END), 0),
            SUM(CASE WHEN o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED 
                      AND o.deliveredAt IS NOT NULL 
                      AND o.deliveredAt BETWEEN :startDate AND :endDate 
                 THEN 1 ELSE 0 END),
            SUM(CASE WHEN o.status = com.example.backend.entity.enums.OrderStatus.CANCELED 
                      AND o.createdAt BETWEEN :startDate AND :endDate 
                 THEN 1 ELSE 0 END),
            COUNT(CASE WHEN o.createdAt BETWEEN :startDate AND :endDate THEN 1 ELSE NULL END),
            COALESCE(AVG(CASE WHEN o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED 
                              AND o.deliveredAt IS NOT NULL 
                              AND o.deliveredAt BETWEEN :startDate AND :endDate 
                         THEN o.totalAmount + o.shippingFee ELSE NULL END), 0),
            COALESCE(AVG(s.commissionRate), 0)
        FROM Order o
        JOIN o.store st
        JOIN st.supplier s
        WHERE o.createdAt BETWEEN :startDate AND :endDate
           OR (o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED 
               AND o.deliveredAt IS NOT NULL 
               AND o.deliveredAt BETWEEN :startDate AND :endDate)
    """)
    Object[] findRevenueSummary(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("""
        SELECT
            p.category.categoryId,
            p.category.name,
            p.category.imageUrl,
            COUNT(DISTINCT o.orderId),
            SUM(od.quantity),
            SUM(od.amount * od.quantity),
            AVG(od.amount * od.quantity)
        FROM Order o
        JOIN o.orderDetails od
        JOIN od.storeProduct sp
        JOIN sp.variant.product p
        WHERE o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED
            AND o.deliveredAt IS NOT NULL
            AND o.deliveredAt BETWEEN :startDate AND :endDate
        GROUP BY p.category.categoryId, p.category.name, p.category.imageUrl
        ORDER BY SUM(od.amount * od.quantity) DESC
    """)
    List<Object[]> findRevenueByCategory(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);


    @Query("""
                SELECT
                        c.tier,
                        COUNT(DISTINCT c.userId),
                        SUM(CASE 
                            WHEN o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED 
                                AND o.deliveredAt IS NOT NULL
                                AND o.deliveredAt BETWEEN :startDate AND :endDate
                            THEN 1 
                            ELSE 0
                        END),
                        COALESCE(SUM(CASE 
                            WHEN o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED 
                                AND o.deliveredAt IS NOT NULL
                                AND o.deliveredAt BETWEEN :startDate AND :endDate
                            THEN o.totalAmount 
                            ELSE 0 
                        END), 0),
                        COALESCE(AVG(CASE 
                            WHEN o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED 
                                AND o.deliveredAt IS NOT NULL
                                AND o.deliveredAt BETWEEN :startDate AND :endDate
                            THEN o.totalAmount 
                            ELSE NULL
                        END), 0)
                FROM Customer c
                LEFT JOIN c.orders o
                GROUP BY c.tier
    """)
    List<Object[]> findCustomerSegmentation(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("""
        SELECT
            c.userId,
            c.fullName,
            c.email,
            c.phoneNumber,
            c.tier,
            c.createdAt,
            COUNT(DISTINCT o.orderId),
            SUM(CASE WHEN o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED THEN 1 ELSE 0 END),
            SUM(CASE WHEN o.status = com.example.backend.entity.enums.OrderStatus.CANCELED THEN 1 ELSE 0 END),
            COALESCE(SUM(CASE WHEN o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED THEN o.totalAmount ELSE 0 END), 0),
            COALESCE(AVG(CASE WHEN o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED THEN o.totalAmount ELSE NULL END), 0)
        FROM Customer c
        LEFT JOIN c.orders o
        GROUP BY c.userId, c.fullName, c.email, c.phoneNumber, c.tier, c.createdAt
        HAVING COUNT(DISTINCT o.orderId) > 0
        ORDER BY COALESCE(SUM(CASE WHEN o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED THEN o.totalAmount ELSE 0 END), 0) DESC
    """)
    List<Object[]> findCustomerLifetimeValue(Pageable pageable);

    @Query("""
        SELECT COUNT(DISTINCT o.customer.userId)
        FROM Order o
        WHERE o.customer.createdAt < :startDate
            AND o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED
            AND o.deliveredAt IS NOT NULL
            AND o.deliveredAt BETWEEN :startDate AND :endDate
    """)
    Long countReturningCustomers(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    // Additional helper query for purchase patterns
    @Query("""
        SELECT
            HOUR(o.createdAt) as hour,
            COUNT(o) as orderCount
        FROM Order o
        WHERE o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED
            AND o.deliveredAt IS NOT NULL
            AND o.deliveredAt BETWEEN :startDate AND :endDate
        GROUP BY HOUR(o.createdAt)
        ORDER BY HOUR(o.createdAt)
    """)
    List<Object[]> findHourlyOrderDistribution(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("""
        SELECT
            DAYOFWEEK(o.createdAt) as dayOfWeek,
            COUNT(o) as orderCount
        FROM Order o
        WHERE o.status = com.example.backend.entity.enums.OrderStatus.DELIVERED
            AND o.deliveredAt IS NOT NULL
            AND o.deliveredAt BETWEEN :startDate AND :endDate
        GROUP BY DAYOFWEEK(o.createdAt)
        ORDER BY DAYOFWEEK(o.createdAt)
    """)
    List<Object[]> findWeeklyOrderDistribution(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}