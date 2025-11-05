package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemWalletSummaryResponse {
    // Total across all suppliers
    private BigDecimal totalAvailableBalance;
    private BigDecimal totalPendingBalance;
    private BigDecimal totalBalance;
    
    // Earnings
    private BigDecimal totalEarnings;
    private BigDecimal monthlyEarnings;
    private BigDecimal totalWithdrawn;
    private BigDecimal totalRefunded;
    
    // Commission (Platform revenue)
    private BigDecimal totalCommissionEarned;
    private BigDecimal monthlyCommissionEarned;
    
    // Statistics
    private Integer totalActiveWallets;
    private Integer totalSuspendedWallets;
    private Integer totalWallets;
    
    // Average metrics
    private BigDecimal averageWalletBalance;
    private BigDecimal averageMonthlyEarnings;
}
