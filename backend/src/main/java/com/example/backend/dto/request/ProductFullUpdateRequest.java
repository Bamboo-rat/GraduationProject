package com.example.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductFullUpdateRequest {

    // Product basic info
    @NotBlank(message = "Product name is required")
    @Size(max = 200, message = "Product name must not exceed 200 characters")
    private String name;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    @NotBlank(message = "Category ID is required")
    private String categoryId;

    // Attributes
    @Valid
    private List<AttributeUpdateRequest> attributes = new ArrayList<>();

    // Variants - can add new, update existing, or mark for deletion
    @Valid
    @NotNull(message = "Variants list is required")
    @Size(min = 1, message = "At least one variant is required")
    private List<VariantUpdateRequest> variants = new ArrayList<>();

    // Product-level images (shared by all variants)
    @Valid
    private List<ImageUpdateRequest> productImages = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttributeUpdateRequest {
        private String attributeId;  // null if new attribute
        private String attributeName;
        private String attributeValue;
        private Boolean delete = false;  // true to mark for deletion
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VariantUpdateRequest {
        private String variantId;  // null if new variant
        
        @NotBlank(message = "Variant name is required")
        private String name;
        
        private String sku;  // can be auto-generated if null
        
        @NotNull(message = "Original price is required")
        private BigDecimal originalPrice;
        
        private BigDecimal discountPrice;
        
        private LocalDate manufacturingDate;
        
        @NotNull(message = "Expiry date is required")
        private LocalDate expiryDate;
        
        private Boolean delete = false;  // true to mark for deletion
        
        // Variant-specific images
        @Valid
        private List<ImageUpdateRequest> variantImages = new ArrayList<>();
        
        // Store inventory for this variant
        @Valid
        private List<StoreInventoryUpdateRequest> storeInventory = new ArrayList<>();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImageUpdateRequest {
        private String imageId;  // null if new image
        private String imageUrl;
        private Boolean isPrimary = false;
        private Boolean delete = false;  // true to mark for deletion
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StoreInventoryUpdateRequest {
        @NotBlank(message = "Store ID is required")
        private String storeId;
        
        @NotNull(message = "Stock quantity is required")
        private Integer stockQuantity;
        
        private BigDecimal priceOverride;
    }
}
