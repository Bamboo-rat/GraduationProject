package com.example.backend.repository;

import com.example.backend.entity.CustomerSuspensionHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CustomerSuspensionHistoryRepository extends JpaRepository<CustomerSuspensionHistory, String> {

    /**
     * Find all suspension history for a customer
     */
    Page<CustomerSuspensionHistory> findByCustomerUserIdOrderByCreatedAtDesc(String customerId, Pageable pageable);

    /**
     * Count total suspensions for a customer
     */
    long countByCustomerUserId(String customerId);

    /**
     * Count suspensions within a time period
     */
    @Query("SELECT COUNT(h) FROM CustomerSuspensionHistory h " +
           "WHERE h.customer.userId = :customerId " +
           "AND h.createdAt >= :since")
    long countByCustomerAndCreatedAtAfter(
            @Param("customerId") String customerId,
            @Param("since") LocalDateTime since);

    /**
     * Get recent suspensions for pattern analysis
     */
    @Query("SELECT h FROM CustomerSuspensionHistory h " +
           "WHERE h.customer.userId = :customerId " +
           "AND h.createdAt >= :since " +
           "ORDER BY h.createdAt DESC")
    List<CustomerSuspensionHistory> findRecentSuspensions(
            @Param("customerId") String customerId,
            @Param("since") LocalDateTime since);

    /**
     * Find currently active suspension
     */
    @Query("SELECT h FROM CustomerSuspensionHistory h " +
           "WHERE h.customer.userId = :customerId " +
           "AND h.suspendedUntil > :now " +
           "AND h.reinstatedAt IS NULL " +
           "ORDER BY h.createdAt DESC")
    List<CustomerSuspensionHistory> findActiveSuspensions(
            @Param("customerId") String customerId,
            @Param("now") LocalDateTime now);
}
