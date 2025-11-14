package com.example.backend.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Payment link response from PayOS")
public class PaymentLinkResponse {

    @Schema(description = "ID giao dịch từ PayOS", example = "1234567890")
    private String paymentLinkId;

    @Schema(description = "Mã đơn hàng", example = "FS123456")
    private String orderCode;

    @Schema(description = "Số tiền thanh toán", example = "500000")
    private BigDecimal amount;

    @Schema(description = "URL thanh toán - dùng để mở trong WebView hoặc trình duyệt", 
            example = "https://pay.payos.vn/web/xxx")
    private String checkoutUrl;

    @Schema(description = "QR code URL để thanh toán bằng app ngân hàng", 
            example = "https://qr.payos.vn/xxx.png")
    private String qrCode;

    @Schema(description = "Trạng thái thanh toán", example = "PENDING")
    private String status;

    @Schema(description = "Thời gian tạo link thanh toán")
    private LocalDateTime createdAt;

    @Schema(description = "Thời gian hết hạn link thanh toán (thường 15 phút)")
    private LocalDateTime expiresAt;
}
