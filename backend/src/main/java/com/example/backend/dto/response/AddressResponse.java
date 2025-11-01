package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO for address response
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddressResponse {

    private String addressId;
    private String fullName;
    private String phoneNumber;
    private String province;
    private String district;
    private String ward;
    private String street;
    private boolean isDefault;
    private Double latitude;
    private Double longitude;

    // Full formatted address for display
    private String fullAddress;

    /**
     * Generate full formatted address
     * Format: street, ward, district, province
     */
    public String getFullAddress() {
        return String.format("%s, %s, %s, %s", street, ward, district, province);
    }
}
