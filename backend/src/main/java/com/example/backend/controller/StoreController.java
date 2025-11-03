package com.example.backend.controller;

import com.example.backend.dto.request.StoreCreateRequest;
import com.example.backend.dto.request.StoreUpdateRequest;
import com.example.backend.dto.response.*;
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
@Tag(name = "Store", description = "Store management endpoints (some endpoints are public, others require authentication)")
public class StoreController {

    private final StoreService storeService;

    @GetMapping("/public")
    @Operation(
            summary = "Get all active stores (Customer-facing, public access)",
            description = "Returns all ACTIVE stores with optional province filter. " +
                    "Useful for customers browsing stores. Default page size: 20."
    )
    public ResponseEntity<ApiResponse<Page<StoreResponse>>> getPublicStores(
            @RequestParam(required = false) String province,
            @PageableDefault(size = 20, sort = "storeName", direction = Sort.Direction.ASC) Pageable pageable) {

        log.info("GET /api/stores/public - province: {}, page: {}, size: {}",
                province, pageable.getPageNumber(), pageable.getPageSize());

        Page<StoreResponse> stores = storeService.getPublicStores(province, pageable);

        return ResponseEntity.ok(ApiResponse.success("Public stores retrieved successfully", stores));
    }

    @GetMapping("/top-stores")
    @Operation(
            summary = "Get stores with most purchases (Customer-facing, public access)",
            description = "Returns top 5 stores based on number of DELIVERED orders. " +
                    "Useful for homepage 'Popular Stores' section."
    )
    public ResponseEntity<ApiResponse<Page<StoreResponse>>> getTopStoresByPurchases(
            @PageableDefault(size = 5, sort = "storeName", direction = Sort.Direction.ASC) Pageable pageable) {

        log.info("GET /api/stores/top-stores - page: {}, size: {}",
                pageable.getPageNumber(), pageable.getPageSize());

        Page<StoreResponse> stores = storeService.getTopStoresByPurchases(pageable);

        return ResponseEntity.ok(ApiResponse.success("Top stores by purchases retrieved successfully", stores));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(
            summary = "Get all stores (Admin only)",
            description = "Admin retrieves all stores in the system with optional filters"
    )
    public ResponseEntity<ApiResponse<Page<StoreResponse>>> getAllStores(
            @RequestParam(required = false) StoreStatus status,
            @RequestParam(required = false) String supplierId,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        log.info("GET /api/stores - Admin viewing all stores. Status: {}, SupplierId: {}, Search: {}",
                status, supplierId, search);

        Page<StoreResponse> stores = storeService.getAllStores(status, supplierId, search, pageable);

        return ResponseEntity.ok(ApiResponse.success("All stores retrieved successfully", stores));
    }

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

    @GetMapping("/nearby")
    @Operation(
            summary = "Get nearby stores (Public - for customers)",
            description = "Find stores within specified radius from customer's location. Default radius is 5km. Only returns ACTIVE stores."
    )
    public ResponseEntity<ApiResponse<Page<StoreResponse>>> getNearbyStores(
            @RequestParam double latitude,
            @RequestParam double longitude,
            @RequestParam(defaultValue = "5.0") double radiusKm,
            @PageableDefault(size = 20, sort = "storeName", direction = Sort.Direction.ASC) Pageable pageable) {

        log.info("GET /api/stores/nearby - lat: {}, lon: {}, radius: {}km", latitude, longitude, radiusKm);

        Page<StoreResponse> stores = storeService.getNearbyStores(latitude, longitude, radiusKm, pageable);

        return ResponseEntity.ok(ApiResponse.success(
                String.format("Found %d stores within %.1fkm radius", stores.getTotalElements(), radiusKm),
                stores
        ));
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

    @PatchMapping("/{id}/suspend")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    @Operation(
            summary = "Suspend active store (Admin only)",
            description = "Admin suspends an active store (changes status from ACTIVE to SUSPENDED)"
    )
    public ResponseEntity<ApiResponse<StoreResponse>> suspendStore(
            @PathVariable String id,
            @RequestParam(required = true) String reason,
            Authentication authentication) {

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        log.info("PATCH /api/stores/{}/suspend - Admin: {}, Reason: {}", id, keycloakId, reason);

        StoreResponse store = storeService.suspendStore(id, keycloakId, reason);

        return ResponseEntity.ok(ApiResponse.success("Store suspended successfully", store));
    }

    @PatchMapping("/{id}/unsuspend")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    @Operation(
            summary = "Unsuspend suspended store (Admin only)",
            description = "Admin unsuspends a suspended store (changes status from SUSPENDED back to ACTIVE)"
    )
    public ResponseEntity<ApiResponse<StoreResponse>> unsuspendStore(
            @PathVariable String id,
            @RequestParam(required = false) String adminNotes,
            Authentication authentication) {

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        log.info("PATCH /api/stores/{}/unsuspend - Admin: {}", id, keycloakId);

        StoreResponse store = storeService.unsuspendStore(id, keycloakId, adminNotes);

        return ResponseEntity.ok(ApiResponse.success("Store unsuspended successfully", store));
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

    @GetMapping("/my-pending-updates")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(
            summary = "Get pending updates for current supplier",
            description = "Supplier views their own pending store updates with optional status filter"
    )
    public ResponseEntity<ApiResponse<Page<StorePendingUpdateResponse>>> getMyPendingUpdates(
            @RequestParam(required = false) SuggestionStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            Authentication authentication) {

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        log.info("GET /api/stores/my-pending-updates - Supplier: {}, Status filter: {}", keycloakId, status);

        Page<StorePendingUpdateResponse> updates = storeService.getMyPendingUpdates(keycloakId, status, pageable);

        return ResponseEntity.ok(ApiResponse.success("Your pending updates retrieved successfully", updates));
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

    @GetMapping("/{id}/products")
    @Operation(
            summary = "Get all product variants at a store (Public access)",
            description = "Get all product variants available at a specific store with their inventory information. " +
                    "Returns detailed variant-level data including stock quantity, prices, expiry dates, and images. " +
                    "This endpoint is public so customers can view products available at each store. " +
                    "Only returns data for ACTIVE stores. " +
                    "Default sort: createdAt DESC (newest products first)"
    )
    public ResponseEntity<ApiResponse<Page<StoreProductVariantResponse>>> getStoreProductVariants(
            @PathVariable String id,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        log.info("GET /api/stores/{}/products - Get product variants for store (public)", id);

        Page<StoreProductVariantResponse> products = storeService.getProductVariantsForStore(id, pageable);

        return ResponseEntity.ok(ApiResponse.success("Store product variants retrieved successfully", products));
    }

    @GetMapping("/{id}/products/manage")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(
            summary = "Get all product variants at a store for inventory management (Supplier only)",
            description = "Supplier endpoint to view product variants and inventory for their store. " +
                    "Works for stores in ANY status (PENDING, ACTIVE, SUSPENDED, REJECTED, etc.). " +
                    "Suppliers need to manage inventory regardless of store approval status. " +
                    "Only the store owner can access this endpoint. " +
                    "Default sort: createdAt DESC (newest products first)"
    )
    public ResponseEntity<ApiResponse<Page<StoreProductVariantResponse>>> getStoreProductVariantsForManagement(
            @PathVariable String id,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            Authentication authentication) {

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        log.info("GET /api/stores/{}/products/manage - Get product variants for store management by supplier: {}", id, keycloakId);

        Page<StoreProductVariantResponse> products = storeService.getProductVariantsForStoreManagement(id, keycloakId, pageable);

        return ResponseEntity.ok(ApiResponse.success("Store product variants retrieved successfully for management", products));
    }
}
