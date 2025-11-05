package com.example.backend.repository;

import com.example.backend.entity.Customer;
import com.example.backend.entity.Order;
import com.example.backend.entity.OrderCancelRequest;
import com.example.backend.entity.Store;
import com.example.backend.entity.enums.CancelRequestStatus;
import com.example.backend.enums.OrderRequestType;
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
     * Find request by order and type (CANCEL or RETURN)
     */
    Optional<OrderCancelRequest> findByOrderAndRequestType(Order order, OrderRequestType requestType);

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

    /**
     * Find by customer and request type
     */
    Page<OrderCancelRequest> findByCustomerAndRequestType(Customer customer, OrderRequestType requestType, Pageable pageable);

    /**
     * Find by store and request type
     */
    @Query("SELECT r FROM OrderCancelRequest r WHERE r.order.store = :store AND r.requestType = :requestType ORDER BY r.requestedAt DESC")
    Page<OrderCancelRequest> findByOrderStoreAndRequestType(
            @Param("store") Store store, 
            @Param("requestType") OrderRequestType requestType, 
            Pageable pageable);

    /**
     * Find by store, request type and status
     */
    @Query("SELECT r FROM OrderCancelRequest r WHERE r.order.store = :store AND r.requestType = :requestType AND r.status = :status ORDER BY r.requestedAt DESC")
    Page<OrderCancelRequest> findByOrderStoreAndRequestTypeAndStatus(
            @Param("store") Store store, 
            @Param("requestType") OrderRequestType requestType,
            @Param("status") CancelRequestStatus status,
            Pageable pageable);

    /**
     * Find by request type and status
     */
    Page<OrderCancelRequest> findByRequestTypeAndStatus(OrderRequestType requestType, CancelRequestStatus status, Pageable pageable);
}
