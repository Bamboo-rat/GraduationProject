package com.example.backend.dto.request;

import com.example.backend.entity.enums.OrderStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to update order status")
public class UpdateOrderStatusRequest {

    @NotNull(message = "Order status is required")
    @Schema(description = "Trạng thái đơn hàng mới", example = "CONFIRMED")
    private OrderStatus status;

    @Schema(description = "Ghi chú cập nhật trạng thái (optional)", example = "Đơn hàng đã được xác nhận")
    private String notes;
}
