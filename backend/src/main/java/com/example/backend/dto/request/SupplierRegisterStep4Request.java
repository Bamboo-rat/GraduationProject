package com.example.backend.dto.request;

import com.example.backend.entity.enums.BusinessType;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO for Step 4: Business and Store Information
 * Thông tin doanh nghiệp và cơ sở kinh doanh
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SupplierRegisterStep4Request {

    @NotBlank(message = "Supplier ID is required")
    private String supplierId;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Business name is required")
    @Size(max = 100, message = "Business name must not exceed 100 characters")
    private String businessName; // Tên doanh nghiệp

    @NotBlank(message = "Business address is required")
    @Size(max = 255, message = "Business address must not exceed 255 characters")
    private String businessAddress; // Địa chỉ trụ sở doanh nghiệp

    @NotBlank(message = "Tax code is required")
    @Size(max = 20, message = "Tax code must not exceed 20 characters")
    private String taxCode; // Mã số thuế

    @NotNull(message = "Business type is required")
    private BusinessType businessType; // Loại hình kinh doanh

    // Thông tin cửa hàng đầu tiên (required)
    @NotBlank(message = "Store name is required")
    private String storeName;

    @NotBlank(message = "Store address is required")
    private String storeAddress;

    @NotBlank(message = "Store phone number is required")
    @Pattern(regexp = "^(\\+84|0)[0-9]{9,10}$", message = "Invalid Vietnamese phone number")
    private String storePhoneNumber;

    @NotBlank(message = "Latitude is required")
    private String latitude;

    @NotBlank(message = "Longitude is required")
    private String longitude;

    private String storeDescription;
}
