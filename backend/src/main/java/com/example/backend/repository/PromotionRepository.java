package com.example.backend.repository;

import com.example.backend.entity.Promotion;
import com.example.backend.entity.enums.PromotionStatus;
import com.example.backend.entity.enums.PromotionTier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PromotionRepository extends JpaRepository<Promotion, String> {

    Optional<Promotion> findByCode(String code);

    /**
     * Find promotion by code with pessimistic write lock
     * This prevents race conditions when applying promotions
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Promotion p WHERE p.code = :code")
    Optional<Promotion> findByCodeWithLock(@Param("code") String code);

    boolean existsByCode(String code);

    boolean existsByCodeAndPromotionIdNot(String code, String promotionId);

    List<Promotion> findByStatus(PromotionStatus status);

    List<Promotion> findByTier(PromotionTier tier);

    List<Promotion> findByIsHighlightedTrue();

    @Query("SELECT p FROM Promotion p WHERE " +
           "p.status = 'ACTIVE' AND " +
           "p.startDate <= :currentDate AND " +
           "p.endDate >= :currentDate")
    List<Promotion> findActivePromotions(@Param("currentDate") LocalDate currentDate);

    @Query("SELECT p FROM Promotion p WHERE " +
           "(:status IS NULL OR p.status = :status) AND " +
           "(:tier IS NULL OR p.tier = :tier) AND " +
           "(:isHighlighted IS NULL OR p.isHighlighted = :isHighlighted) AND " +
           "(:search IS NULL OR " +
           "LOWER(p.code) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Promotion> findByFilters(
            @Param("status") PromotionStatus status,
            @Param("tier") PromotionTier tier,
            @Param("isHighlighted") Boolean isHighlighted,
            @Param("search") String search,
            Pageable pageable
    );

    /**
     * Atomically increment promotion usage count
     * This is thread-safe and prevents race conditions
     *
     * @param promotionId The promotion ID
     * @return Number of rows updated (1 if successful, 0 if promotion not found)
     */
    @Modifying
    @Query("UPDATE Promotion p SET p.currentUsageCount = p.currentUsageCount + 1 " +
           "WHERE p.promotionId = :promotionId")
    int incrementUsageCount(@Param("promotionId") String promotionId);

    /**
     * Atomically increment usage count only if limit not exceeded
     * This combines check and increment in a single atomic operation
     *
     * @param promotionId The promotion ID
     * @return Number of rows updated (1 if successful, 0 if limit reached or promotion not found)
     */
    @Modifying
    @Query("UPDATE Promotion p SET p.currentUsageCount = p.currentUsageCount + 1 " +
           "WHERE p.promotionId = :promotionId " +
           "AND (p.totalUsageLimit IS NULL OR p.currentUsageCount < p.totalUsageLimit)")
    int incrementUsageCountIfAvailable(@Param("promotionId") String promotionId);

    /**
     * Find promotions by status and endDate before a specific date
     * Used by scheduler to find expired promotions
     */
    List<Promotion> findByStatusAndEndDateBefore(PromotionStatus status, LocalDate date);

    /**
     * Find promotions by status with startDate and endDate range
     * Used by scheduler to find promotions that should be activated
     */
    @Query("SELECT p FROM Promotion p WHERE " +
           "p.status = :status AND " +
           "p.startDate <= :startDate AND " +
           "p.endDate >= :endDate")
    List<Promotion> findByStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            @Param("status") PromotionStatus status,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    /**
     * Count promotions by status
     * Used by scheduler for status summary
     */
    long countByStatus(PromotionStatus status);

    /**
     * Count promotions by status with endDate in a specific range
     * Used by scheduler to count promotions expiring soon
     */
    long countByStatusAndEndDateBetween(PromotionStatus status, LocalDate startDate, LocalDate endDate);

    /**
     * Count promotions by status with startDate in a specific range
     * Used by scheduler to count promotions starting soon
     */
    long countByStatusAndStartDateBetween(PromotionStatus status, LocalDate startDate, LocalDate endDate);
}
