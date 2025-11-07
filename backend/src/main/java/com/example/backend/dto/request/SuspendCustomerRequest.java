package com.example.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuspendCustomerRequest {

    @NotBlank(message = "Suspension reason is required")
    private String reason;

    @Positive(message = "Duration must be positive")
    private Integer durationDays; // Optional: null = indefinite suspension
}
