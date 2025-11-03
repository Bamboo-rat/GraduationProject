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
    @Query("SELECT o.store.storeId, COUNT(o) as orderCount " +
           "FROM Order o " +
           "WHERE o.status = 'DELIVERED' " +
           "GROUP BY o.store.storeId " +
           "ORDER BY orderCount DESC")
    List<Object[]> findTopStoresByOrderCount(Pageable pageable);
}
