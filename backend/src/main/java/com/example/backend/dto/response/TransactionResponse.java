package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class TransactionResponse {
    private String transactionId;
    private String walletId;
    
    // Supplier info (for admin views)
    private String supplierId;
    private String supplierName;
    
    // Transaction info
    private String transactionType;
    private String transactionTypeLabel;
    private BigDecimal amount;
    private String description;
    
    // Balance after transaction
    private BigDecimal balanceAfter;
    private BigDecimal pendingBalanceAfter;
    
    // Related entities
    private String orderId;
    private String orderCode;
    private String externalReference;
    
    // Admin info (if manual transaction)
    private String adminId;
    private String adminName;
    private String adminNote;
    
    // Metadata
    private LocalDateTime createdAt;
    
    // Display helpers
    private Boolean isIncome;  // true for positive, false for negative
    private String displayAmount;  // formatted with +/- sign
}
