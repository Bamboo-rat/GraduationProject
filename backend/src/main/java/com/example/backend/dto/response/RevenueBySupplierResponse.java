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
public class RevenueBySupplierResponse {
    private String supplierId;
    private String supplierName;
    private String avatarUrl;
    private Long totalOrders;
    private BigDecimal totalRevenue;
    private BigDecimal platformCommission;
    private BigDecimal supplierEarnings;
    private Double revenuePercentage;
    private Long productCount;
    private Long storeCount;
}
