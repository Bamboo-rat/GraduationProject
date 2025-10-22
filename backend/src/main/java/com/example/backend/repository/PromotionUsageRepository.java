package com.example.backend.repository;

import com.example.backend.entity.PromotionUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PromotionUsageRepository extends JpaRepository<PromotionUsage, String> {

    /**
     * Count how many times a customer has used a specific promotion
     * Used to enforce per-customer usage limits
     */
    @Query("SELECT COUNT(pu) FROM PromotionUsage pu " +
           "WHERE pu.promotion.promotionId = :promotionId " +
           "AND pu.customer.userId = :customerId")
    long countByPromotionAndCustomer(
            @Param("promotionId") String promotionId,
            @Param("customerId") String customerId
    );

    /**
     * Check if customer has already used a promotion
     * Useful for one-time-only promotions
     */
    @Query("SELECT CASE WHEN COUNT(pu) > 0 THEN true ELSE false END " +
           "FROM PromotionUsage pu " +
           "WHERE pu.promotion.promotionId = :promotionId " +
           "AND pu.customer.userId = :customerId")
    boolean hasCustomerUsedPromotion(
            @Param("promotionId") String promotionId,
            @Param("customerId") String customerId
    );

    /**
     * Find all usage records for a specific promotion
     */
    @Query("SELECT pu FROM PromotionUsage pu " +
           "WHERE pu.promotion.promotionId = :promotionId " +
           "ORDER BY pu.usedAt DESC")
    List<PromotionUsage> findByPromotionId(@Param("promotionId") String promotionId);

    /**
     * Find all promotions used by a customer
     */
    @Query("SELECT pu FROM PromotionUsage pu " +
           "WHERE pu.customer.userId = :customerId " +
           "ORDER BY pu.usedAt DESC")
    List<PromotionUsage> findByCustomerId(@Param("customerId") String customerId);

    /**
     * Find usage record by order ID
     * Each order should have at most one promotion applied
     */
    @Query("SELECT pu FROM PromotionUsage pu " +
           "WHERE pu.order.orderId = :orderId")
    Optional<PromotionUsage> findByOrderId(@Param("orderId") String orderId);

    /**
     * Get total discount amount given by a promotion
     */
    @Query("SELECT COALESCE(SUM(pu.discountAmount), 0) FROM PromotionUsage pu " +
           "WHERE pu.promotion.promotionId = :promotionId")
    java.math.BigDecimal getTotalDiscountByPromotion(@Param("promotionId") String promotionId);

    /**
     * Get total savings for a customer across all promotions
     */
    @Query("SELECT COALESCE(SUM(pu.discountAmount), 0) FROM PromotionUsage pu " +
           "WHERE pu.customer.userId = :customerId")
    java.math.BigDecimal getTotalSavingsByCustomer(@Param("customerId") String customerId);

    /**
     * Find recent promotion usage within time window
     * Useful for rate limiting or fraud detection
     */
    @Query("SELECT pu FROM PromotionUsage pu " +
           "WHERE pu.promotion.promotionId = :promotionId " +
           "AND pu.customer.userId = :customerId " +
           "AND pu.usedAt >= :since " +
           "ORDER BY pu.usedAt DESC")
    List<PromotionUsage> findRecentUsage(
            @Param("promotionId") String promotionId,
            @Param("customerId") String customerId,
            @Param("since") LocalDateTime since
    );

    /**
     * Get most popular promotions by usage count
     */
    @Query("SELECT pu.promotion.promotionId, pu.promotion.code, COUNT(pu) as usageCount " +
           "FROM PromotionUsage pu " +
           "WHERE pu.usedAt >= :since " +
           "GROUP BY pu.promotion.promotionId, pu.promotion.code " +
           "ORDER BY usageCount DESC")
    List<Object[]> getMostPopularPromotions(@Param("since") LocalDateTime since);

    /**
     * Get promotion usage statistics
     */
    @Query("SELECT " +
           "COUNT(DISTINCT pu.customer.userId) as uniqueCustomers, " +
           "COUNT(pu) as totalUsages, " +
           "COALESCE(AVG(pu.orderAmount), 0) as avgOrderAmount, " +
           "COALESCE(AVG(pu.discountAmount), 0) as avgDiscountAmount, " +
           "COALESCE(SUM(pu.discountAmount), 0) as totalDiscountGiven " +
           "FROM PromotionUsage pu " +
           "WHERE pu.promotion.promotionId = :promotionId")
    Object[] getPromotionStatistics(@Param("promotionId") String promotionId);

    /**
     * Find promotions used in a specific order
     */
    @Query("SELECT pu FROM PromotionUsage pu " +
           "WHERE pu.order.orderId = :orderId")
    List<PromotionUsage> findByOrder(@Param("orderId") String orderId);

    /**
     * Count total usage in last N hours (fraud detection)
     */
    @Query("SELECT COUNT(pu) FROM PromotionUsage pu " +
           "WHERE pu.promotion.promotionId = :promotionId " +
           "AND pu.customer.userId = :customerId " +
           "AND pu.usedAt >= :since")
    long countUsageInTimeWindow(
            @Param("promotionId") String promotionId,
            @Param("customerId") String customerId,
            @Param("since") LocalDateTime since
    );

    /**
     * Delete old usage records (cleanup for GDPR compliance)
     */
    @Query("DELETE FROM PromotionUsage pu " +
           "WHERE pu.usedAt < :cutoffDate")
    void deleteOldUsageRecords(@Param("cutoffDate") LocalDateTime cutoffDate);
}
