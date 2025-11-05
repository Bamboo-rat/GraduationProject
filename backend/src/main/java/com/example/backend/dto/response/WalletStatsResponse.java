package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletStatsResponse {
    // Period info
    private Integer year;
    private Integer month;
    private String period;  // e.g., "2025-01" or "2025"
    
    // Summary
    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal netAmount;
    
    // Transaction counts
    private Integer totalTransactions;
    private Map<String, Integer> transactionTypeCount;
    
    // Monthly breakdown (if yearly stats)
    private List<MonthlyStats> monthlyBreakdown;
    
    // Transaction type breakdown
    private List<TransactionTypeStats> transactionTypeBreakdown;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyStats {
        private Integer month;
        private String monthName;
        private BigDecimal income;
        private BigDecimal expense;
        private BigDecimal net;
        private Integer transactionCount;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransactionTypeStats {
        private String transactionType;
        private String label;
        private BigDecimal amount;
        private Integer count;
        private Boolean isIncome;
    }
}
