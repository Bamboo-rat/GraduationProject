package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReconciliationResponse {
    // Period
    private LocalDate startDate;
    private LocalDate endDate;
    private String period;
    
    // Order-related
    private BigDecimal totalOrderValue;
    private Integer totalOrders;
    private BigDecimal totalCommission;
    
    // Supplier earnings

    private BigDecimal totalSupplierEarnings;
    private BigDecimal totalPaidToSuppliers;
    private BigDecimal pendingPayments;
    private BigDecimal totalSupplierBalance;
    
    // Refunds
    private BigDecimal totalRefunded;
    private Integer refundCount;
    
    // Platform metrics
    private BigDecimal platformRevenue;  // Total commission
    private BigDecimal platformExpenses;  // Refunds, adjustments
    private BigDecimal netPlatformRevenue;
    
    // Breakdown by supplier
    private List<SupplierReconciliation> supplierBreakdown;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SupplierReconciliation {
        private String supplierId;
        private String supplierName;
        private String storeName;
        // IMPORTANT: All values from WalletTransaction to match supplier's view
        private BigDecimal totalEarnings;  // sum(ORDER_COMPLETED) = net after commission
        private BigDecimal commission;  // sum(COMMISSION_FEE)
        private BigDecimal netEarnings;  // totalEarnings - commission (for display)
        private Integer orderCount;  // count(ORDER_COMPLETED)
        private BigDecimal refunded;  // sum(ORDER_REFUND) = net refund
    }
}
