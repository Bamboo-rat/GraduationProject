package com.example.backend.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO for supplier profile update
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SupplierUpdateRequest {

    @Size(max = 100, message = "Full name must not exceed 100 characters")
    private String fullName;

    @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Phone number must be valid")
    private String phoneNumber;

    @Size(max = 100, message = "Business name must not exceed 100 characters")
    private String businessName;

    @Size(max = 50, message = "Business license must not exceed 50 characters")
    private String businessLicense;

    @Size(max = 20, message = "Tax code must not exceed 20 characters")
    private String taxCode;

    // URLs will be updated separately via file upload endpoints
    // logoUrl and businessLicenseUrl are managed through FileStorageController
}
