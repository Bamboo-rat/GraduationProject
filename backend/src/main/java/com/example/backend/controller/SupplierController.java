package com.example.backend.controller;

import com.example.backend.dto.request.*;
import com.example.backend.dto.response.*;
import com.example.backend.entity.enums.SuggestionStatus;
import com.example.backend.entity.enums.SupplierStatus;
import com.example.backend.service.SupplierDashboardService;
import com.example.backend.service.SupplierService;
import com.example.backend.utils.JwtUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for supplier-specific operations (requires authentication)
 * Supplier registration has been moved to AuthController: POST /api/auth/register/supplier/*
 */
@Slf4j
@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
@Tag(name = "Supplier", description = "Supplier profile and management endpoints (authenticated)")
@SecurityRequirement(name = "Bearer Authentication")
@PreAuthorize("hasAnyRole('SUPPLIER', 'SUPER_ADMIN', 'MODERATOR', 'STAFF')")
public class SupplierController {

    private final SupplierService supplierService;
    private final SupplierDashboardService supplierDashboardService;

    // ===== PROFILE MANAGEMENT ENDPOINTS (Authentication required) =====

    @GetMapping("/me")
    @Operation(summary = "Get current supplier profile", 
               description = "Get detailed profile information of the authenticated supplier")
    public ResponseEntity<ApiResponse<SupplierResponse>> getCurrentSupplier(Authentication authentication) {
        log.info("GET /api/suppliers/me - Getting current supplier profile");

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        SupplierResponse response = supplierService.getSupplierInfo(keycloakId);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Get supplier by ID",
               description = "Get detailed supplier information by user ID (admin only)")
    public ResponseEntity<ApiResponse<SupplierResponse>> getSupplierById(@PathVariable String userId) {
        log.info("GET /api/suppliers/{} - Getting supplier by ID", userId);

        SupplierResponse response = supplierService.getSupplierById(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/me")
    @Operation(summary = "Update supplier profile", 
               description = "Update current supplier's profile information")
    public ResponseEntity<ApiResponse<SupplierResponse>> updateProfile(
            Authentication authentication,
            @Valid @RequestBody SupplierProfileUpdateRequest request) {
        log.info("PUT /api/suppliers/me - Updating supplier profile");

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        SupplierResponse response = supplierService.updateProfile(keycloakId, request);

        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Get all suppliers",
               description = "Get list of all suppliers with pagination, search, and filtering (admin only)")
    public ResponseEntity<ApiResponse<Page<SupplierResponse>>> getAllSuppliers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) SupplierStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {
        log.info("GET /api/suppliers - Getting all suppliers (page: {}, size: {}, status: {}, search: {})",
                page, size, status, search);

        Page<SupplierResponse> suppliers =
                supplierService.getAllSuppliers(page, size, status, search, sortBy, sortDirection);

        return ResponseEntity.ok(ApiResponse.success(suppliers));
    }

    @PatchMapping("/{userId}/approve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    @Operation(summary = "Approve supplier",
               description = "Approve pending supplier application and send email notification (admin/moderator only)")
    public ResponseEntity<ApiResponse<SupplierResponse>> approveSupplier(
            @PathVariable String userId,
            @RequestParam(required = false) String note) {
        log.info("PATCH /api/suppliers/{}/approve - Approving supplier with note: {}", userId, note);

        SupplierResponse response = supplierService.approveSupplier(userId, note);
        return ResponseEntity.ok(ApiResponse.success("Supplier approved successfully and notification email sent", response));
    }

    @PatchMapping("/{userId}/reject")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    @Operation(summary = "Reject supplier",
               description = "Reject pending supplier application and send email notification (admin/moderator only)")
    public ResponseEntity<ApiResponse<SupplierResponse>> rejectSupplier(
            @PathVariable String userId,
            @RequestParam(required = false) String reason) {
        log.info("PATCH /api/suppliers/{}/reject - Rejecting supplier. Reason: {}", userId, reason);

        SupplierResponse response = supplierService.rejectSupplier(userId, reason);
        return ResponseEntity.ok(ApiResponse.success("Supplier rejected and notification email sent", response));
    }

    @PatchMapping("/{userId}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    @Operation(summary = "Update supplier status",
               description = "Update supplier status (admin/moderator only)")
    public ResponseEntity<ApiResponse<SupplierResponse>> updateSupplierStatus(
            @PathVariable String userId,
            @RequestParam SupplierStatus status) {
        log.info("PATCH /api/suppliers/{}/status - Updating supplier status to: {}", userId, status);

        SupplierResponse response = supplierService.updateStatus(userId, status);
        return ResponseEntity.ok(ApiResponse.success("Supplier status updated successfully", response));
    }

    @PatchMapping("/{userId}/active")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    @Operation(summary = "Toggle supplier active status",
               description = "Activate or deactivate supplier account (admin/moderator only)")
    public ResponseEntity<ApiResponse<SupplierResponse>> setSupplierActive(
            @PathVariable String userId,
            @RequestParam boolean active) {
        log.info("PATCH /api/suppliers/{}/active - Setting active status to: {}", userId, active);

        SupplierResponse response = supplierService.setActive(userId, active);
        return ResponseEntity.ok(ApiResponse.success("Supplier active status updated successfully", response));
    }

    @PatchMapping("/{userId}/commission")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    @Operation(summary = "Update supplier commission rate",
               description = "Update commission rate for supplier (admin/moderator only)")
    public ResponseEntity<ApiResponse<SupplierResponse>> updateCommissionRate(
            @PathVariable String userId,
            @Valid @RequestBody SupplierCommissionUpdateRequest request) {
        log.info("PATCH /api/suppliers/{}/commission - Updating commission rate to: {}", userId, request.getCommissionRate());

        SupplierResponse response = supplierService.updateCommissionRate(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Commission rate updated successfully", response));
    }

    @PatchMapping("/{userId}/suspend")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    @Operation(summary = "Suspend supplier (Admin only)",
               description = "Suspend supplier for policy violation. Blocks all operations including stores, products, and system access.")
    public ResponseEntity<ApiResponse<SupplierResponse>> suspendSupplier(
            @PathVariable String userId,
            @RequestParam String reason) {
        log.info("PATCH /api/suppliers/{}/suspend - Admin suspending supplier. Reason: {}", userId, reason);

        SupplierResponse response = supplierService.suspendSupplier(userId, reason);
        return ResponseEntity.ok(ApiResponse.success("Supplier suspended successfully", response));
    }

    @PatchMapping("/{userId}/unsuspend")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    @Operation(summary = "Unsuspend supplier (Admin only)",
               description = "Remove suspension and restore supplier to ACTIVE status")
    public ResponseEntity<ApiResponse<SupplierResponse>> unsuspendSupplier(@PathVariable String userId) {
        log.info("PATCH /api/suppliers/{}/unsuspend - Admin unsuspending supplier", userId);

        SupplierResponse response = supplierService.unsuspendSupplier(userId);
        return ResponseEntity.ok(ApiResponse.success("Supplier unsuspended successfully", response));
    }

    @PatchMapping("/me/pause")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Pause operations (Supplier)",
               description = "Temporarily pause business operations. Stores hidden from search, no new orders accepted, but backend access retained.")
    public ResponseEntity<ApiResponse<SupplierResponse>> pauseOperations(
            Authentication authentication,
            @RequestParam(required = false) String reason) {
        log.info("PATCH /api/suppliers/me/pause - Supplier pausing operations. Reason: {}", reason);

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        SupplierResponse response = supplierService.pauseOperations(keycloakId, reason);
        return ResponseEntity.ok(ApiResponse.success("Operations paused successfully", response));
    }

    @PatchMapping("/me/resume")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Resume operations (Supplier)",
               description = "Resume business operations from PAUSE status")
    public ResponseEntity<ApiResponse<SupplierResponse>> resumeOperations(Authentication authentication) {
        log.info("PATCH /api/suppliers/me/resume - Supplier resuming operations");

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        SupplierResponse response = supplierService.resumeOperations(keycloakId);
        return ResponseEntity.ok(ApiResponse.success("Operations resumed successfully", response));
    }

