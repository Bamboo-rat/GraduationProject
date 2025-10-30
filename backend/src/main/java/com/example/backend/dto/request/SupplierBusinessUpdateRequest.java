package com.example.backend.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for supplier to request business information update
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierBusinessUpdateRequest {

    @Size(min = 10, max = 13, message = "Tax code must be between 10 and 13 characters")
    private String taxCode;

    @Size(max = 50, message = "Business license number must not exceed 50 characters")
    private String businessLicense;

    @Size(max = 255, message = "Business license URL must not exceed 255 characters")
    private String businessLicenseUrl;

    @Size(max = 50, message = "Food safety certificate number must not exceed 50 characters")
    private String foodSafetyCertificate;

    @Size(max = 255, message = "Food safety certificate URL must not exceed 255 characters")
    private String foodSafetyCertificateUrl;

    @Size(max = 500, message = "Notes must not exceed 500 characters")
    private String supplierNotes; // Reason for update request
}
