package com.example.backend.service;

import com.example.backend.entity.Customer;
import com.example.backend.entity.enums.ViolationType;

public interface AutomatedSuspensionService {

    /**
     * Check and enforce spam/comment violation rules
     * Rules:
     * - >= 5 comments within 1 day → 1st warning
     * - >= 10 violating comments → 3-day suspension
     * - More violations after suspension → permanent ban
     */
    void checkSpamViolations(String customerId);

    /**
     * Record a comment/review for tracking
     */
    void recordComment(String customerId, String commentId, String commentType);

    /**
     * Record a violating comment (reported or banned keywords)
     */
    void recordViolatingComment(String customerId, String commentId, String reason);

    /**
     * Check and enforce order cancellation rules
     * Rules:
     * - >= 5 consecutive cancellations within 7 days → warning
     * - >= 10 consecutive cancellations within 30 days → 7-day suspension
     * - >= 20 cancellations within 60 days → permanent ban
     */
    void checkCancellationViolations(String customerId);

    /**
     * Record an order cancellation
     */
    void recordOrderCancellation(String customerId, String orderId, boolean customerFault);

    /**
     * Check and enforce community report rules
     * Rules:
     * - >= 3 confirmed reports → auto-suspend pending admin review
     */
    void checkCommunityReports(String customerId);

    /**
     * Record a community report
     */
    void recordCommunityReport(String customerId, String reportedBy, String reason, String referenceId);

    /**
     * Automatically reinstate customers whose suspension period has expired
     */
    void processExpiredSuspensions();

    /**
     * Get violation summary for a customer
     */
    ViolationSummary getViolationSummary(String customerId);

    /**
     * Manually resolve a violation (admin action)
     */
    void resolveViolation(String violationId, String adminId, String notes);

    /**
     * Check if customer should be automatically suspended
     */
    boolean shouldAutoSuspend(Customer customer);

    /**
     * Apply suspension to customer
     */
    void applySuspension(String customerId, int durationDays, String reason, ViolationType violationType);

    /**
     * Apply permanent ban to customer
     */
    void applyPermanentBan(String customerId, String reason, ViolationType violationType);

    /**
     * Issue warning to customer
     */
    void issueWarning(String customerId, String reason, ViolationType violationType);

    /**
     * DTO for violation summary
     */
    record ViolationSummary(
            long totalViolations,
            long activeWarnings,
            long activeSuspensions,
            long permanentBans,
            long spamCount24h,
            long violatingCommentsCount,
            long cancellationsLast7Days,
            long cancellationsLast30Days,
            long cancellationsLast60Days,
            long confirmedReports,
            boolean isCurrentlySuspended,
            String suspendedUntil
    ) {}
}
