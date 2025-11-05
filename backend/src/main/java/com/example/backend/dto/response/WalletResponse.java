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
public class WalletResponse {
    private String walletId;
    private String supplierId;
    private String supplierName;
    private String storeName;
    
    // Balance information
    private BigDecimal availableBalance;
    private BigDecimal pendingBalance;
    private BigDecimal totalBalance;
    
    // Earnings information
    private BigDecimal totalEarnings;
    private BigDecimal monthlyEarnings;
    private BigDecimal totalWithdrawn;
    private BigDecimal totalRefunded;
    
    // Status
    private String status;
    private String currentMonth;
    
    // Metadata
    private LocalDateTime lastWithdrawalDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Additional info
    private Double commissionRate;
}
