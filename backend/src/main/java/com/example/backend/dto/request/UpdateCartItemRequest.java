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
@Schema(description = "Request to update cart item quantity. Set quantity to 0 or null to remove item from cart.")
public class UpdateCartItemRequest {

    @Min(value = 0, message = "Quantity must be greater than or equal to 0")
    @Schema(description = "Số lượng mới. Đặt 0 để xóa sản phẩm khỏi giỏ hàng", example = "5")
    private Integer quantity;
}
