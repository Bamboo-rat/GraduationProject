package com.example.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ProductImageRequest {

    @NotBlank(message = "Image URL is required")
    private String imageUrl;

    /**
     * Whether this is the primary/main image
     * @JsonProperty ensures Jackson deserializes "isPrimary" from JSON (not "primary")
     */
    @JsonProperty("isPrimary")
    private boolean isPrimary = false;
}
