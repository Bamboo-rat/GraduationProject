package com.example.backend.service.impl;

import com.example.backend.dto.response.*;
import com.example.backend.entity.enums.CustomerStatus;
import com.example.backend.entity.enums.OrderStatus;
import com.example.backend.entity.enums.SupplierStatus;
import com.example.backend.repository.*;
import com.example.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final CustomerRepository customerRepository;
    private final SupplierRepository supplierRepository;
    private final StoreRepository storeRepository;
    private final StoreProductRepository storeProductRepository;

    private static final int LOW_STOCK_THRESHOLD = 10;

    @Override
    @Transactional(readOnly = true)
    public DashboardOverviewResponse getOverview() {
        log.info("Getting dashboard overview metrics");

        // Date ranges
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = LocalDate.now().atTime(LocalTime.MAX);
        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime monthEnd = now;

        // Previous month for growth calculation
        LocalDateTime prevMonthStart = monthStart.minusMonths(1);
        LocalDateTime prevMonthEnd = monthStart.minusSeconds(1);

        // Total counts
        Long totalOrders = orderRepository.count();
        Long totalCustomers = customerRepository.countByStatus(CustomerStatus.ACTIVE);
        Long totalSuppliers = supplierRepository.findByStatus(SupplierStatus.ACTIVE).stream().count();
        Long totalProducts = storeProductRepository.count();
        Long totalStores = storeRepository.count();

        // Revenue metrics - actual revenue (totalAmount - discount + shippingFee)
        Double totalRevenueDouble = orderDetailRepository.calculateRevenueByDateRange(
                LocalDateTime.of(2000, 1, 1, 0, 0), now);
        Double todayRevenueDouble = orderDetailRepository.calculateRevenueByDateRange(todayStart, todayEnd);
        Double monthRevenueDouble = orderDetailRepository.calculateRevenueByDateRange(monthStart, monthEnd);

        BigDecimal totalRevenue = totalRevenueDouble != null ? BigDecimal.valueOf(totalRevenueDouble) : BigDecimal.ZERO;
        BigDecimal todayRevenue = todayRevenueDouble != null ? BigDecimal.valueOf(todayRevenueDouble) : BigDecimal.ZERO;
        BigDecimal monthRevenue = monthRevenueDouble != null ? BigDecimal.valueOf(monthRevenueDouble) : BigDecimal.ZERO;

        // Order status counts
        Long pendingOrders = orderRepository.countByStatus(OrderStatus.PENDING);
        Long confirmedOrders = orderRepository.countByStatus(OrderStatus.CONFIRMED);
        Long preparingOrders = orderRepository.countByStatus(OrderStatus.PREPARING);
        Long shippingOrders = orderRepository.countByStatus(OrderStatus.SHIPPING);
        Long deliveredOrders = orderRepository.countByStatus(OrderStatus.DELIVERED);
        Long cancelledOrders = orderRepository.countByStatus(OrderStatus.CANCELED);

        // Growth metrics (compared to previous month)
        Double prevMonthRevenueDouble = orderDetailRepository.calculateRevenueByDateRange(prevMonthStart, prevMonthEnd);
        BigDecimal prevMonthRevenue = prevMonthRevenueDouble != null ? BigDecimal.valueOf(prevMonthRevenueDouble) : BigDecimal.ZERO;

        Long currentMonthOrders = orderRepository.countOrdersByDateRange(monthStart, monthEnd);
        Long prevMonthOrders = orderRepository.countOrdersByDateRange(prevMonthStart, prevMonthEnd);

        Long currentMonthCustomers = customerRepository.countByCreatedAtBetween(monthStart, monthEnd);
        Long prevMonthCustomers = customerRepository.countByCreatedAtBetween(prevMonthStart, prevMonthEnd);

        // Calculate growth rates
        Double revenueGrowthRate = calculateGrowthRate(monthRevenue, prevMonthRevenue);
        Double orderGrowthRate = calculateGrowthRate(currentMonthOrders, prevMonthOrders);
        Double customerGrowthRate = calculateGrowthRate(currentMonthCustomers, prevMonthCustomers);

        // Product stock metrics
        Long activeProducts = storeProductRepository.countActiveProducts();
        Long lowStockProducts = storeProductRepository.countLowStockProducts(LOW_STOCK_THRESHOLD);
        Long outOfStockProducts = storeProductRepository.countOutOfStockProducts();

        return DashboardOverviewResponse.builder()
                .totalOrders(totalOrders)
                .totalCustomers(totalCustomers)
                .totalSuppliers(totalSuppliers)
                .totalProducts(totalProducts)
                .totalStores(totalStores)
                .totalRevenue(totalRevenue)
                .todayRevenue(todayRevenue)
                .monthRevenue(monthRevenue)
                .pendingOrders(pendingOrders)
                .confirmedOrders(confirmedOrders)
                .preparingOrders(preparingOrders)
                .shippingOrders(shippingOrders)
                .deliveredOrders(deliveredOrders)
                .cancelledOrders(cancelledOrders)
                .revenueGrowthRate(revenueGrowthRate)
                .orderGrowthRate(orderGrowthRate)
                .customerGrowthRate(customerGrowthRate)
                .activeProducts(activeProducts)
                .lowStockProducts(lowStockProducts)
                .outOfStockProducts(outOfStockProducts)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SalesTrendResponse> getSalesTrends(LocalDate startDate, LocalDate endDate) {
        log.info("Getting sales trends from {} to {}", startDate, endDate);

        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);

        List<Object[]> rawResults = orderRepository.findSalesTrendsByDateRange(startDateTime, endDateTime);

        List<SalesTrendResponse> trends = new ArrayList<>();
        for (Object[] row : rawResults) {
            Date sqlDate = (Date) row[0];
            LocalDate date = sqlDate.toLocalDate();
            Long orderCount = ((Number) row[1]).longValue();
            Double revenueDouble = row[2] != null ? ((Number) row[2]).doubleValue() : 0.0;
            Double avgOrderValueDouble = row[3] != null ? ((Number) row[3]).doubleValue() : 0.0;

            BigDecimal revenue = BigDecimal.valueOf(revenueDouble).setScale(2, RoundingMode.HALF_UP);
            BigDecimal avgOrderValue = BigDecimal.valueOf(avgOrderValueDouble).setScale(2, RoundingMode.HALF_UP);

            trends.add(SalesTrendResponse.builder()
                    .date(date)
                    .orderCount(orderCount)
                    .revenue(revenue)
                    .averageOrderValue(avgOrderValue)
                    .build());
        }

        return trends;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopProductResponse> getTopProducts(int limit) {
        log.info("Getting top {} products by revenue", limit);

        Pageable pageable = PageRequest.of(0, limit);
        List<Object[]> rawResults = orderDetailRepository.findTopProductsByRevenue(pageable);

        List<TopProductResponse> topProducts = new ArrayList<>();
        for (Object[] row : rawResults) {
            String productId = (String) row[0];
            String productName = (String) row[1];
            String categoryName = (String) row[2];
            String supplierName = (String) row[3];
            Long totalSold = ((Number) row[4]).longValue();
            Double revenueDouble = row[5] != null ? ((Number) row[5]).doubleValue() : 0.0;
            String imageUrl = (String) row[6];

            BigDecimal revenue = BigDecimal.valueOf(revenueDouble).setScale(2, RoundingMode.HALF_UP);

            topProducts.add(TopProductResponse.builder()
                    .productId(productId)
                    .productName(productName)
                    .categoryName(categoryName)
                    .supplierName(supplierName)
                    .totalSold(totalSold)
                    .revenue(revenue)
                    .imageUrl(imageUrl)
                    .build());
        }

        return topProducts;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryRevenueResponse> getCategoryRevenue() {
        log.info("Getting revenue breakdown by category");

        List<Object[]> rawResults = orderDetailRepository.findRevenueByCategory();

        // Calculate total revenue for percentage calculation
        double totalRevenue = rawResults.stream()
                .mapToDouble(row -> row[2] != null ? ((Number) row[2]).doubleValue() : 0.0)
                .sum();

        List<CategoryRevenueResponse> categoryRevenues = new ArrayList<>();
        for (Object[] row : rawResults) {
            String categoryId = (String) row[0];
            String categoryName = (String) row[1];
            Double revenueDouble = row[2] != null ? ((Number) row[2]).doubleValue() : 0.0;
            Long orderCount = ((Number) row[3]).longValue();
            Long productCount = ((Number) row[4]).longValue();

            BigDecimal revenue = BigDecimal.valueOf(revenueDouble).setScale(2, RoundingMode.HALF_UP);
            Double revenuePercentage = totalRevenue > 0 ? (revenueDouble / totalRevenue) * 100 : 0.0;

            categoryRevenues.add(CategoryRevenueResponse.builder()
                    .categoryId(categoryId)
                    .categoryName(categoryName)
                    .revenue(revenue)
                    .orderCount(orderCount)
                    .productCount(productCount)
                    .revenuePercentage(Math.round(revenuePercentage * 100.0) / 100.0)
                    .build());
        }

        return categoryRevenues;
    }

    /**
     * Helper method to calculate growth rate as percentage
     */
    private Double calculateGrowthRate(Number current, Number previous) {
        if (previous == null || previous.doubleValue() == 0) {
            return current != null && current.doubleValue() > 0 ? 100.0 : 0.0;
        }

        double currentVal = current != null ? current.doubleValue() : 0.0;
        double prevVal = previous.doubleValue();

        double growth = ((currentVal - prevVal) / prevVal) * 100;
        return Math.round(growth * 100.0) / 100.0; // Round to 2 decimal places
    }

    /**
     * Helper method to calculate growth rate for BigDecimal
     */
    private Double calculateGrowthRate(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return current != null && current.compareTo(BigDecimal.ZERO) > 0 ? 100.0 : 0.0;
        }

        BigDecimal currentVal = current != null ? current : BigDecimal.ZERO;
        BigDecimal growth = currentVal.subtract(previous)
                .divide(previous, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));

        return Math.round(growth.doubleValue() * 100.0) / 100.0;
    }
}
