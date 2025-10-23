package com.example.backend.service;

import com.example.backend.dto.response.PartnerPerformanceMetrics;
import com.example.backend.dto.response.PartnerPerformanceSummary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;

public interface PartnerPerformanceService {

    /**
     * Get performance summary for all partners
     */
    PartnerPerformanceSummary getPerformanceSummary();

    /**
     * Get performance metrics for all partners with pagination
     */
    Page<PartnerPerformanceMetrics> getAllPartnerPerformance(Pageable pageable);

    /**
     * Get performance metrics for a specific partner
     */
    PartnerPerformanceMetrics getPartnerPerformance(String supplierId);

    /**
     * Get performance metrics for a specific partner within a time period
     */
    PartnerPerformanceMetrics getPartnerPerformanceByPeriod(
        String supplierId,
        LocalDateTime startDate,
        LocalDateTime endDate
    );
}
