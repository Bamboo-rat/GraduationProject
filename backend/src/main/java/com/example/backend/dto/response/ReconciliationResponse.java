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
    private BigDecimal pendingPayments;  // ONLY pending balance (chờ 7 ngày)
    private BigDecimal totalSupplierBalance;  // Total balance = available + pending (tổng nợ NCC)
    
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
        private BigDecimal totalEarnings;
        private BigDecimal commission;
        private BigDecimal netEarnings;
        private Integer orderCount;
        private BigDecimal refunded;
    }
}
