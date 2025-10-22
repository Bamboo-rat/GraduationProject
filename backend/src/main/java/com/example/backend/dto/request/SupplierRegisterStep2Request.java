package com.example.backend.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO for Step 2: Email Verification - OTP
 * Xác thực email bằng mã OTP
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SupplierRegisterStep2Request {

    @NotBlank(message = "Supplier ID is required")
    private String supplierId;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "OTP is required")
    @Size(min = 6, max = 6, message = "OTP must be 6 digits")
    @Pattern(regexp = "^[0-9]{6}$", message = "OTP must contain only digits")
    private String otp;
}
