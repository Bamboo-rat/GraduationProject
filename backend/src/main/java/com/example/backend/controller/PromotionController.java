package com.example.backend.controller;

import com.example.backend.dto.request.PromotionRequest;
import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.PromotionResponse;
import com.example.backend.entity.enums.PromotionStatus;
import com.example.backend.entity.enums.PromotionTier;
import com.example.backend.service.PromotionService;
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
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

/**
 * Controller for promotion management
 */
@Slf4j
@RestController
@RequestMapping("/api/promotions")
@RequiredArgsConstructor
@Tag(name = "Promotion", description = "Promotion management endpoints")
@SecurityRequirement(name = "Bearer Authentication")
public class PromotionController {

    private final PromotionService promotionService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Create new promotion",
               description = "Create a new promotion code (admin only)")
    public ResponseEntity<ApiResponse<PromotionResponse>> createPromotion(
            @Valid @RequestBody PromotionRequest request) {
        log.info("POST /api/promotions - Creating new promotion: {}", request.getCode());

        PromotionResponse response = promotionService.createPromotion(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Promotion created successfully", response));
    }

    @PutMapping("/{promotionId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Update promotion",
               description = "Update an existing promotion (admin only)")
    public ResponseEntity<ApiResponse<PromotionResponse>> updatePromotion(
            @PathVariable String promotionId,
            @Valid @RequestBody PromotionRequest request) {
        log.info("PUT /api/promotions/{} - Updating promotion", promotionId);

        PromotionResponse response = promotionService.updatePromotion(promotionId, request);
        return ResponseEntity.ok(ApiResponse.success("Promotion updated successfully", response));
    }

    @GetMapping("/{promotionId}")
    @Operation(summary = "Get promotion by ID",
               description = "Get promotion details by ID (public)")
    public ResponseEntity<ApiResponse<PromotionResponse>> getPromotionById(
            @PathVariable String promotionId) {
        log.info("GET /api/promotions/{} - Getting promotion", promotionId);

        PromotionResponse response = promotionService.getPromotionById(promotionId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/code/{code}")
    @Operation(summary = "Get promotion by code",
               description = "Get promotion details by code (public)")
    public ResponseEntity<ApiResponse<PromotionResponse>> getPromotionByCode(
            @PathVariable String code) {
        log.info("GET /api/promotions/code/{} - Getting promotion by code", code);

        PromotionResponse response = promotionService.getPromotionByCode(code);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "Get all promotions",
               description = "Get list of all promotions with pagination, search, and filtering (public)")
    public ResponseEntity<ApiResponse<Page<PromotionResponse>>> getAllPromotions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) PromotionStatus status,
            @RequestParam(required = false) PromotionTier tier,
            @RequestParam(required = false) Boolean isHighlighted,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {
        log.info("GET /api/promotions - Getting all promotions (page: {}, size: {}, status: {}, tier: {}, highlighted: {}, search: {})",
                page, size, status, tier, isHighlighted, search);

        Page<PromotionResponse> promotions = promotionService.getAllPromotions(
                page, size, status, tier, isHighlighted, search, sortBy, sortDirection);

        return ResponseEntity.ok(ApiResponse.success(promotions));
    }

    @DeleteMapping("/{promotionId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    @Operation(summary = "Delete promotion",
               description = "Delete a promotion (admin only, only if not used)")
    public ResponseEntity<ApiResponse<Void>> deletePromotion(@PathVariable String promotionId) {
        log.info("DELETE /api/promotions/{} - Deleting promotion", promotionId);

        promotionService.deletePromotion(promotionId);
        return ResponseEntity.ok(ApiResponse.success("Promotion deleted successfully", null));
    }

    @PatchMapping("/{promotionId}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Toggle promotion status",
               description = "Activate or deactivate a promotion (admin only)")
    public ResponseEntity<ApiResponse<PromotionResponse>> toggleStatus(
            @PathVariable String promotionId,
            @RequestParam PromotionStatus status) {
        log.info("PATCH /api/promotions/{}/status - Setting status={}", promotionId, status);

        PromotionResponse response = promotionService.toggleStatus(promotionId, status);
        return ResponseEntity.ok(ApiResponse.success("Promotion status updated successfully", response));
    }

    @GetMapping("/validate/{code}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SUPPLIER', 'SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Validate promotion code",
               description = "Validate promotion code for an order (authenticated users). NOTE: This is for preview only. Use /apply to actually apply the promotion.")
    public ResponseEntity<ApiResponse<PromotionResponse>> validatePromotionCode(
            @PathVariable String code,
            @RequestParam(required = false) String customerId,
            @RequestParam BigDecimal orderAmount) {
        log.info("GET /api/promotions/validate/{} - Validating promotion for customer: {} with amount: {}",
                code, customerId, orderAmount);

        PromotionResponse response = promotionService.validatePromotionCode(code, customerId, orderAmount);
        return ResponseEntity.ok(ApiResponse.success("Promotion is valid", response));
    }

    @PostMapping("/apply/{code}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SUPPLIER')")
    @Operation(summary = "Apply promotion to order",
               description = "Apply promotion code to an order (atomic operation with race condition protection). " +
                             "This increments usage count and should be called when creating the order.")
    public ResponseEntity<ApiResponse<PromotionResponse>> applyPromotionToOrder(
            @PathVariable String code,
            @RequestParam String customerId,
            @RequestParam BigDecimal orderAmount) {
        log.info("POST /api/promotions/apply/{} - Applying promotion for customer: {} with amount: {}",
                code, customerId, orderAmount);

        PromotionResponse response = promotionService.applyPromotionToOrder(code, customerId, orderAmount);
        return ResponseEntity.ok(ApiResponse.success("Promotion applied successfully", response));
    }
}
