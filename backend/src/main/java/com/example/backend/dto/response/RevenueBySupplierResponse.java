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
    
    // Revenue breakdown
    private BigDecimal totalGMV;  // Total GMV (totalAmount + shippingFee)
    private BigDecimal totalProductRevenue;  // Product revenue only
    private BigDecimal totalShippingFee;  // Shipping fees
    private BigDecimal platformCommission;  // Platform revenue (commission + shipping)
    private BigDecimal supplierEarnings;  // Supplier gross earnings
    
    // Legacy for backward compatibility
    private BigDecimal totalRevenue;  // Same as totalGMV
    
    private Double revenuePercentage;  // % of total supplier earnings
    private Long productCount;
    private Long storeCount;
    private Double commissionRate;  // Supplier's commission rate
}
