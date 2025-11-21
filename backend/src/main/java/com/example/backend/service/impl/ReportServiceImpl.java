package com.example.backend.service.impl;

import com.example.backend.dto.response.*;
import com.example.backend.entity.Order;
import com.example.backend.entity.OrderDetail;
import com.example.backend.entity.enums.CustomerStatus;
import com.example.backend.entity.enums.CustomerTier;
import com.example.backend.entity.enums.OrderStatus;
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
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
        if (summaryData == null || summaryData.length < 10) {
            summaryData = new Object[]{
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, 
                BigDecimal.ZERO, BigDecimal.ZERO, 
                0L, 0L, 0L, 
                BigDecimal.ZERO, 0.0
            };
        }

        // Parse query results (updated order based on new query)
        BigDecimal totalGMV = toBigDecimal(summaryData[0]);  // totalAmount + shippingFee
        BigDecimal totalProductRevenue = toBigDecimal(summaryData[1]);  // totalAmount only
        BigDecimal totalShippingFee = toBigDecimal(summaryData[2]);  // shippingFee only
        BigDecimal totalPlatformRevenue = toBigDecimal(summaryData[3]);  // commission on products only (no shipping)
        BigDecimal totalSupplierEarnings = toBigDecimal(summaryData[4]);  // product net + shipping
        Long completedOrders = toLong(summaryData[5]);
        Long cancelledOrders = toLong(summaryData[6]);
        Long totalOrders = toLong(summaryData[7]);
        BigDecimal avgOrderValue = toBigDecimal(summaryData[8]);  // Average GMV
        Double avgCommissionRate = toDouble(summaryData[9]);  // Average commission rate
        
        // Legacy fields for backward compatibility
        BigDecimal totalRevenue = totalGMV;
        BigDecimal totalCommission = totalPlatformRevenue;  // Commission on products only (no shipping)

        // Calculate daily average
        long daysBetween = Math.max(1, ChronoUnit.DAYS.between(startDate.toLocalDate(), endDate.toLocalDate()));
        BigDecimal avgDailyRevenue = totalGMV.divide(BigDecimal.valueOf(daysBetween), 2, RoundingMode.HALF_UP);

        // Calculate growth rates (compare to previous period)
        LocalDateTime previousStartDate = startDate.minusDays(daysBetween);
        LocalDateTime previousEndDate = startDate;
        Object[] previousData = orderRepository.findRevenueSummary(previousStartDate, previousEndDate);
        if (previousData == null || previousData.length < 10) {
            previousData = new Object[]{
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO,
                0L, 0L, 0L,
                BigDecimal.ZERO, 0.0
            };
        }

        BigDecimal previousGMV = toBigDecimal(previousData[0]);
        Long previousCompletedOrders = toLong(previousData[5]);

        Double revenueGrowth = calculateGrowthRate(previousGMV, totalGMV);
        Double orderGrowth = calculateGrowthRate(previousCompletedOrders.doubleValue(), completedOrders.doubleValue());

        // Get top performers
        List<Object[]> topSuppliers = orderRepository.findRevenueBySupplier(startDate, endDate);
        List<Object[]> topCategories = orderDetailRepository.findRevenueByCategoryWithDateRange(startDate, endDate);

        String topSupplierName = (topSuppliers != null && !topSuppliers.isEmpty()) ? (String) topSuppliers.get(0)[1] : "N/A";
        // row[8] = supplierEarnings (product net + shipping)
        BigDecimal topSupplierRevenue = (topSuppliers != null && !topSuppliers.isEmpty()) ? toBigDecimal(topSuppliers.get(0)[8]) : BigDecimal.ZERO;
        String topCategoryName = (topCategories != null && !topCategories.isEmpty()) ? (String) topCategories.get(0)[1] : "N/A";
        BigDecimal topCategoryRevenue = (topCategories != null && !topCategories.isEmpty()) ? toBigDecimal(topCategories.get(0)[5]) : BigDecimal.ZERO;

        return RevenueSummaryResponse.builder()
                .startDate(startDate)
                .endDate(endDate)
                .totalGMV(totalGMV)
                .totalProductRevenue(totalProductRevenue)
                .totalShippingFee(totalShippingFee)
                .totalPlatformRevenue(totalPlatformRevenue)
                .totalSupplierEarnings(totalSupplierEarnings)
                .totalRevenue(totalRevenue)  // Legacy: same as GMV
                .totalCommission(totalCommission)  // Legacy: commission only
                .totalOrders(totalOrders)
                .completedOrders(completedOrders)
                .cancelledOrders(cancelledOrders)
                .averageOrderValue(avgOrderValue)
                .averageDailyRevenue(avgDailyRevenue)
                .averageCommissionRate(avgCommissionRate)
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

        // Handle empty results
        if (results == null || results.isEmpty()) {
            log.warn("No revenue data found for suppliers between {} and {}", startDate, endDate);
            return Collections.emptyList();
        }

        // Calculate total supplier earnings for percentage calculation
        BigDecimal totalSupplierEarnings = results.stream()
                .map(r -> toBigDecimal(r[8]))  // supplierEarnings at index 8
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return results.stream().map(row -> {
            // Updated query returns:
            // 0: supplierId, 1: supplierName, 2: avatarUrl, 3: orderCount,
            // 4: totalGMV, 5: productRevenue, 6: shippingFee, 7: platformCommission (product only),
            // 8: supplierEarnings (product net + shipping), 9: productCount, 10: storeCount, 11: commissionRate
            
            BigDecimal totalGMV = toBigDecimal(row[4]);
            BigDecimal productRevenue = toBigDecimal(row[5]);
            BigDecimal shippingFee = toBigDecimal(row[6]);
            BigDecimal platformCommission = toBigDecimal(row[7]);  // Commission on products only (no shipping)
            BigDecimal supplierEarnings = toBigDecimal(row[8]);     // Product net + shipping fee
            Double commissionRate = toDouble(row[11]);
            
            Double revenuePercentage = totalSupplierEarnings.compareTo(BigDecimal.ZERO) > 0
                    ? supplierEarnings.divide(totalSupplierEarnings, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                    : 0.0;

            return RevenueBySupplierResponse.builder()
                    .supplierId((String) row[0])
                    .supplierName((String) row[1])
                    .avatarUrl((String) row[2])
                    .totalOrders(toLong(row[3]))
                    .totalGMV(totalGMV)
                    .totalProductRevenue(productRevenue)
                    .totalShippingFee(shippingFee)
                    .platformCommission(platformCommission)
                    .supplierEarnings(supplierEarnings)
                    .totalRevenue(totalGMV)  // Legacy: same as GMV
                    .revenuePercentage(revenuePercentage)
                    .productCount(toLong(row[9]))
                    .storeCount(toLong(row[10]))
                    .commissionRate(commissionRate)
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    public List<RevenueByCategoryResponse> getRevenueByCategory(LocalDateTime startDate, LocalDateTime endDate) {
        log.info("Generating revenue by category from {} to {}", startDate, endDate);

        List<Object[]> results = orderDetailRepository.findRevenueByCategoryWithDateRange(startDate, endDate);

        // Handle empty results
        if (results == null || results.isEmpty()) {
            log.warn("No revenue data found for categories between {} and {}", startDate, endDate);
            return Collections.emptyList();
        }

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

        // Handle empty results
        if (results == null || results.isEmpty()) {
            log.warn("No revenue time series data found between {} and {}", startDate, endDate);
            return Collections.emptyList();
        }

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

        // Validate date range
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("Start date and end date cannot be null");
        }
        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("Start date must be before or equal to end date");
        }

        long totalCustomers = customerRepository.count();

        // Get suspended and banned customers
        long suspendedCustomers = customerRepository.countByStatus(CustomerStatus.SUSPENDED);
        long bannedCustomers = customerRepository.countByStatus(CustomerStatus.BANNED);

        Long newCustomers = customerRepository.countByCreatedAtBetween(startDate, endDate);
        Long returningCustomers = orderRepository.countReturningCustomers(startDate, endDate);
        if (newCustomers == null) {
            newCustomers = 0L;
        }
        if (returningCustomers == null) {
            returningCustomers = 0L;
        }
        Long activeCustomers = newCustomers + returningCustomers;

        // Get segmentation data
        List<Object[]> segmentationData = orderRepository.findCustomerSegmentation(startDate, endDate);
        if (segmentationData == null) {
            segmentationData = Collections.emptyList();
        }

        Long bronzeTier = 0L, silverTier = 0L, goldTier = 0L, platinumTier = 0L, diamondTier = 0L;
        for (Object[] row : segmentationData) {
            if (row == null || row.length < 2) continue; // Skip invalid rows
            
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
        if (clvData == null || clvData.isEmpty()) {
            clvData = new ArrayList<>();
        }

        BigDecimal avgCLV = BigDecimal.ZERO;
        BigDecimal avgOrderValue = BigDecimal.ZERO;

        if (!clvData.isEmpty()) {
            // Calculate average CLV
            BigDecimal totalCLV = clvData.stream()
                    .map(row -> row.length > 9 ? toBigDecimal(row[9]) : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            avgCLV = totalCLV.divide(BigDecimal.valueOf(clvData.size()), 2, RoundingMode.HALF_UP);

            // Calculate average order value - only from non-zero values
            List<BigDecimal> nonZeroOrderValues = clvData.stream()
                    .map(row -> row.length > 10 ? toBigDecimal(row[10]) : BigDecimal.ZERO)
                    .filter(v -> v.compareTo(BigDecimal.ZERO) > 0)
                    .toList();
            
            if (!nonZeroOrderValues.isEmpty()) {
                BigDecimal totalOrderValue = nonZeroOrderValues.stream()
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                avgOrderValue = totalOrderValue.divide(BigDecimal.valueOf(nonZeroOrderValues.size()), 2, RoundingMode.HALF_UP);
            }
        }

        Double avgOrdersPerCustomer = clvData.isEmpty() ? 0.0 : clvData.stream()
                .mapToLong(row -> row.length > 6 ? toLong(row[6]) : 0L)
                .average()
                .orElse(0.0);

        // Calculate rates
        Double activeCustomerRate = totalCustomers > 0
                ? (activeCustomers.doubleValue() / totalCustomers) * 100
                : 0.0;
        Double repeatPurchaseRate = activeCustomers > 0
                ? (returningCustomers.doubleValue() / activeCustomers) * 100
                : 0.0;
        
        
        long deliveredOrders = orderRepository.countByStatusAndCreatedAtBetween(OrderStatus.DELIVERED, startDate, endDate);
        long returnedOrdersCount = orderRepository.countByStatusAndCreatedAtBetween(OrderStatus.RETURNED, startDate, endDate);
        long canceledOrdersCount = orderRepository.countByStatusAndCreatedAtBetween(OrderStatus.CANCELED, startDate, endDate);

        // Total completed process orders = successfully delivered + returned + canceled
        long completedProcessOrders = deliveredOrders + returnedOrdersCount + canceledOrdersCount;
        
        long failedOrders = returnedOrdersCount + canceledOrdersCount;
        Double returnRate = completedProcessOrders > 0
                ? ((double) failedOrders / completedProcessOrders) * 100
                : 0.0;

        BigDecimal totalValue = clvData.isEmpty() ? BigDecimal.ZERO : clvData.stream()
                .map(row -> row.length > 9 ? toBigDecimal(row[9]) : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CustomerBehaviorSummaryResponse.builder()
                .startDate(startDate)
                .endDate(endDate)
                .totalCustomers(totalCustomers)
                .activeCustomers(activeCustomers)
                .newCustomers(newCustomers)
                .returningCustomers(returningCustomers)
                .suspendedCustomers(suspendedCustomers)
                .bannedCustomers(bannedCustomers)
                .returnRate(returnRate)
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
        if (results == null || results.isEmpty()) {
            log.warn("No customer segmentation data found between {} and {}", startDate, endDate);
            return Collections.emptyList();
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
        if (results == null || results.isEmpty()) {
            log.warn("No customer lifetime value data found");
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
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

        // Get all delivered orders in the date range
        List<Order> orders = orderRepository.findByDeliveredAtBetween(startDate, endDate);
        
        if (orders.isEmpty()) {
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

        long totalOrders = orders.size();
        
        // Calculate average order value
        BigDecimal totalRevenue = orders.stream()
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal averageOrderValue = totalOrders > 0 
                ? totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Calculate repeat customer rate
        Map<String, Long> customerOrderCount = orders.stream()
                .collect(Collectors.groupingBy(
                        o -> o.getCustomer().getUserId(),
                        Collectors.counting()
                ));
        
        long repeatCustomers = customerOrderCount.values().stream()
                .filter(count -> count > 1)
                .count();
        long oneTimeCustomers = customerOrderCount.size() - repeatCustomers;
        double repeatCustomerRate = customerOrderCount.size() > 0
                ? (double) repeatCustomers / customerOrderCount.size() * 100
                : 0.0;

        // Calculate average days between orders for repeat customers
        double averageDaysBetweenOrders = 0.0;
        if (repeatCustomers > 0) {
            List<Double> daysBetweenList = new ArrayList<>();
            for (Map.Entry<String, Long> entry : customerOrderCount.entrySet()) {
                if (entry.getValue() > 1) {
                    List<Order> customerOrders = orders.stream()
                            .filter(o -> o.getCustomer().getUserId().equals(entry.getKey()))
                            .sorted(Comparator.comparing(Order::getDeliveredAt))
                            .collect(Collectors.toList());
                    
                    for (int i = 1; i < customerOrders.size(); i++) {
                        long daysBetween = java.time.Duration.between(
                                customerOrders.get(i-1).getDeliveredAt(),
                                customerOrders.get(i).getDeliveredAt()
                        ).toDays();
                        daysBetweenList.add((double) daysBetween);
                    }
                }
            }
            averageDaysBetweenOrders = daysBetweenList.stream()
                    .mapToDouble(Double::doubleValue)
                    .average()
                    .orElse(0.0);
        }

        // Find top category (most ordered)
        Map<String, Long> categoryOrderCount = new HashMap<>();
        for (Order order : orders) {
            for (OrderDetail detail : order.getOrderDetails()) {
                String categoryName = detail.getStoreProduct().getVariant().getProduct()
                        .getCategory().getName();
                categoryOrderCount.merge(categoryName, 1L, Long::sum);
            }
        }
        
        Map.Entry<String, Long> topCategory = categoryOrderCount.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .orElse(null);


        // Count both RETURNED and CANCELED orders as failed orders
        long returnedOrders = orders.stream()
                .filter(o -> o.getStatus() == OrderStatus.RETURNED)
                .count();
        long canceledOrders = orders.stream()
                .filter(o -> o.getStatus() == OrderStatus.CANCELED)
                .count();
        
        long totalReturns = returnedOrders + canceledOrders;
        double returnRate = totalOrders > 0 ? (double) totalReturns / totalOrders * 100 : 0.0;

        return PurchasePatternResponse.builder()
                .period("All Day")
                .orderCount(totalOrders)
                .orderPercentage(100.0)
                .dayOfWeek("All Days")
                .averageOrderValue(averageOrderValue)
                .topCategoryName(topCategory != null ? topCategory.getKey() : "N/A")
                .categoryOrderCount(topCategory != null ? topCategory.getValue() : 0L)
                .totalReturns(totalReturns)
                .returnRate(returnRate)
                .topReturnReason(totalReturns > 0 ? "Sản phẩm không đúng mô tả" : "N/A")
                .repeatCustomers(repeatCustomers)
                .oneTimeCustomers(oneTimeCustomers)
                .repeatCustomerRate(repeatCustomerRate)
                .averageDaysBetweenOrders(averageDaysBetweenOrders)
                .build();
    }

    // ==================== WASTE REPORTS ====================

    @Override
    public WasteSummaryResponse getWasteSummary(LocalDateTime startDate, LocalDateTime endDate) {
        LocalDateTime defaultStart = LocalDateTime.of(2020, 1, 1, 0, 0);
        LocalDateTime now = LocalDateTime.now();

        LocalDateTime effectiveEnd = endDate != null ? endDate : now;
        LocalDateTime effectiveStart = startDate != null ? startDate : defaultStart;

        if (effectiveStart.isAfter(effectiveEnd)) {
            throw new IllegalArgumentException("Start date must be before end date");
        }

        log.info("Generating waste summary - StartDate: {}, EndDate: {}", effectiveStart, effectiveEnd);

        LocalDate nearExpiryDate = LocalDate.now().plusDays(7);

        Object[] data = storeProductRepository.findWasteSummary(nearExpiryDate);
        if (data == null || data.length < 10) {
            data = defaultWasteSummary();
        }

        // Parse new data structure
        Long totalProducts = toLong(data[0]);
        Long activeProducts = toLong(data[1]);
        Long soldOutProducts = toLong(data[2]);
        Long expiredProducts = toLong(data[3]);
        Long nearExpiryProducts = toLong(data[4]);
        Long remainingStock = toLong(data[5]);       // ACTIVE + INACTIVE stock
        Long expiredStock = toLong(data[6]);         // EXPIRED stock
        Long currentStock = remainingStock + expiredStock; // Tồn kho hiện tại
        BigDecimal totalStockValue = toBigDecimal(data[7]);
        BigDecimal unsoldValue = toBigDecimal(data[8]);
        BigDecimal wasteValue = toBigDecimal(data[9]);

        // Get sold quantity from DELIVERED orders
        Long soldQuantity = orderDetailRepository.sumSoldQuantityInPeriod(effectiveStart, effectiveEnd);
        if (soldQuantity == null) {
            soldQuantity = 0L;
        }

        // Calculate tổng tồn kho ban đầu = đã bán + tồn kho hiện tại
        Long totalInitialStock = soldQuantity + currentStock;
        Long unsoldQuantity = remainingStock;  // ACTIVE + INACTIVE
        Long expiredQuantity = expiredStock;
        Long totalUnsold = unsoldQuantity + expiredQuantity;

        // Calculate rates dựa trên tổng tồn kho ban đầu
        Double sellThroughRate = totalInitialStock > 0 ? (soldQuantity.doubleValue() / totalInitialStock) * 100 : 0.0;
        Double expiryRate = totalInitialStock > 0 ? (expiredQuantity.doubleValue() / totalInitialStock) * 100 : 0.0;
        Double remainingRate = totalInitialStock > 0 ? (unsoldQuantity.doubleValue() / totalInitialStock) * 100 : 0.0;

        // Waste rate = expiry rate (true waste)
        Double wasteRate = expiryRate;

        // No more waste index calculation
        Double overallWasteIndex = expiryRate;

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
        BigDecimal topSupplierWasteValue = supplierWaste.isEmpty() ? BigDecimal.ZERO : toBigDecimal(supplierWaste.get(0)[13]);

        return WasteSummaryResponse.builder()
            .startDate(effectiveStart)
            .endDate(effectiveEnd)
            .totalListed(totalInitialStock)
            .totalSold(soldQuantity)
            .totalUnsold(totalUnsold)
                .totalProducts(totalProducts)
                .activeProducts(activeProducts)
                .soldOutProducts(soldOutProducts)
                .expiredProducts(expiredProducts)
                .nearExpiryProducts(nearExpiryProducts)
                .totalStockQuantity(totalInitialStock)
                .soldQuantity(soldQuantity)
                .unsoldQuantity(unsoldQuantity)  // ACTIVE + INACTIVE stock
                .expiredQuantity(expiredQuantity) // EXPIRED stock
                .initialStockQuantity(totalInitialStock)
                .currentStockQuantity(currentStock)
                .totalStockValue(totalStockValue)
                .soldValue(BigDecimal.ZERO)
                .unsoldValue(unsoldValue)
                .wasteValue(wasteValue)
                .potentialRevenueLoss(unsoldValue.add(wasteValue))
                .sellThroughRate(sellThroughRate)
                .wasteRate(wasteRate)
                .expiryRate(expiryRate)
                .remainingRate(remainingRate)
                .overallWasteIndex(overallWasteIndex)
                .wasteRateChange(0.0)
                .wasteRateTrend(expiryRate < 15 ? "IMPROVING" : expiryRate < 30 ? "STABLE" : "WORSENING")
                .topWasteCategoryName(topWasteCategory)
                .topWasteCategoryValue(topCategoryWasteValue)
                .topWasteSupplierName(topWasteSupplier)
                .topWasteSupplierValue(topSupplierWasteValue)
                .build();
    }

    @Override
    public Page<UnsoldInventoryResponse> getUnsoldInventory(
            Pageable pageable, 
            LocalDateTime startDate, 
            LocalDateTime endDate
    ) {
        log.info("Generating unsold inventory report - StartDate: {}, EndDate: {}", startDate, endDate);

        List<Object[]> results = storeProductRepository.findUnsoldInventory();
        if (results == null) {
            results = Collections.emptyList();
        }

        // Filter by date if provided
        if (startDate != null || endDate != null) {
            LocalDate startLocalDate = startDate != null ? startDate.toLocalDate() : LocalDate.MIN;
            LocalDate endLocalDate = endDate != null ? endDate.toLocalDate() : LocalDate.MAX;
            
            results = results.stream()
                    .filter(row -> {
                        LocalDate expiryDate = (LocalDate) row[9];
                        if (expiryDate == null) return true; // Include items without expiry
                        return !expiryDate.isBefore(startLocalDate) && !expiryDate.isAfter(endLocalDate);
                    })
                    .collect(Collectors.toList());
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
    public List<WasteByCategoryResponse> getWasteByCategory(
            LocalDateTime startDate, 
            LocalDateTime endDate
    ) {
        log.info("Generating waste by category report - StartDate: {}, EndDate: {}", startDate, endDate);

        // Use consistent 90-day sales window for waste analysis
        LocalDateTime salesWindowStart = LocalDateTime.now().minusDays(90);
        LocalDateTime salesWindowEnd = LocalDateTime.now();

        LocalDate nearExpiryDate = LocalDate.now().plusDays(7);

        List<Object[]> results = storeProductRepository.findWasteByCategory(nearExpiryDate);

        return results.stream().map(row -> {
            String categoryId = (String) row[0];
            Long totalProducts = toLong(row[3]);
            Long unsoldProducts = toLong(row[4]);
            Long currentStock = toLong(row[7]);
            Long expiredQuantity = toLong(row[9]);
            BigDecimal totalStockValue = toBigDecimal(row[10]);
            BigDecimal unsoldValue = toBigDecimal(row[11]);

           
            Long recentSold = orderDetailRepository.sumSoldQuantityByCategoryInPeriod(
                categoryId,
                salesWindowStart,
                salesWindowEnd
            );
            
            // totalListed = recent sales (90d) + currentStock + expired
            Long totalListed = recentSold + currentStock + expiredQuantity;
            Long totalUnsold = currentStock + expiredQuantity;

            // Calculate rates using SaveFood business model
            Double expiryRate = totalListed > 0 ? (expiredQuantity.doubleValue() / totalListed) * 100 : 0.0;
            Double remainingRate = totalListed > 0 ? (currentStock.doubleValue() / totalListed) * 100 : 0.0;

            // In SaveFood model: waste = expired (true waste)
            Double wasteRate = expiryRate;

            // Waste index = expiryRate × 0.7 + remainingRate × 0.3
            Double wasteIndex = (expiryRate * 0.7) + (remainingRate * 0.3);

            return WasteByCategoryResponse.builder()
                    .categoryId((String) row[0])
                    .categoryName((String) row[1])
                    .categoryImageUrl((String) row[2])
                    .totalProducts(totalProducts)
                    .unsoldProducts(unsoldProducts)
                    .expiredProducts(toLong(row[5]))
                    .nearExpiryProducts(toLong(row[6]))
                    .totalStockQuantity(totalListed)
                    .unsoldQuantity(totalUnsold)
                    .expiredQuantity(expiredQuantity)
                    .totalStockValue(totalStockValue)
                    .unsoldValue(unsoldValue)
                    .wasteValue(unsoldValue)
                    .wasteRate(wasteRate)
                    .expiryRate(expiryRate)
                    .remainingRate(remainingRate)
                    .wasteIndex(wasteIndex)
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    public List<WasteBySupplierResponse> getWasteBySupplier(
            LocalDateTime startDate, 
            LocalDateTime endDate
    ) {
        LocalDateTime defaultStart = LocalDateTime.of(2020, 1, 1, 0, 0);
        LocalDateTime now = LocalDateTime.now();

        LocalDateTime effectiveEnd = endDate != null ? endDate : now;
        LocalDateTime effectiveStart = startDate != null ? startDate : defaultStart;

        if (effectiveStart.isAfter(effectiveEnd)) {
            throw new IllegalArgumentException("Start date must be before end date");
        }

        log.info("Generating waste by supplier report - StartDate: {}, EndDate: {}", effectiveStart, effectiveEnd);

        List<Object[]> results = storeProductRepository.findWasteBySupplier();

        return results.stream().map(row -> {
            String supplierId = (String) row[0];
            
            // New data structure (no initialStock):
            // Index: 9: remainingStock (ACTIVE+INACTIVE), 10: allStock, 11: expiredStock
            Long remainingStock = toLong(row[9]);  // ACTIVE + INACTIVE
            Long allStock = toLong(row[10]);       // Tổng tồn kho hiện tại (mọi trạng thái)
            Long expiredStock = toLong(row[11]);

            // Get sold quantity from DELIVERED orders
            Long soldQuantity = orderDetailRepository.sumSoldQuantityBySupplierInPeriod(
                supplierId, 
                effectiveStart, 
                effectiveEnd
            );
            if (soldQuantity == null) {
                soldQuantity = 0L;
            }
            
            // Calculate tồn kho hiện tại & tồn kho ban đầu
            Long currentStock = allStock;
            Long totalInitialStock = soldQuantity + currentStock;
            Long expiredQuantity = expiredStock;
            Long unsoldQuantity = remainingStock;  // ACTIVE + INACTIVE

            // Calculate rates dựa trên tổng tồn kho ban đầu
            Double sellThroughRate = totalInitialStock > 0 ? (soldQuantity.doubleValue() / totalInitialStock) * 100 : 0.0;
            Double expiryRate = totalInitialStock > 0 ? (expiredQuantity.doubleValue() / totalInitialStock) * 100 : 0.0;
            Double remainingRate = totalInitialStock > 0 ? (unsoldQuantity.doubleValue() / totalInitialStock) * 100 : 0.0;

            // Waste rate = expiry rate
            Double wasteRate = expiryRate;

            // No more waste index - use expiry rate for sorting
            Double wasteIndex = expiryRate;

            String rating = sellThroughRate >= 80 ? "EXCELLENT"
                    : sellThroughRate >= 60 ? "GOOD"
                    : sellThroughRate >= 40 ? "FAIR" : "POOR";

            // Calculate financial metrics
            BigDecimal totalStockValue = row.length > 13 ? toBigDecimal(row[13]) : BigDecimal.ZERO;
            BigDecimal wasteValue = row.length > 14 ? toBigDecimal(row[14]) : BigDecimal.ZERO;

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
                    .totalStockQuantity(totalInitialStock)
                    .soldQuantity(soldQuantity)
                    .unsoldQuantity(unsoldQuantity)  // ACTIVE + INACTIVE stock
                    .expiredQuantity(expiredQuantity) // EXPIRED stock
                    .initialStockQuantity(totalInitialStock)
                    .currentStockQuantity(currentStock)
                    .totalRevenue(BigDecimal.ZERO)
                    .potentialRevenueLoss(wasteValue)
                    .wasteValue(wasteValue)
                    .sellThroughRate(sellThroughRate)
                    .wasteRate(wasteRate)
                    .expiryRate(expiryRate)
                    .remainingRate(remainingRate)
                    .wasteIndex(wasteIndex)  // Now equals expiryRate
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

            // Add UTF-8 BOM for Excel compatibility
            baos.write(new byte[] { (byte) 0xEF, (byte) 0xBB, (byte) 0xBF });


            writer.println("Supplier ID,Supplier Name,Total Orders,Total GMV,Product Revenue,Shipping Fee,Platform Revenue,Commission Rate %,Supplier Earnings,Revenue Share %,Products,Stores");

            // Data
            List<RevenueBySupplierResponse> data = getRevenueBySupplier(startDate, endDate);
            for (RevenueBySupplierResponse item : data) {
                writer.printf("%s,%s,%d,%s,%s,%s,%s,%.2f,%s,%.2f,%d,%d%n",
                        item.getSupplierId(),
                        escapeCSV(item.getSupplierName()),
                        item.getTotalOrders(),
                        item.getTotalGMV(),  // Total GMV (what customer pays)
                        item.getTotalProductRevenue(),  // Product revenue only
                        item.getTotalShippingFee(),  // Shipping fees
                        item.getPlatformCommission(),  // Platform's actual revenue (commission + shipping)
                        item.getCommissionRate() * 100,  // Commission rate as percentage
                        item.getSupplierEarnings(),  // Supplier's gross earnings
                        item.getRevenuePercentage(),  // % of total supplier earnings
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

            // Add UTF-8 BOM for Excel compatibility
            baos.write(new byte[] { (byte) 0xEF, (byte) 0xBB, (byte) 0xBF });

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
    public byte[] exportWasteReportToCsv(LocalDateTime startDate, LocalDateTime endDate) {
        log.info("Exporting waste report to CSV - StartDate: {}, EndDate: {}", startDate, endDate);

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             PrintWriter writer = new PrintWriter(baos, true, StandardCharsets.UTF_8)) {

            // Add UTF-8 BOM for Excel compatibility
            baos.write(new byte[] { (byte) 0xEF, (byte) 0xBB, (byte) 0xBF });

            writer.println("Category,Total Products,Unsold Products,Expired,Near Expiry,Total Stock,Unsold Qty,Expired Qty,Waste Rate %,Expiry Rate %,Waste Index");

            List<WasteByCategoryResponse> data = getWasteByCategory(startDate, endDate);
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
                0L, // 0: totalProducts
                0L, // 1: activeProducts
                0L, // 2: soldOutProducts
                0L, // 3: expiredProducts
                0L, // 4: nearExpiryProducts
                0L, // 5: remainingStock (ACTIVE + INACTIVE)
                0L, // 6: expiredStock
                BigDecimal.ZERO, // 7: totalStockValue
                BigDecimal.ZERO, // 8: unsoldValue
                BigDecimal.ZERO // 9: wasteValue
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

    private Double toDouble(Object value) {
        if (value == null) return 0.0;
        if (value instanceof Double) return (Double) value;
        if (value instanceof Float) return ((Float) value).doubleValue();
        if (value instanceof BigDecimal) return ((BigDecimal) value).doubleValue();
        if (value instanceof Integer) return ((Integer) value).doubleValue();
        if (value instanceof Long) return ((Long) value).doubleValue();
        return 0.0;
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
        if (daysUntilExpiry == null || currentStock == null || initialStock == null) return "LOW";
        if (initialStock == 0) return "LOW"; // Avoid division by zero

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
