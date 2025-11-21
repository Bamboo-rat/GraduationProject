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
public class WasteBySupplierResponse {
    private String supplierId;
    private String supplierName;
    private String avatarUrl;

    // Product metrics
    private Long totalProducts;
    private Long activeProducts;
    private Long unsoldProducts;
    private Long expiredProducts;

    // Store metrics
    private Long totalStores;
    private Long activeStores;

    // Quantity metrics
    private Long totalStockQuantity;
    private Long soldQuantity;
    private Long unsoldQuantity;
    private Long expiredQuantity;

    // Financial metrics
    private BigDecimal totalRevenue;
    private BigDecimal potentialRevenueLoss;
    private BigDecimal wasteValue;

    // Performance metrics
    private Double sellThroughRate; // sold / total stock (percentage)
    private Double wasteRate; // equals expiryRate in SaveFood model (percentage)
    private Double expiryRate; // expired / total stock (percentage)
    private Double remainingRate; // remaining stock / total stock (unsold but not expired)
    private Double wasteIndex; // composite waste performance (expiryRate × 0.7 + remainingRate × 0.3)
    private String performanceRating; // EXCELLENT, GOOD, FAIR, POOR
}
