package com.example.backend.controller;

import com.example.backend.dto.request.CustomerUpdateRequest;
import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.CustomerResponse;
import com.example.backend.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for customer-specific operations (requires authentication)
 * Customer registration has been moved to AuthController: POST /api/auth/register/customer/*
 */
@Slf4j
@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
@Tag(name = "Customer", description = "Customer profile and management endpoints (authenticated)")
@SecurityRequirement(name = "Bearer Authentication")
public class CustomerController {

    private final CustomerService customerService;

    // ===== Profile Management Endpoints (Authentication required) =====

    @GetMapping("/me")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Get current customer profile",
               description = "Get detailed profile information of the authenticated customer")
    public ResponseEntity<ApiResponse<CustomerResponse>> getCurrentCustomer(Authentication authentication) {
        log.info("GET /api/customers/me - Getting current customer profile");

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String userId = jwt.getSubject(); // For customers, subject is userId (not keycloakId)
        CustomerResponse response = customerService.getCustomerInfo(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF', 'SUPPLIER')")
    @Operation(summary = "Get customer by ID",
               description = "Get detailed customer information by user ID (admin only)")
    public ResponseEntity<ApiResponse<CustomerResponse>> getCustomerById(@PathVariable String userId) {
        log.info("GET /api/customers/{} - Getting customer by ID", userId);

        CustomerResponse response = customerService.getCustomerById(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Update customer profile",
               description = "Update current customer's profile information")
    public ResponseEntity<ApiResponse<CustomerResponse>> updateProfile(
            Authentication authentication,
            @Valid @RequestBody CustomerUpdateRequest request) {
        log.info("PUT /api/customers/me - Updating customer profile");

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String userId = jwt.getSubject(); // For customers, subject is userId
        CustomerResponse response = customerService.updateProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", response));
    }

    // Avatar update is handled via updateProfile() method
    // Upload avatar first via FileStorageController, then include avatarUrl in CustomerProfileUpdateRequest

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Get all customers",
               description = "Get list of all customers with pagination and filtering (admin only)")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<CustomerResponse>>> getAllCustomers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) com.example.backend.entity.enums.CustomerStatus status,
            @RequestParam(required = false) com.example.backend.entity.enums.CustomerTier tier,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {
        log.info("GET /api/customers - Getting all customers (page: {}, size: {}, status: {}, tier: {}, search: {})",
                page, size, status, tier, search);

        org.springframework.data.domain.Page<CustomerResponse> customers =
                customerService.getAllCustomers(page, size, status, tier, search, sortBy, sortDirection);

        return ResponseEntity.ok(ApiResponse.success(customers));
    }

    @PatchMapping("/{userId}/active")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    @Operation(summary = "Toggle customer active status",
               description = "Activate or deactivate customer account (admin only)")
    public ResponseEntity<ApiResponse<CustomerResponse>> setCustomerActive(
            @PathVariable String userId,
            @RequestParam boolean active) {
        log.info("PATCH /api/customers/{}/active - Setting active status to: {}", userId, active);

        CustomerResponse response = customerService.setActive(userId, active);
        return ResponseEntity.ok(ApiResponse.success("Customer active status updated successfully", response));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Get customer statistics",
               description = "Get customer statistics including counts by status and tier (admin only)")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> getCustomerStats() {
        log.info("GET /api/customers/stats - Getting customer statistics");

        java.util.Map<String, Object> stats = customerService.getCustomerStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/{userId}/detail")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Get comprehensive customer details (Admin)",
               description = "Get comprehensive customer details including violations, behavioral statistics, and AI recommendation for admin evaluation")
    public ResponseEntity<ApiResponse<com.example.backend.dto.response.CustomerDetailResponse>> getCustomerDetailForAdmin(
            @PathVariable String userId) {
        log.info("GET /api/customers/{}/detail - Getting comprehensive customer details for admin", userId);

        com.example.backend.dto.response.CustomerDetailResponse response =
                customerService.getCustomerDetailForAdmin(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ===== Customer History Endpoints =====

    @GetMapping("/{userId}/orders")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF', 'CUSTOMER')")
    @Operation(summary = "Get customer order history",
               description = "Get paginated list of customer orders with basic information. " +
                           "Customers can only access their own orders, admins can access any customer's orders")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<com.example.backend.dto.response.OrderSummaryResponse>>> getCustomerOrders(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        log.info("GET /api/customers/{}/orders - Getting customer order history (page: {}, size: {})", userId, page, size);

        // Authorization: Customers can only view their own orders
        if (authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"))) {
            Jwt jwt = (Jwt) authentication.getPrincipal();
            String currentUserId = jwt.getSubject();
            if (!currentUserId.equals(userId)) {
                return ResponseEntity.status(403)
                        .body(ApiResponse.error("FORBIDDEN", "You can only view your own orders"));
            }
        }

        org.springframework.data.domain.Page<com.example.backend.dto.response.OrderSummaryResponse> orders =
                customerService.getCustomerOrders(userId, page, size);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping("/{userId}/point-transactions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF', 'CUSTOMER')")
    @Operation(summary = "Get customer point transaction history",
               description = "Get paginated list of customer point transactions. " +
                           "Customers can only access their own transactions, admins can access any customer's transactions")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<com.example.backend.dto.response.PointTransactionResponse>>> getCustomerPointTransactions(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        log.info("GET /api/customers/{}/point-transactions - Getting point transaction history (page: {}, size: {})",
                userId, page, size);

        // Authorization: Customers can only view their own transactions
        if (authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"))) {
            Jwt jwt = (Jwt) authentication.getPrincipal();
            String currentUserId = jwt.getSubject();
            if (!currentUserId.equals(userId)) {
                return ResponseEntity.status(403)
                        .body(ApiResponse.error("FORBIDDEN", "You can only view your own transactions"));
            }
        }

        org.springframework.data.domain.Page<com.example.backend.dto.response.PointTransactionResponse> transactions =
                customerService.getCustomerPointTransactions(userId, page, size);
        return ResponseEntity.ok(ApiResponse.success(transactions));
    }

    @GetMapping("/{userId}/addresses")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF', 'CUSTOMER')")
    @Operation(summary = "Get customer addresses",
               description = "Get list of customer addresses. " +
                           "Customers can only access their own addresses, admins can access any customer's addresses")
    public ResponseEntity<ApiResponse<java.util.List<com.example.backend.dto.response.AddressResponse>>> getCustomerAddresses(
            @PathVariable String userId,
            Authentication authentication) {
        log.info("GET /api/customers/{}/addresses - Getting customer addresses", userId);

        // Authorization: Customers can only view their own addresses
        if (authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"))) {
            Jwt jwt = (Jwt) authentication.getPrincipal();
            String currentUserId = jwt.getSubject();
            if (!currentUserId.equals(userId)) {
                return ResponseEntity.status(403)
                        .body(ApiResponse.error("FORBIDDEN", "You can only view your own addresses"));
            }
        }

        java.util.List<com.example.backend.dto.response.AddressResponse> addresses =
                customerService.getCustomerAddresses(userId);
        return ResponseEntity.ok(ApiResponse.success(addresses));
    }

    @GetMapping("/{userId}/reviews")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF', 'CUSTOMER')")
    @Operation(summary = "Get customer reviews",
               description = "Get paginated list of customer product reviews. " +
                           "Customers can only access their own reviews, admins can access any customer's reviews")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<com.example.backend.dto.response.ReviewResponse>>> getCustomerReviews(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        log.info("GET /api/customers/{}/reviews - Getting customer reviews (page: {}, size: {})", userId, page, size);

        // Authorization: Customers can only view their own reviews
        if (authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"))) {
            Jwt jwt = (Jwt) authentication.getPrincipal();
            String currentUserId = jwt.getSubject();
            if (!currentUserId.equals(userId)) {
                return ResponseEntity.status(403)
                        .body(ApiResponse.error("FORBIDDEN", "You can only view your own reviews"));
            }
        }

        org.springframework.data.domain.Page<com.example.backend.dto.response.ReviewResponse> reviews =
                customerService.getCustomerReviews(userId, page, size);
        return ResponseEntity.ok(ApiResponse.success(reviews));
    }

    @GetMapping("/{userId}/favorite-stores")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF', 'CUSTOMER')")
    @Operation(summary = "Get customer favorite stores",
               description = "Get paginated list of customer's favorite stores. " +
                           "Customers can only access their own favorites, admins can access any customer's favorites")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<com.example.backend.dto.response.FavoriteStoreResponse>>> getCustomerFavoriteStores(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        log.info("GET /api/customers/{}/favorite-stores - Getting customer favorite stores (page: {}, size: {})",
                userId, page, size);

        // Authorization: Customers can only view their own favorites
        if (authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"))) {
            Jwt jwt = (Jwt) authentication.getPrincipal();
            String currentUserId = jwt.getSubject();
            if (!currentUserId.equals(userId)) {
                return ResponseEntity.status(403)
                        .body(ApiResponse.error("FORBIDDEN", "You can only view your own favorites"));
            }
        }

        org.springframework.data.domain.Page<com.example.backend.dto.response.FavoriteStoreResponse> favorites =
                customerService.getCustomerFavoriteStores(userId, page, size);
        return ResponseEntity.ok(ApiResponse.success(favorites));
    }

    // ===== Customer Management Endpoints (Admin Only) =====

    @PostMapping("/{userId}/suspend")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    @Operation(summary = "Suspend customer account",
               description = "Suspend customer account with a reason and optional duration. Creates disciplinary record. (Admin only)")
    public ResponseEntity<ApiResponse<CustomerResponse>> suspendCustomer(
            @PathVariable String userId,
            @RequestBody com.example.backend.dto.request.SuspendCustomerRequest request) {
        log.info("POST /api/customers/{}/suspend - Suspending customer (reason: {}, duration: {} days)",
                userId, request.getReason(), request.getDurationDays());

        CustomerResponse response = customerService.suspendCustomer(userId, request.getReason(), request.getDurationDays());
        return ResponseEntity.ok(ApiResponse.success("Customer suspended successfully", response));
    }

    @PostMapping("/{userId}/unsuspend")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    @Operation(summary = "Unsuspend customer account",
               description = "Reactivate suspended customer account and mark disciplinary records as resolved. (Admin only)")
    public ResponseEntity<ApiResponse<CustomerResponse>> unsuspendCustomer(@PathVariable String userId) {
        log.info("POST /api/customers/{}/unsuspend - Unsuspending customer", userId);

        CustomerResponse response = customerService.unsuspendCustomer(userId);
        return ResponseEntity.ok(ApiResponse.success("Customer unsuspended successfully", response));
    }
}
