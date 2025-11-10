package com.example.backend.controller;

import com.example.backend.dto.request.CategorySuggestionRequest;
import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.CategorySuggestionResponse;
import com.example.backend.entity.enums.SuggestionStatus;
import com.example.backend.service.CategorySuggestionService;
import com.example.backend.utils.JwtUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/category-suggestions")
@RequiredArgsConstructor
@Tag(name = "Category Suggestion", description = "Category suggestion management endpoints")
@SecurityRequirement(name = "Bearer Authentication")
public class CategorySuggestionController {

    private final CategorySuggestionService suggestionService;

    @PostMapping
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(
            summary = "Suggest a new category",
            description = "Supplier suggests a new category for admin approval"
    )
    public ResponseEntity<ApiResponse<CategorySuggestionResponse>> createSuggestion(
            @Valid @RequestBody CategorySuggestionRequest request,
            Authentication authentication) {

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        log.info("POST /api/category-suggestions - Creating suggestion: {} by supplier: {}", 
                request.getName(), keycloakId);

        CategorySuggestionResponse response = suggestionService.createSuggestion(request, keycloakId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Category suggestion submitted successfully. Waiting for admin approval.", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    @Operation(
            summary = "Get all category suggestions (Admin only)",
            description = "Admin views all category suggestions with optional status filter"
    )
    public ResponseEntity<ApiResponse<Page<CategorySuggestionResponse>>> getAllSuggestions(
            @RequestParam(required = false) SuggestionStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "DESC") String direction) {

        log.info("GET /api/category-suggestions - Admin viewing suggestions. Status: {}, Page: {}, Size: {}", 
                status, page, size);

        // Create Pageable manually from request params
        Sort.Direction sortDirection = "ASC".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, Sort.by(sortDirection, sort));

        Page<CategorySuggestionResponse> suggestions = suggestionService.getAllSuggestions(status, pageable);

        return ResponseEntity.ok(ApiResponse.success("Category suggestions retrieved successfully", suggestions));
    }

    @GetMapping("/my-suggestions")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(
            summary = "Get my category suggestions",
            description = "Supplier views their own category suggestions"
    )
    public ResponseEntity<ApiResponse<Page<CategorySuggestionResponse>>> getMySuggestions(
            @RequestParam(required = false) SuggestionStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "DESC") String direction,
            Authentication authentication) {

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        log.info("GET /api/category-suggestions/my-suggestions - Supplier: {}, Status: {}, Page: {}, Size: {}", 
                keycloakId, status, page, size);

        // Create Pageable manually from request params
        Sort.Direction sortDirection = "ASC".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, Sort.by(sortDirection, sort));

        Page<CategorySuggestionResponse> suggestions = suggestionService.getMySuggestions(keycloakId, status, pageable);

        return ResponseEntity.ok(ApiResponse.success("My suggestions retrieved successfully", suggestions));
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "Get category suggestion by ID",
            description = "Get detailed information of a specific category suggestion"
    )
    public ResponseEntity<ApiResponse<CategorySuggestionResponse>> getSuggestionById(@PathVariable String id) {

        log.info("GET /api/category-suggestions/{} - Get suggestion details", id);

        CategorySuggestionResponse suggestion = suggestionService.getSuggestionById(id);

        return ResponseEntity.ok(ApiResponse.success("Suggestion retrieved successfully", suggestion));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    @Operation(
            summary = "Approve category suggestion (Admin only)",
            description = "Admin approves a pending category suggestion and creates the category"
    )
    public ResponseEntity<ApiResponse<CategorySuggestionResponse>> approveSuggestion(
            @PathVariable String id,
            @RequestParam(required = false) String adminNotes,
            Authentication authentication) {

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        log.info("PATCH /api/category-suggestions/{}/approve - Admin: {}", id, keycloakId);

        CategorySuggestionResponse suggestion = suggestionService.approveSuggestion(id, keycloakId, adminNotes);

        return ResponseEntity.ok(ApiResponse.success("Category suggestion approved and category created successfully", suggestion));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    @Operation(
            summary = "Reject category suggestion (Admin only)",
            description = "Admin rejects a pending category suggestion"
    )
    public ResponseEntity<ApiResponse<CategorySuggestionResponse>> rejectSuggestion(
            @PathVariable String id,
            @RequestParam(required = true) String adminNotes,
            Authentication authentication) {

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        log.info("PATCH /api/category-suggestions/{}/reject - Admin: {}, Reason: {}", id, keycloakId, adminNotes);

        CategorySuggestionResponse suggestion = suggestionService.rejectSuggestion(id, keycloakId, adminNotes);

        return ResponseEntity.ok(ApiResponse.success("Category suggestion rejected successfully", suggestion));
    }
}
