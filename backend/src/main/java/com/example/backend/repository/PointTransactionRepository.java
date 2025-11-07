package com.example.backend.repository;

import com.example.backend.entity.Customer;
import com.example.backend.entity.PointTransaction;
import com.example.backend.entity.enums.PointTransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PointTransactionRepository extends JpaRepository<PointTransaction, String> {

    /**
     * Find all transactions by customer
     */
    Page<PointTransaction> findByCustomerOrderByCreatedAtDesc(Customer customer, Pageable pageable);

    /**
     * Find recent transactions by customer (last 20)
     */
    List<PointTransaction> findTop20ByCustomerOrderByCreatedAtDesc(Customer customer);

    /**
     * Find transactions by customer and type
     */
    Page<PointTransaction> findByCustomerAndTransactionTypeOrderByCreatedAtDesc(
            Customer customer, 
            PointTransactionType type, 
            Pageable pageable
    );

    /**
     * Find transactions by customer within date range
     */
    @Query("SELECT pt FROM PointTransaction pt WHERE pt.customer = :customer " +
           "AND pt.createdAt BETWEEN :startDate AND :endDate " +
           "ORDER BY pt.createdAt DESC")
    List<PointTransaction> findByCustomerAndDateRange(
            @Param("customer") Customer customer,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    /**
     * Calculate total points earned by customer
     */
    @Query("SELECT COALESCE(SUM(pt.pointsChange), 0) FROM PointTransaction pt " +
           "WHERE pt.customer = :customer AND pt.pointsChange > 0")
    int calculateTotalPointsEarned(@Param("customer") Customer customer);

    /**
     * Calculate total points spent by customer
     */
    @Query("SELECT COALESCE(SUM(ABS(pt.pointsChange)), 0) FROM PointTransaction pt " +
           "WHERE pt.customer = :customer AND pt.pointsChange < 0")
    int calculateTotalPointsSpent(@Param("customer") Customer customer);

    /**
     * Get points summary by transaction type
     */
    @Query("SELECT pt.transactionType, SUM(pt.pointsChange) FROM PointTransaction pt " +
           "WHERE pt.customer = :customer " +
           "GROUP BY pt.transactionType")
    List<Object[]> getPointsSummaryByType(@Param("customer") Customer customer);
}
