package com.example.backend.controller;

import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.PartnerPerformanceMetrics;
import com.example.backend.dto.response.PartnerPerformanceSummary;
import com.example.backend.service.PartnerPerformanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@Slf4j
@RestController
@RequestMapping("/api/partners/performance")
@RequiredArgsConstructor
@Tag(name = "Partner Performance", description = "Partner performance reporting endpoints")
@SecurityRequirement(name = "Bearer Authentication")
public class PartnerPerformanceController {

    private final PartnerPerformanceService partnerPerformanceService;

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(
        summary = "Get performance summary for all partners",
        description = "Returns aggregated performance metrics for all partners including total stores, products, orders, and completion rates"
    )
    public ResponseEntity<ApiResponse<PartnerPerformanceSummary>> getPerformanceSummary() {
        log.info("GET /api/partners/performance/summary - Getting performance summary");

        PartnerPerformanceSummary summary = partnerPerformanceService.getPerformanceSummary();

        return ResponseEntity.ok(
            ApiResponse.success("Performance summary retrieved successfully", summary)
        );
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(
        summary = "Get performance metrics for all partners",
        description = "Returns paginated list of performance metrics for all active partners with sorting support"
    )
    public ResponseEntity<ApiResponse<Page<PartnerPerformanceMetrics>>> getAllPartnerPerformance(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "totalOrders") String sortBy,
        @RequestParam(defaultValue = "DESC") Sort.Direction sortDirection
    ) {
        log.info("GET /api/partners/performance - Page: {}, Size: {}, SortBy: {}, Direction: {}",
            page, size, sortBy, sortDirection);

        // Validate sortBy field
        String validatedSortBy = validateSortField(sortBy);

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, validatedSortBy));

        Page<PartnerPerformanceMetrics> performanceMetrics =
            partnerPerformanceService.getAllPartnerPerformance(pageable);

        return ResponseEntity.ok(
            ApiResponse.success(
                String.format("Retrieved %d partner performance metrics", performanceMetrics.getNumberOfElements()),
                performanceMetrics
            )
        );
    }

    @GetMapping("/{supplierId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(
        summary = "Get performance metrics for a specific partner",
        description = "Returns detailed performance metrics for a specific supplier"
    )
    public ResponseEntity<ApiResponse<PartnerPerformanceMetrics>> getPartnerPerformance(
        @PathVariable String supplierId
    ) {
        log.info("GET /api/partners/performance/{} - Getting performance for supplier", supplierId);

        PartnerPerformanceMetrics metrics = partnerPerformanceService.getPartnerPerformance(supplierId);

        return ResponseEntity.ok(
            ApiResponse.success("Partner performance metrics retrieved successfully", metrics)
        );
    }

    @GetMapping("/{supplierId}/period")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(
        summary = "Get performance metrics for a specific partner within a time period",
        description = "Returns performance metrics for a specific supplier filtered by date range"
    )
    public ResponseEntity<ApiResponse<PartnerPerformanceMetrics>> getPartnerPerformanceByPeriod(
        @PathVariable String supplierId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        log.info("GET /api/partners/performance/{}/period - Start: {}, End: {}",
            supplierId, startDate, endDate);

        // Validate date range
        if (endDate.isBefore(startDate)) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error("End date must be after start date")
            );
        }

        PartnerPerformanceMetrics metrics = partnerPerformanceService.getPartnerPerformanceByPeriod(
            supplierId, startDate, endDate
        );

        return ResponseEntity.ok(
            ApiResponse.success("Partner performance metrics for period retrieved successfully", metrics)
        );
    }

    /**
     * Validate and sanitize sort field to prevent SQL injection
     */
    private String validateSortField(String sortBy) {
        return switch (sortBy.toLowerCase()) {
            case "totalorders" -> "totalOrders";
            case "completedorders" -> "completedOrders";
            case "ordercompletionrate" -> "orderCompletionRate";
            case "ordercancellationrate" -> "orderCancellationRate";
            case "totalstores" -> "totalStores";
            case "activestores" -> "activeStores";
            case "totalproducts" -> "totalProducts";
            case "activeproducts" -> "activeProducts";
            case "businessname" -> "businessName";
            default -> "totalOrders"; // Default to totalOrders
        };
    }
}
