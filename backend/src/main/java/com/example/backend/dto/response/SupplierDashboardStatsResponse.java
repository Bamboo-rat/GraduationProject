package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for supplier dashboard statistics
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierDashboardStatsResponse {
    private BigDecimal todayRevenue;
    private Long todayOrders;
    private Long pendingOrders;
    private Long lowStockProducts;
    private Long totalProducts;
    private Long activeProducts;
    private BigDecimal monthlyRevenue;
    private Long monthlyOrders;
    private Long unrepliedReviews;
    private Long expiringProducts;
    private Long overdueOrders;
}
