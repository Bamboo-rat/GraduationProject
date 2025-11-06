package com.example.backend.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
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
@Schema(description = "Request by admin to mark payout as paid to supplier")
public class PayoutRequest {

    @NotNull
    @Schema(description = "Amount paid to supplier", example = "1000000")
    private BigDecimal amount;

    @Schema(description = "External reference (bank transfer id)")
    private String externalReference;

    @Schema(description = "Optional admin note")
    private String adminNote;
}
