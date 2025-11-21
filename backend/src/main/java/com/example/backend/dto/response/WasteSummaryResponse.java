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

    // NEW DEFINITION - Core waste metrics
    private Long totalListed;    // Tổng số lượng đã niêm yết (from orders + stock)
    private Long totalSold;      // Tổng số lượng đã bán (delivered orders)
    private Long totalUnsold;    // Tổng số lượng chưa bán (canceled + stock + expired)
    // WasteRate = (totalUnsold / totalListed) × 100%

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
    private Long initialStockQuantity;   // Tổng tồn kho ban đầu (sold + current stock)
    private Long currentStockQuantity;   // Tồn kho hiện tại (ACTIVE + INACTIVE + EXPIRED)

    // Financial metrics
    private BigDecimal totalStockValue;
    private BigDecimal soldValue;
    private BigDecimal unsoldValue;
    private BigDecimal wasteValue;
    private BigDecimal potentialRevenueLoss;

    // Performance metrics
    private Double sellThroughRate; // percentage
    private Double wasteRate; // percentage (equals expiryRate in SaveFood model)
    private Double expiryRate; // percentage
    private Double remainingRate; // percentage (unsold but not expired)
    private Double overallWasteIndex; // 0-100 (expiryRate × 0.7 + remainingRate × 0.3)

    // Comparison to previous period
    private Double wasteRateChange; // percentage change
    private String wasteRateTrend; // IMPROVING, STABLE, WORSENING

    // Top contributors
    private String topWasteCategoryName;
    private BigDecimal topWasteCategoryValue;
    private String topWasteSupplierName;
    private BigDecimal topWasteSupplierValue;
}
