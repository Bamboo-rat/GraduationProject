package com.example.backend.controller;

import com.example.backend.dto.response.*;
import com.example.backend.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Tag(name = "Reports", description = "Revenue, Customer Behavior, and Waste Reporting APIs")
@SecurityRequirement(name = "bearer-jwt")
public class ReportController {

    private final ReportService reportService;

    // ==================== REVENUE REPORTS ====================

    @GetMapping("/revenue/summary")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Get revenue summary", description = "Get comprehensive revenue summary for date range")
    public ResponseEntity<ApiResponse<RevenueSummaryResponse>> getRevenueSummary(
            @Parameter(description = "Start date (ISO format with Z)") @RequestParam Instant startDate,
            @Parameter(description = "End date (ISO format with Z)") @RequestParam Instant endDate
    ) {
        LocalDateTime startDateTime = LocalDateTime.ofInstant(startDate, ZoneId.systemDefault());
        LocalDateTime endDateTime = LocalDateTime.ofInstant(endDate, ZoneId.systemDefault());
        log.info("GET /api/reports/revenue/summary - Start: {}, End: {}", startDateTime, endDateTime);
        RevenueSummaryResponse response = reportService.getRevenueSummary(startDateTime, endDateTime);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/revenue/by-supplier")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Get revenue by supplier", description = "Get revenue breakdown by supplier")
    public ResponseEntity<ApiResponse<List<RevenueBySupplierResponse>>> getRevenueBySupplier(
            @Parameter(description = "Start date") @RequestParam Instant startDate,
            @Parameter(description = "End date") @RequestParam Instant endDate
    ) {
        LocalDateTime startDateTime = LocalDateTime.ofInstant(startDate, ZoneId.systemDefault());
        LocalDateTime endDateTime = LocalDateTime.ofInstant(endDate, ZoneId.systemDefault());
        log.info("GET /api/reports/revenue/by-supplier - Start: {}, End: {}", startDateTime, endDateTime);
        List<RevenueBySupplierResponse> response = reportService.getRevenueBySupplier(startDateTime, endDateTime);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/revenue/by-category")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Get revenue by category", description = "Get revenue breakdown by category")
    public ResponseEntity<ApiResponse<List<RevenueByCategoryResponse>>> getRevenueByCategory(
            @Parameter(description = "Start date") @RequestParam Instant startDate,
            @Parameter(description = "End date") @RequestParam Instant endDate
    ) {
        LocalDateTime startDateTime = LocalDateTime.ofInstant(startDate, ZoneId.systemDefault());
        LocalDateTime endDateTime = LocalDateTime.ofInstant(endDate, ZoneId.systemDefault());
        log.info("GET /api/reports/revenue/by-category - Start: {}, End: {}", startDateTime, endDateTime);
        List<RevenueByCategoryResponse> response = reportService.getRevenueByCategory(startDateTime, endDateTime);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/revenue/time-series")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Get revenue time series", description = "Get daily revenue time series")
    public ResponseEntity<ApiResponse<List<RevenueTimeSeriesResponse>>> getRevenueTimeSeries(
            @Parameter(description = "Start date") @RequestParam Instant startDate,
            @Parameter(description = "End date") @RequestParam Instant endDate
    ) {
        LocalDateTime startDateTime = LocalDateTime.ofInstant(startDate, ZoneId.systemDefault());
        LocalDateTime endDateTime = LocalDateTime.ofInstant(endDate, ZoneId.systemDefault());
        log.info("GET /api/reports/revenue/time-series - Start: {}, End: {}", startDateTime, endDateTime);
        List<RevenueTimeSeriesResponse> response = reportService.getRevenueTimeSeries(startDateTime, endDateTime);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/revenue/export")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Export revenue report to CSV")
    public ResponseEntity<byte[]> exportRevenueReport(
            @Parameter(description = "Start date") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @Parameter(description = "End date") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        log.info("GET /api/reports/revenue/export - Start: {}, End: {}", startDate, endDate);
        byte[] csvData = reportService.exportRevenueReportToCsv(startDate, endDate);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
        headers.setContentDispositionFormData("attachment", "revenue-report.csv");
        headers.setContentLength(csvData.length);

        return new ResponseEntity<>(csvData, headers, HttpStatus.OK);
    }

    // ==================== CUSTOMER BEHAVIOR REPORTS ====================

