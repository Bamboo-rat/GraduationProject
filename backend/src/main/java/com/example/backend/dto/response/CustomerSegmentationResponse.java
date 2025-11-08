package com.example.backend.dto.response;

import com.example.backend.entity.enums.CustomerTier;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerSegmentationResponse {
    private CustomerTier tier;
    private Long customerCount;
    private Double customerPercentage;
    private BigDecimal totalRevenue;
    private Double revenuePercentage;
    private BigDecimal averageOrderValue;
    private Double averageOrdersPerCustomer;
    private Long totalOrders;
}
