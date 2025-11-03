package com.example.backend.repository;

import com.example.backend.entity.Order;
import com.example.backend.entity.Payment;
import com.example.backend.entity.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, String> {

    /**
     * Find payment by order
     */
    Optional<Payment> findByOrder(Order order);

    /**
     * Find payment by order ID
     */
    @Query("SELECT p FROM Payment p WHERE p.order.orderId = :orderId")
    Optional<Payment> findByOrderId(@Param("orderId") String orderId);

    /**
     * Find payment by transaction ID
     */
    Optional<Payment> findByTransactionId(String transactionId);

    /**
     * Find payments by status
     */
    List<Payment> findByStatus(PaymentStatus status);

    /**
     * Count payments by status
     */
    long countByStatus(PaymentStatus status);

    /**
     * Check if transaction ID exists
     */
    boolean existsByTransactionId(String transactionId);
}
