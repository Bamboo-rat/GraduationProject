package com.example.backend.entity;

import com.example.backend.entity.enums.PromotionValidationStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Tracks all promotion validation attempts (both successful and failed)
 * This helps detect incomplete usage where customers validate but don't apply
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "promotion_validation_logs", indexes = {
    @Index(name = "idx_validation_promotion", columnList = "promotion_id"),
    @Index(name = "idx_validation_customer", columnList = "customer_id"),
    @Index(name = "idx_validation_status", columnList = "status"),
    @Index(name = "idx_validation_created", columnList = "created_at"),
    @Index(name = "idx_validation_promotion_customer", columnList = "promotion_id, customer_id")
})
public class PromotionValidationLog {

    @Id
    @UuidGenerator
    @Column(name = "log_id")
    private String logId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id", nullable = false)
    private Promotion promotion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    /**
     * Status of validation attempt
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PromotionValidationStatus status;

    /**
     * Order amount at time of validation
     */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal orderAmount;

    /**
     * Calculated discount amount (if validation succeeded)
     */
    @Column(precision = 10, scale = 2)
    private BigDecimal discountAmount;

    /**
     * Error message (if validation failed)
     */
    @Column(length = 500)
    private String errorMessage;

    /**
     * Whether this validation was eventually applied to an order
     */
    @Column(nullable = false)
    private boolean applied = false;

    /**
     * Order ID if this validation was applied
     */
    @Column(name = "order_id")
    private String orderId;

    /**
     * When the validation occurred
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * When the promotion was applied (if it was)
     */
    @Column(name = "applied_at")
    private LocalDateTime appliedAt;

    /**
     * Session ID or tracking identifier (optional)
     */
    @Column(name = "session_id", length = 100)
    private String sessionId;
}
