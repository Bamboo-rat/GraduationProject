package com.example.backend.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Phone authentication - Step 1 response")
public class PhoneAuthStep1Response {

    @Schema(description = "Số điện thoại đã được chuẩn hóa", example = "0987654321")
    private String phoneNumber;

    @Schema(description = "Trạng thái tài khoản", example = "EXISTING (đã tồn tại) hoặc NEW (mới tạo)")
    private String accountStatus; // "EXISTING" hoặc "NEW"

    @Schema(description = "Thông báo", example = "Mã OTP đã được gửi đến số điện thoại của bạn")
    private String message;

    @Schema(description = "Thời gian hết hạn OTP (giây)", example = "300")
    private Integer expirySeconds;

    @Schema(description = "Tên đầy đủ được tạo ngẫu nhiên (chỉ có khi là tài khoản mới)", example = "Nguyễn Văn A")
    private String fullName;
}
