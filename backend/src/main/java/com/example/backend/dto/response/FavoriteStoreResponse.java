package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for favorite store
 * Contains store information and favorite metadata
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FavoriteStoreResponse {

    private String favoriteId;

    // Store information
    private StoreResponse store;

    // Favorite metadata
    private LocalDateTime createdAt;
    private Integer orderCount;
    private LocalDateTime lastOrderDate;
}
