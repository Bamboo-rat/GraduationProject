package com.example.backend.dto.request;

import com.example.backend.entity.enums.ProductStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProductStatusUpdateRequest {

    @NotNull(message = "Status is required")
    private ProductStatus status;

    private String reason; // Optional reason for status change (e.g., rejection reason)
}
