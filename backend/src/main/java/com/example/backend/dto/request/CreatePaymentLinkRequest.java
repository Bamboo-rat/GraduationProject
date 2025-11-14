package com.example.backend.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to create PayOS payment link for mobile")
public class CreatePaymentLinkRequest {

    @NotBlank(message = "Order ID is required")
    @Schema(description = "ID đơn hàng cần thanh toán", example = "uuid-order-id", required = true)
    private String orderId;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    @Schema(description = "Số tiền thanh toán", example = "500000", required = true)
    private BigDecimal amount;

    @Schema(description = "Mô tả giao dịch", example = "Thanh toán đơn hàng #FS123456")
    private String description;

    @Schema(description = "URL trả về sau khi thanh toán thành công (mobile deep link)", 
            example = "foodsave://payment/success")
    private String returnUrl;

    @Schema(description = "URL trả về khi hủy thanh toán (mobile deep link)", 
            example = "foodsave://payment/cancel")
    private String cancelUrl;
}
