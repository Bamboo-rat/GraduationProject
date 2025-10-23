package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartnerPerformanceSummary {

    // Partner summary
    private Long totalPartners;
    private Long activePartners;        // Supplier.status = ACTIVE
    private Long inactivePartners;
    private Long suspendedPartners;

    // Store summary
    private Long totalStores;
    private Long totalActiveStores;

    // Product summary
    private Long totalProducts;
    private Long totalActiveProducts;

    // Order summary
    private Long totalOrders;
    private Long totalCompletedOrders;
    private Long totalCancelledOrders;

    // Average rates
    private Double averageCompletionRate;
    private Double averageCancellationRate;

    // Revenue summary (optional - to be implemented later)
    private Double totalRevenue;
    private Double totalCommission;

    /**
     * Calculate average rates from totals
     */
    public void calculateAverageRates() {
        if (totalOrders != null && totalOrders > 0) {
            this.averageCompletionRate = (totalCompletedOrders != null)
                ? Math.round((totalCompletedOrders * 100.0 / totalOrders) * 100.0) / 100.0
                : 0.0;

            this.averageCancellationRate = (totalCancelledOrders != null)
                ? Math.round((totalCancelledOrders * 100.0 / totalOrders) * 100.0) / 100.0
                : 0.0;
        } else {
            this.averageCompletionRate = 0.0;
            this.averageCancellationRate = 0.0;
        }
    }
}
