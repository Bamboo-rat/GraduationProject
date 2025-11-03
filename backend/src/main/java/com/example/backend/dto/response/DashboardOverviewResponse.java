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
public class DashboardOverviewResponse {

    // Total counts
    private Long totalOrders;
    private Long totalCustomers;
    private Long totalSuppliers;
    private Long totalProducts;
    private Long totalStores;

    // Revenue metrics
    private BigDecimal totalRevenue;
    private BigDecimal todayRevenue;
    private BigDecimal monthRevenue;

    // Order metrics
    private Long pendingOrders;
    private Long confirmedOrders;
    private Long preparingOrders;
    private Long shippingOrders;
    private Long deliveredOrders;
    private Long cancelledOrders;

    // Growth metrics (compared to previous period)
    private Double revenueGrowthRate;  // Percentage
    private Double orderGrowthRate;    // Percentage
    private Double customerGrowthRate; // Percentage

    // Product metrics
    private Long activeProducts;
    private Long lowStockProducts;     // Stock < 10
    private Long outOfStockProducts;   // Stock = 0
}
