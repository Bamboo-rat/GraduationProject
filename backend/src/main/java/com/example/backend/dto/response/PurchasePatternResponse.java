package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchasePatternResponse {
    // Time patterns
    private String period; // e.g., "Morning", "Afternoon", "Evening", "Night"
    private Long orderCount;
    private Double orderPercentage;

    // Day of week patterns
    private String dayOfWeek; // Monday, Tuesday, etc.
    private BigDecimal averageOrderValue;

    // Category preferences
    private String topCategoryName;
    private Long categoryOrderCount;

    // Return patterns
    private Long totalReturns;
    private Double returnRate; // percentage
    private String topReturnReason;

    // Repeat purchase behavior
    private Long repeatCustomers;
    private Long oneTimeCustomers;
    private Double repeatCustomerRate; // percentage
    private Double averageDaysBetweenOrders;
}
