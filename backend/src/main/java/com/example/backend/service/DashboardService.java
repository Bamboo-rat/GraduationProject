package com.example.backend.service;

import com.example.backend.dto.response.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Service interface for dashboard analytics
 */
public interface DashboardService {

    /**
     * Get dashboard overview metrics (total counts, revenue, growth rates)
     */
    DashboardOverviewResponse getOverview();

    /**
     * Get sales trends for a specific date range
     * @param startDate Start date (inclusive)
     * @param endDate End date (inclusive)
     * @return List of daily sales trends
     */
    List<SalesTrendResponse> getSalesTrends(LocalDate startDate, LocalDate endDate);

    /**
     * Get top products by revenue
     * @param limit Maximum number of products to return (default: 10)
     * @return List of top products
     */
    List<TopProductResponse> getTopProducts(int limit);

    /**
     * Get revenue breakdown by category
     * @return List of category revenue statistics
     */
    List<CategoryRevenueResponse> getCategoryRevenue();
}
