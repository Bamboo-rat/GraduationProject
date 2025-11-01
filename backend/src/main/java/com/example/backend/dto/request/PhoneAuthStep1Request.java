package com.example.backend.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Phone authentication - Step 1: Send OTP")
public class PhoneAuthStep1Request {
    
    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(
        regexp = "^(0|\\+84)(3|5|7|8|9)[0-9]{8}$",
        message = "Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam"
    )
    @Schema(description = "Số điện thoại (VD: 0987654321 hoặc +84987654321)", example = "0987654321")
    private String phoneNumber;
}
