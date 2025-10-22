package com.example.backend.dto.response;

import com.example.backend.entity.enums.PromotionStatus;
import com.example.backend.entity.enums.PromotionTier;
import com.example.backend.entity.enums.PromotionType;
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
    private boolean isHighlighted;
    private boolean isActive; // Computed field: valid dates + ACTIVE status
    private boolean isExpired; // Computed field: past end date
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
