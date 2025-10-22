package com.example.backend.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO for admin to update supplier commission rate
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SupplierCommissionUpdateRequest {

    @NotNull(message = "Commission rate is required")
    @DecimalMin(value = "0.0", message = "Commission rate must be at least 0%")
    @DecimalMax(value = "1.0", message = "Commission rate must not exceed 100%")
    private Double commissionRate; // 0.15 = 15%
}
