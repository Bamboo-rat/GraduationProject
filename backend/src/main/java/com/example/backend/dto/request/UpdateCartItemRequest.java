package com.example.backend.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to update cart item quantity")
public class UpdateCartItemRequest {

    @Min(value = 1, message = "Quantity must be at least 1")
    @Schema(description = "Số lượng mới", example = "5")
    private Integer quantity;
}
