package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
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
    @Builder.Default
    private List<ProductImageResponse> variantImages = new ArrayList<>();
    
    // Thông tin tồn kho chi tiết
    private Integer totalStock;        // Tổng tồn kho tất cả cửa hàng
    private Boolean isOutOfStock;      // Có hết hàng không (totalStock = 0)
    private Boolean isExpired;         // Có quá hạn không
    private Boolean isAvailable;       // Có sẵn để mua không (còn hàng + chưa hết hạn)
    
    // Danh sách tồn kho theo từng cửa hàng (optional, để frontend hiển thị chi tiết)
    @Builder.Default
    private List<StoreStockInfo> storeStocks = new ArrayList<>();
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StoreStockInfo {
        private String storeProductId;   
        private String storeId;
        private String storeName;
        private Integer stockQuantity;
        private BigDecimal priceOverride;  // Giá đặc biệt tại cửa hàng này (nếu có)
    }
}
