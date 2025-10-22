package com.example.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class StoreInventoryRequest {

    @NotBlank(message = "Store ID is required")
    private String storeId;

    @NotBlank(message = "Variant SKU is required")
    private String variantSku;

    @Min(value = 0, message = "Stock quantity must be at least 0")
    private int stockQuantity;

    // Giá đặc biệt tại cửa hàng này (optional)
    private BigDecimal priceOverride;
}
