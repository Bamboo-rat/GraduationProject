package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariantResponse {

    private String variantId;
    private String name;
    private String sku;
    private BigDecimal originalPrice;
    private BigDecimal discountPrice;
    private LocalDate manufacturingDate;
    private LocalDate expiryDate;
    
    // Danh sách ảnh riêng cho biến thể này
    private List<ProductImageResponse> variantImages;
}
