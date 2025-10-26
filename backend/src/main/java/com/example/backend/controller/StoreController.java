package com.example.backend.controller;

import com.example.backend.dto.request.StoreCreateRequest;
import com.example.backend.dto.request.StoreUpdateRequest;
import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.StorePendingUpdateResponse;
import com.example.backend.dto.response.StoreResponse;
import com.example.backend.dto.response.StoreUpdateResponse;
import com.example.backend.entity.enums.StoreStatus;
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

    @GetMapping("/my-stores")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(
            summary = "Get all stores for current supplier",
            description = "Supplier retrieves all their stores with optional filters for status and search"
    )
    public ResponseEntity<ApiResponse<Page<StoreResponse>>> getMyStores(
            @RequestParam(required = false) StoreStatus status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            Authentication authentication) {

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        log.info("GET /api/stores/my-stores - Supplier: {}, Status: {}, Search: {}",
                keycloakId, status, search);

        Page<StoreResponse> stores = storeService.getMyStores(keycloakId, status, search, pageable);

        return ResponseEntity.ok(ApiResponse.success("Stores retrieved successfully", stores));
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "Get store by ID",
            description = "Retrieve detailed information about a specific store (public access)"
    )
    public ResponseEntity<ApiResponse<StoreResponse>> getStoreById(@PathVariable String id) {

        log.info("GET /api/stores/{} - Get store details", id);

        StoreResponse store = storeService.getStoreById(id);

        return ResponseEntity.ok(ApiResponse.success("Store retrieved successfully", store));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(
            summary = "Create new store",
            description = "Supplier creates a new store. Store will be in PENDING status and requires admin approval."
    )
    public ResponseEntity<ApiResponse<StoreResponse>> createStore(
            @Valid @RequestBody StoreCreateRequest request,
            Authentication authentication) {

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        log.info("POST /api/stores - Creating store by supplier: {}", keycloakId);

        StoreResponse store = storeService.createStore(request, keycloakId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Store created successfully. Waiting for admin approval.", store));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    @Operation(
            summary = "Approve pending store (Admin only)",
            description = "Admin approves a pending store and changes status to ACTIVE"
    )
    public ResponseEntity<ApiResponse<StoreResponse>> approveStore(
            @PathVariable String id,
            @RequestParam(required = false) String adminNotes,
            Authentication authentication) {

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        log.info("PATCH /api/stores/{}/approve - Admin: {}", id, keycloakId);

        StoreResponse store = storeService.approveStore(id, keycloakId, adminNotes);

        return ResponseEntity.ok(ApiResponse.success("Store approved successfully", store));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    @Operation(
            summary = "Reject pending store (Admin only)",
            description = "Admin rejects a pending store"
    )
    public ResponseEntity<ApiResponse<StoreResponse>> rejectStore(
            @PathVariable String id,
            @RequestParam(required = true) String adminNotes,
            Authentication authentication) {

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        log.info("PATCH /api/stores/{}/reject - Admin: {}, Reason: {}", id, keycloakId, adminNotes);

        StoreResponse store = storeService.rejectStore(id, keycloakId, adminNotes);

        return ResponseEntity.ok(ApiResponse.success("Store rejected successfully", store));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(
            summary = "Update store information",
            description = "Supplier updates store information. Minor changes (description, images, hours) are applied immediately. Major changes (name, address, location) require admin approval."
    )
    public ResponseEntity<ApiResponse<StoreUpdateResponse>> updateStore(
            @PathVariable String id,
            @Valid @RequestBody StoreUpdateRequest request,
            Authentication authentication) {

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        log.info("PUT /api/stores/{} - Updating store by supplier: {}", id, keycloakId);

        StoreUpdateResponse response = storeService.updateStore(id, request, keycloakId);

        // Return different status codes based on update type
        HttpStatus status = response.getUpdateType() == StoreUpdateResponse.UpdateType.IMMEDIATE
                ? HttpStatus.OK
                : HttpStatus.CREATED;

        return ResponseEntity.status(status)
                .body(ApiResponse.success(response.getMessage(), response));
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
