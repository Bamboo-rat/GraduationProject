package com.example.backend.dto.request;

import com.example.backend.entity.enums.PromotionStatus;
import com.example.backend.entity.enums.PromotionTier;
import com.example.backend.entity.enums.PromotionType;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PromotionRequest {

    @NotBlank(message = "Promotion code is required")
    @Size(max = 50, message = "Promotion code must not exceed 50 characters")
    private String code;

    @NotBlank(message = "Promotion title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;

    @NotNull(message = "Promotion type is required")
    private PromotionType type;

    @NotNull(message = "Promotion tier is required")
    private PromotionTier tier;

    @NotNull(message = "Discount value is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Discount value must be greater than 0")
    private BigDecimal discountValue;

    @DecimalMin(value = "0.0", message = "Minimum order amount must be greater than or equal to 0")
    private BigDecimal minimumOrderAmount;

    @DecimalMin(value = "0.0", message = "Max discount amount must be greater than or equal to 0")
    private BigDecimal maxDiscountAmount;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @Min(value = 1, message = "Total usage limit must be at least 1")
    private Integer totalUsageLimit;

    @Min(value = 1, message = "Usage per customer limit must be at least 1")
    private Integer usagePerCustomerLimit;

    private PromotionStatus status;

    private Boolean isHighlighted;
}
