package com.example.backend.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/**
 * DTO for customer profile update
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CustomerUpdateRequest {

    @Size(max = 100, message = "Full name must not exceed 100 characters")
    private String fullName;

    @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Phone number must be valid")
    private String phoneNumber;

    private LocalDate dateOfBirth;

    // avatarUrl will be updated separately via file upload endpoints
    // avatarUrl is managed through FileStorageController
}
