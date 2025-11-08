package com.example.backend.dto.response;

import com.example.backend.entity.enums.CustomerTier;
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
public class CustomerLifetimeValueResponse {
    private String customerId;
    private String fullName;
    private String email;
    private String phoneNumber;
    private CustomerTier tier;
    private LocalDateTime registeredAt;

    // Lifetime metrics
    private BigDecimal totalSpent;
    private Long totalOrders;
    private Long completedOrders;
    private Long cancelledOrders;
    private BigDecimal averageOrderValue;

    // Behavior metrics
    private Long daysSinceRegistration;
    private Long daysSinceLastOrder;
    private Double orderFrequency; // orders per month
    private Double repeatPurchaseRate; // percentage
    private Long favoriteStoreCount;

    // Predicted CLV
    private BigDecimal predictedLifetimeValue;
    private String customerSegment; // High Value, Medium Value, Low Value, At Risk
}
