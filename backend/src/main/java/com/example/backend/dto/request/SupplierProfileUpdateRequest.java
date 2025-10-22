package com.example.backend.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for updating supplier profile information
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierProfileUpdateRequest {

    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    private String fullName;

    @Pattern(regexp = "^(\\+84|0)[0-9]{9,10}$", message = "Invalid Vietnamese phone number")
    private String phoneNumber;

    private String avatarUrl;

    @Size(max = 255, message = "Business address must not exceed 255 characters")
    private String businessAddress;
}
