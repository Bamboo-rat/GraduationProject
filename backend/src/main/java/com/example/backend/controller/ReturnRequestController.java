package com.example.backend.controller;

import com.example.backend.dto.request.CreateReturnRequestRequest;
import com.example.backend.dto.request.ReviewReturnRequestRequest;
import com.example.backend.dto.response.ReturnRequestResponse;
import com.example.backend.service.ReturnRequestService;
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

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/return-requests")
@RequiredArgsConstructor
@Tag(name = "Return Request", description = "APIs for Return Request Management")
@SecurityRequirement(name = "bearerAuth")
public class ReturnRequestController {

    private final ReturnRequestService returnRequestService;

    @Operation(summary = "Create return request", description = "Customer creates a return request for a delivered order (within 7 days)")
    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ReturnRequestResponse> createReturnRequest(
            Authentication authentication,
            @RequestParam String orderId,
            @Valid @RequestBody CreateReturnRequestRequest request) {
        
        String customerId = authentication.getName();
        log.info("Creating return request: customerId={}, orderId={}", customerId, orderId);
        
        ReturnRequestResponse response = returnRequestService.createReturnRequest(customerId, orderId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Approve return request", description = "Supplier or Admin approves a return request")
    @PostMapping("/{returnRequestId}/approve")
    @PreAuthorize("hasAnyRole('SUPPLIER', 'SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    public ResponseEntity<ReturnRequestResponse> approveReturnRequest(
            Authentication authentication,
            @PathVariable String returnRequestId,
            @Valid @RequestBody ReviewReturnRequestRequest request) {
        
        String reviewerId = authentication.getName();
        log.info("Approving return request: returnRequestId={}, reviewerId={}", returnRequestId, reviewerId);
        
        ReturnRequestResponse response = returnRequestService.approveReturnRequest(returnRequestId, reviewerId, request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Reject return request", description = "Supplier or Admin rejects a return request")
    @PostMapping("/{returnRequestId}/reject")
    @PreAuthorize("hasAnyRole('SUPPLIER', 'SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    public ResponseEntity<ReturnRequestResponse> rejectReturnRequest(
            Authentication authentication,
            @PathVariable String returnRequestId,
            @Valid @RequestBody ReviewReturnRequestRequest request) {
        
        String reviewerId = authentication.getName();
        log.info("Rejecting return request: returnRequestId={}, reviewerId={}", returnRequestId, reviewerId);
        
        ReturnRequestResponse response = returnRequestService.rejectReturnRequest(returnRequestId, reviewerId, request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get return request by ID", description = "Get details of a return request")
    @GetMapping("/{returnRequestId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SUPPLIER', 'SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    public ResponseEntity<ReturnRequestResponse> getReturnRequestById(
            @PathVariable String returnRequestId) {
        
        log.info("Getting return request: returnRequestId={}", returnRequestId);
        
        ReturnRequestResponse response = returnRequestService.getReturnRequestById(returnRequestId);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get return request by order ID", description = "Get return request for a specific order")
    @GetMapping("/order/{orderId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SUPPLIER', 'SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    public ResponseEntity<ReturnRequestResponse> getReturnRequestByOrderId(
            @PathVariable String orderId) {
        
        log.info("Getting return request by order: orderId={}", orderId);
        
        ReturnRequestResponse response = returnRequestService.getReturnRequestByOrderId(orderId);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get customer's return requests", description = "Customer gets their own return requests")
    @GetMapping("/my-requests")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Page<ReturnRequestResponse>> getMyRequests(Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        String customerId = authentication.getName();
        log.info("Getting customer's return requests: customerId={}", customerId);
        
        Page<ReturnRequestResponse> responses = returnRequestService.getCustomerReturnRequests(customerId, page, size);
        return ResponseEntity.ok(responses);
    }

    @Operation(summary = "Get store's return requests", description = "Supplier gets return requests for their store")
    @GetMapping("/store/{storeId}")
    @PreAuthorize("hasAnyRole('SUPPLIER', 'SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    public ResponseEntity<Page<ReturnRequestResponse>> getStoreReturnRequests(
            @PathVariable String storeId,
            @RequestParam(defaultValue = "false") boolean pending,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        log.info("Getting store's return requests: storeId={}, pending={}", storeId, pending);
        
        Page<ReturnRequestResponse> responses = returnRequestService.getStoreReturnRequests(storeId, pending, page, size);
        return ResponseEntity.ok(responses);
    }

    @Operation(summary = "Get all pending return requests", description = "Admin gets all pending return requests")
    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    public ResponseEntity<Page<ReturnRequestResponse>> getAllPendingRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        log.info("Getting all pending return requests");

        Page<ReturnRequestResponse> responses = returnRequestService.getAllPendingReturnRequests(page, size);
        return ResponseEntity.ok(responses);
    }

    @Operation(summary = "Get supplier's return requests", description = "Supplier gets all return requests for all their stores")
    @GetMapping("/my-stores-requests")
    @PreAuthorize("hasRole('SUPPLIER')")
    public ResponseEntity<Page<ReturnRequestResponse>> getMyStoresRequests(
            Authentication authentication,
            @RequestParam(defaultValue = "false") boolean pending,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        String supplierId = authentication.getName();
        log.info("Getting supplier's return requests: supplierId={}, pending={}", supplierId, pending);

        Page<ReturnRequestResponse> responses = returnRequestService.getSupplierReturnRequests(supplierId, pending, page, size);
        return ResponseEntity.ok(responses);
    }
}
