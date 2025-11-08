package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevenueSummaryResponse {
    private LocalDateTime startDate;
    private LocalDateTime endDate;

    // Overall metrics
    private BigDecimal totalRevenue;
    private BigDecimal totalCommission;
    private BigDecimal totalSupplierEarnings;
    private Long totalOrders;
    private Long completedOrders;
    private Long cancelledOrders;

    // Average metrics
    private BigDecimal averageOrderValue;
    private BigDecimal averageDailyRevenue;

    // Growth metrics (compared to previous period)
    private Double revenueGrowthRate;
    private Double orderGrowthRate;

    // Top performers
    private String topSupplierName;
    private BigDecimal topSupplierRevenue;
    private String topCategoryName;
    private BigDecimal topCategoryRevenue;
}
