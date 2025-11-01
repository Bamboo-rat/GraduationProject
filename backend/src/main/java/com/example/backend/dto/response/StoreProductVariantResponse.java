package com.example.backend.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class StoreProductVariantResponse {
    // Từ Product
    private String productId;
    private String productName;
    private String categoryName;

    // Từ ProductVariant
    private String variantId;
    private String variantName;
    private String sku;
    private BigDecimal originalPrice;
    private BigDecimal discountPrice;
    private LocalDate expiryDate;
    private boolean isAvailable; // Logic từ ProductVariant.isAvailable()
    private List<ProductImageResponse> variantImages;

    // Từ StoreProduct (Thông tin tại cửa hàng)
    private int stockQuantity;
    private BigDecimal priceOverride;
}
