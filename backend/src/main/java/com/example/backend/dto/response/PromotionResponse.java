package com.example.backend.dto.response;

import com.example.backend.entity.enums.PromotionStatus;
import com.example.backend.entity.enums.PromotionTier;
import com.example.backend.entity.enums.PromotionType;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromotionResponse {

    private String promotionId;
    private String code;
    private String title;
    private String description;
    private PromotionType type;
    private PromotionTier tier;
    private BigDecimal discountValue;
    private BigDecimal minimumOrderAmount;
    private BigDecimal maxDiscountAmount;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer totalUsageLimit;
    private Integer usagePerCustomerLimit;
    private Integer currentUsageCount;
    private PromotionStatus status;

    /**
     * Whether this promotion should be highlighted in the UI
     * @JsonProperty ensures Jackson serializes this as "isHighlighted" instead of "highlighted"
     */
    @JsonProperty("isHighlighted")
    private boolean isHighlighted;

    /**
     * Computed field: whether promotion is currently active (valid dates + ACTIVE status)
     * @JsonProperty ensures Jackson serializes this as "isActive" instead of "active"
     */
    @JsonProperty("isActive")
    private boolean isActive;

    /**
     * Computed field: whether promotion has expired (past end date)
     * @JsonProperty ensures Jackson serializes this as "isExpired" instead of "expired"
     */
    @JsonProperty("isExpired")
    private boolean isExpired;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
