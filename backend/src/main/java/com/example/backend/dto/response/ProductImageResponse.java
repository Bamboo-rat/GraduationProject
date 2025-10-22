package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductImageResponse {

    private String imageId;
    private String imageUrl;
    private boolean isPrimary;
    
    // Để biết ảnh này thuộc về product hay variant
    private String productId;    // Nếu là ảnh chung của sản phẩm
    private String variantId;    // Nếu là ảnh riêng của biến thể
}
