package com.example.backend.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to cancel order")
public class CancelOrderRequest {

    @NotBlank(message = "Cancellation reason is required")
    @Schema(description = "Lý do hủy đơn", example = "Khách hàng đổi ý")
    private String reason;

    @Schema(description = "Lỗi do khách hàng (true) hay do hệ thống/nhà cung cấp (false)", example = "true")
    private Boolean customerFault = true;
}
