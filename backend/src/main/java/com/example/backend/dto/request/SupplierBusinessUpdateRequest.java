package com.example.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.Length;

/**
 * DTO for supplier to request business information update
 * All fields are optional - at least one must be provided (validated in service layer)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierBusinessUpdateRequest {

    // @Size validates only if value is not null
    @Length(min = 10, max = 13, message = "Mã số thuế phải có độ dài từ 10 đến 13 ký tự")
    private String taxCode;

    @Length(max = 50, message = "Số giấy phép kinh doanh không được vượt quá 50 ký tự")
    private String businessLicense;

    @Length(max = 255, message = "URL giấy phép kinh doanh không được vượt quá 255 ký tự")
    private String businessLicenseUrl;

    @Length(max = 50, message = "Số giấy chứng nhận an toàn thực phẩm không được vượt quá 50 ký tự")
    private String foodSafetyCertificate;

    @Length(max = 255, message = "URL giấy chứng nhận an toàn thực phẩm không được vượt quá 255 ký tự")
    private String foodSafetyCertificateUrl;

    @Length(max = 500, message = "Ghi chú không được vượt quá 500 ký tự")
    private String supplierNotes; // Reason for update request
}
