package com.example.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO for supplier to update bank information
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SupplierBankUpdateRequest {

    @NotBlank(message = "Bank account number is required")
    @Size(max = 50, message = "Bank account number must not exceed 50 characters")
    private String bankAccountNumber;

    @NotBlank(message = "Bank name is required")
    @Size(max = 100, message = "Bank name must not exceed 100 characters")
    private String bankName;

    @NotBlank(message = "Bank branch is required")
    @Size(max = 100, message = "Bank branch must not exceed 100 characters")
    private String bankBranch;
}
