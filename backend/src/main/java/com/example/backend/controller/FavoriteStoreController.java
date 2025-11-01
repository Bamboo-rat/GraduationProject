package com.example.backend.controller;

import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.FavoriteStoreResponse;
import com.example.backend.service.FavoriteStoreService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller for customer favorite store management
 * All endpoints require CUSTOMER authentication
 */
@Slf4j
@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
@Tag(name = "Favorite Stores", description = "Customer favorite store management endpoints")
@SecurityRequirement(name = "Bearer Authentication")
@PreAuthorize("hasRole('CUSTOMER')")
public class FavoriteStoreController {

    private final FavoriteStoreService favoriteStoreService;

    @GetMapping("/stores")
    @Operation(summary = "Get favorite stores",
               description = "Get list of favorite stores for the authenticated customer with pagination")
    public ResponseEntity<ApiResponse<Page<FavoriteStoreResponse>>> getFavoriteStores(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("GET /api/favorites/stores - Getting favorite stores (page: {}, size: {})", page, size);

        String customerId = extractUserId(authentication);
        Page<FavoriteStoreResponse> favorites = favoriteStoreService.getFavoriteStores(customerId, page, size);

        return ResponseEntity.ok(ApiResponse.success(favorites));
    }

    @GetMapping("/stores/most-ordered")
    @Operation(summary = "Get most ordered favorite stores",
               description = "Get favorite stores ordered by order frequency (most ordered first)")
    public ResponseEntity<ApiResponse<Page<FavoriteStoreResponse>>> getMostOrderedFavorites(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("GET /api/favorites/stores/most-ordered - Getting most ordered favorites (page: {}, size: {})",
                 page, size);

        String customerId = extractUserId(authentication);
        Page<FavoriteStoreResponse> favorites = favoriteStoreService.getMostOrderedFavorites(customerId, page, size);

        return ResponseEntity.ok(ApiResponse.success(favorites));
    }

    @PostMapping("/stores/{storeId}")
    @Operation(summary = "Add store to favorites",
               description = "Add a store to customer's favorite list. Idempotent operation - if already favorited, returns existing favorite.")
    public ResponseEntity<ApiResponse<FavoriteStoreResponse>> addFavoriteStore(
            Authentication authentication,
            @PathVariable String storeId) {
        log.info("POST /api/favorites/stores/{} - Adding store to favorites", storeId);

        String customerId = extractUserId(authentication);
        FavoriteStoreResponse favorite = favoriteStoreService.addFavoriteStore(customerId, storeId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Store added to favorites successfully", favorite));
    }

    @DeleteMapping("/stores/{storeId}")
    @Operation(summary = "Remove store from favorites",
               description = "Remove a store from customer's favorite list")
    public ResponseEntity<ApiResponse<Void>> removeFavoriteStore(
            Authentication authentication,
            @PathVariable String storeId) {
        log.info("DELETE /api/favorites/stores/{} - Removing store from favorites", storeId);

        String customerId = extractUserId(authentication);
        favoriteStoreService.removeFavoriteStore(customerId, storeId);

        return ResponseEntity.ok(ApiResponse.success("Store removed from favorites successfully", null));
    }

    @GetMapping("/stores/{storeId}/check")
    @Operation(summary = "Check if store is favorited",
               description = "Check if a specific store is in customer's favorite list")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> checkFavoriteStatus(
            Authentication authentication,
            @PathVariable String storeId) {
        log.info("GET /api/favorites/stores/{}/check - Checking favorite status", storeId);

        String customerId = extractUserId(authentication);
        boolean isFavorited = favoriteStoreService.isFavorited(customerId, storeId);

        Map<String, Boolean> response = Map.of("isFavorited", isFavorited);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/stores/count")
    @Operation(summary = "Get favorite store count",
               description = "Get total number of favorite stores for the authenticated customer")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getFavoriteCount(Authentication authentication) {
        log.info("GET /api/favorites/stores/count - Getting favorite count");

        String customerId = extractUserId(authentication);
        long count = favoriteStoreService.getFavoriteCount(customerId);

        Map<String, Long> response = Map.of("count", count);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Extract user ID from JWT token
     * For customers, the subject is the userId
     */
    private String extractUserId(Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        return jwt.getSubject();
    }
}
