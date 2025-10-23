package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartnerPerformanceMetrics {

    // Supplier info
    private String supplierId;
    private String businessName;
    private String avatarUrl;

    // Store metrics
    private Long totalStores;
    private Long activeStores;      // Store.status = ACTIVE
    private Long inactiveStores;

    // Product metrics
    private Long totalProducts;
    private Long activeProducts;    // Product.status = ACTIVE or AVAILABLE
    private Long outOfStockProducts;

    // Order metrics
    private Long totalOrders;
    private Long completedOrders;
    private Long cancelledOrders;
    private Double orderCompletionRate;      // Percentage
    private Double orderCancellationRate;    // Percentage

    // Revenue metrics (optional - to be implemented later)
    private Double totalRevenue;
    private Double commission;

    // Time period (optional)
    private LocalDateTime periodStart;
    private LocalDateTime periodEnd;

    // Last updated
    private LocalDateTime lastUpdated;

    /**
     * Calculate completion rate from completed and total orders
     */
    public void calculateRates() {
        if (totalOrders != null && totalOrders > 0) {
            this.orderCompletionRate = (completedOrders != null)
                ? Math.round((completedOrders * 100.0 / totalOrders) * 100.0) / 100.0
                : 0.0;

            this.orderCancellationRate = (cancelledOrders != null)
                ? Math.round((cancelledOrders * 100.0 / totalOrders) * 100.0) / 100.0
                : 0.0;
        } else {
            this.orderCompletionRate = 0.0;
            this.orderCancellationRate = 0.0;
        }

        this.lastUpdated = LocalDateTime.now();
    }
}
