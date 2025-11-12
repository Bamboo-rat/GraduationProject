package com.example.backend.service.impl;

import com.example.backend.dto.response.*;
import com.example.backend.entity.enums.CustomerTier;
import com.example.backend.entity.enums.ProductStatus;
import com.example.backend.repository.*;
import com.example.backend.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportServiceImpl implements ReportService {

    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final CustomerRepository customerRepository;
    private final StoreProductRepository storeProductRepository;
    private final SystemConfigRepository systemConfigRepository;

    // ==================== REVENUE REPORTS ====================

    @Override
    public RevenueSummaryResponse getRevenueSummary(LocalDateTime startDate, LocalDateTime endDate) {
        log.info("Generating revenue summary from {} to {}", startDate, endDate);

        Object[] summaryData = orderRepository.findRevenueSummary(startDate, endDate);
        if (summaryData == null) {
            summaryData = new Object[]{BigDecimal.ZERO, 0L, 0L, 0L, BigDecimal.ZERO, BigDecimal.ZERO};
        }

        BigDecimal totalRevenue = toBigDecimal(summaryData[0]);
        Long completedOrders = toLong(summaryData[1]);
        Long cancelledOrders = toLong(summaryData[2]);
        Long totalOrders = toLong(summaryData[3]);
        BigDecimal avgOrderValue = toBigDecimal(summaryData[4]);
        BigDecimal totalCommission = toBigDecimal(summaryData[5]); // Actual commission from query
        BigDecimal totalSupplierEarnings = totalRevenue.subtract(totalCommission);

        // Calculate daily average
        long daysBetween = Math.max(1, ChronoUnit.DAYS.between(startDate.toLocalDate(), endDate.toLocalDate()));
        BigDecimal avgDailyRevenue = totalRevenue.divide(BigDecimal.valueOf(daysBetween), 2, RoundingMode.HALF_UP);

        // Calculate growth rates (compare to previous period)
        LocalDateTime previousStartDate = startDate.minusDays(daysBetween);
        LocalDateTime previousEndDate = startDate;
        Object[] previousData = orderRepository.findRevenueSummary(previousStartDate, previousEndDate);
        if (previousData == null) {
            previousData = new Object[]{BigDecimal.ZERO, 0L, 0L, 0L, BigDecimal.ZERO, BigDecimal.ZERO};
        }

        BigDecimal previousRevenue = toBigDecimal(previousData[0]);
        Long previousOrders = toLong(previousData[1]);

        Double revenueGrowth = calculateGrowthRate(previousRevenue, totalRevenue);
        Double orderGrowth = calculateGrowthRate(previousOrders.doubleValue(), totalOrders.doubleValue());

        // Get top performers
        List<Object[]> topSuppliers = orderRepository.findRevenueBySupplier(startDate, endDate);
        List<Object[]> topCategories = orderDetailRepository.findRevenueByCategoryWithDateRange(startDate, endDate);

        String topSupplierName = (topSuppliers != null && !topSuppliers.isEmpty()) ? (String) topSuppliers.get(0)[1] : "N/A";
        // row[4] = totalRevenue, row[5] = commission, row[6] = supplierEarnings
        BigDecimal topSupplierRevenue = (topSuppliers != null && !topSuppliers.isEmpty()) ? toBigDecimal(topSuppliers.get(0)[4]) : BigDecimal.ZERO;
        String topCategoryName = (topCategories != null && !topCategories.isEmpty()) ? (String) topCategories.get(0)[1] : "N/A";
        BigDecimal topCategoryRevenue = (topCategories != null && !topCategories.isEmpty()) ? toBigDecimal(topCategories.get(0)[5]) : BigDecimal.ZERO;

        return RevenueSummaryResponse.builder()
                .startDate(startDate)
                .endDate(endDate)
                .totalRevenue(totalRevenue)
                .totalCommission(totalCommission)
                .totalSupplierEarnings(totalSupplierEarnings)
                .totalOrders(totalOrders)
                .completedOrders(completedOrders)
                .cancelledOrders(cancelledOrders)
                .averageOrderValue(avgOrderValue)
                .averageDailyRevenue(avgDailyRevenue)
                .revenueGrowthRate(revenueGrowth)
                .orderGrowthRate(orderGrowth)
                .topSupplierName(topSupplierName)
                .topSupplierRevenue(topSupplierRevenue)
                .topCategoryName(topCategoryName)
                .topCategoryRevenue(topCategoryRevenue)
                .build();
    }

    @Override
    public List<RevenueBySupplierResponse> getRevenueBySupplier(LocalDateTime startDate, LocalDateTime endDate) {
        log.info("Generating revenue by supplier from {} to {}", startDate, endDate);

        List<Object[]> results = orderRepository.findRevenueBySupplier(startDate, endDate);
        
        // Calculate total supplier earnings for percentage calculation
        BigDecimal totalSupplierEarnings = results.stream()
                .map(r -> toBigDecimal(r[6]))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return results.stream().map(row -> {
            // Query returns: totalRevenue, platformCommission, supplierEarnings
            BigDecimal totalRevenue = toBigDecimal(row[4]);
            BigDecimal platformCommission = toBigDecimal(row[5]);
            BigDecimal supplierEarnings = toBigDecimal(row[6]);
            
            Double revenuePercentage = totalSupplierEarnings.compareTo(BigDecimal.ZERO) > 0
                    ? supplierEarnings.divide(totalSupplierEarnings, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                    : 0.0;

            return RevenueBySupplierResponse.builder()
                    .supplierId((String) row[0])
                    .supplierName((String) row[1])
                    .avatarUrl((String) row[2])
                    .totalOrders(toLong(row[3]))
                    .totalRevenue(totalRevenue)
                    .platformCommission(platformCommission)
                    .supplierEarnings(supplierEarnings)
                    .revenuePercentage(revenuePercentage)
                    .productCount(toLong(row[7]))
                    .storeCount(toLong(row[8]))
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    public List<RevenueByCategoryResponse> getRevenueByCategory(LocalDateTime startDate, LocalDateTime endDate) {
        log.info("Generating revenue by category from {} to {}", startDate, endDate);

        List<Object[]> results = orderDetailRepository.findRevenueByCategoryWithDateRange(startDate, endDate);
        BigDecimal totalRevenue = results.stream()
                .map(r -> toBigDecimal(r[5]))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return results.stream().map(row -> {
            BigDecimal revenue = toBigDecimal(row[5]);
            Double revenuePercentage = totalRevenue.compareTo(BigDecimal.ZERO) > 0
                    ? revenue.divide(totalRevenue, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                    : 0.0;

            return RevenueByCategoryResponse.builder()
                    .categoryId((String) row[0])
                    .categoryName((String) row[1])
                    .categoryImageUrl((String) row[2])
                    .totalOrders(toLong(row[3]))
                    .totalProductsSold(toLong(row[4]))
                    .totalRevenue(revenue)
                    .revenuePercentage(revenuePercentage)
                    .averageOrderValue(toBigDecimal(row[6]))
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    public List<RevenueTimeSeriesResponse> getRevenueTimeSeries(LocalDateTime startDate, LocalDateTime endDate) {
        log.info("Generating revenue time series from {} to {}", startDate, endDate);

        List<Object[]> results = orderRepository.findRevenueTimeSeries(startDate, endDate);

        // Get new vs returning customers per day
        Object[] customerData = orderRepository.findNewVsReturningCustomers(startDate, endDate);

        return results.stream().map(row -> {
            LocalDate date = row[0] instanceof java.sql.Date
                    ? ((java.sql.Date) row[0]).toLocalDate()
                    : (LocalDate) row[0];
            BigDecimal revenue = toBigDecimal(row[2]);
            BigDecimal commission = toBigDecimal(row[3]); // Actual commission from query
            BigDecimal avgOrderValue = toBigDecimal(row[4]);

            return RevenueTimeSeriesResponse.builder()
                    .date(date)
                    .orderCount(toLong(row[1]))
                    .revenue(revenue)
                    .platformCommission(commission)
                    .averageOrderValue(avgOrderValue)
                    .newCustomers(0L) // Would need additional query per date
                    .returningCustomers(0L) // Would need additional query per date
                    .build();
        }).collect(Collectors.toList());
    }

    // ==================== CUSTOMER BEHAVIOR REPORTS ====================

    @Override
    public CustomerBehaviorSummaryResponse getCustomerBehaviorSummary(LocalDateTime startDate, LocalDateTime endDate) {
        log.info("Generating customer behavior summary from {} to {}", startDate, endDate);

        long totalCustomers = customerRepository.count();

    // Get new vs returning customers
        Object[] customerData = orderRepository.findNewVsReturningCustomers(startDate, endDate);
        if (customerData == null) {
            customerData = new Object[]{0L, 0L};
        }
        Long newCustomers = toLong(customerData[0]);
        Long returningCustomers = toLong(customerData[1]);
        Long activeCustomers = newCustomers + returningCustomers;

        // Get segmentation data
        List<Object[]> segmentationData = orderRepository.findCustomerSegmentation(startDate, endDate);
        if (segmentationData == null) {
            segmentationData = Collections.emptyList();
        }

        Long bronzeTier = 0L, silverTier = 0L, goldTier = 0L, platinumTier = 0L, diamondTier = 0L;
        for (Object[] row : segmentationData) {
            CustomerTier tier = row[0] instanceof CustomerTier ? (CustomerTier) row[0] : null;
            Long count = toLong(row[1]);

            if (tier == null || tier == CustomerTier.BRONZE) {
                bronzeTier += count;
                continue;
            }

            switch (tier) {
                case SILVER -> silverTier += count;
                case GOLD -> goldTier += count;
                case PLATINUM -> platinumTier += count;
                case DIAMOND -> diamondTier += count;
                default -> bronzeTier += count;
            }
        }

        // Calculate CLV metrics
        List<Object[]> clvData = orderRepository.findCustomerLifetimeValue(Pageable.ofSize(1000));
        if (clvData == null) {
            clvData = new ArrayList<>();
        }
        BigDecimal avgCLV = clvData.stream()
                .map(row -> toBigDecimal(row[9]))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(Math.max(1, clvData.size())), 2, RoundingMode.HALF_UP);

        BigDecimal avgOrderValue = clvData.stream()
                .map(row -> toBigDecimal(row[10]))
                .filter(v -> v.compareTo(BigDecimal.ZERO) > 0)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(Math.max(1, clvData.size())), 2, RoundingMode.HALF_UP);

        Double avgOrdersPerCustomer = clvData.stream()
                .mapToLong(row -> toLong(row[6]))
                .average()
                .orElse(0.0);

        // Calculate rates
        Double activeCustomerRate = totalCustomers > 0
                ? (activeCustomers.doubleValue() / totalCustomers) * 100
                : 0.0;
        Double repeatPurchaseRate = activeCustomers > 0
                ? (returningCustomers.doubleValue() / activeCustomers) * 100
                : 0.0;

        BigDecimal totalValue = clvData.stream()
                .map(row -> toBigDecimal(row[9]))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CustomerBehaviorSummaryResponse.builder()
                .startDate(startDate)
                .endDate(endDate)
                .totalCustomers(totalCustomers)
                .activeCustomers(activeCustomers)
                .newCustomers(newCustomers)
                .returningCustomers(returningCustomers)
                .activeCustomerRate(activeCustomerRate)
                .repeatPurchaseRate(repeatPurchaseRate)
                .customerRetentionRate(repeatPurchaseRate) // Simplified
                .customerChurnRate(100.0 - repeatPurchaseRate)
                .averageCustomerLifetimeValue(avgCLV)
                .averageOrderValue(avgOrderValue)
                .averageOrdersPerCustomer(avgOrdersPerCustomer)
                .totalCustomerValue(totalValue)
                .bronzeTierCount(bronzeTier)
                .silverTierCount(silverTier)
                .goldTierCount(goldTier)
                .platinumTierCount(platinumTier)
                .diamondTierCount(diamondTier)
                .build();
    }

    @Override
    public List<CustomerSegmentationResponse> getCustomerSegmentation(LocalDateTime startDate, LocalDateTime endDate) {
        log.info("Generating customer segmentation from {} to {}", startDate, endDate);

        List<Object[]> results = orderRepository.findCustomerSegmentation(startDate, endDate);
        if (results == null) {
            results = Collections.emptyList();
        }

        Long totalCustomers = results.stream().map(r -> toLong(r[1])).reduce(0L, Long::sum);
        BigDecimal totalRevenue = results.stream().map(r -> toBigDecimal(r[3])).reduce(BigDecimal.ZERO, BigDecimal::add);

        return results.stream().map(row -> {
            Long customerCount = toLong(row[1]);
            BigDecimal revenue = toBigDecimal(row[3]);
            Long totalOrders = toLong(row[2]);

            Double customerPercentage = totalCustomers > 0
                    ? (customerCount.doubleValue() / totalCustomers) * 100
                    : 0.0;
            Double revenuePercentage = totalRevenue.compareTo(BigDecimal.ZERO) > 0
                    ? revenue.divide(totalRevenue, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                    : 0.0;
            Double avgOrdersPerCustomer = customerCount > 0
                    ? totalOrders.doubleValue() / customerCount
                    : 0.0;

            return CustomerSegmentationResponse.builder()
                    .tier((CustomerTier) row[0])
                    .customerCount(customerCount)
                    .customerPercentage(customerPercentage)
                    .totalRevenue(revenue)
                    .revenuePercentage(revenuePercentage)
                    .averageOrderValue(toBigDecimal(row[4]))
                    .averageOrdersPerCustomer(avgOrdersPerCustomer)
                    .totalOrders(totalOrders)
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    public Page<CustomerLifetimeValueResponse> getCustomerLifetimeValue(Pageable pageable) {
        log.info("Generating customer lifetime value analysis");

        List<Object[]> results = orderRepository.findCustomerLifetimeValue(pageable);
        if (results == null) {
            results = Collections.emptyList();
        }

        List<CustomerLifetimeValueResponse> responses = results.stream().map(row -> {
            LocalDateTime registeredAt = (LocalDateTime) row[5];
            Long totalOrders = toLong(row[6]);
            Long completedOrders = toLong(row[7]);
            BigDecimal totalSpent = toBigDecimal(row[9]);

            long daysSinceRegistration = ChronoUnit.DAYS.between(registeredAt, LocalDateTime.now());
            long monthsSinceRegistration = Math.max(1, daysSinceRegistration / 30);

            Double orderFrequency = totalOrders.doubleValue() / monthsSinceRegistration;
            Double repeatRate = totalOrders > 1 ? ((double)(totalOrders - 1) / totalOrders) * 100 : 0.0;

            // Predicted CLV = current spending * (expected lifetime months / months active)
            long expectedLifetimeMonths = 12; // Assume 12 months
            BigDecimal predictedCLV = totalSpent.multiply(BigDecimal.valueOf(expectedLifetimeMonths))
                    .divide(BigDecimal.valueOf(monthsSinceRegistration), 2, RoundingMode.HALF_UP);

            String segment = categorizeCustomer(totalSpent, totalOrders, daysSinceRegistration);

            return CustomerLifetimeValueResponse.builder()
                    .customerId((String) row[0])
                    .fullName((String) row[1])
                    .email((String) row[2])
                    .phoneNumber((String) row[3])
                    .tier((CustomerTier) row[4])
                    .registeredAt(registeredAt)
                    .totalSpent(totalSpent)
                    .totalOrders(totalOrders)
                    .completedOrders(completedOrders)
                    .cancelledOrders(toLong(row[8]))
                    .averageOrderValue(toBigDecimal(row[10]))
                    .daysSinceRegistration(daysSinceRegistration)
                    .daysSinceLastOrder(0L) // Would need additional query
                    .orderFrequency(orderFrequency)
                    .repeatPurchaseRate(repeatRate)
                    .favoriteStoreCount(0L) // Would need FavoriteStore query
                    .predictedLifetimeValue(predictedCLV)
                    .customerSegment(segment)
                    .build();
        }).collect(Collectors.toList());

        return new PageImpl<>(responses, pageable, results.size());
    }

    @Override
    public PurchasePatternResponse getPurchasePatterns(LocalDateTime startDate, LocalDateTime endDate) {
        log.info("Generating purchase patterns from {} to {}", startDate, endDate);

        // This is a simplified version - would need more complex queries for full implementation
        return PurchasePatternResponse.builder()
                .period("All Day")
                .orderCount(0L)
                .orderPercentage(0.0)
                .dayOfWeek("All Days")
                .averageOrderValue(BigDecimal.ZERO)
                .topCategoryName("N/A")
                .categoryOrderCount(0L)
                .totalReturns(0L)
                .returnRate(0.0)
                .topReturnReason("N/A")
                .repeatCustomers(0L)
                .oneTimeCustomers(0L)
                .repeatCustomerRate(0.0)
                .averageDaysBetweenOrders(0.0)
                .build();
    }

    // ==================== WASTE REPORTS ====================

    @Override
    public WasteSummaryResponse getWasteSummary() {
        log.info("Generating waste summary");

        LocalDate nearExpiryDate = LocalDate.now().plusDays(7);

        Object[] data = storeProductRepository.findWasteSummary(nearExpiryDate);
        if (data == null || data.length < 13) {
            data = defaultWasteSummary();
        }

        Long totalProducts = toLong(data[0]);
        Long activeProducts = toLong(data[1]);
        Long soldOutProducts = toLong(data[2]);
        Long expiredProducts = toLong(data[3]);
        Long nearExpiryProducts = toLong(data[4]);
        Long totalStock = toLong(data[5]);
        Long soldQuantity = toLong(data[6]);
        Long unsoldQuantity = toLong(data[7]);
        Long expiredQuantity = toLong(data[8]);
        BigDecimal totalStockValue = toBigDecimal(data[9]);
        BigDecimal soldValue = toBigDecimal(data[10]);
        BigDecimal unsoldValue = toBigDecimal(data[11]);
        BigDecimal wasteValue = toBigDecimal(data[12]);

        // Calculate rates
        Double sellThroughRate = totalStock > 0 ? (soldQuantity.doubleValue() / totalStock) * 100 : 0.0;
        Double wasteRate = totalStock > 0 ? (unsoldQuantity.doubleValue() / totalStock) * 100 : 0.0;
        Double expiryRate = totalStock > 0 ? (expiredQuantity.doubleValue() / totalStock) * 100 : 0.0;

        // Waste index (0-100, lower is better)
        Double overallWasteIndex = (wasteRate + expiryRate) / 2;

        // Get top waste contributors
        List<Object[]> categoryWaste = storeProductRepository.findWasteByCategory(nearExpiryDate);
        if (categoryWaste == null) {
            categoryWaste = Collections.emptyList();
        }
        List<Object[]> supplierWaste = storeProductRepository.findWasteBySupplier();
        if (supplierWaste == null) {
            supplierWaste = Collections.emptyList();
        }

        String topWasteCategory = categoryWaste.isEmpty() ? "N/A" : (String) categoryWaste.get(0)[1];
        BigDecimal topCategoryWasteValue = categoryWaste.isEmpty() ? BigDecimal.ZERO : toBigDecimal(categoryWaste.get(0)[11]);

        String topWasteSupplier = supplierWaste.isEmpty() ? "N/A" : (String) supplierWaste.get(0)[1];
        BigDecimal topSupplierWasteValue = supplierWaste.isEmpty() ? BigDecimal.ZERO : toBigDecimal(supplierWaste.get(0)[12]);

        return WasteSummaryResponse.builder()
                .startDate(LocalDateTime.now().minusMonths(1))
                .endDate(LocalDateTime.now())
                .totalProducts(totalProducts)
                .activeProducts(activeProducts)
                .soldOutProducts(soldOutProducts)
                .expiredProducts(expiredProducts)
                .nearExpiryProducts(nearExpiryProducts)
                .totalStockQuantity(totalStock)
                .soldQuantity(soldQuantity)
                .unsoldQuantity(unsoldQuantity)
                .expiredQuantity(expiredQuantity)
                .totalStockValue(totalStockValue)
                .soldValue(soldValue)
                .unsoldValue(unsoldValue)
                .wasteValue(wasteValue)
                .potentialRevenueLoss(unsoldValue.add(wasteValue))
                .sellThroughRate(sellThroughRate)
                .wasteRate(wasteRate)
                .expiryRate(expiryRate)
                .overallWasteIndex(overallWasteIndex)
                .wasteRateChange(0.0) // Would need historical comparison
                .wasteRateTrend(overallWasteIndex < 30 ? "IMPROVING" : overallWasteIndex < 50 ? "STABLE" : "WORSENING")
                .topWasteCategoryName(topWasteCategory)
                .topWasteCategoryValue(topCategoryWasteValue)
                .topWasteSupplierName(topWasteSupplier)
                .topWasteSupplierValue(topSupplierWasteValue)
                .build();
    }

    @Override
    public Page<UnsoldInventoryResponse> getUnsoldInventory(Pageable pageable) {
        log.info("Generating unsold inventory report");

        List<Object[]> results = storeProductRepository.findUnsoldInventory();
        if (results == null) {
            results = Collections.emptyList();
        }

        List<UnsoldInventoryResponse> responses = results.stream().map(row -> {
            Integer currentStock = (Integer) row[7];
            Integer initialStock = (Integer) row[8];
            Integer soldQuantity = initialStock - currentStock;
            LocalDate expiryDate = (LocalDate) row[9];
            BigDecimal originalPrice = toBigDecimal(row[10]);
            BigDecimal discountPrice = toBigDecimal(row[11]);
            ProductStatus status = (ProductStatus) row[12];

            Integer daysUntilExpiry = expiryDate != null
                    ? (int) ChronoUnit.DAYS.between(LocalDate.now(), expiryDate)
                    : null;
            Boolean isNearExpiry = daysUntilExpiry != null && daysUntilExpiry <= 7;

            BigDecimal potentialLoss = originalPrice.subtract(discountPrice).multiply(BigDecimal.valueOf(currentStock));
            BigDecimal wasteValue = originalPrice.multiply(BigDecimal.valueOf(currentStock));

            String riskLevel = determineWasteRiskLevel(daysUntilExpiry, currentStock, initialStock);

            return UnsoldInventoryResponse.builder()
                    .productId((String) row[0])
                    .productName((String) row[1])
                    .variantId((String) row[2])
                    .variantName((String) row[3])
                    .categoryName((String) row[4])
                    .supplierName((String) row[5])
                    .storeName((String) row[6])
                    .currentStock(currentStock)
                    .initialStock(initialStock)
                    .soldQuantity(soldQuantity)
                    .expiryDate(expiryDate)
                    .daysUntilExpiry(daysUntilExpiry)
                    .originalPrice(originalPrice)
                    .discountPrice(discountPrice)
                    .potentialRevenueLoss(potentialLoss)
                    .estimatedWasteValue(wasteValue)
                    .wasteRiskLevel(riskLevel)
                    .productStatus(status.name())
                    .isNearExpiry(isNearExpiry)
                    .build();
        }).collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), responses.size());
        List<UnsoldInventoryResponse> pageContent = responses.subList(start, end);

        return new PageImpl<>(pageContent, pageable, responses.size());
    }

    @Override
    public List<WasteByCategoryResponse> getWasteByCategory() {
        log.info("Generating waste by category report");

        LocalDate nearExpiryDate = LocalDate.now().plusDays(7);

        List<Object[]> results = storeProductRepository.findWasteByCategory(nearExpiryDate);

        return results.stream().map(row -> {
            Long totalProducts = toLong(row[3]);
            Long unsoldProducts = toLong(row[4]);
            Long totalStock = toLong(row[7]);
            Long unsoldQuantity = toLong(row[8]);
            Long expiredQuantity = toLong(row[9]);
            BigDecimal totalStockValue = toBigDecimal(row[10]);
            BigDecimal unsoldValue = toBigDecimal(row[11]);

            Double wasteRate = totalStock > 0 ? (unsoldQuantity.doubleValue() / totalStock) * 100 : 0.0;
            Double expiryRate = totalStock > 0 ? (expiredQuantity.doubleValue() / totalStock) * 100 : 0.0;
            Double wasteIndex = (wasteRate * 0.6) + (expiryRate * 0.4); // Weighted composite

            return WasteByCategoryResponse.builder()
                    .categoryId((String) row[0])
                    .categoryName((String) row[1])
                    .categoryImageUrl((String) row[2])
                    .totalProducts(totalProducts)
                    .unsoldProducts(unsoldProducts)
                    .expiredProducts(toLong(row[5]))
                    .nearExpiryProducts(toLong(row[6]))
                    .totalStockQuantity(totalStock)
                    .unsoldQuantity(unsoldQuantity)
                    .expiredQuantity(expiredQuantity)
                    .totalStockValue(totalStockValue)
                    .unsoldValue(unsoldValue)
                    .wasteValue(unsoldValue) // Simplified
                    .wasteRate(wasteRate)
                    .expiryRate(expiryRate)
                    .wasteIndex(wasteIndex)
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    public List<WasteBySupplierResponse> getWasteBySupplier() {
        log.info("Generating waste by supplier report");

        List<Object[]> results = storeProductRepository.findWasteBySupplier();

        return results.stream().map(row -> {
            Long totalStock = toLong(row[10]);
            Long soldQuantity = toLong(row[11]);
            Long unsoldQuantity = toLong(row[12]);

            Double sellThroughRate = totalStock > 0 ? (soldQuantity.doubleValue() / totalStock) * 100 : 0.0;
            Double wasteRate = totalStock > 0 ? (unsoldQuantity.doubleValue() / totalStock) * 100 : 0.0;
            Double wasteIndex = 100.0 - sellThroughRate;

            String rating = sellThroughRate >= 80 ? "EXCELLENT"
                    : sellThroughRate >= 60 ? "GOOD"
                    : sellThroughRate >= 40 ? "FAIR" : "POOR";

            // Calculate financial metrics (would need revenue data from orders)
            BigDecimal wasteValue = toBigDecimal(unsoldQuantity * 50000); // Estimate

            return WasteBySupplierResponse.builder()
                    .supplierId((String) row[0])
                    .supplierName((String) row[1])
                    .avatarUrl((String) row[2])
                    .totalProducts(toLong(row[3]))
                    .activeProducts(toLong(row[4]))
                    .unsoldProducts(toLong(row[5]))
                    .expiredProducts(toLong(row[6]))
                    .totalStores(toLong(row[7]))
                    .activeStores(toLong(row[8]))
                    .totalStockQuantity(totalStock)
                    .soldQuantity(soldQuantity)
                    .unsoldQuantity(unsoldQuantity)
                    .expiredQuantity(toLong(row[13]))
                    .totalRevenue(BigDecimal.ZERO) // Would need order join
                    .potentialRevenueLoss(wasteValue)
                    .wasteValue(wasteValue)
                    .sellThroughRate(sellThroughRate)
                    .wasteRate(wasteRate)
                    .wasteIndex(wasteIndex)
                    .performanceRating(rating)
                    .build();
        }).collect(Collectors.toList());
    }

    // ==================== EXPORT METHODS ====================

    @Override
    public byte[] exportRevenueReportToCsv(LocalDateTime startDate, LocalDateTime endDate) {
        log.info("Exporting revenue report to CSV");

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             PrintWriter writer = new PrintWriter(baos, true, StandardCharsets.UTF_8)) {

            // Header
            writer.println("Supplier ID,Supplier Name,Total Orders,Total Revenue,Commission,Supplier Earnings,Revenue %,Products,Stores");

            // Data
            List<RevenueBySupplierResponse> data = getRevenueBySupplier(startDate, endDate);
            for (RevenueBySupplierResponse item : data) {
                writer.printf("%s,%s,%d,%s,%s,%s,%.2f,%d,%d%n",
                        item.getSupplierId(),
                        escapeCSV(item.getSupplierName()),
                        item.getTotalOrders(),
                        item.getTotalRevenue(),
                        item.getPlatformCommission(),
                        item.getSupplierEarnings(),
                        item.getRevenuePercentage(),
                        item.getProductCount(),
                        item.getStoreCount());
            }

            writer.flush();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Error exporting revenue report to CSV", e);
            throw new RuntimeException("Failed to export report", e);
        }
    }

    @Override
    public byte[] exportCustomerBehaviorReportToCsv(LocalDateTime startDate, LocalDateTime endDate) {
        log.info("Exporting customer behavior report to CSV");

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             PrintWriter writer = new PrintWriter(baos, true, StandardCharsets.UTF_8)) {

            writer.println("Tier,Customer Count,Customer %,Total Orders,Total Revenue,Revenue %,Avg Order Value,Avg Orders/Customer");

            List<CustomerSegmentationResponse> data = getCustomerSegmentation(startDate, endDate);
            for (CustomerSegmentationResponse item : data) {
                writer.printf("%s,%d,%.2f,%d,%s,%.2f,%s,%.2f%n",
                        item.getTier(),
                        item.getCustomerCount(),
                        item.getCustomerPercentage(),
                        item.getTotalOrders(),
                        item.getTotalRevenue(),
                        item.getRevenuePercentage(),
                        item.getAverageOrderValue(),
                        item.getAverageOrdersPerCustomer());
            }

            writer.flush();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Error exporting customer behavior report to CSV", e);
            throw new RuntimeException("Failed to export report", e);
        }
    }

    @Override
    public byte[] exportWasteReportToCsv() {
        log.info("Exporting waste report to CSV");

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             PrintWriter writer = new PrintWriter(baos, true, StandardCharsets.UTF_8)) {

            writer.println("Category,Total Products,Unsold Products,Expired,Near Expiry,Total Stock,Unsold Qty,Expired Qty,Waste Rate %,Expiry Rate %,Waste Index");

            List<WasteByCategoryResponse> data = getWasteByCategory();
            for (WasteByCategoryResponse item : data) {
                writer.printf("%s,%d,%d,%d,%d,%d,%d,%d,%.2f,%.2f,%.2f%n",
                        escapeCSV(item.getCategoryName()),
                        item.getTotalProducts(),
                        item.getUnsoldProducts(),
                        item.getExpiredProducts(),
                        item.getNearExpiryProducts(),
                        item.getTotalStockQuantity(),
                        item.getUnsoldQuantity(),
                        item.getExpiredQuantity(),
                        item.getWasteRate(),
                        item.getExpiryRate(),
                        item.getWasteIndex());
            }

            writer.flush();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Error exporting waste report to CSV", e);
            throw new RuntimeException("Failed to export report", e);
        }
    }

    // ==================== HELPER METHODS ====================

    private Object[] defaultWasteSummary() {
        return new Object[]{
                0L, // totalProducts
                0L, // activeProducts
                0L, // soldOutProducts
                0L, // expiredProducts
                0L, // nearExpiryProducts
                0L, // totalStock
                0L, // soldQuantity
                0L, // unsoldQuantity
                0L, // expiredQuantity
                BigDecimal.ZERO, // totalStockValue
                BigDecimal.ZERO, // soldValue
                BigDecimal.ZERO, // unsoldValue
                BigDecimal.ZERO // wasteValue
        };
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal) return (BigDecimal) value;
        if (value instanceof Double) return BigDecimal.valueOf((Double) value);
        if (value instanceof Integer) return BigDecimal.valueOf((Integer) value);
        if (value instanceof Long) return BigDecimal.valueOf((Long) value);
        if (value instanceof BigInteger) return new BigDecimal((BigInteger) value);
        return BigDecimal.ZERO;
    }

    private Long toLong(Object value) {
        if (value == null) return 0L;
        if (value instanceof Long) return (Long) value;
        if (value instanceof Integer) return ((Integer) value).longValue();
        if (value instanceof BigDecimal) return ((BigDecimal) value).longValue();
        if (value instanceof BigInteger) return ((BigInteger) value).longValue();
        return 0L;
    }

    private Double getCommissionRate() {
        return systemConfigRepository.findByConfigKey("commission_rate")
                .map(config -> Double.parseDouble(config.getConfigValue()))
                .orElse(5.0); // Default 5%
    }

    private Double calculateGrowthRate(Double previous, Double current) {
        if (previous == null || previous == 0.0) return 0.0;
        return ((current - previous) / previous) * 100;
    }

    private Double calculateGrowthRate(BigDecimal previous, BigDecimal current) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) return 0.0;
        return current.subtract(previous)
                .divide(previous, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();
    }

    private String categorizeCustomer(BigDecimal totalSpent, Long totalOrders, Long daysSinceRegistration) {
        if (totalSpent.compareTo(BigDecimal.valueOf(10000000)) > 0 && totalOrders >= 10) {
            return "High Value";
        } else if (totalSpent.compareTo(BigDecimal.valueOf(5000000)) > 0 && totalOrders >= 5) {
            return "Medium Value";
        } else if (daysSinceRegistration > 90 && totalOrders <= 2) {
            return "At Risk";
        } else {
            return "Low Value";
        }
    }

    private String determineWasteRiskLevel(Integer daysUntilExpiry, Integer currentStock, Integer initialStock) {
        if (daysUntilExpiry == null) return "LOW";

        double stockRatio = currentStock.doubleValue() / initialStock;

        if (daysUntilExpiry <= 2) return "CRITICAL";
        if (daysUntilExpiry <= 5 && stockRatio > 0.5) return "HIGH";
        if (daysUntilExpiry <= 7 && stockRatio > 0.7) return "MEDIUM";
        return "LOW";
    }

    private String escapeCSV(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
