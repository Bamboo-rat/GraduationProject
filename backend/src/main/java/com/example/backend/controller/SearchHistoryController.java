package com.example.backend.controller;

import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.SearchHistoryResponse;
import com.example.backend.service.SearchHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for managing customer search history
 */
@Slf4j
@RestController
@RequestMapping("/api/search-history")
@RequiredArgsConstructor
@Tag(name = "Search History", description = "Customer search history management endpoints")
@SecurityRequirement(name = "Bearer Authentication")
public class SearchHistoryController {

    private final SearchHistoryService searchHistoryService;

    // ========== CUSTOMER ENDPOINTS ==========

    @GetMapping("/me")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Get my search history",
               description = "Get paginated search history for the authenticated customer")
    public ResponseEntity<ApiResponse<Page<SearchHistoryResponse>>> getMySearchHistory(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("GET /api/search-history/me - Getting search history");

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String customerId = jwt.getSubject(); // For customers, subject is userId

        Page<SearchHistoryResponse> searchHistory = searchHistoryService.getSearchHistory(customerId, page, size);
        return ResponseEntity.ok(ApiResponse.success(searchHistory));
    }

    @GetMapping("/me/recent")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Get recent search history",
               description = "Get search history from last 30 days for the authenticated customer")
    public ResponseEntity<ApiResponse<Page<SearchHistoryResponse>>> getMyRecentSearchHistory(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("GET /api/search-history/me/recent - Getting recent search history");

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String customerId = jwt.getSubject();

        Page<SearchHistoryResponse> searchHistory = searchHistoryService.getRecentSearchHistory(customerId, page, size);
        return ResponseEntity.ok(ApiResponse.success(searchHistory));
    }

    @GetMapping("/me/unique-queries")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Get unique search queries",
               description = "Get list of unique/distinct search queries for suggestions")
    public ResponseEntity<ApiResponse<List<String>>> getMyUniqueQueries(Authentication authentication) {
        log.info("GET /api/search-history/me/unique-queries - Getting unique search queries");

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String customerId = jwt.getSubject();

        List<String> uniqueQueries = searchHistoryService.getUniqueSearchQueries(customerId);
        return ResponseEntity.ok(ApiResponse.success(uniqueQueries));
    }

    @GetMapping("/me/count")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Get total search count",
               description = "Get total number of searches performed by authenticated customer")
    public ResponseEntity<ApiResponse<Long>> getMySearchCount(Authentication authentication) {
        log.info("GET /api/search-history/me/count - Getting search count");

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String customerId = jwt.getSubject();

        long count = searchHistoryService.getSearchCount(customerId);
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    @PostMapping("/record")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Record a search",
               description = "Record a search query when customer performs a search")
    public ResponseEntity<ApiResponse<String>> recordSearch(
            Authentication authentication,
            @RequestParam String query) {
        log.info("POST /api/search-history/record - Recording search: {}", query);

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String customerId = jwt.getSubject();

        searchHistoryService.recordSearch(customerId, query);
        return ResponseEntity.ok(ApiResponse.success("Search recorded successfully"));
    }

    @DeleteMapping("/{searchId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Delete a specific search",
               description = "Delete a specific search history entry by ID")
    public ResponseEntity<ApiResponse<String>> deleteSearchHistory(
            Authentication authentication,
            @PathVariable String searchId) {
        log.info("DELETE /api/search-history/{} - Deleting search history", searchId);

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String customerId = jwt.getSubject();

        boolean deleted = searchHistoryService.deleteSearchHistory(searchId, customerId);

        if (deleted) {
            return ResponseEntity.ok(ApiResponse.success("Search history deleted successfully"));
        } else {
            return ResponseEntity.ok(ApiResponse.error("Search history not found or unauthorized"));
        }
    }

    @DeleteMapping("/me/all")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Delete all search history",
               description = "Delete all search history for the authenticated customer")
    public ResponseEntity<ApiResponse<String>> deleteAllMySearchHistory(Authentication authentication) {
        log.info("DELETE /api/search-history/me/all - Deleting all search history");

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String customerId = jwt.getSubject();

        searchHistoryService.deleteAllSearchHistory(customerId);
        return ResponseEntity.ok(ApiResponse.success("All search history deleted successfully"));
    }

    @DeleteMapping("/me/old")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Delete old search history",
               description = "Delete search history older than specified days")
    public ResponseEntity<ApiResponse<String>> deleteOldSearchHistory(
            Authentication authentication,
            @RequestParam(defaultValue = "30") int daysOld) {
        log.info("DELETE /api/search-history/me/old - Deleting search history older than {} days", daysOld);

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String customerId = jwt.getSubject();

        searchHistoryService.deleteOldSearchHistory(customerId, daysOld);
        return ResponseEntity.ok(ApiResponse.success(
                String.format("Search history older than %d days deleted successfully", daysOld)));
    }

    // ========== ADMIN ENDPOINTS ==========

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Get customer search history (Admin)",
               description = "Get search history for any customer (admin only)")
    public ResponseEntity<ApiResponse<Page<SearchHistoryResponse>>> getCustomerSearchHistory(
            @PathVariable String customerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("GET /api/search-history/customer/{} - Getting search history (admin)", customerId);

        Page<SearchHistoryResponse> searchHistory = searchHistoryService.getSearchHistory(customerId, page, size);
        return ResponseEntity.ok(ApiResponse.success(searchHistory));
    }

    @GetMapping("/customer/{customerId}/count")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Get customer search count (Admin)",
               description = "Get total search count for any customer (admin only)")
    public ResponseEntity<ApiResponse<Long>> getCustomerSearchCount(@PathVariable String customerId) {
        log.info("GET /api/search-history/customer/{}/count - Getting search count (admin)", customerId);

        long count = searchHistoryService.getSearchCount(customerId);
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    @DeleteMapping("/customer/{customerId}/all")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    @Operation(summary = "Delete all customer search history (Admin)",
               description = "Delete all search history for a customer (admin only)")
    public ResponseEntity<ApiResponse<String>> deleteCustomerSearchHistory(@PathVariable String customerId) {
        log.info("DELETE /api/search-history/customer/{}/all - Deleting all search history (admin)", customerId);

        searchHistoryService.deleteAllSearchHistory(customerId);
        return ResponseEntity.ok(ApiResponse.success("Customer search history deleted successfully"));
    }
}
