package com.example.backend.controller;

import com.example.backend.dto.response.*;
import com.example.backend.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Dashboard", description = "Dashboard analytics endpoints (admin only)")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/overview")
    @Operation(
            summary = "Get dashboard overview",
            description = "Get comprehensive dashboard metrics including total counts, revenue, order status, and growth rates. " +
                    "Accessible by SUPER_ADMIN, MODERATOR, and STAFF roles."
    )
    public ResponseEntity<ApiResponse<DashboardOverviewResponse>> getOverview() {
        log.info("GET /api/dashboard/overview - Getting dashboard overview");

        DashboardOverviewResponse overview = dashboardService.getOverview();

        return ResponseEntity.ok(ApiResponse.success("Dashboard overview retrieved successfully", overview));
    }

    @GetMapping("/sales-trends")
    @Operation(
            summary = "Get sales trends by date range",
            description = "Get daily sales trends including order count, revenue, and average order value. " +
                    "Date range is required. Default: last 30 days if not specified."
    )
    public ResponseEntity<ApiResponse<List<SalesTrendResponse>>> getSalesTrends(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        // Default to last 30 days if not specified
        if (startDate == null) {
            startDate = LocalDate.now().minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }

        log.info("GET /api/dashboard/sales-trends - Getting sales trends from {} to {}", startDate, endDate);

        List<SalesTrendResponse> trends = dashboardService.getSalesTrends(startDate, endDate);

        return ResponseEntity.ok(ApiResponse.success("Sales trends retrieved successfully", trends));
    }

    @GetMapping("/top-products")
    @Operation(
            summary = "Get top products by revenue",
            description = "Get top N products ranked by revenue from delivered orders. " +
                    "Default limit: 10 products."
    )
    public ResponseEntity<ApiResponse<List<TopProductResponse>>> getTopProducts(
            @RequestParam(defaultValue = "10") int limit) {

        log.info("GET /api/dashboard/top-products - Getting top {} products", limit);

        // Validate limit
        if (limit < 1 || limit > 100) {
            limit = 10;
        }

        List<TopProductResponse> topProducts = dashboardService.getTopProducts(limit);

        return ResponseEntity.ok(ApiResponse.success("Top products retrieved successfully", topProducts));
    }

    @GetMapping("/category-revenue")
    @Operation(
            summary = "Get revenue breakdown by category",
            description = "Get revenue statistics for each product category including order count, " +
                    "product count, and revenue percentage."
    )
    public ResponseEntity<ApiResponse<List<CategoryRevenueResponse>>> getCategoryRevenue() {
        log.info("GET /api/dashboard/category-revenue - Getting category revenue breakdown");

        List<CategoryRevenueResponse> categoryRevenue = dashboardService.getCategoryRevenue();

        return ResponseEntity.ok(ApiResponse.success("Category revenue retrieved successfully", categoryRevenue));
    }

    @GetMapping("/top-stores")
    @Operation(
            summary = "Get top stores by revenue",
            description = "Get top N stores ranked by revenue from delivered orders. " +
                    "Default limit: 10 stores."
    )
    public ResponseEntity<ApiResponse<List<TopStoreResponse>>> getTopStores(
            @RequestParam(defaultValue = "10") int limit) {

        log.info("GET /api/dashboard/top-stores - Getting top {} stores", limit);

        // Validate limit
        if (limit < 1 || limit > 100) {
            limit = 10;
        }

        List<TopStoreResponse> topStores = dashboardService.getTopStores(limit);

        return ResponseEntity.ok(ApiResponse.success("Top stores retrieved successfully", topStores));
    }
}
