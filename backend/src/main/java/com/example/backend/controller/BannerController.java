package com.example.backend.controller;

import com.example.backend.dto.request.BannerRequest;
import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.BannerResponse;
import com.example.backend.entity.enums.BannerStatus;
import com.example.backend.service.BannerService;
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
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/banners")
@RequiredArgsConstructor
@Tag(name = "Banner", description = "Banner management endpoints")
public class BannerController {

    private final BannerService bannerService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(
            summary = "Get all banners (Admin only)",
            description = "Admin retrieves all banners with optional status filter and pagination"
    )
    public ResponseEntity<ApiResponse<Page<BannerResponse>>> getAllBanners(
            @RequestParam(required = false) BannerStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        log.info("GET /api/banners - Admin viewing all banners. Status: {}", status);

        Page<BannerResponse> banners = bannerService.getAllBanners(status, pageable);

        return ResponseEntity.ok(ApiResponse.success("Banners retrieved successfully", banners));
    }

    @GetMapping("/active")
    @Operation(
            summary = "Get active banners (Public)",
            description = "Get all active banners for customers - no authentication required"
    )
    public ResponseEntity<ApiResponse<List<BannerResponse>>> getActiveBanners() {

        log.info("GET /api/banners/active - Getting active banners for customers");

        List<BannerResponse> banners = bannerService.getActiveBanners();

        return ResponseEntity.ok(ApiResponse.success("Active banners retrieved successfully", banners));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(
            summary = "Get banner by ID (Admin only)",
            description = "Get detailed information about a specific banner"
    )
    public ResponseEntity<ApiResponse<BannerResponse>> getBannerById(@PathVariable String id) {

        log.info("GET /api/banners/{} - Get banner details", id);

        BannerResponse banner = bannerService.getBannerById(id);

        return ResponseEntity.ok(ApiResponse.success("Banner retrieved successfully", banner));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(
            summary = "Create new banner (Admin only)",
            description = "Admin creates a new banner"
    )
    public ResponseEntity<ApiResponse<BannerResponse>> createBanner(
            @Valid @RequestBody BannerRequest request) {

        log.info("POST /api/banners - Creating new banner: {}", request.getTitle());

        BannerResponse banner = bannerService.createBanner(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Banner created successfully", banner));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(
            summary = "Update banner (Admin only)",
            description = "Admin updates an existing banner"
    )
    public ResponseEntity<ApiResponse<BannerResponse>> updateBanner(
            @PathVariable String id,
            @Valid @RequestBody BannerRequest request) {

        log.info("PUT /api/banners/{} - Updating banner", id);

        BannerResponse banner = bannerService.updateBanner(id, request);

        return ResponseEntity.ok(ApiResponse.success("Banner updated successfully", banner));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(
            summary = "Delete banner (Admin only)",
            description = "Admin deletes a banner"
    )
    public ResponseEntity<ApiResponse<Void>> deleteBanner(@PathVariable String id) {

        log.info("DELETE /api/banners/{} - Deleting banner", id);

        bannerService.deleteBanner(id);

        return ResponseEntity.ok(ApiResponse.success("Banner deleted successfully"));
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(
            summary = "Activate banner (Admin only)",
            description = "Admin activates a banner (changes status to ACTIVE)"
    )
    public ResponseEntity<ApiResponse<BannerResponse>> activateBanner(@PathVariable String id) {

        log.info("PATCH /api/banners/{}/activate - Activating banner", id);

        BannerResponse banner = bannerService.activateBanner(id);

        return ResponseEntity.ok(ApiResponse.success("Banner activated successfully", banner));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(
            summary = "Deactivate banner (Admin only)",
            description = "Admin deactivates a banner (changes status to INACTIVE)"
    )
    public ResponseEntity<ApiResponse<BannerResponse>> deactivateBanner(@PathVariable String id) {

        log.info("PATCH /api/banners/{}/deactivate - Deactivating banner", id);

        BannerResponse banner = bannerService.deactivateBanner(id);

        return ResponseEntity.ok(ApiResponse.success("Banner deactivated successfully", banner));
    }
}
