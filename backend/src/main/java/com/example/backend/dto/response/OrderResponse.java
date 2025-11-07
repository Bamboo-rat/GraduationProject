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

    private String id;
    private String orderId; // Deprecated, use 'id'
    private String orderCode;
    
    // Customer info
    private String customerId;
    private String customerName;
    private String customerPhone;
    private String customerEmail;
    
    // Store/Supplier info
    private String storeId;
    private String storeName;
    private String supplierId;
    private String supplierName;
    
    // Order items
    private List<OrderItemResponse> items;
    
    // Status
    private String status;
    private List<OrderStatusHistoryResponse> statusHistory;
    
    // Pricing
    private BigDecimal subtotal;
    private BigDecimal shippingFee;
    private BigDecimal discount;
    private BigDecimal totalAmount;
    
    // Payment
    private String paymentMethod;
    private String paymentStatus;
    
    // Shipping
    private OrderAddressResponse shippingAddress;
    private String trackingNumber;
    private String shipmentStatus;
    
    // Notes
    private String note;
    private String cancelReason;
    
    // Dates
    private String estimatedDeliveryDate;
    private String actualDeliveryDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime confirmedAt;
    private LocalDateTime shippedAt;
    private LocalDateTime deliveredAt;
    private LocalDateTime cancelledAt;
    
    // Legacy
    private List<String> appliedPromotions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemResponse {
        private String id;
        private String orderDetailId; // Deprecated, use 'id'
        private String productId;
        private String productName;
        private String variantId;
        private String variantName;
        private String imageUrl;
        private String productImage; // Deprecated, use 'imageUrl'
        private Integer quantity;
        private BigDecimal price;
        private BigDecimal unitPrice; // Deprecated, use 'price'
        private BigDecimal subtotal;
        private BigDecimal amount; // Deprecated, use 'subtotal'
        private Boolean canReview;
        private Boolean hasReviewed;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderAddressResponse {
        private String recipientName;
        private String phoneNumber;
        private String addressLine;
        private String ward;
        private String district;
        private String city;
        private String fullAddress;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderStatusHistoryResponse {
        private String status;
        private LocalDateTime timestamp;
        private String note;
        private String updatedBy;
    }
}
