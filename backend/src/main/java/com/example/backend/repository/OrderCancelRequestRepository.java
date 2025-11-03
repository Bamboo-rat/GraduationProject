package com.example.backend.repository;

import com.example.backend.entity.Order;
import com.example.backend.entity.OrderCancelRequest;
import com.example.backend.entity.enums.CancelRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrderCancelRequestRepository extends JpaRepository<OrderCancelRequest, String> {

    /**
     * Find cancel request by order
     */
    Optional<OrderCancelRequest> findByOrder(Order order);

    /**
     * Check if order has pending cancel request
     */
    @Query("SELECT COUNT(r) > 0 FROM OrderCancelRequest r WHERE r.order = :order AND r.status = 'PENDING_REVIEW'")
    boolean existsPendingRequestByOrder(@Param("order") Order order);

    /**
     * Find all cancel requests by customer
     */
    @Query("SELECT r FROM OrderCancelRequest r WHERE r.customer.userId = :customerId ORDER BY r.requestedAt DESC")
    Page<OrderCancelRequest> findByCustomerId(@Param("customerId") String customerId, Pageable pageable);

    /**
     * Find all cancel requests by store (for supplier to review)
     */
    @Query("SELECT r FROM OrderCancelRequest r WHERE r.order.store.storeId = :storeId ORDER BY r.requestedAt DESC")
    Page<OrderCancelRequest> findByStoreId(@Param("storeId") String storeId, Pageable pageable);

    /**
     * Find pending cancel requests by store
     */
    @Query("SELECT r FROM OrderCancelRequest r WHERE r.order.store.storeId = :storeId AND r.status = 'PENDING_REVIEW' ORDER BY r.requestedAt ASC")
    Page<OrderCancelRequest> findPendingByStoreId(@Param("storeId") String storeId, Pageable pageable);

    /**
     * Find all pending cancel requests (for admin)
     */
    @Query("SELECT r FROM OrderCancelRequest r WHERE r.status = 'PENDING_REVIEW' ORDER BY r.requestedAt ASC")
    Page<OrderCancelRequest> findAllPending(Pageable pageable);

    /**
     * Find by status
     */
    Page<OrderCancelRequest> findByStatus(CancelRequestStatus status, Pageable pageable);
}
