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
public class WithdrawalResponse {
    private String transactionId;
    private BigDecimal amount;
    private BigDecimal balanceAfter;
    private String status;
    private String message;
    private LocalDateTime requestedAt;
    private LocalDateTime processedAt;
    
    // Bank info
    private String bankName;
    private String bankAccountNumber;
    private String bankAccountName;
}
