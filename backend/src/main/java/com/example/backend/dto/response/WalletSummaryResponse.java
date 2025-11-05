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
public class WalletSummaryResponse {
    // Current balances
    private BigDecimal availableBalance;
    private BigDecimal pendingBalance;
    private BigDecimal totalBalance;
    
    // This month
    private BigDecimal monthlyEarnings;
    private BigDecimal monthlyOrders;
    private Integer totalOrdersThisMonth;
    
    // All time
    private BigDecimal totalEarnings;
    private BigDecimal totalWithdrawn;
    private BigDecimal totalRefunded;
    
    // Commission info
    private Double commissionRate;
    private BigDecimal estimatedCommissionThisMonth;
    
    // Status
    private String status;
    private Boolean canWithdraw;
    private BigDecimal minimumWithdrawal;
}
