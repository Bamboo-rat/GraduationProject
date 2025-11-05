package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShippingPartnerOrderResponse {

    private String trackingNumber;
    private String orderId;
    private String orderCode;
    private String shippingProvider;
    private String orderStatus;
    private String shipmentStatus;
    private String storeName;
    private String customerName;
    private String customerPhone;
    private String shippingAddress;
    private BigDecimal codAmount;
    private LocalDateTime createdAt;
    private LocalDateTime estimatedDeliveryDate;
    private LocalDateTime deliveredAt;
}