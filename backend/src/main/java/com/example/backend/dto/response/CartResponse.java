package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartResponse {

    private String cartId;
    private String customerId;
    private String storeId;
    private String storeName;
    private BigDecimal total;
    private List<CartItemResponse> items;
    private List<String> appliedPromotions;
    private Integer itemCount;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CartItemResponse {
        private String cartDetailId;
        private String storeProductId;
        private String storeId;
        private String productId;
        private String variantId;
        private String sku;
        private String productName;
        private String variantName;
        private String productImage;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal amount;
        private Integer availableStock;
        private Boolean isAvailable;
    }
}
