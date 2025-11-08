package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnsoldInventoryResponse {
    private String productId;
    private String productName;
    private String variantId;
    private String variantName;
    private String categoryName;
    private String supplierName;
    private String storeName;

    // Inventory details
    private Integer currentStock;
    private Integer initialStock;
    private Integer soldQuantity;
    private LocalDate expiryDate;
    private Integer daysUntilExpiry;

    // Financial impact
    private BigDecimal originalPrice;
    private BigDecimal discountPrice;
    private BigDecimal potentialRevenueLoss;
    private BigDecimal estimatedWasteValue;

    // Status
    private String wasteRiskLevel; // LOW, MEDIUM, HIGH, CRITICAL
    private String productStatus; // ACTIVE, SOLD_OUT, EXPIRED
    private Boolean isNearExpiry; // expires within 7 days
}
