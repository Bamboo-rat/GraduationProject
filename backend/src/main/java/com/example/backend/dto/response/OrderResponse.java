package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {

    private String orderId;
    private String orderCode;
    private String customerId;
    private String customerName;
    private String storeId;
    private String storeName;
    private BigDecimal totalAmount;
    private String status;
    private String paymentStatus;
    private String paymentMethod;
    private String shippingAddress;
    private String trackingNumber;
    private String shipmentStatus;
    private List<OrderItemResponse> items;
    private List<String> appliedPromotions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemResponse {
        private String orderDetailId;
        private String productName;
        private String variantName;
        private String productImage;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal amount;
        private Boolean canReview;
        private Boolean hasReviewed;
    }
}
