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
public class PointTransactionResponse {

    private String transactionId;
    private String customerId;
    private String customerName;
    private int pointsChange;
    private String transactionType;
    private String transactionTypeDisplay;
    private String reason;
    private LocalDateTime createdAt;
    
    // Current balance after this transaction
    private Integer balanceAfter;
}
