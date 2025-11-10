package com.example.backend.dto.response;

import com.example.backend.entity.enums.ProductStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Lightweight product response for list/grid views
 * Contains only essential information to reduce payload size and improve performance
 * Use ProductResponse for detailed product view
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductSummaryResponse {

    private String productId;
    private String name;
    private String description;
    private ProductStatus status;
    
    // Category info
    private String categoryId;
    private String categoryName;
    
    // Supplier info
    private String supplierId;
    private String supplierName;
    
    // Suspension info (if suspended)
    private String suspensionReason;
    
    // Single representative image (first image only)
    private String thumbnailUrl;
    
    // Price range (from variants)
    private PriceRange priceRange;
    
    // Inventory summary
    private Integer totalInventory;           // Total stock across all variants + stores
    private Long availableVariantCount;       // Number of variants in stock and not expired
    private Long totalVariantCount;           // Total number of variants
    
    // Quick status flags
    private Boolean hasStock;                 // Has any stock available
    private Boolean hasDiscount;              // Has any variant with discount
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PriceRange {
        private BigDecimal minPrice;
        private BigDecimal maxPrice;
        private BigDecimal minDiscountPrice;  // null if no discount
        private BigDecimal maxDiscountPrice;  // null if no discount
    }
}
