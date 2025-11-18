package com.example.backend.service;

import com.example.backend.dto.response.SupplierDashboardStatsResponse;
import com.example.backend.dto.response.SupplierOrderStatusResponse;
import com.example.backend.dto.response.SupplierRevenueTimeSeriesResponse;
import com.example.backend.dto.response.SupplierTopProductResponse;

import java.time.LocalDate;
import java.util.List;

/**
 * Service interface for supplier dashboard analytics
 */
public interface SupplierDashboardService {

    /**
     * Get dashboard statistics for a supplier
     * @param supplierId Supplier user ID
     * @return Dashboard statistics
     */
    SupplierDashboardStatsResponse getDashboardStats(String supplierId);

    /**
     * Get revenue over time for a supplier
     * @param supplierId Supplier user ID
     * @param startDate Start date
     * @param endDate End date
     * @return List of revenue time series data
     */
    List<SupplierRevenueTimeSeriesResponse> getRevenueOverTime(String supplierId, LocalDate startDate, LocalDate endDate);

    /**
     * Get top selling products for a supplier
     * @param supplierId Supplier user ID
     * @param limit Maximum number of products
     * @param startDate Start date (optional)
     * @param endDate End date (optional)
     * @return List of top products
     */
    List<SupplierTopProductResponse> getTopProducts(String supplierId, int limit, LocalDate startDate, LocalDate endDate);

    /**
     * Get order status distribution for a supplier
     * @param supplierId Supplier user ID
     * @return List of order status counts
     */
    List<SupplierOrderStatusResponse> getOrderStatusDistribution(String supplierId);
}