    // ===== BUSINESS INFO UPDATE ENDPOINTS =====

    @PostMapping("/me/business-info-update")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Request business info update",
               description = "Submit a request to update sensitive business information (tax code, licenses). Requires admin approval.")
    public ResponseEntity<ApiResponse<SupplierPendingUpdateResponse>> requestBusinessInfoUpdate(
            Authentication authentication,
            @Valid @RequestBody SupplierBusinessUpdateRequest request) {
        log.info("POST /api/suppliers/me/business-info-update - Submitting business info update request");

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        SupplierPendingUpdateResponse response = supplierService.requestBusinessInfoUpdate(keycloakId, request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Business info update request submitted successfully. Waiting for admin approval.", response));
    }

    @GetMapping("/me/business-info-updates")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get my business info update requests",
               description = "Get all business info update requests submitted by current supplier")
    public ResponseEntity<ApiResponse<Page<SupplierPendingUpdateResponse>>> getMyBusinessInfoUpdates(
            Authentication authentication,
            @RequestParam(required = false) SuggestionStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {
        log.info("GET /api/suppliers/me/business-info-updates - Getting my update requests (status: {})", status);

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        Sort sort = Sort.by(Sort.Direction.fromString(sortDirection), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<SupplierPendingUpdateResponse> updates = 
                supplierService.getMyPendingBusinessUpdates(keycloakId, status, pageable);

        return ResponseEntity.ok(ApiResponse.success(updates));
    }

    @GetMapping("/business-info-updates")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Get all business info update requests",
               description = "Get all business info update requests from all suppliers (admin only)")
    public ResponseEntity<ApiResponse<Page<SupplierPendingUpdateResponse>>> getAllBusinessInfoUpdates(
            @RequestParam(required = false) SuggestionStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {
        log.info("GET /api/suppliers/business-info-updates - Getting all update requests (status: {})", status);

        Sort sort = Sort.by(Sort.Direction.fromString(sortDirection), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<SupplierPendingUpdateResponse> updates = 
                supplierService.getAllPendingBusinessUpdates(status, pageable);

        return ResponseEntity.ok(ApiResponse.success(updates));
    }

    @GetMapping("/business-info-updates/{updateId}")
    @PreAuthorize("hasAnyRole('SUPPLIER', 'SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Get business info update by ID",
               description = "Get details of a specific business info update request")
    public ResponseEntity<ApiResponse<SupplierPendingUpdateResponse>> getBusinessInfoUpdateById(
            @PathVariable String updateId) {
        log.info("GET /api/suppliers/business-info-updates/{} - Getting update request details", updateId);

        SupplierPendingUpdateResponse response = supplierService.getPendingBusinessUpdateById(updateId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/business-info-updates/{updateId}/approve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    @Operation(summary = "Approve business info update",
               description = "Approve pending business info update request and apply changes (admin only)")
    public ResponseEntity<ApiResponse<SupplierPendingUpdateResponse>> approveBusinessInfoUpdate(
            Authentication authentication,
            @PathVariable String updateId,
            @RequestParam(required = false) String adminNotes) {
        log.info("PATCH /api/suppliers/business-info-updates/{}/approve - Approving update request", updateId);

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        SupplierPendingUpdateResponse response = 
                supplierService.approveBusinessInfoUpdate(updateId, keycloakId, adminNotes);

        return ResponseEntity.ok(ApiResponse.success("Business info update approved and applied successfully", response));
    }

    @PatchMapping("/business-info-updates/{updateId}/reject")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    @Operation(summary = "Reject business info update",
               description = "Reject pending business info update request (admin only)")
    public ResponseEntity<ApiResponse<SupplierPendingUpdateResponse>> rejectBusinessInfoUpdate(
            Authentication authentication,
            @PathVariable String updateId,
            @RequestParam(required = false) String adminNotes) {
        log.info("PATCH /api/suppliers/business-info-updates/{}/reject - Rejecting update request", updateId);

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        SupplierPendingUpdateResponse response = 
                supplierService.rejectBusinessInfoUpdate(updateId, keycloakId, adminNotes);

        return ResponseEntity.ok(ApiResponse.success("Business info update request rejected", response));
    }

    // ===== DASHBOARD ANALYTICS ENDPOINTS =====

    @GetMapping("/me/dashboard/stats")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get dashboard statistics",
               description = "Get comprehensive dashboard statistics including today's orders, revenue, stock alerts, etc.")
    public ResponseEntity<ApiResponse<SupplierDashboardStatsResponse>> getDashboardStats(
            Authentication authentication) {
        log.info("GET /api/suppliers/me/dashboard/stats - Getting dashboard statistics");

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        SupplierDashboardStatsResponse stats = supplierDashboardService.getDashboardStats(keycloakId);

        return ResponseEntity.ok(ApiResponse.success("Dashboard statistics retrieved successfully", stats));
    }

    @GetMapping("/me/dashboard/revenue")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get revenue over time",
               description = "Get daily revenue time series for a date range. Default: last 7 days.")
    public ResponseEntity<ApiResponse<java.util.List<SupplierRevenueTimeSeriesResponse>>> getRevenueOverTime(
            Authentication authentication,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate endDate) {
        log.info("GET /api/suppliers/me/dashboard/revenue - Getting revenue over time");

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        // Default to last 7 days if not specified
        if (startDate == null) {
            startDate = java.time.LocalDate.now().minusDays(6);
        }
        if (endDate == null) {
            endDate = java.time.LocalDate.now();
        }

        java.util.List<SupplierRevenueTimeSeriesResponse> revenue =
                supplierDashboardService.getRevenueOverTime(keycloakId, startDate, endDate);

        return ResponseEntity.ok(ApiResponse.success("Revenue time series retrieved successfully", revenue));
    }

    @GetMapping("/me/dashboard/top-products")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get top selling products",
               description = "Get top N selling products ranked by revenue. Default limit: 5 products.")
    public ResponseEntity<ApiResponse<java.util.List<SupplierTopProductResponse>>> getTopProducts(
            Authentication authentication,
            @RequestParam(defaultValue = "5") int limit,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate endDate) {
        log.info("GET /api/suppliers/me/dashboard/top-products - Getting top {} products", limit);

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        // Validate limit
        if (limit < 1 || limit > 100) {
            limit = 5;
        }

        // Default to current month if not specified
        if (startDate == null) {
            startDate = java.time.LocalDate.now().withDayOfMonth(1);
        }
        if (endDate == null) {
            endDate = java.time.LocalDate.now();
        }

        java.util.List<SupplierTopProductResponse> topProducts =
                supplierDashboardService.getTopProducts(keycloakId, limit, startDate, endDate);

        return ResponseEntity.ok(ApiResponse.success("Top products retrieved successfully", topProducts));
    }

    @GetMapping("/me/dashboard/order-status")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get order status distribution",
               description = "Get count of orders grouped by status")
    public ResponseEntity<ApiResponse<java.util.List<SupplierOrderStatusResponse>>> getOrderStatusDistribution(
            Authentication authentication) {
        log.info("GET /api/suppliers/me/dashboard/order-status - Getting order status distribution");

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        java.util.List<SupplierOrderStatusResponse> orderStatus =
                supplierDashboardService.getOrderStatusDistribution(keycloakId);

        return ResponseEntity.ok(ApiResponse.success("Order status distribution retrieved successfully", orderStatus));
    }
}
