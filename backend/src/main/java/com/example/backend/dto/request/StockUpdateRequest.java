package com.example.backend.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to update stock quantity for a variant at a specific store")
public class StockUpdateRequest {

    @NotNull(message = "Stock quantity is required")
    @Min(value = 0, message = "Stock quantity must be non-negative")
    @Schema(description = "New stock quantity", example = "50", required = true)
    private Integer stockQuantity;

    @Schema(description = "Optional note about the stock update", example = "Nhập hàng mới từ nhà cung cấp")
    private String note;
}
