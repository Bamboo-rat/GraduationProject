package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Comprehensive customer details for admin management and evaluation
 * Includes all information needed to assess customer behavior and make ban decisions
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDetailResponse {

    // ==================== A. BASIC INFORMATION ====================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BasicInfo {
        // Personal Information
        private String userId;
        private String keycloakId;
        private String username;
        private String email;
        private String phoneNumber;
        private String fullName;
        private LocalDate dateOfBirth;
        private String avatarUrl;

        // Account Status
        private String status; // PENDING_VERIFICATION, ACTIVE, SUSPENDED, BANNED
        private boolean active;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private LocalDateTime lastLoginAt;

        // Membership Level
        private String tier; // BRONZE, SILVER, GOLD, PLATINUM, DIAMOND
        private LocalDateTime tierUpdatedAt;
        private int currentPoints;
        private int lifetimePoints;
        private int pointsThisYear;
        private int pointsToNextTier;
    }

    private BasicInfo basicInfo;

    // ==================== B. ACTIVITY HISTORY ====================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderSummary {
        private String orderId;
        private String orderCode;
        private String storeName;
        private BigDecimal totalAmount;
        private String status;
        private LocalDateTime createdAt;
        private LocalDateTime deliveredAt;
        private boolean wasCanceled;
        private String cancelReason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PointTransaction {
        private String transactionId;
        private String type; // EARNED, REDEEMED, EXPIRED, ADJUSTED
        private int points;
        private String description;
        private String relatedOrderCode;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddressSummary {
        private String addressId;
        private String fullName;
        private String phoneNumber;
        private String fullAddress;
        private boolean isDefault;
        private int orderCount; // How many times this address was used
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReviewSummary {
        private String reviewId;
        private String productName;
        private String storeName;
        private int rating;
        private String comment;
        private LocalDateTime createdAt;
        private boolean hasBeenReported;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PromotionUsageSummary {
        private String promotionCode;
        private String promotionTitle;
        private BigDecimal discountAmount;
        private String orderCode;
        private LocalDateTime usedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivityHistory {
        private List<OrderSummary> recentOrders; // Last 20 orders
        private List<PointTransaction> recentPointTransactions; // Last 20 transactions
        private List<AddressSummary> addresses; // All addresses
        private List<ReviewSummary> recentReviews; // Last 20 reviews
        private List<PromotionUsageSummary> recentPromotionUsage; // Last 20 promotions
    }

    private ActivityHistory activityHistory;

    // ==================== C. VIOLATIONS & DISCIPLINE ====================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ViolationRecord {
        private String recordId;
        private String violationType; // EXCESSIVE_CANCELLATIONS, FAKE_REVIEWS, etc.
        private String severity; // LOW, MEDIUM, HIGH, CRITICAL
        private String description;
        private String actionTaken; // WARNING, POINTS_DEDUCTION, TEMPORARY_SUSPENSION, PERMANENT_BAN
        private Integer suspensionDurationDays;
        private LocalDateTime suspendedUntil;
        private LocalDateTime reinstatedAt;
        private boolean isResolved;
        private String referenceId; // Order/Review ID related to violation
        private String referenceType;
        private LocalDateTime createdAt;
        private String reviewedByAdmin;
        private String adminNotes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ViolationsDiscipline {
        private List<ViolationRecord> violationHistory; // All violations
        private List<ViolationRecord> activeWarnings; // Unresolved warnings
        private List<ViolationRecord> suspensionHistory; // Past suspensions
        private int totalViolations;
        private int activeWarningsCount;
        private int totalSuspensions;
        private int violationPoints; // Accumulated points (can be used for auto-ban)
        private boolean isCurrentlySuspended;
        private LocalDateTime currentSuspensionEndsAt;
    }

    private ViolationsDiscipline violationsDiscipline;

    // ==================== D. BEHAVIORAL STATISTICS ====================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FavoriteStoreSummary {
        private String storeId;
        private String storeName;
        private int orderCount;
        private BigDecimal totalSpent;
        private LocalDateTime lastOrderDate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BehavioralStatistics {
        // Order Statistics
        private int totalOrders;
        private int completedOrders;
        private int canceledOrders;
        private int returnedOrders;
        private BigDecimal totalOrderValue;
        private BigDecimal averageOrderValue;

        // Purchase Behavior
        private double purchaseFrequency; // Orders per month
        private double cancellationRate; // Percentage of canceled orders
        private double returnRate; // Percentage of returned orders
        private int daysSinceLastOrder;
        private int daysSinceFirstOrder;

        // Rating & Reviews
        private double averageRatingGiven; // Average rating customer gives in reviews
        private int totalReviews;
        private int reportedReviews; // Reviews reported by others

        // Favorite Stores
        private List<FavoriteStoreSummary> topFavoriteStores; // Top 5 stores by order count

        // Monthly Activity
        private int ordersThisMonth;
        private BigDecimal spendingThisMonth;
        private int ordersLastMonth;
        private BigDecimal spendingLastMonth;

        // Risk Indicators (for ban evaluation)
        private boolean hasHighCancellationRate; // > 30%
        private boolean hasHighReturnRate; // > 20%
        private boolean hasReportedReviews;
        private boolean hasActiveViolations;
        private int riskScore; // 0-100, higher = more risky
    }

    private BehavioralStatistics behavioralStatistics;

    // ==================== EVALUATION RECOMMENDATION ====================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EvaluationRecommendation {
        private String recommendation; // ALLOW, WARN, SUSPEND, BAN
        private String reason;
        private int confidenceScore; // 0-100
        private List<String> riskFactors;
        private List<String> positiveFactors;
    }

    private EvaluationRecommendation evaluationRecommendation;
}
