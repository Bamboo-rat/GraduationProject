package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Nested response for mobile: Store -> Categories -> Products
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreWithCategoriesResponse {

    // Store info
    private String storeId;
    private String storeName;
    private String description;
    private String phoneNumber;
    private String status;
    private String imageUrl;
    
    // Nested categories with their products
    private List<CategoryWithProductsResponse> categories;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryWithProductsResponse {
        private String categoryId;
        private String categoryName;
        private String categoryDescription;
        private String categoryImageUrl;
        private Integer availableProductCount;
        
        // Products in this category at this store
        private List<StoreProductVariantResponse> products;
    }
}
