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

    // GMV & Revenue breakdown
    private BigDecimal totalGMV;  // Total Gross Merchandise Value (totalAmount + shippingFee)
    private BigDecimal totalProductRevenue;  // Revenue from products only
    private BigDecimal totalShippingFee;  // Total shipping fees collected
    private BigDecimal totalPlatformRevenue;  // Platform's revenue (commission + shipping)
    private BigDecimal totalSupplierEarnings;  // Supplier's gross earnings (before costs)
    
    // Legacy field for backward compatibility (same as totalGMV)
    private BigDecimal totalRevenue;
    private BigDecimal totalCommission;  // Product commission only (for comparison)
    
    private Long totalOrders;
    private Long completedOrders;
    private Long cancelledOrders;

    // Average metrics
    private BigDecimal averageOrderValue;  // Average GMV per order
    private BigDecimal averageDailyRevenue;  // Average daily GMV
    private Double averageCommissionRate;  // Average commission rate across all suppliers

    // Growth metrics (compared to previous period)
    private Double revenueGrowthRate;
    private Double orderGrowthRate;

    // Top performers
    private String topSupplierName;
    private BigDecimal topSupplierRevenue;
    private String topCategoryName;
    private BigDecimal topCategoryRevenue;
}
