package com.example.backend.dto.request;

import com.example.backend.entity.enums.PaymentMethod;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to checkout cart and create order")
public class CheckoutRequest {

    @NotBlank(message = "Cart ID is required")
    @Schema(description = "ID của giỏ hàng", example = "uuid-cart-id")
    private String cartId;

    @NotBlank(message = "Shipping address is required")
    @Schema(description = "Địa chỉ giao hàng", example = "123 Nguyễn Huệ, Quận 1, TP.HCM")
    private String shippingAddress;

    @NotNull(message = "Payment method is required")
    @Schema(description = "Phương thức thanh toán", example = "COD")
    private PaymentMethod paymentMethod;

    @Schema(description = "Danh sách mã khuyến mãi áp dụng (optional)", example = "[\"PROMO123\"]")
    private List<String> promotionCodes;

    @Schema(description = "Ghi chú đơn hàng (optional)", example = "Giao hàng buổi sáng")
    private String notes;
}
