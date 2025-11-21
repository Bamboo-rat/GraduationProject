package com.example.backend.service;

import com.example.backend.dto.response.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

public interface ReportService {

    // ==================== REVENUE REPORTS ====================

    /**
     * Get revenue summary for date range
     */
    RevenueSummaryResponse getRevenueSummary(LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Get revenue breakdown by supplier
     */
    List<RevenueBySupplierResponse> getRevenueBySupplier(LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Get revenue breakdown by category
     */
    List<RevenueByCategoryResponse> getRevenueByCategory(LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Get revenue time series (daily)
     */
    List<RevenueTimeSeriesResponse> getRevenueTimeSeries(LocalDateTime startDate, LocalDateTime endDate);

    // ==================== CUSTOMER BEHAVIOR REPORTS ====================

    /**
     * Get customer behavior summary
     */
    CustomerBehaviorSummaryResponse getCustomerBehaviorSummary(LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Get customer segmentation by tier
     */
    List<CustomerSegmentationResponse> getCustomerSegmentation(LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Get customer lifetime value analysis
     */
    Page<CustomerLifetimeValueResponse> getCustomerLifetimeValue(Pageable pageable);

    /**
     * Get purchase pattern analysis
     */
    PurchasePatternResponse getPurchasePatterns(LocalDateTime startDate, LocalDateTime endDate);

    // ==================== WASTE REPORTS ====================

    /**
     * Get waste summary
     */
        WasteSummaryResponse getWasteSummary(LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Get unsold inventory details with optional date filtering
     */
    Page<UnsoldInventoryResponse> getUnsoldInventory(
            Pageable pageable, 
            LocalDateTime startDate, 
            LocalDateTime endDate
    );

    /**
     * Get waste metrics by category with optional date filtering
     */
    List<WasteByCategoryResponse> getWasteByCategory(
            LocalDateTime startDate, 
            LocalDateTime endDate
    );

    /**
     * Get waste metrics by supplier with optional date filtering
     */
    List<WasteBySupplierResponse> getWasteBySupplier(
            LocalDateTime startDate, 
            LocalDateTime endDate
    );

    // ==================== EXPORT FUNCTIONALITY ====================

    /**
     * Export revenue report to CSV
     */
    byte[] exportRevenueReportToCsv(LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Export customer behavior report to CSV
     */
    byte[] exportCustomerBehaviorReportToCsv(LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Export waste report to CSV
     */
        byte[] exportWasteReportToCsv(LocalDateTime startDate, LocalDateTime endDate);
}
