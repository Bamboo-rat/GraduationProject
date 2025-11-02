package com.example.backend.repository;

import com.example.backend.entity.CustomerViolation;
import com.example.backend.entity.enums.ViolationAction;
import com.example.backend.entity.enums.ViolationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CustomerViolationRepository extends JpaRepository<CustomerViolation, String> {

    /**
     * Find all violations for a customer
     */
    Page<CustomerViolation> findByCustomerUserIdOrderByCreatedAtDesc(String customerId, Pageable pageable);

    /**
     * Find unresolved violations for a customer
     */
    List<CustomerViolation> findByCustomerUserIdAndResolvedFalse(String customerId);

    /**
     * Count violations by type within a time period
     */
    @Query("SELECT COUNT(v) FROM CustomerViolation v " +
           "WHERE v.customer.userId = :customerId " +
           "AND v.violationType = :type " +
           "AND v.createdAt >= :since")
    long countByCustomerAndTypeAndCreatedAtAfter(
            @Param("customerId") String customerId,
            @Param("type") ViolationType type,
            @Param("since") LocalDateTime since);

    /**
     * Count violations with specific action taken within a time period
     */
    @Query("SELECT COUNT(v) FROM CustomerViolation v " +
           "WHERE v.customer.userId = :customerId " +
           "AND v.actionTaken = :action " +
           "AND v.createdAt >= :since")
    long countByCustomerAndActionAndCreatedAtAfter(
            @Param("customerId") String customerId,
            @Param("action") ViolationAction action,
            @Param("since") LocalDateTime since);

    /**
     * Find all unresolved violations awaiting admin review
     */
    @Query("SELECT v FROM CustomerViolation v " +
           "WHERE v.resolved = false " +
           "AND v.actionTaken = 'UNDER_REVIEW' " +
           "ORDER BY v.createdAt DESC")
    Page<CustomerViolation> findAllPendingReview(Pageable pageable);

    /**
     * Get recent violations for a customer
     */
    @Query("SELECT v FROM CustomerViolation v " +
           "WHERE v.customer.userId = :customerId " +
           "AND v.createdAt >= :since " +
           "ORDER BY v.createdAt DESC")
    List<CustomerViolation> findRecentViolations(
            @Param("customerId") String customerId,
            @Param("since") LocalDateTime since);

    /**
     * Check if customer has active suspension
     */
    @Query("SELECT CASE WHEN COUNT(v) > 0 THEN true ELSE false END " +
           "FROM CustomerViolation v " +
           "WHERE v.customer.userId = :customerId " +
           "AND v.suspensionUntil > :now " +
           "AND v.resolved = false")
    boolean hasActiveSuspension(
            @Param("customerId") String customerId,
            @Param("now") LocalDateTime now);
}
