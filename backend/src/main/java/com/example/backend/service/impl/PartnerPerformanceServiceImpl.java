package com.example.backend.service.impl;

import com.example.backend.dto.response.PartnerPerformanceMetrics;
import com.example.backend.dto.response.PartnerPerformanceSummary;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.repository.PartnerPerformanceRepository;
import com.example.backend.service.PartnerPerformanceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PartnerPerformanceServiceImpl implements PartnerPerformanceService {

    private final PartnerPerformanceRepository partnerPerformanceRepository;

    @Override
    public PartnerPerformanceSummary getPerformanceSummary() {
        log.info("Getting performance summary for all partners");

        Map<String, Object> summaryData = partnerPerformanceRepository.getPerformanceSummary();

        PartnerPerformanceSummary summary = PartnerPerformanceSummary.builder()
            .totalPartners(getLongValue(summaryData, "totalPartners"))
            .activePartners(getLongValue(summaryData, "activePartners"))
            .inactivePartners(getLongValue(summaryData, "inactivePartners"))
            .suspendedPartners(getLongValue(summaryData, "suspendedPartners"))
            .totalStores(getLongValue(summaryData, "totalStores"))
            .totalActiveStores(getLongValue(summaryData, "totalActiveStores"))
            .totalProducts(getLongValue(summaryData, "totalProducts"))
            .totalActiveProducts(getLongValue(summaryData, "totalActiveProducts"))
            .totalOrders(getLongValue(summaryData, "totalOrders"))
            .totalCompletedOrders(getLongValue(summaryData, "totalCompletedOrders"))
            .totalCancelledOrders(getLongValue(summaryData, "totalCancelledOrders"))
            .build();

        summary.calculateAverageRates();

        log.info("Performance summary retrieved: {} total partners, {} active",
            summary.getTotalPartners(), summary.getActivePartners());

        return summary;
    }

    @Override
    public Page<PartnerPerformanceMetrics> getAllPartnerPerformance(Pageable pageable) {
        log.info("Getting performance metrics for all partners - Page: {}, Size: {}",
            pageable.getPageNumber(), pageable.getPageSize());

        Page<Map<String, Object>> metricsPage = partnerPerformanceRepository.getAllPerformanceMetrics(pageable);

        List<PartnerPerformanceMetrics> metricsList = metricsPage.getContent().stream()
            .map(this::mapToPerformanceMetrics)
            .collect(Collectors.toList());

        log.info("Retrieved {} partner performance metrics", metricsList.size());

        return new PageImpl<>(metricsList, pageable, metricsPage.getTotalElements());
    }

    @Override
    public PartnerPerformanceMetrics getPartnerPerformance(String supplierId) {
        log.info("Getting performance metrics for supplier: {}", supplierId);

        Map<String, Object> metricsData = partnerPerformanceRepository.getPerformanceMetrics(supplierId);

        if (metricsData == null || metricsData.isEmpty()) {
            log.error("Supplier not found: {}", supplierId);
            throw new NotFoundException(ErrorCode.USER_NOT_FOUND, "Supplier with ID: " + supplierId);
        }

        PartnerPerformanceMetrics metrics = mapToPerformanceMetrics(metricsData);

        log.info("Performance metrics retrieved for supplier {}: {} total orders, {}% completion rate",
            supplierId, metrics.getTotalOrders(), metrics.getOrderCompletionRate());

        return metrics;
    }

    @Override
    public PartnerPerformanceMetrics getPartnerPerformanceByPeriod(
        String supplierId,
        LocalDateTime startDate,
        LocalDateTime endDate
    ) {
        log.info("Getting performance metrics for supplier {} from {} to {}",
            supplierId, startDate, endDate);

        Map<String, Object> metricsData = partnerPerformanceRepository.getPerformanceMetricsByPeriod(
            supplierId, startDate, endDate
        );

        if (metricsData == null || metricsData.isEmpty()) {
            log.error("Supplier not found: {}", supplierId);
            throw new NotFoundException(ErrorCode.USER_NOT_FOUND, "Supplier with ID: " + supplierId);
        }

        PartnerPerformanceMetrics metrics = mapToPerformanceMetrics(metricsData);
        metrics.setPeriodStart(startDate);
        metrics.setPeriodEnd(endDate);

        log.info("Performance metrics retrieved for supplier {} in period: {} total orders",
            supplierId, metrics.getTotalOrders());

        return metrics;
    }

    /**
     * Helper method to map database result to PartnerPerformanceMetrics
     */
    private PartnerPerformanceMetrics mapToPerformanceMetrics(Map<String, Object> data) {
        PartnerPerformanceMetrics metrics = PartnerPerformanceMetrics.builder()
            .supplierId(getStringValue(data, "supplierId"))
            .businessName(getStringValue(data, "businessName"))
            .avatarUrl(getStringValue(data, "avatarUrl"))
            .totalStores(getLongValue(data, "totalStores"))
            .activeStores(getLongValue(data, "activeStores"))
            .inactiveStores(getLongValue(data, "inactiveStores"))
            .totalProducts(getLongValue(data, "totalProducts"))
            .activeProducts(getLongValue(data, "activeProducts"))
            .outOfStockProducts(getLongValue(data, "outOfStockProducts"))
            .totalOrders(getLongValue(data, "totalOrders"))
            .completedOrders(getLongValue(data, "completedOrders"))
            .cancelledOrders(getLongValue(data, "cancelledOrders"))
            .build();

        // Calculate rates
        metrics.calculateRates();

        return metrics;
    }

    /**
     * Helper method to safely get Long value from map
     */
    private Long getLongValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) {
            return 0L;
        }
        if (value instanceof Long) {
            return (Long) value;
        }
        if (value instanceof Integer) {
            return ((Integer) value).longValue();
        }
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        return 0L;
    }

    /**
     * Helper method to safely get String value from map
     */
    private String getStringValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value != null ? value.toString() : null;
    }

    /**
     * Helper method to safely get Double value from map
     */
    private Double getDoubleValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) {
            return 0.0;
        }
        if (value instanceof Double) {
            return (Double) value;
        }
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        return 0.0;
    }
}
