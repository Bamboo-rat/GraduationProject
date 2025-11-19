package com.example.backend.service.impl;

import com.example.backend.dto.response.SupplierDashboardStatsResponse;
import com.example.backend.dto.response.SupplierOrderStatusResponse;
import com.example.backend.dto.response.SupplierRevenueTimeSeriesResponse;
import com.example.backend.dto.response.SupplierTopProductResponse;
import com.example.backend.entity.Order;
import com.example.backend.entity.OrderDetail;
import com.example.backend.entity.Store;
import com.example.backend.entity.Supplier;
import com.example.backend.entity.enums.OrderStatus;
import com.example.backend.entity.enums.ProductStatus;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.repository.*;
import com.example.backend.service.SupplierDashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SupplierDashboardServiceImpl implements SupplierDashboardService {

    private final StoreRepository storeRepository;
    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final ProductRepository productRepository;
    private final StoreProductRepository storeProductRepository;
    private final ReviewRepository reviewRepository;
    private final SupplierRepository supplierRepository;

    private static final int LOW_STOCK_THRESHOLD = 10;
    private static final int EXPIRING_DAYS_THRESHOLD = 7;

    @Override
    @Transactional(readOnly = true)
    public SupplierDashboardStatsResponse getDashboardStats(String supplierId) {
        try {
            log.info("Getting dashboard stats for keycloakId: {}", supplierId);
            
            Supplier supplier = getSupplierByKeycloakId(supplierId);
            String supplierUserId = supplier.getUserId();

            log.info("Found supplier with userId: {}", supplierUserId);

            // Get all stores belonging to this supplier
            List<Store> stores = storeRepository.findBySupplierUserId(supplierUserId);
            log.info("Found {} stores for supplier", stores.size());
            
            List<String> storeIds = stores.stream()
                    .map(Store::getStoreId)
                    .collect(Collectors.toList());

            if (storeIds.isEmpty()) {
                log.warn("No stores found for supplier: {}, returning empty stats", supplierUserId);
                return buildEmptyStats();
            }

            // Date ranges
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime todayStart = LocalDate.now().atStartOfDay();
            LocalDateTime todayEnd = LocalDate.now().atTime(LocalTime.MAX);
            LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
            LocalDateTime monthEnd = now;

            // Get all orders for these stores
            List<Order> allOrders = storeIds.stream()
                    .flatMap(storeId -> orderRepository.findByStoreId(storeId).stream())
                    .collect(Collectors.toList());

            // Today's statistics
            List<Order> todayOrders = allOrders.stream()
                    .filter(o -> !o.getCreatedAt().isBefore(todayStart) && !o.getCreatedAt().isAfter(todayEnd))
                    .collect(Collectors.toList());

            Long todayOrdersCount = (long) todayOrders.size();
            BigDecimal todayRevenue = calculateRevenue(todayOrders, OrderStatus.DELIVERED);

            // Pending orders (all time)
            Long pendingOrders = allOrders.stream()
                    .filter(o -> o.getStatus() == OrderStatus.PENDING)
                    .count();

            // Overdue orders (pending > 2 hours)
            LocalDateTime twoHoursAgo = now.minusHours(2);
            Long overdueOrders = allOrders.stream()
                    .filter(o -> o.getStatus() == OrderStatus.PENDING)
                    .filter(o -> o.getCreatedAt().isBefore(twoHoursAgo))
                    .count();

            // Monthly statistics
            List<Order> monthlyOrders = allOrders.stream()
                    .filter(o -> !o.getCreatedAt().isBefore(monthStart) && !o.getCreatedAt().isAfter(monthEnd))
                    .collect(Collectors.toList());

            Long monthlyOrdersCount = (long) monthlyOrders.size();
            BigDecimal monthlyRevenue = calculateRevenue(monthlyOrders, OrderStatus.DELIVERED);

            // Product statistics
            Long totalProducts = productRepository.countBySupplierUserId(supplierUserId);
            Long activeProducts = productRepository.countBySupplierUserIdAndStatus(supplierUserId, ProductStatus.ACTIVE);

            log.info("Product stats - Total: {}, Active: {}", totalProducts, activeProducts);

            // Low stock products across all stores
            Long lowStockProducts = storeIds.stream()
                    .mapToLong(storeId -> storeProductRepository.countLowStockProductsByStore(storeId, LOW_STOCK_THRESHOLD))
                    .sum();

            log.info("Low stock products: {}", lowStockProducts);

            // Expiring products (within 7 days)
            LocalDate expiryThreshold = LocalDate.now().plusDays(EXPIRING_DAYS_THRESHOLD);
            Long expiringProducts = storeIds.stream()
                    .mapToLong(storeId -> storeProductRepository.countExpiringProductsByStore(storeId, expiryThreshold))
                    .sum();

            log.info("Expiring products: {}", expiringProducts);

            // Unreplied 1-star reviews
            Long unrepliedReviews = productRepository.findBySupplierUserId(supplierUserId).stream()
                    .mapToLong(product -> reviewRepository.countByProductProductIdAndRatingAndReplyIsNull(
                            product.getProductId(), 1))
                    .sum();

            log.info("Unreplied reviews: {}", unrepliedReviews);
            log.info("Dashboard stats calculation completed successfully");

            return SupplierDashboardStatsResponse.builder()
                    .todayRevenue(todayRevenue)
                    .todayOrders(todayOrdersCount)
                    .pendingOrders(pendingOrders)
                    .lowStockProducts(lowStockProducts)
                    .totalProducts(totalProducts)
                    .activeProducts(activeProducts)
                    .monthlyRevenue(monthlyRevenue)
                    .monthlyOrders(monthlyOrdersCount)
                    .unrepliedReviews(unrepliedReviews)
                    .expiringProducts(expiringProducts)
                    .overdueOrders(overdueOrders)
                    .build();
        } catch (Exception e) {
            log.error("Error getting dashboard stats for supplier: {}", supplierId, e);
            log.error("Exception type: {}", e.getClass().getName());
            log.error("Error message: {}", e.getMessage());
            throw e;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<SupplierRevenueTimeSeriesResponse> getRevenueOverTime(
            String supplierId, LocalDate startDate, LocalDate endDate) {
        Supplier supplier = getSupplierByKeycloakId(supplierId);
        String supplierUserId = supplier.getUserId();

        log.info("Getting revenue over time for supplier: {} from {} to {}", supplierUserId, startDate, endDate);

        // Get all stores belonging to this supplier
        List<Store> stores = storeRepository.findBySupplierUserId(supplierUserId);
        List<String> storeIds = stores.stream()
                .map(Store::getStoreId)
                .collect(Collectors.toList());

        if (storeIds.isEmpty()) {
            return new ArrayList<>();
        }

        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);

        // Get all delivered orders for these stores in the date range
        List<Order> orders = storeIds.stream()
                .flatMap(storeId -> orderRepository.findByStoreId(storeId).stream())
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                .filter(o -> o.getDeliveredAt() != null)
                .filter(o -> o.getDeliveredAt().isAfter(startDateTime) && o.getDeliveredAt().isBefore(endDateTime))
                .collect(Collectors.toList());

        // Group by date
        Map<LocalDate, List<Order>> ordersByDate = orders.stream()
                .collect(Collectors.groupingBy(o -> o.getDeliveredAt().toLocalDate()));

        // Create time series
        List<SupplierRevenueTimeSeriesResponse> timeSeries = new ArrayList<>();
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            List<Order> dayOrders = ordersByDate.getOrDefault(date, new ArrayList<>());
            BigDecimal dayRevenue = calculateRevenue(dayOrders, OrderStatus.DELIVERED);
            long dayOrderCount = dayOrders.size();
            BigDecimal avgOrderValue = dayOrderCount > 0
                    ? dayRevenue.divide(BigDecimal.valueOf(dayOrderCount), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            timeSeries.add(SupplierRevenueTimeSeriesResponse.builder()
                    .date(date)
                    .revenue(dayRevenue)
                    .orders(dayOrderCount)
                    .averageOrderValue(avgOrderValue)
                    .build());
        }

        return timeSeries;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SupplierTopProductResponse> getTopProducts(
            String supplierId, int limit, LocalDate startDate, LocalDate endDate) {
        Supplier supplier = getSupplierByKeycloakId(supplierId);
        String supplierUserId = supplier.getUserId();

        log.info("Getting top {} products for supplier: {}", limit, supplierUserId);

        // Get all stores belonging to this supplier
        List<Store> stores = storeRepository.findBySupplierUserId(supplierUserId);
        List<String> storeIds = stores.stream()
                .map(Store::getStoreId)
                .collect(Collectors.toList());

        log.info("Found {} stores for supplier: {}", stores.size(), supplierUserId);

        if (storeIds.isEmpty()) {
            log.warn("No stores found for supplier: {}", supplierUserId);
            return new ArrayList<>();
        }

        // Build date range filters
        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : LocalDateTime.of(2000, 1, 1, 0, 0);
        LocalDateTime endDateTime = endDate != null ? endDate.atTime(LocalTime.MAX) : LocalDateTime.now();

        log.info("Date range: {} to {}", startDateTime, endDateTime);

        // Get all delivered orders for these stores
        List<Order> allOrders = storeIds.stream()
                .flatMap(storeId -> orderRepository.findByStoreId(storeId).stream())
                .collect(Collectors.toList());

        log.info("Total orders for supplier's stores: {}", allOrders.size());

        List<Order> deliveredOrders = allOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                .collect(Collectors.toList());

        log.info("Delivered orders: {}", deliveredOrders.size());

        List<Order> orders = deliveredOrders.stream()
                .filter(o -> o.getDeliveredAt() != null)
                .filter(o -> !o.getDeliveredAt().isBefore(startDateTime) && !o.getDeliveredAt().isAfter(endDateTime))
                .collect(Collectors.toList());

        log.info("Delivered orders in date range: {}", orders.size());

        // Get all order details
        Map<String, ProductStats> productStatsMap = new HashMap<>();

        for (Order order : orders) {
            List<OrderDetail> details = orderDetailRepository.findByOrder(order);
            for (OrderDetail detail : details) {
                String productId = detail.getStoreProduct().getVariant().getProduct().getProductId();
                String productName = detail.getStoreProduct().getVariant().getProduct().getName();
                String categoryName = detail.getStoreProduct().getVariant().getProduct().getCategory().getName();
                String imageUrl = detail.getStoreProduct().getVariant().getProduct().getImages().isEmpty()
                        ? null
                        : detail.getStoreProduct().getVariant().getProduct().getImages().get(0).getImageUrl();

                ProductStats stats = productStatsMap.getOrDefault(productId, new ProductStats(
                        productId, productName, categoryName, imageUrl, 0L, BigDecimal.ZERO));

                stats.totalSold += detail.getQuantity();
                BigDecimal subtotal = detail.getAmount().multiply(BigDecimal.valueOf(detail.getQuantity()));
                stats.totalRevenue = stats.totalRevenue.add(subtotal);

                productStatsMap.put(productId, stats);
            }
        }

        // Sort by revenue and limit
        return productStatsMap.values().stream()
                .sorted((a, b) -> b.totalRevenue.compareTo(a.totalRevenue))
                .limit(limit)
                .map(stats -> SupplierTopProductResponse.builder()
                        .productId(stats.productId)
                        .productName(stats.productName)
                        .categoryName(stats.categoryName)
                        .totalSold(stats.totalSold)
                        .totalRevenue(stats.totalRevenue)
                        .imageUrl(stats.imageUrl)
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<SupplierOrderStatusResponse> getOrderStatusDistribution(String supplierId) {
        Supplier supplier = getSupplierByKeycloakId(supplierId);
        String supplierUserId = supplier.getUserId();

        log.info("Getting order status distribution for supplier: {}", supplierUserId);

        // Get all stores belonging to this supplier
        List<Store> stores = storeRepository.findBySupplierUserId(supplierUserId);
        List<String> storeIds = stores.stream()
                .map(Store::getStoreId)
                .collect(Collectors.toList());

        if (storeIds.isEmpty()) {
            return new ArrayList<>();
        }

        // Get all orders for these stores
        List<Order> orders = storeIds.stream()
                .flatMap(storeId -> orderRepository.findByStoreId(storeId).stream())
                .collect(Collectors.toList());

        // Count by status
        Map<OrderStatus, Long> statusCounts = orders.stream()
                .collect(Collectors.groupingBy(Order::getStatus, Collectors.counting()));

        // Define colors for each status
        Map<OrderStatus, String> statusColors = Map.of(
                OrderStatus.PENDING, "#FFA500",
                OrderStatus.CONFIRMED, "#3B82F6",
                OrderStatus.PREPARING, "#8B5CF6",
                OrderStatus.SHIPPING, "#10B981",
                OrderStatus.DELIVERED, "#059669",
                OrderStatus.CANCELED, "#EF4444"
        );

        // Define Vietnamese names
        Map<OrderStatus, String> statusNames = Map.of(
                OrderStatus.PENDING, "Chờ xác nhận",
                OrderStatus.CONFIRMED, "Đã xác nhận",
                OrderStatus.PREPARING, "Đang chuẩn bị",
                OrderStatus.SHIPPING, "Đang giao",
                OrderStatus.DELIVERED, "Đã giao",
                OrderStatus.CANCELED, "Đã hủy"
        );

        return statusCounts.entrySet().stream()
                .map(entry -> SupplierOrderStatusResponse.builder()
                        .status(entry.getKey())
                        .name(statusNames.getOrDefault(entry.getKey(), entry.getKey().name()))
                        .count(entry.getValue())
                        .color(statusColors.getOrDefault(entry.getKey(), "#6B7280"))
                        .build())
                .collect(Collectors.toList());
    }

    // Helper methods

    private BigDecimal calculateRevenue(List<Order> orders, OrderStatus requiredStatus) {
        return orders.stream()
                .filter(o -> o.getStatus() == requiredStatus)
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private SupplierDashboardStatsResponse buildEmptyStats() {
        return SupplierDashboardStatsResponse.builder()
                .todayRevenue(BigDecimal.ZERO)
                .todayOrders(0L)
                .pendingOrders(0L)
                .lowStockProducts(0L)
                .totalProducts(0L)
                .activeProducts(0L)
                .monthlyRevenue(BigDecimal.ZERO)
                .monthlyOrders(0L)
                .unrepliedReviews(0L)
                .expiringProducts(0L)
                .overdueOrders(0L)
                .build();
    }

    private Supplier getSupplierByKeycloakId(String keycloakId) {
        return supplierRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND,
                        "Supplier not found for keycloak ID: " + keycloakId));
    }

    // Inner class to hold product statistics
    private static class ProductStats {
        String productId;
        String productName;
        String categoryName;
        String imageUrl;
        Long totalSold;
        BigDecimal totalRevenue;

        ProductStats(String productId, String productName, String categoryName,
                    String imageUrl, Long totalSold, BigDecimal totalRevenue) {
            this.productId = productId;
            this.productName = productName;
            this.categoryName = categoryName;
            this.imageUrl = imageUrl;
            this.totalSold = totalSold;
            this.totalRevenue = totalRevenue;
        }
    }
}
