package com.example.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManualTransactionRequest {
    @NotBlank(message = "Supplier ID không được để trống")
    private String supplierId;
    
    @NotNull(message = "Số tiền không được để trống")
    private BigDecimal amount;
    
    @NotBlank(message = "Loại giao dịch không được để trống")
    private String transactionType;  // ADMIN_DEPOSIT, ADMIN_DEDUCTION, ADJUSTMENT, PENALTY_FEE
    
    @NotBlank(message = "Mô tả không được để trống")
    private String description;
    
    private String adminNote;
    private String externalReference;
}
