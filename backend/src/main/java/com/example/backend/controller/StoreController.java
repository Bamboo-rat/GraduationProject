package com.example.backend.controller;

import com.example.backend.dto.request.StoreUpdateRequest;
import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.StorePendingUpdateResponse;
import com.example.backend.entity.enums.SuggestionStatus;
import com.example.backend.service.StoreService;
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
@RequestMapping("/api/stores")
@RequiredArgsConstructor
@Tag(name = "Store", description = "Store management endpoints")
@SecurityRequirement(name = "Bearer Authentication")
public class StoreController {

    private final StoreService storeService;

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(
            summary = "Submit store update request",
            description = "Supplier submits a store update that requires admin approval"
    )
    public ResponseEntity<ApiResponse<StorePendingUpdateResponse>> submitStoreUpdate(
            @PathVariable String id,
            @Valid @RequestBody StoreUpdateRequest request,
            Authentication authentication) {

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        log.info("PUT /api/stores/{} - Submitting update by supplier: {}", id, keycloakId);

        StorePendingUpdateResponse response = storeService.submitStoreUpdate(id, request, keycloakId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Store update submitted successfully. Waiting for admin approval.", response));
    }

    @GetMapping("/pending-updates")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(
            summary = "Get all pending store updates (Super Admin only)",
            description = "Super Admin views all pending store updates with optional status filter"
    )
    public ResponseEntity<ApiResponse<Page<StorePendingUpdateResponse>>> getAllPendingUpdates(
            @RequestParam(required = false) SuggestionStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        log.info("GET /api/stores/pending-updates - Admin viewing updates. Status filter: {}", status);

        Page<StorePendingUpdateResponse> updates = storeService.getAllPendingUpdates(status, pageable);

        return ResponseEntity.ok(ApiResponse.success("Pending updates retrieved successfully", updates));
    }

    @GetMapping("/pending-updates/{id}")
    @Operation(
            summary = "Get pending update by ID",
            description = "Get detailed information of a specific pending update"
    )
    public ResponseEntity<ApiResponse<StorePendingUpdateResponse>> getPendingUpdateById(@PathVariable String id) {

        log.info("GET /api/stores/pending-updates/{} - Get update details", id);

        StorePendingUpdateResponse update = storeService.getPendingUpdateById(id);

        return ResponseEntity.ok(ApiResponse.success("Pending update retrieved successfully", update));
    }

    @GetMapping("/{storeId}/pending-updates")
    @Operation(
            summary = "Get pending updates for a store",
            description = "Get all pending updates for a specific store"
    )
    public ResponseEntity<ApiResponse<Page<StorePendingUpdateResponse>>> getPendingUpdatesByStore(
            @PathVariable String storeId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        log.info("GET /api/stores/{}/pending-updates - Get updates for store", storeId);

        Page<StorePendingUpdateResponse> updates = storeService.getPendingUpdatesByStore(storeId, pageable);

        return ResponseEntity.ok(ApiResponse.success("Store pending updates retrieved successfully", updates));
    }

    @PatchMapping("/pending-updates/{id}/approve")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(
            summary = "Approve store update (Super Admin only)",
            description = "Super Admin approves a pending store update and applies the changes"
    )
    public ResponseEntity<ApiResponse<StorePendingUpdateResponse>> approveStoreUpdate(
            @PathVariable String id,
            @RequestParam(required = false) String adminNotes,
            Authentication authentication) {

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        log.info("PATCH /api/stores/pending-updates/{}/approve - Admin: {}", id, keycloakId);

        StorePendingUpdateResponse update = storeService.approveStoreUpdate(id, keycloakId, adminNotes);

        return ResponseEntity.ok(ApiResponse.success("Store update approved and applied successfully", update));
    }

    @PatchMapping("/pending-updates/{id}/reject")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(
            summary = "Reject store update (Super Admin only)",
            description = "Super Admin rejects a pending store update"
    )
    public ResponseEntity<ApiResponse<StorePendingUpdateResponse>> rejectStoreUpdate(
            @PathVariable String id,
            @RequestParam(required = true) String adminNotes,
            Authentication authentication) {

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        log.info("PATCH /api/stores/pending-updates/{}/reject - Admin: {}, Reason: {}", 
                id, keycloakId, adminNotes);

        StorePendingUpdateResponse update = storeService.rejectStoreUpdate(id, keycloakId, adminNotes);

        return ResponseEntity.ok(ApiResponse.success("Store update rejected successfully", update));
    }
}
