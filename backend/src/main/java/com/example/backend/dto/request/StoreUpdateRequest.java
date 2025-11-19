package com.example.backend.dto.request;

import com.example.backend.entity.enums.StoreStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

/**
 * DTO for updating store information
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreUpdateRequest {

    @Size(min = 2, max = 100, message = "Store name must be between 2 and 100 characters")
    private String storeName;


    @Size(max = 255, message = "Address must not exceed 255 characters")
    private String address;

    @Size(max = 255, message = "Street must not exceed 255 characters")
    private String street;

    @Size(max = 100, message = "Ward must not exceed 100 characters")
    private String ward;

    @Size(max = 100, message = "District must not exceed 100 characters")
    private String district;

    @Size(max = 100, message = "Province must not exceed 100 characters")
    private String province;

    @Pattern(regexp = "^$|^(\\+84|0)[0-9]{9,10}$", message = "Phone number must be empty or valid Vietnamese format (e.g., 0912345678 or +84912345678)")
    private String phoneNumber;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @Size(max = 500, message = "Image URL must not exceed 500 characters")
    private String imageUrl;

    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime openTime;

    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime closeTime;

    private Double latitude;

    private Double longitude;

    // Note: Store status should be updated via the updateStoreStatus endpoint, not here
    // private StoreStatus status;
}
