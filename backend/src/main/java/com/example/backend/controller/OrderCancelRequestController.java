package com.example.backend.controller;

import com.example.backend.dto.request.CreateCancelRequestRequest;
import com.example.backend.dto.request.ReviewCancelRequestRequest;
import com.example.backend.dto.response.CancelRequestResponse;
import com.example.backend.service.OrderCancelRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/order-cancel-requests")
@RequiredArgsConstructor
@Tag(name = "Order Cancel Request", description = "APIs for Order Cancel Request Management")
@SecurityRequirement(name = "bearerAuth")
public class OrderCancelRequestController {

    private final OrderCancelRequestService cancelRequestService;

    @Operation(summary = "Create cancel request", description = "Customer creates a cancel request for an order (PREPARING/SHIPPING status)")
    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CancelRequestResponse> createCancelRequest(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam String orderId,
            @Valid @RequestBody CreateCancelRequestRequest request) {
        
        String customerId = jwt.getSubject();
        log.info("Creating cancel request: customerId={}, orderId={}", customerId, orderId);
        
        CancelRequestResponse response = cancelRequestService.createCancelRequest(customerId, orderId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Review cancel request", description = "Supplier or Admin reviews (approves/rejects) a cancel request")
    @PostMapping("/{cancelRequestId}/review")
    @PreAuthorize("hasAnyRole('SUPPLIER', 'SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    public ResponseEntity<CancelRequestResponse> reviewCancelRequest(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String cancelRequestId,
            @Valid @RequestBody ReviewCancelRequestRequest request) {
        
        String reviewerId = jwt.getSubject();
        log.info("Reviewing cancel request: cancelRequestId={}, reviewerId={}", cancelRequestId, reviewerId);
        
        CancelRequestResponse response = cancelRequestService.reviewCancelRequest(cancelRequestId, reviewerId, request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get cancel request by ID", description = "Get details of a cancel request")
    @GetMapping("/{cancelRequestId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SUPPLIER', 'SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    public ResponseEntity<CancelRequestResponse> getCancelRequestById(
            @PathVariable String cancelRequestId) {
        
        log.info("Getting cancel request: cancelRequestId={}", cancelRequestId);
        
        CancelRequestResponse response = cancelRequestService.getCancelRequestById(cancelRequestId);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get cancel request by order ID", description = "Get cancel request for a specific order")
    @GetMapping("/order/{orderId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SUPPLIER', 'SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    public ResponseEntity<CancelRequestResponse> getCancelRequestByOrderId(
            @PathVariable String orderId) {
        
        log.info("Getting cancel request by order: orderId={}", orderId);
        
        CancelRequestResponse response = cancelRequestService.getCancelRequestByOrderId(orderId);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get customer's cancel requests", description = "Customer gets their own cancel requests")
    @GetMapping("/my-requests")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Page<CancelRequestResponse>> getMyRequests(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        String customerId = jwt.getSubject();
        log.info("Getting customer's cancel requests: customerId={}", customerId);
        
        Page<CancelRequestResponse> responses = cancelRequestService.getCustomerCancelRequests(customerId, page, size);
        return ResponseEntity.ok(responses);
    }

    @Operation(summary = "Get store's cancel requests", description = "Supplier gets cancel requests for their store")
    @GetMapping("/store/{storeId}")
    @PreAuthorize("hasAnyRole('SUPPLIER', 'SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    public ResponseEntity<Page<CancelRequestResponse>> getStoreCancelRequests(
            @PathVariable String storeId,
            @RequestParam(defaultValue = "false") boolean pending,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        log.info("Getting store's cancel requests: storeId={}, pending={}", storeId, pending);
        
        Page<CancelRequestResponse> responses = cancelRequestService.getStoreCancelRequests(storeId, pending, page, size);
        return ResponseEntity.ok(responses);
    }

    @Operation(summary = "Get all pending cancel requests", description = "Admin gets all pending cancel requests")
    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    public ResponseEntity<Page<CancelRequestResponse>> getAllPendingRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        log.info("Getting all pending cancel requests");
        
        Page<CancelRequestResponse> responses = cancelRequestService.getAllPendingCancelRequests(page, size);
        return ResponseEntity.ok(responses);
    }
}
