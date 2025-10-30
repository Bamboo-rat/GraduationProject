package com.example.backend.dto.response;

import com.example.backend.entity.enums.SuggestionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for supplier pending update response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierPendingUpdateResponse {
    
    private String updateId;
    
    // Supplier info
    private String supplierId;
    private String supplierName;
    private String currentBusinessName;
    
    // Current values
    private String currentTaxCode;
    private String currentBusinessLicense;
    private String currentFoodSafetyCertificate;
    
    // Pending update fields (only set when requested)
    private String taxCode;
    private String businessLicense;
    private String businessLicenseUrl;
    private String foodSafetyCertificate;
    private String foodSafetyCertificateUrl;
    
    // Update metadata
    private SuggestionStatus updateStatus;
    private String supplierNotes;
    private String adminNotes;
    private LocalDateTime createdAt;
    private LocalDateTime processedAt;
    
    // Admin info (người xử lý)
    private String adminId;
    private String adminName;
}
