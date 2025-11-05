package com.example.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewReturnRequestRequest {

    @NotBlank(message = "Review note is required")
    @Size(min = 5, max = 500, message = "Review note must be between 5 and 500 characters")
    private String reviewNote;
}