    @GetMapping("/customer-behavior/summary")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Get customer behavior summary")
    public ResponseEntity<ApiResponse<CustomerBehaviorSummaryResponse>> getCustomerBehaviorSummary(
            @Parameter(description = "Start date") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @Parameter(description = "End date") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        log.info("GET /api/reports/customer-behavior/summary - Start: {}, End: {}", startDate, endDate);
        CustomerBehaviorSummaryResponse response = reportService.getCustomerBehaviorSummary(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/customer-behavior/segmentation")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Get customer segmentation by tier")
    public ResponseEntity<ApiResponse<List<CustomerSegmentationResponse>>> getCustomerSegmentation(
            @Parameter(description = "Start date") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @Parameter(description = "End date") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        log.info("GET /api/reports/customer-behavior/segmentation - Start: {}, End: {}", startDate, endDate);
        List<CustomerSegmentationResponse> response = reportService.getCustomerSegmentation(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/customer-behavior/lifetime-value")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Get customer lifetime value analysis")
    public ResponseEntity<ApiResponse<Page<CustomerLifetimeValueResponse>>> getCustomerLifetimeValue(
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort by") @RequestParam(defaultValue = "totalSpent") String sortBy,
            @Parameter(description = "Sort direction") @RequestParam(defaultValue = "DESC") String sortDirection
    ) {
        log.info("GET /api/reports/customer-behavior/lifetime-value - Page: {}, Size: {}", page, size);
        Sort.Direction direction = Sort.Direction.fromString(sortDirection);
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        Page<CustomerLifetimeValueResponse> response = reportService.getCustomerLifetimeValue(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/customer-behavior/patterns")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Get purchase pattern analysis")
    public ResponseEntity<ApiResponse<PurchasePatternResponse>> getPurchasePatterns(
            @Parameter(description = "Start date") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @Parameter(description = "End date") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        log.info("GET /api/reports/customer-behavior/patterns - Start: {}, End: {}", startDate, endDate);
        PurchasePatternResponse response = reportService.getPurchasePatterns(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/customer-behavior/export")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Export customer behavior report to CSV")
    public ResponseEntity<byte[]> exportCustomerBehaviorReport(
            @Parameter(description = "Start date") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @Parameter(description = "End date") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        log.info("GET /api/reports/customer-behavior/export - Start: {}, End: {}", startDate, endDate);
        byte[] csvData = reportService.exportCustomerBehaviorReportToCsv(startDate, endDate);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
        headers.setContentDispositionFormData("attachment", "customer-behavior-report.csv");
        headers.setContentLength(csvData.length);

        return new ResponseEntity<>(csvData, headers, HttpStatus.OK);
    }

    // ==================== WASTE REPORTS ====================

    @GetMapping("/waste/summary")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Get waste summary")
    public ResponseEntity<ApiResponse<WasteSummaryResponse>> getWasteSummary() {
        log.info("GET /api/reports/waste/summary");
        WasteSummaryResponse response = reportService.getWasteSummary();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/waste/unsold-inventory")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Get unsold inventory details")
    public ResponseEntity<ApiResponse<Page<UnsoldInventoryResponse>>> getUnsoldInventory(
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Start date (ISO format)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @Parameter(description = "End date (ISO format)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        log.info("GET /api/reports/waste/unsold-inventory - Page: {}, Size: {}, StartDate: {}, EndDate: {}", page, size, startDate, endDate);
        Pageable pageable = PageRequest.of(page, size);
        Page<UnsoldInventoryResponse> response = reportService.getUnsoldInventory(pageable, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/waste/by-category")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Get waste metrics by category")
    public ResponseEntity<ApiResponse<List<WasteByCategoryResponse>>> getWasteByCategory(
            @Parameter(description = "Start date (ISO format)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @Parameter(description = "End date (ISO format)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        log.info("GET /api/reports/waste/by-category - StartDate: {}, EndDate: {}", startDate, endDate);
        List<WasteByCategoryResponse> response = reportService.getWasteByCategory(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/waste/by-supplier")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Get waste metrics by supplier")
    public ResponseEntity<ApiResponse<List<WasteBySupplierResponse>>> getWasteBySupplier(
            @Parameter(description = "Start date (ISO format)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @Parameter(description = "End date (ISO format)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        log.info("GET /api/reports/waste/by-supplier - StartDate: {}, EndDate: {}", startDate, endDate);
        List<WasteBySupplierResponse> response = reportService.getWasteBySupplier(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/waste/export")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Export waste report to CSV")
    public ResponseEntity<byte[]> exportWasteReport() {
        log.info("GET /api/reports/waste/export");
        byte[] csvData = reportService.exportWasteReportToCsv();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
        headers.setContentDispositionFormData("attachment", "waste-report.csv");
        headers.setContentLength(csvData.length);

        return new ResponseEntity<>(csvData, headers, HttpStatus.OK);
    }
}
