package com.example.backend.repository;

import com.example.backend.entity.PromotionValidationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PromotionValidationLogRepository extends JpaRepository<PromotionValidationLog, String> {

    /**
     * Find all validation logs for a specific promotion
     */
    @Query("SELECT pvl FROM PromotionValidationLog pvl " +
           "WHERE pvl.promotion.promotionId = :promotionId " +
           "ORDER BY pvl.createdAt DESC")
    List<PromotionValidationLog> findByPromotionId(@Param("promotionId") String promotionId);

    /**
     * Find all validation logs for a specific customer
     */
    @Query("SELECT pvl FROM PromotionValidationLog pvl " +
           "WHERE pvl.customer.userId = :customerId " +
           "ORDER BY pvl.createdAt DESC")
    List<PromotionValidationLog> findByCustomerId(@Param("customerId") String customerId);

    /**
     * Find incomplete validations (validated but not applied)
     * These indicate customers who checked the promotion but didn't complete the order
     */
    @Query("SELECT pvl FROM PromotionValidationLog pvl " +
           "WHERE pvl.status = 'VALID' " +
           "AND pvl.applied = false " +
           "AND pvl.createdAt >= :sinceDate " +
           "ORDER BY pvl.createdAt DESC")
    List<PromotionValidationLog> findIncompleteValidations(@Param("sinceDate") LocalDateTime sinceDate);

    /**
     * Count incomplete validations for a specific promotion
     * This helps identify promotions with high abandon rate
     */
    @Query("SELECT COUNT(pvl) FROM PromotionValidationLog pvl " +
           "WHERE pvl.promotion.promotionId = :promotionId " +
           "AND pvl.status = 'VALID' " +
           "AND pvl.applied = false")
    long countIncompleteValidationsByPromotion(@Param("promotionId") String promotionId);

    /**
     * Get validation statistics for a promotion
     */
    @Query("SELECT pvl.status, COUNT(pvl) FROM PromotionValidationLog pvl " +
           "WHERE pvl.promotion.promotionId = :promotionId " +
           "GROUP BY pvl.status")
    List<Object[]> getValidationStatsByPromotion(@Param("promotionId") String promotionId);

    /**
     * Find recent validation attempts by customer for specific promotion
     * Used to detect duplicate validations within short time window
     */
    @Query("SELECT pvl FROM PromotionValidationLog pvl " +
           "WHERE pvl.promotion.promotionId = :promotionId " +
           "AND pvl.customer.userId = :customerId " +
           "AND pvl.createdAt >= :sinceTime " +
           "ORDER BY pvl.createdAt DESC")
    List<PromotionValidationLog> findRecentValidations(
            @Param("promotionId") String promotionId,
            @Param("customerId") String customerId,
            @Param("sinceTime") LocalDateTime sinceTime
    );

    /**
     * Get conversion rate for promotions (applied / validated)
     */
    @Query("SELECT " +
           "pvl.promotion.promotionId, " +
           "pvl.promotion.code, " +
           "COUNT(CASE WHEN pvl.status = 'VALID' THEN 1 END) as totalValidations, " +
           "COUNT(CASE WHEN pvl.applied = true THEN 1 END) as totalApplied " +
           "FROM PromotionValidationLog pvl " +
           "WHERE pvl.createdAt >= :sinceDate " +
           "GROUP BY pvl.promotion.promotionId, pvl.promotion.code")
    List<Object[]> getPromotionConversionStats(@Param("sinceDate") LocalDateTime sinceDate);
}
