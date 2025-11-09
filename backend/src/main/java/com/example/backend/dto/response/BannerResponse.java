package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Response DTO for Banner information
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BannerResponse {

    private String bannerId;
    private String imageUrl;
    private String title;
    private String description;
    private String status; // ACTIVE or INACTIVE
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
