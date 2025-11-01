package com.example.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class StoreInventoryRequest {

    @NotBlank(message = "Store ID is required")
    private String storeId;

    // For updates: use existing variant SKU
    private String variantSku;

    // For creation: use variant index (position in variants array)
    @Min(value = 0, message = "Variant index must be at least 0")
    private Integer variantIndex;

    @Min(value = 0, message = "Stock quantity must be at least 0")
    private int stockQuantity;

    // Giá đặc biệt tại cửa hàng này (optional)
    private BigDecimal priceOverride;
}
