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
public class CustomerBehaviorSummaryResponse {
    private LocalDateTime startDate;
    private LocalDateTime endDate;

    // Customer metrics
    private Long totalCustomers;
    private Long activeCustomers; // customers with orders in period
    private Long newCustomers;
    private Long returningCustomers;

    // Engagement metrics
    private Double activeCustomerRate; // percentage
    private Double repeatPurchaseRate; // percentage
    private Double customerRetentionRate; // percentage
    private Double customerChurnRate; // percentage

    // Value metrics
    private BigDecimal averageCustomerLifetimeValue;
    private BigDecimal averageOrderValue;
    private Double averageOrdersPerCustomer;
    private BigDecimal totalCustomerValue;

    // Tier distribution
    private Long bronzeTierCount;
    private Long silverTierCount;
    private Long goldTierCount;
    private Long platinumTierCount;
    private Long diamondTierCount;
}
