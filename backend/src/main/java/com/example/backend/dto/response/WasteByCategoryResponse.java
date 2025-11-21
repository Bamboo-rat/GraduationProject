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
public class WasteByCategoryResponse {
    private String categoryId;
    private String categoryName;
    private String categoryImageUrl;

    // Product metrics
    private Long totalProducts;
    private Long unsoldProducts;
    private Long expiredProducts;
    private Long nearExpiryProducts; // expires within 7 days

    // Quantity metrics
    private Long totalStockQuantity;
    private Long unsoldQuantity;
    private Long expiredQuantity;

    // Financial metrics
    private BigDecimal totalStockValue;
    private BigDecimal unsoldValue;
    private BigDecimal wasteValue;

    // Waste index (percentage)
    private Double wasteRate; // equals expiryRate in SaveFood model
    private Double expiryRate; // expired / total stock
    private Double remainingRate; // remaining stock / total stock (unsold but not expired)
    private Double wasteIndex; // composite waste metric (expiryRate × 0.7 + remainingRate × 0.3)
}
