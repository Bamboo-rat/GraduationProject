package com.example.backend.dto.response;

import com.example.backend.entity.enums.ProductStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {

    private String productId;
    private String name;
    private String description;
    private ProductStatus status;
    private String categoryId;
    private String categoryName;
    private String supplierId;
    private String supplierName;

    @Builder.Default
    private List<ProductVariantResponse> variants = new ArrayList<>();

    @Builder.Default
    private List<ProductImageResponse> images = new ArrayList<>();

    @Builder.Default
    private List<ProductAttributeResponse> attributes = new ArrayList<>();
}
