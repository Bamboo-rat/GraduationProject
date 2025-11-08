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
public class WasteSummaryResponse {
    private LocalDateTime startDate;
    private LocalDateTime endDate;

    // Overall metrics
    private Long totalProducts;
    private Long activeProducts;
    private Long soldOutProducts;
    private Long expiredProducts;
    private Long nearExpiryProducts; // expires within 7 days

    // Quantity metrics
    private Long totalStockQuantity;
    private Long soldQuantity;
    private Long unsoldQuantity;
    private Long expiredQuantity;

    // Financial metrics
    private BigDecimal totalStockValue;
    private BigDecimal soldValue;
    private BigDecimal unsoldValue;
    private BigDecimal wasteValue;
    private BigDecimal potentialRevenueLoss;

    // Performance metrics
    private Double sellThroughRate; // percentage
    private Double wasteRate; // percentage
    private Double expiryRate; // percentage
    private Double overallWasteIndex; // 0-100

    // Comparison to previous period
    private Double wasteRateChange; // percentage change
    private String wasteRateTrend; // IMPROVING, STABLE, WORSENING

    // Top contributors
    private String topWasteCategoryName;
    private BigDecimal topWasteCategoryValue;
    private String topWasteSupplierName;
    private BigDecimal topWasteSupplierValue;
}
