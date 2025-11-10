package com.example.backend.scheduler;

import com.example.backend.entity.Promotion;
import com.example.backend.entity.enums.PromotionStatus;
import com.example.backend.repository.PromotionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Scheduler for automatically updating promotion statuses based on dates
 * - Activates promotions that have reached their start date
 * - Deactivates promotions that have passed their end date
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PromotionStatusScheduler {

    private final PromotionRepository promotionRepository;

    /**
     * Automatically deactivate expired promotions
     * Runs daily at 00:01:00 (1 minute after midnight)
     * Updates ACTIVE promotions whose endDate has passed to INACTIVE
     */
    @Scheduled(cron = "0 1 0 * * ?")
    @Transactional
    public void deactivateExpiredPromotions() {
        log.info("Starting scheduled task: Deactivate expired promotions");

        try {
            LocalDate today = LocalDate.now();

            // Find all ACTIVE promotions whose endDate is before today
            List<Promotion> expiredPromotions = promotionRepository
                    .findByStatusAndEndDateBefore(PromotionStatus.ACTIVE, today);

            if (expiredPromotions.isEmpty()) {
                log.info("No expired promotions found");
                return;
            }

            int deactivatedCount = 0;
            int unhighlightedCount = 0;
            for (Promotion promotion : expiredPromotions) {
                log.info("Deactivating expired promotion: {} (code: {}, endDate: {})",
                        promotion.getPromotionId(), promotion.getCode(), promotion.getEndDate());

                promotion.setStatus(PromotionStatus.INACTIVE);
                
                // Automatically remove highlighted status when promotion expires
                if (promotion.isHighlighted()) {
                    promotion.setHighlighted(false);
                    unhighlightedCount++;
                    log.info("Removed highlighted status from expired promotion: {}", promotion.getCode());
                }
                
                promotionRepository.save(promotion);
                deactivatedCount++;
            }

            log.info("Successfully deactivated {} expired promotions (removed highlight from {})", 
                    deactivatedCount, unhighlightedCount);

        } catch (Exception e) {
            log.error("Error during deactivation of expired promotions", e);
        }
    }

    /**
     * Automatically activate promotions that have reached their start date
     * Runs daily at 00:02:00 (2 minutes after midnight)
     * Updates INACTIVE promotions whose startDate has arrived to ACTIVE
     * (only if they haven't expired yet)
     */
    @Scheduled(cron = "0 2 0 * * ?")
    @Transactional
    public void activatePendingPromotions() {
        log.info("Starting scheduled task: Activate pending promotions");

        try {
            LocalDate today = LocalDate.now();

            // Find all INACTIVE promotions whose startDate has arrived (but not expired)
            List<Promotion> pendingPromotions = promotionRepository
                    .findByStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                            PromotionStatus.INACTIVE, today, today);

            if (pendingPromotions.isEmpty()) {
                log.info("No pending promotions to activate");
                return;
            }

            int activatedCount = 0;
            for (Promotion promotion : pendingPromotions) {
                log.info("Activating promotion: {} (code: {}, startDate: {}, endDate: {})",
                        promotion.getPromotionId(), promotion.getCode(),
                        promotion.getStartDate(), promotion.getEndDate());

                promotion.setStatus(PromotionStatus.ACTIVE);
                promotionRepository.save(promotion);
                activatedCount++;
            }

            log.info("Successfully activated {} pending promotions", activatedCount);

        } catch (Exception e) {
            log.error("Error during activation of pending promotions", e);
        }
    }

    /**
     * Log promotion status summary
     * Runs daily at 09:00:00 (9 AM)
     * Provides a summary of promotion statuses for monitoring
     */
    @Scheduled(cron = "0 0 9 * * ?")
    @Transactional(readOnly = true)
    public void logPromotionStatusSummary() {
        log.info("Starting scheduled task: Promotion status summary");

        try {
            LocalDate today = LocalDate.now();

            long activeCount = promotionRepository.countByStatus(PromotionStatus.ACTIVE);
            long inactiveCount = promotionRepository.countByStatus(PromotionStatus.INACTIVE);

            // Count promotions expiring soon (within 3 days)
            LocalDate threeDaysFromNow = today.plusDays(3);
            long expiringSoonCount = promotionRepository
                    .countByStatusAndEndDateBetween(PromotionStatus.ACTIVE, today, threeDaysFromNow);

            // Count promotions starting soon (within 3 days)
            long startingSoonCount = promotionRepository
                    .countByStatusAndStartDateBetween(PromotionStatus.INACTIVE, today, threeDaysFromNow);

            log.info("=== Promotion Status Summary ===");
            log.info("Active promotions: {}", activeCount);
            log.info("Inactive promotions: {}", inactiveCount);
            log.info("Promotions expiring within 3 days: {}", expiringSoonCount);
            log.info("Promotions starting within 3 days: {}", startingSoonCount);
            log.info("===============================");

        } catch (Exception e) {
            log.error("Error during promotion status summary", e);
        }
    }
}
