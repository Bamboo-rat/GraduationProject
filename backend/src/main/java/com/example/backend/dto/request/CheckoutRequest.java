package com.example.backend.dto.request;

import com.example.backend.entity.enums.PaymentMethod;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
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

    @NotBlank(message = "Address ID is required")
    @Schema(description = "ID của địa chỉ giao hàng (từ danh sách addresses của customer)", 
            example = "uuid-address-id", 
            required = true)
    private String addressId;

    @NotNull(message = "Payment method is required")
    @Schema(description = "Phương thức thanh toán", example = "COD")
    private PaymentMethod paymentMethod;

    @Schema(description = "Phí vận chuyển", example = "25000")
    private BigDecimal shippingFee;

    @Schema(description = "Danh sách mã khuyến mãi áp dụng (optional)", example = "[\"PROMO123\"]")
    private List<String> promotionCodes;

    @Schema(description = "Ghi chú đơn hàng (optional)", example = "Giao hàng buổi sáng")
    private String note;

    @Schema(description = "Unique key để đảm bảo request không bị duplicate. Nếu không cung cấp, backend sẽ tự động generate UUID.", 
            example = "550e8400-e29b-41d4-a716-446655440000",
            required = false)
    private String idempotencyKey;
}
