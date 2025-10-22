package com.example.backend.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO for Step 3: Upload Business Documents
 * Upload giấy phép kinh doanh và giấy chứng nhận an toàn thực phẩm
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SupplierRegisterStep3Request {

    @NotBlank(message = "Supplier ID is required")
    private String supplierId;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Business license number is required")
    @Size(max = 50, message = "Business license number must not exceed 50 characters")
    private String businessLicense; // Số giấy phép kinh doanh

    @NotBlank(message = "Business license URL is required")
    private String businessLicenseUrl; // URL file giấy phép kinh doanh

    // Giấy chứng nhận an toàn vệ sinh thực phẩm
    @NotBlank(message = "Food safety certificate number is required")
    @Size(max = 50, message = "Food safety certificate number must not exceed 50 characters")
    private String foodSafetyCertificate; // Số giấy chứng nhận ATTP

    @NotBlank(message = "Food safety certificate URL is required")
    private String foodSafetyCertificateUrl; // URL file giấy chứng nhận ATTP

    // Avatar/Logo - OPTIONAL
    private String avatarUrl; // Avatar của supplier (logo công ty)
}
