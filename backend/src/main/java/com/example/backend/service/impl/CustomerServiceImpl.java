package com.example.backend.service.impl;

import com.example.backend.dto.request.CustomerUpdateRequest;
import com.example.backend.dto.request.PhoneAuthStep1Request;
import com.example.backend.dto.request.PhoneAuthStep2Request;
import com.example.backend.dto.response.*;
import com.example.backend.entity.*;
import com.example.backend.entity.enums.*;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.BadRequestException;
import com.example.backend.exception.custom.ConflictException;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.mapper.CustomerMapper;
import com.example.backend.repository.*;
import com.example.backend.service.AuthService;
import com.example.backend.service.CustomerService;
import com.example.backend.service.KeycloakService;
import com.example.backend.service.OtpService;
import com.example.backend.utils.CustomerTierUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of CustomerService
 * Handles 2-step customer registration via mobile app with SMS OTP
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {
    private final AuthService authService;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final KeycloakService keycloakService;
    private final OtpService otpService;
    private final CustomerMapper customerMapper;

    // Additional repositories for customer detail
    private final OrderRepository orderRepository;
    private final AddressRepository addressRepository;
    private final ReviewRepository reviewRepository;
    private final PointTransactionRepository pointTransactionRepository;
    private final PromotionUsageRepository promotionUsageRepository;
    private final CustomerDisciplinaryRecordRepository disciplinaryRecordRepository;
    private final FavoriteStoreRepository favoriteStoreRepository;
    private final OrderCancelRequestRepository orderCancelRequestRepository;

    @Override
    @Transactional
    public PhoneAuthStep1Response phoneAuthStep1(PhoneAuthStep1Request request) {
        String phoneNumber = request.getPhoneNumber();
        log.info("Phone Auth Step 1: Processing phone number: {}", phoneNumber);

        // Check if customer exists
        boolean isExistingCustomer = userRepository.existsByPhoneNumber(phoneNumber);
        String accountStatus;
        String generatedFullName = null;

        if (!isExistingCustomer) {
            // Auto-create new customer account (only in DB, Keycloak user created after OTP verification)
            log.info("Phone number not found, will create customer account after OTP verification");

            // Generate random username: user_xxxxxxxx
            String randomUsername = "user_" + UUID.randomUUID().toString().substring(0, 8);
            while (userRepository.existsByUsername(randomUsername)) {
                randomUsername = "user_" + UUID.randomUUID().toString().substring(0, 8);
            }

            // Generate random full name
            generatedFullName = com.example.backend.utils.ValidationUtils.generateRandomFullName();

            // Create customer with PENDING_VERIFICATION status (no keycloakId yet)
            Customer customer = new Customer();
            customer.setUsername(randomUsername);
            customer.setPhoneNumber(phoneNumber);
            customer.setFullName(generatedFullName);
            customer.setStatus(CustomerStatus.PENDING_VERIFICATION);
            customer.setActive(false);
            customer.setAvatarUrl("https://res.cloudinary.com/dk7coitah/image/upload/v1760668372/avatar_cflwdp.jpg");

            customerRepository.save(customer);
            log.info("New customer created in DB: userId={}, username={}, fullName={} (Keycloak user will be created after OTP)",
                    customer.getUserId(), customer.getUsername(), generatedFullName);
            accountStatus = "NEW";
        } else {
            log.info("Existing customer found for phone: {}", phoneNumber);
            accountStatus = "EXISTING";
        }

        // Send OTP (both new and existing customers)
        try {
            otpService.sendOtp(phoneNumber);
            log.info("OTP sent successfully to: {}", phoneNumber);
        } catch (Exception e) {
            log.error("Failed to send OTP to: {}", phoneNumber, e);
            throw new BadRequestException(ErrorCode.SMS_SEND_FAILED);
        }

        return PhoneAuthStep1Response.builder()
                .phoneNumber(phoneNumber)
                .accountStatus(accountStatus)
                .message("Mã OTP đã được gửi đến số điện thoại của bạn")
                .expirySeconds(300) // 5 minutes
                .fullName(generatedFullName) // Only set for NEW accounts
                .build();
    }
    
    @Override
    @Transactional
    public LoginResponse phoneAuthStep2(PhoneAuthStep2Request request) {
        String phoneNumber = request.getPhoneNumber();
        String otp = request.getOtp();
        log.info("Phone Auth Step 2: Processing login/registration for phone: {}", phoneNumber);
        LoginResponse loginResponse = authService.verifyCustomerLoginOtp(phoneNumber, otp);

        log.info("Phone authentication completed successfully for phone: {}", phoneNumber);

        return loginResponse;
    }

    @Override
    public CustomerResponse getCustomerInfo(String userId) {
        log.info("Getting customer info by userId: {}", userId);

        Customer customer = customerRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        return customerMapper.toResponse(customer);
    }

    @Override
    public CustomerResponse getCustomerById(String userId) {
        log.info("Getting customer by userId: {}", userId);
        
        Customer customer = customerRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));
        
        return customerMapper.toResponse(customer);
    }

    @Override
    @Transactional
    public CustomerResponse updateProfile(String userId, CustomerUpdateRequest request) {
        log.info("Updating customer profile for userId: {}", userId);

        Customer customer = customerRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        // Update customer fields (null-safe)
        if (request.getFullName() != null) {
            customer.setFullName(request.getFullName());
        }
        if (request.getEmail() != null) {
            // Check if email is already used by another user
            if (userRepository.existsByEmail(request.getEmail()) &&
                !request.getEmail().equals(customer.getEmail())) {
                throw new ConflictException(ErrorCode.EMAIL_ALREADY_EXISTS);
            }
            customer.setEmail(request.getEmail());
        }
        if (request.getDateOfBirth() != null) {
            customer.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getAvatarUrl() != null) {
            customer.setAvatarUrl(request.getAvatarUrl());
        }

        customer = customerRepository.save(customer);

        log.info("Customer profile updated successfully for userId: {}", customer.getUserId());
        return customerMapper.toResponse(customer);
    }

    @Override
    @Transactional
    public CustomerResponse setActive(String userId, boolean active) {
        log.info("Setting customer active status: userId={}, active={}", userId, active);

        Customer customer = customerRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        CustomerStatus currentStatus = customer.getStatus();
        customer.setActive(active);

        // Sync status with active flag, respecting status hierarchy
        if (active) {
            // When enabling, only allow activation for non-permanent states
            // NEVER automatically reactivate BANNED customers
            if (currentStatus == CustomerStatus.BANNED) {
                log.warn("Cannot auto-activate BANNED customer {}. Requires explicit unban.", userId);
                // Keep as BANNED, but set active=true for consistency
                // Admin must explicitly unban to change status
            } else if (currentStatus == CustomerStatus.PENDING_VERIFICATION) {
                // Keep as PENDING_VERIFICATION until they complete verification
                log.info("Keeping customer {} in PENDING_VERIFICATION status", userId);
            } else if (currentStatus == CustomerStatus.RESTRICTED) {
                // Keep as RESTRICTED - this is a special limited state
                // Requires explicit action to remove restriction
                log.info("Keeping customer {} in RESTRICTED status", userId);
            } else {
                // SUSPENDED, INACTIVE, ACTIVE → set to ACTIVE
                customer.setStatus(CustomerStatus.ACTIVE);
            }
        } else {
            // When disabling, respect severity hierarchy
            // NEVER downgrade a more severe status to a less severe one
            if (currentStatus == CustomerStatus.BANNED) {
                // BANNED is permanent - don't downgrade to SUSPENDED
                log.warn("Customer {} is BANNED - not downgrading to SUSPENDED", userId);
                // Keep as BANNED
            } else if (currentStatus == CustomerStatus.SUSPENDED) {
                // Already suspended - no change needed
                log.info("Customer {} is already SUSPENDED", userId);
            } else if (currentStatus == CustomerStatus.RESTRICTED) {
                // RESTRICTED is a special state - don't change to SUSPENDED
                // unless explicitly required by business logic
                log.info("Customer {} is RESTRICTED - not changing to SUSPENDED", userId);
                // Keep as RESTRICTED
            } else {
                // ACTIVE, INACTIVE, PENDING_VERIFICATION → set to SUSPENDED
                customer.setStatus(CustomerStatus.SUSPENDED);
            }
        }

        customer = customerRepository.save(customer);

        log.info("Customer active status updated: userId={}, active={}, previousStatus={}, newStatus={}",
                userId, active, currentStatus, customer.getStatus());
        return customerMapper.toResponse(customer);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CustomerResponse> getAllCustomers(
            int page,
            int size,
            CustomerStatus status,
            CustomerTier tier,
            String search,
            String sortBy,
            String sortDirection
    ) {
        log.info("Getting customers: page={}, size={}, status={}, tier={}, search={}",
                 page, size, status, tier, search);

        // Validate and set default sort
        if (sortBy == null || sortBy.isBlank()) {
            sortBy = "createdAt";
        }
        if (sortDirection == null || sortDirection.isBlank()) {
            sortDirection = "DESC";
        }

        // Create pageable
        Sort.Direction direction =
                sortDirection.equalsIgnoreCase("ASC") ?
                        Sort.Direction.ASC :
                        Sort.Direction.DESC;

        Pageable pageable =
                PageRequest.of(page, size,
                        Sort.by(direction, sortBy));

        // Query with search and filter
        Page<Customer> customersPage =
                customerRepository.findByStatusAndTierAndSearch(status, tier, search, pageable);

        // Map to response
        return customersPage.map(customerMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getCustomerStats() {
        log.info("Getting customer statistics");

        long totalCustomers = customerRepository.count();
        long activeCustomers = customerRepository.countByStatus(CustomerStatus.ACTIVE);
        long pendingCustomers = customerRepository.countByStatus(CustomerStatus.PENDING_VERIFICATION);
        long suspendedCustomers = customerRepository.countByStatus(CustomerStatus.SUSPENDED);

        long bronzeCustomers = customerRepository.countByTier(CustomerTier.BRONZE);
        long silverCustomers = customerRepository.countByTier(CustomerTier.SILVER);
        long goldCustomers = customerRepository.countByTier(CustomerTier.GOLD);
        long platinumCustomers = customerRepository.countByTier(CustomerTier.PLATINUM);

        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("totalCustomers", totalCustomers);
        stats.put("activeCustomers", activeCustomers);
        stats.put("pendingCustomers", pendingCustomers);
        stats.put("suspendedCustomers", suspendedCustomers);
        stats.put("bronzeCustomers", bronzeCustomers);
        stats.put("silverCustomers", silverCustomers);
        stats.put("goldCustomers", goldCustomers);
        stats.put("platinumCustomers", platinumCustomers);

        return stats;
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerDetailResponse getCustomerDetailForAdmin(String userId) {
        log.info("Getting comprehensive customer details for admin: userId={}", userId);

        Customer customer = customerRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        // Build all sections
        CustomerDetailResponse.BasicInfo basicInfo = buildBasicInfo(customer);
        CustomerDetailResponse.ActivityHistory activityHistory = buildActivityHistory(customer);
        CustomerDetailResponse.ViolationsDiscipline violationsDiscipline = buildViolationsDiscipline(customer);
        CustomerDetailResponse.BehavioralStatistics behavioralStatistics = buildBehavioralStatistics(customer);
        CustomerDetailResponse.EvaluationRecommendation evaluationRecommendation =
                buildEvaluationRecommendation(customer, behavioralStatistics, violationsDiscipline);

        return CustomerDetailResponse.builder()
                .basicInfo(basicInfo)
                .activityHistory(activityHistory)
                .violationsDiscipline(violationsDiscipline)
                .behavioralStatistics(behavioralStatistics)
                .evaluationRecommendation(evaluationRecommendation)
                .build();
    }

    // ==================== HELPER METHODS ====================

    private CustomerDetailResponse.BasicInfo buildBasicInfo(Customer customer) {
        // Calculate points to next tier
        int pointsToNextTier = CustomerTierUtils.getPointsRequiredForNextTier(
                customer.getTier(),
                customer.getPointsThisYear()
        );

        return CustomerDetailResponse.BasicInfo.builder()
                .userId(customer.getUserId())
                .keycloakId(customer.getKeycloakId())
                .username(customer.getUsername())
                .email(customer.getEmail())
                .phoneNumber(customer.getPhoneNumber())
                .fullName(customer.getFullName())
                .dateOfBirth(customer.getDateOfBirth())
                .avatarUrl(customer.getAvatarUrl())
                .status(customer.getStatus().toString())
                .active(customer.isActive())
                .createdAt(customer.getCreatedAt())
                .updatedAt(customer.getUpdatedAt())
                .lastLoginAt(customer.getCreatedAt()) // Use createdAt as fallback until lastLoginAt is added
                .tier(customer.getTier().toString())
                .tierUpdatedAt(customer.getTierUpdatedAt())
                .currentPoints(customer.getPoints())
                .lifetimePoints(customer.getLifetimePoints())
                .pointsThisYear(customer.getPointsThisYear())
                .pointsToNextTier(pointsToNextTier)
                .build();
    }

    private CustomerDetailResponse.ActivityHistory buildActivityHistory(Customer customer) {
        // Fetch recent orders (last 20)
        List<Order> recentOrders = orderRepository.findTop20ByCustomerOrderByCreatedAtDesc(customer);
        List<CustomerDetailResponse.OrderSummary> orderSummaries = recentOrders.stream()
                .map(this::mapToOrderSummary)
                .collect(Collectors.toList());

        // Fetch recent point transactions (last 20)
        List<PointTransaction> recentPoints = pointTransactionRepository
                .findTop20ByCustomerOrderByCreatedAtDesc(customer);
        List<CustomerDetailResponse.PointTransaction> pointSummaries = recentPoints.stream()
                .map(this::mapToPointTransaction)
                .collect(Collectors.toList());

        // Fetch all addresses
        List<Address> addresses = addressRepository.findByCustomer(customer);
        List<CustomerDetailResponse.AddressSummary> addressSummaries = addresses.stream()
                .map(this::mapToAddressSummary)
                .collect(Collectors.toList());

        // Fetch recent reviews (last 20)
        List<Review> recentReviews = reviewRepository.findTop20ByCustomerOrderByCreatedAtDesc(customer);
        List<CustomerDetailResponse.ReviewSummary> reviewSummaries = recentReviews.stream()
                .map(this::mapToReviewSummary)
                .collect(Collectors.toList());

        // Fetch recent promotion usage (last 20)
        List<PromotionUsage> recentPromotions = promotionUsageRepository
                .findTop20ByCustomerOrderByUsedAtDesc(customer);
        List<CustomerDetailResponse.PromotionUsageSummary> promotionSummaries = recentPromotions.stream()
                .map(this::mapToPromotionUsage)
                .collect(Collectors.toList());

        return CustomerDetailResponse.ActivityHistory.builder()
                .recentOrders(orderSummaries)
                .recentPointTransactions(pointSummaries)
                .addresses(addressSummaries)
                .recentReviews(reviewSummaries)
                .recentPromotionUsage(promotionSummaries)
                .build();
    }

    private CustomerDetailResponse.ViolationsDiscipline buildViolationsDiscipline(Customer customer) {
        // Fetch all disciplinary records
        List<CustomerDisciplinaryRecord> allRecords = disciplinaryRecordRepository
                .findByCustomerOrderByCreatedAtDesc(customer);

        List<CustomerDetailResponse.ViolationRecord> violationHistory = allRecords.stream()
                .map(this::mapToViolationRecord)
                .collect(Collectors.toList());

        // Filter active warnings (unresolved)
        List<CustomerDetailResponse.ViolationRecord> activeWarnings = violationHistory.stream()
                .filter(v -> !v.isResolved())
                .collect(Collectors.toList());

        // Filter suspension history
        List<CustomerDetailResponse.ViolationRecord> suspensionHistory = violationHistory.stream()
                .filter(v -> v.getActionTaken() != null &&
                        v.getActionTaken().contains("SUSPENSION"))
                .collect(Collectors.toList());

        // Calculate violation points
        int violationPoints = allRecords.stream()
                .filter(r -> !r.isResolved())
                .mapToInt(r -> calculateViolationPoints(r.getViolationType(), r.getSeverity()))
                .sum();

        // Check if currently suspended
        boolean isCurrentlySuspended = customer.getStatus() == CustomerStatus.SUSPENDED;
        LocalDateTime currentSuspensionEndsAt = null;

        if (isCurrentlySuspended) {
            // Find most recent active suspension
            Optional<CustomerDisciplinaryRecord> activeSuspension = allRecords.stream()
                    .filter(r -> r.getSuspendedUntil() != null &&
                            r.getSuspendedUntil().isAfter(LocalDateTime.now()))
                    .findFirst();
            currentSuspensionEndsAt = activeSuspension.map(CustomerDisciplinaryRecord::getSuspendedUntil)
                    .orElse(null);
        }

        return CustomerDetailResponse.ViolationsDiscipline.builder()
                .violationHistory(violationHistory)
                .activeWarnings(activeWarnings)
                .suspensionHistory(suspensionHistory)
                .totalViolations(allRecords.size())
                .activeWarningsCount(activeWarnings.size())
                .totalSuspensions(suspensionHistory.size())
                .violationPoints(violationPoints)
                .isCurrentlySuspended(isCurrentlySuspended)
                .currentSuspensionEndsAt(currentSuspensionEndsAt)
                .build();
    }

    private CustomerDetailResponse.BehavioralStatistics buildBehavioralStatistics(Customer customer) {
        // Fetch all orders
        List<Order> allOrders = orderRepository.findByCustomer(customer);

        int totalOrders = allOrders.size();
        int completedOrders = (int) allOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                .count();
        int canceledOrders = (int) allOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.CANCELED)
                .count();
        int returnedOrders = (int) allOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.RETURNED)
                .count();

        List<BigDecimal> deliveredOrderAmounts = allOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                .map(Order::getTotalAmount)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        BigDecimal totalOrderValue = deliveredOrderAmounts.stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal averageOrderValue = !deliveredOrderAmounts.isEmpty()
                ? totalOrderValue.divide(BigDecimal.valueOf(deliveredOrderAmounts.size()), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Calculate rates
        double cancellationRate = totalOrders > 0
                ? (canceledOrders * 100.0) / totalOrders
                : 0.0;
        double returnRate = totalOrders > 0
                ? (returnedOrders * 100.0) / totalOrders
                : 0.0;

        // Calculate days since first/last order
        int daysSinceFirstOrder = 0;
        int daysSinceLastOrder = 999999;
        if (!allOrders.isEmpty()) {
            LocalDateTime firstOrderDate = allOrders.stream()
                    .map(Order::getCreatedAt)
                    .min(LocalDateTime::compareTo)
                    .orElse(LocalDateTime.now());
            daysSinceFirstOrder = (int) ChronoUnit.DAYS.between(firstOrderDate, LocalDateTime.now());

            LocalDateTime lastOrderDate = allOrders.stream()
                    .map(Order::getCreatedAt)
                    .max(LocalDateTime::compareTo)
                    .orElse(LocalDateTime.now());
            daysSinceLastOrder = (int) ChronoUnit.DAYS.between(lastOrderDate, LocalDateTime.now());
        }

        // Purchase frequency (orders per month)
        double purchaseFrequency = daysSinceFirstOrder > 0
                ? (totalOrders * 30.0) / daysSinceFirstOrder
                : 0.0;

        // Review statistics
        List<Review> allReviews = reviewRepository.findByCustomer(customer);
        int totalReviews = allReviews.size();
        double averageRatingGiven = allReviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);
        int reportedReviews = (int) allReviews.stream()
                .filter(Review::isMarkedAsSpam)
                .count();

        // Favorite stores (top 5 by order count)
        List<CustomerDetailResponse.FavoriteStoreSummary> topFavoriteStores =
                buildTopFavoriteStores(customer, allOrders);

        // Monthly activity
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime thisMonthStart = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime lastMonthStart = thisMonthStart.minusMonths(1);

        int ordersThisMonth = (int) allOrders.stream()
                .filter(o -> o.getCreatedAt().isAfter(thisMonthStart))
                .count();
        BigDecimal spendingThisMonth = allOrders.stream()
                .filter(o -> o.getCreatedAt().isAfter(thisMonthStart) &&
                        o.getStatus() == OrderStatus.DELIVERED)
                .map(Order::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int ordersLastMonth = (int) allOrders.stream()
                .filter(o -> o.getCreatedAt().isAfter(lastMonthStart) &&
                        o.getCreatedAt().isBefore(thisMonthStart))
                .count();
        BigDecimal spendingLastMonth = allOrders.stream()
                .filter(o -> o.getCreatedAt().isAfter(lastMonthStart) &&
                        o.getCreatedAt().isBefore(thisMonthStart) &&
                        o.getStatus() == OrderStatus.DELIVERED)
                .map(Order::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Risk indicators
        boolean hasHighCancellationRate = cancellationRate > 30.0;
        boolean hasHighReturnRate = returnRate > 20.0;
        boolean hasReportedReviews = reportedReviews > 0;
        boolean hasActiveViolations = disciplinaryRecordRepository
                .countByCustomerAndIsResolved(customer, false) > 0;

        // Calculate risk score (0-100)
        int riskScore = calculateRiskScore(
                cancellationRate,
                returnRate,
                reportedReviews,
                hasActiveViolations,
                daysSinceLastOrder
        );

        return CustomerDetailResponse.BehavioralStatistics.builder()
                .totalOrders(totalOrders)
                .completedOrders(completedOrders)
                .canceledOrders(canceledOrders)
                .returnedOrders(returnedOrders)
                .totalOrderValue(totalOrderValue)
                .averageOrderValue(averageOrderValue)
                .purchaseFrequency(purchaseFrequency)
                .cancellationRate(cancellationRate)
                .returnRate(returnRate)
                .daysSinceLastOrder(daysSinceLastOrder)
                .daysSinceFirstOrder(daysSinceFirstOrder)
                .averageRatingGiven(averageRatingGiven)
                .totalReviews(totalReviews)
                .reportedReviews(reportedReviews)
                .topFavoriteStores(topFavoriteStores)
                .ordersThisMonth(ordersThisMonth)
                .spendingThisMonth(spendingThisMonth)
                .ordersLastMonth(ordersLastMonth)
                .spendingLastMonth(spendingLastMonth)
                .hasHighCancellationRate(hasHighCancellationRate)
                .hasHighReturnRate(hasHighReturnRate)
                .hasReportedReviews(hasReportedReviews)
                .hasActiveViolations(hasActiveViolations)
                .riskScore(riskScore)
                .build();
    }

    private CustomerDetailResponse.EvaluationRecommendation buildEvaluationRecommendation(
            Customer customer,
            CustomerDetailResponse.BehavioralStatistics stats,
            CustomerDetailResponse.ViolationsDiscipline violations) {

        List<String> riskFactors = new ArrayList<>();
        List<String> positiveFactors = new ArrayList<>();
        int confidenceScore = 0;
        String recommendation = "ALLOW";

        // Analyze risk factors
        if (stats.isHasHighCancellationRate()) {
            riskFactors.add(String.format("Tỷ lệ hủy đơn cao: %.1f%% (ngưỡng: 30%%)", stats.getCancellationRate()));
        }
        if (stats.isHasHighReturnRate()) {
            riskFactors.add(String.format("Tỷ lệ trả hàng cao: %.1f%% (ngưỡng: 20%%)", stats.getReturnRate()));
        }
        if (stats.isHasReportedReviews()) {
            riskFactors.add(String.format("Có %d đánh giá bị báo cáo", stats.getReportedReviews()));
        }
        if (stats.isHasActiveViolations()) {
            riskFactors.add(String.format("Có %d cảnh báo chưa giải quyết", violations.getActiveWarningsCount()));
        }
        if (violations.getViolationPoints() > 50) {
            riskFactors.add(String.format("Điểm vi phạm cao: %d/100", violations.getViolationPoints()));
        }
        if (stats.getDaysSinceLastOrder() > 180) {
            riskFactors.add("Không có hoạt động trong 6 tháng qua");
        }

        // Analyze positive factors
        if (stats.getTotalOrders() > 50) {
            positiveFactors.add(String.format("Khách hàng trung thành với %d đơn hàng", stats.getTotalOrders()));
        }
        if (stats.getTotalOrderValue().compareTo(BigDecimal.valueOf(10000000)) > 0) {
            positiveFactors.add(String.format("Tổng giá trị đơn hàng: %,.0f VNĐ", stats.getTotalOrderValue()));
        }
        if (stats.getAverageRatingGiven() >= 4.0) {
            positiveFactors.add(String.format("Đánh giá tích cực (TB: %.1f sao)", stats.getAverageRatingGiven()));
        }
        if (violations.getTotalViolations() == 0) {
            positiveFactors.add("Không có lịch sử vi phạm");
        }
        if (customer.getTier() == CustomerTier.PLATINUM || customer.getTier() == CustomerTier.DIAMOND) {
            positiveFactors.add(String.format("Khách hàng VIP: %s", customer.getTier()));
        }

        // Determine recommendation
        int riskFactorCount = riskFactors.size();
        int positiveFactorCount = positiveFactors.size();

        if (stats.getRiskScore() >= 70 || violations.getViolationPoints() >= 80) {
            recommendation = "BAN";
            confidenceScore = 85 + Math.min(15, riskFactorCount * 3);
        } else if (stats.getRiskScore() >= 50 || violations.getViolationPoints() >= 50) {
            recommendation = "SUSPEND";
            confidenceScore = 70 + Math.min(20, riskFactorCount * 4);
        } else if (stats.getRiskScore() >= 30 || violations.getActiveWarningsCount() > 0) {
            recommendation = "WARN";
            confidenceScore = 60 + Math.min(25, riskFactorCount * 5);
        } else {
            recommendation = "ALLOW";
            confidenceScore = 50 + Math.min(40, positiveFactorCount * 8);
        }

        // Build reason
        String reason = buildRecommendationReason(recommendation, riskFactorCount, positiveFactorCount, stats);

        return CustomerDetailResponse.EvaluationRecommendation.builder()
                .recommendation(recommendation)
                .reason(reason)
                .confidenceScore(Math.min(100, confidenceScore))
                .riskFactors(riskFactors)
                .positiveFactors(positiveFactors)
                .build();
    }

    // ==================== MAPPING METHODS ====================

    private CustomerDetailResponse.OrderSummary mapToOrderSummary(Order order) {
        // Get cancel reason if order was canceled
        String cancelReason = null;
        if (order.getStatus() == OrderStatus.CANCELED) {
            // Try to find cancel request for this order
            Optional<OrderCancelRequest> cancelRequest = orderCancelRequestRepository.findByOrder(order);
            if (cancelRequest.isPresent()) {
                cancelReason = cancelRequest.get().getReason();
            }
        }

        return CustomerDetailResponse.OrderSummary.builder()
                .orderId(order.getOrderId())
                .orderCode(order.getOrderCode())
                .storeName(order.getStore() != null ? order.getStore().getStoreName() : "Unknown")
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus().toString())
                .createdAt(order.getCreatedAt())
                .deliveredAt(order.getDeliveredAt())
                .wasCanceled(order.getStatus() == OrderStatus.CANCELED)
                .cancelReason(cancelReason)
                .build();
    }

    private CustomerDetailResponse.PointTransaction mapToPointTransaction(PointTransaction pt) {
        // Try to extract order code from reason if it contains order reference
        String relatedOrderCode = null;
        String reason = pt.getReason();
        if (reason != null) {
            // Check if reason contains order code pattern (e.g., "Đặt hàng ORD-XXX thành công")
            if (reason.contains("ORD-")) {
                int startIdx = reason.indexOf("ORD-");
                int endIdx = reason.indexOf(" ", startIdx);
                if (endIdx == -1) endIdx = reason.length();
                relatedOrderCode = reason.substring(startIdx, endIdx);
            }
        }

        return CustomerDetailResponse.PointTransaction.builder()
                .transactionId(pt.getTransactionId())
                .type(pt.getTransactionType().toString())
                .points(pt.getPointsChange())
                .description(pt.getReason())
                .relatedOrderCode(relatedOrderCode)
                .createdAt(pt.getCreatedAt())
                .build();
    }

    private CustomerDetailResponse.AddressSummary mapToAddressSummary(Address address) {
        // Count orders using this address by searching for street name in shipping address
        // Use street as the search term since it's most unique part of the address
        int orderCount = (int) orderRepository.countByShippingAddressContaining(address.getStreet());

        return CustomerDetailResponse.AddressSummary.builder()
                .addressId(address.getAddressId())
                .fullName(address.getFullName())
                .phoneNumber(address.getPhoneNumber())
                .fullAddress(String.format("%s, %s, %s, %s",
                        address.getStreet(),
                        address.getWard(),
                        address.getDistrict(),
                        address.getProvince()))
                .isDefault(address.isDefault())
                .orderCount(orderCount)
                .build();
    }

    private CustomerDetailResponse.ReviewSummary mapToReviewSummary(Review review) {
        return CustomerDetailResponse.ReviewSummary.builder()
                .reviewId(review.getReviewId())
                .productName(review.getProduct() != null ? review.getProduct().getName() : "Unknown")
                .storeName(review.getStore() != null ? review.getStore().getStoreName() : "Unknown")
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .hasBeenReported(review.isMarkedAsSpam())
                .build();
    }

    private CustomerDetailResponse.PromotionUsageSummary mapToPromotionUsage(PromotionUsage usage) {
        return CustomerDetailResponse.PromotionUsageSummary.builder()
                .promotionCode(usage.getPromotion() != null ? usage.getPromotion().getCode() : "Unknown")
                .promotionTitle(usage.getPromotion() != null ? usage.getPromotion().getTitle() : "Unknown")
                .discountAmount(usage.getDiscountAmount())
                .orderCode(usage.getOrder() != null ? usage.getOrder().getOrderCode() : null)
                .usedAt(usage.getUsedAt())
                .build();
    }

    private CustomerDetailResponse.ViolationRecord mapToViolationRecord(CustomerDisciplinaryRecord record) {
        return CustomerDetailResponse.ViolationRecord.builder()
                .recordId(record.getRecordId())
                .violationType(record.getViolationType() != null ? record.getViolationType().toString() : null)
                .severity(record.getSeverity() != null ? record.getSeverity().toString() : null)
                .description(record.getDescription())
                .actionTaken(record.getActionTaken() != null ? record.getActionTaken().toString() : null)
                .suspensionDurationDays(record.getSuspensionDurationDays())
                .suspendedUntil(record.getSuspendedUntil())
                .reinstatedAt(record.getReinstatedAt())
                .isResolved(record.isResolved())
                .referenceId(record.getReferenceId())
                .referenceType(record.getReferenceType())
                .createdAt(record.getCreatedAt())
                .reviewedByAdmin(record.getReviewedByAdmin() != null ? record.getReviewedByAdmin().getUserId() : null)
                .adminNotes(record.getAdminNotes())
                .build();
    }

    // ==================== CALCULATION METHODS ====================

    private List<CustomerDetailResponse.FavoriteStoreSummary> buildTopFavoriteStores(
            Customer customer, List<Order> orders) {

        Map<Store, List<Order>> ordersByStore = orders.stream()
                .filter(o -> o.getStore() != null)
                .collect(Collectors.groupingBy(Order::getStore));

        return ordersByStore.entrySet().stream()
                .map(entry -> {
                    Store store = entry.getKey();
                    List<Order> storeOrders = entry.getValue();

                    int orderCount = storeOrders.size();
                    BigDecimal totalSpent = storeOrders.stream()
                            .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                            .map(Order::getTotalAmount)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    LocalDateTime lastOrderDate = storeOrders.stream()
                            .map(Order::getCreatedAt)
                            .max(LocalDateTime::compareTo)
                            .orElse(null);

                    return CustomerDetailResponse.FavoriteStoreSummary.builder()
                            .storeId(store.getStoreId())
                            .storeName(store.getStoreName())
                            .orderCount(orderCount)
                            .totalSpent(totalSpent)
                            .lastOrderDate(lastOrderDate)
                            .build();
                })
                .sorted(Comparator.comparingInt(CustomerDetailResponse.FavoriteStoreSummary::getOrderCount).reversed())
                .limit(5)
                .collect(Collectors.toList());
    }

    private int calculateViolationPoints(ViolationType type, com.example.backend.entity.enums.ViolationSeverity severity) {
        if (type == null || severity == null) {
            return 0;
        }

        int basePoints = switch (type) {
            case ORDER_CANCELLATION -> 10;
            case SPAM_REVIEW -> 20;
            case HARASSMENT -> 25;
            case FRAUDULENT_ACTIVITY -> 30;
            case POLICY_VIOLATION -> 15;
            case SPAM_COMMENT -> 10;
            case BANNED_KEYWORD -> 15;
            case COMMUNITY_REPORT -> 20;
            default -> 5;
        };
        
        int multiplier = switch (severity) {
            case LOW -> 1;
            case MEDIUM -> 2;
            case HIGH -> 3;
            case CRITICAL -> 4;
        };

        return basePoints * multiplier;
    }

    private int calculateRiskScore(
            double cancellationRate,
            double returnRate,
            int reportedReviews,
            boolean hasActiveViolations,
            int daysSinceLastOrder) {

        int score = 0;

        // Cancellation rate (0-30 points)
        if (cancellationRate > 50) score += 30;
        else if (cancellationRate > 40) score += 25;
        else if (cancellationRate > 30) score += 20;
        else if (cancellationRate > 20) score += 10;

        // Return rate (0-20 points)
        if (returnRate > 40) score += 20;
        else if (returnRate > 30) score += 15;
        else if (returnRate > 20) score += 10;
        else if (returnRate > 10) score += 5;

        // Reported reviews (0-20 points)
        if (reportedReviews > 5) score += 20;
        else if (reportedReviews > 3) score += 15;
        else if (reportedReviews > 1) score += 10;
        else if (reportedReviews == 1) score += 5;

        // Active violations (0-20 points)
        if (hasActiveViolations) score += 20;

        // Inactivity (0-10 points)
        if (daysSinceLastOrder > 365) score += 10;
        else if (daysSinceLastOrder > 180) score += 5;

        return Math.min(100, score);
    }

    private String buildRecommendationReason(
            String recommendation,
            int riskFactorCount,
            int positiveFactorCount,
            CustomerDetailResponse.BehavioralStatistics stats) {

        return switch (recommendation) {
            case "BAN" -> String.format(
                    "Khách hàng có %d yếu tố rủi ro nghiêm trọng với điểm rủi ro %d/100. " +
                    "Khuyến nghị cấm tài khoản để bảo vệ hệ thống.",
                    riskFactorCount, stats.getRiskScore()
            );
            case "SUSPEND" -> String.format(
                    "Khách hàng có %d yếu tố rủi ro với điểm rủi ro %d/100. " +
                    "Khuyến nghị tạm khóa tài khoản để đánh giá thêm.",
                    riskFactorCount, stats.getRiskScore()
            );
            case "WARN" -> String.format(
                    "Khách hàng có %d yếu tố rủi ro nhẹ. " +
                    "Khuyến nghị cảnh báo và theo dõi hoạt động.",
                    riskFactorCount
            );
            default -> String.format(
                    "Khách hàng có %d yếu tố tích cực và hồ sơ tốt. " +
                    "Không phát hiện vấn đề nghiêm trọng.",
                    positiveFactorCount
            );
        };
    }

    // ===== CUSTOMER HISTORY APIs IMPLEMENTATION =====

    @Override
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<com.example.backend.dto.response.OrderSummaryResponse> getCustomerOrders(
            String userId, int page, int size) {
        log.info("Getting order history for customer: userId={}, page={}, size={}", userId, page, size);

        Customer customer = customerRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        org.springframework.data.domain.Pageable pageable =
                org.springframework.data.domain.PageRequest.of(page, size,
                        org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));

        org.springframework.data.domain.Page<Order> ordersPage = orderRepository.findByCustomer(customer, pageable);

        return ordersPage.map(order -> {
            String cancelReason = null;
            if (order.getStatus() == OrderStatus.CANCELED) {
                Optional<OrderCancelRequest> cancelRequest = orderCancelRequestRepository.findByOrder(order);
                if (cancelRequest.isPresent()) {
                    cancelReason = cancelRequest.get().getReason();
                }
            }

            return com.example.backend.dto.response.OrderSummaryResponse.builder()
                    .orderId(order.getOrderId())
                    .orderCode(order.getOrderCode())
                    .storeName(order.getStore() != null ? order.getStore().getStoreName() : "Unknown")
                    .storeId(order.getStore() != null ? order.getStore().getStoreId() : null)
                    .totalAmount(order.getTotalAmount())
                    .status(order.getStatus().toString())
                    .createdAt(order.getCreatedAt())
                    .deliveredAt(order.getDeliveredAt())
                    .wasCanceled(order.getStatus() == OrderStatus.CANCELED)
                    .cancelReason(cancelReason)
                    .itemCount(order.getOrderDetails() != null ? order.getOrderDetails().size() : 0)
                    .build();
        });
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PointTransactionResponse> getCustomerPointTransactions(
            String userId, int page, int size) {
        log.info("Getting point transaction history for customer: userId={}, page={}, size={}", userId, page, size);

        Customer customer = customerRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        Pageable pageable = PageRequest.of(page, size);

        Page<PointTransaction> transactionsPage =
                pointTransactionRepository.findByCustomerOrderByCreatedAtDesc(customer, pageable);

        return transactionsPage.map(pt -> PointTransactionResponse.builder()
                .transactionId(pt.getTransactionId())
                .transactionType(pt.getTransactionType().toString())
                .pointsChange(pt.getPointsChange())
                .reason(pt.getReason())
                .createdAt(pt.getCreatedAt())
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AddressResponse> getCustomerAddresses(String userId) {
        log.info("Getting addresses for customer: userId={}", userId);

        Customer customer = customerRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        List<Address> addresses = addressRepository.findByCustomer(customer);

        return addresses.stream()
                .map(address -> AddressResponse.builder()
                        .addressId(address.getAddressId())
                        .fullName(address.getFullName())
                        .phoneNumber(address.getPhoneNumber())
                        .street(address.getStreet())
                        .ward(address.getWard())
                        .district(address.getDistrict())
                        .province(address.getProvince())
                        .isDefault(address.isDefault())
                        .latitude(address.getLatitude())
                        .longitude(address.getLongitude())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getCustomerReviews(
            String userId, int page, int size) {
        log.info("Getting reviews for customer: userId={}, page={}, size={}", userId, page, size);

        Customer customer = customerRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        Pageable pageable = PageRequest.of(page, size);

        Page<Review> reviewsPage = reviewRepository.findByCustomerOrderByCreatedAtDesc(customer, pageable);

        return reviewsPage.map(review -> ReviewResponse.builder()
                .reviewId(review.getReviewId())
                .productId(review.getProduct() != null ? review.getProduct().getProductId() : null)
                .productName(review.getProduct() != null ? review.getProduct().getName() : "Unknown")
                .storeId(review.getStore() != null ? review.getStore().getStoreId() : null)
                .storeName(review.getStore() != null ? review.getStore().getStoreName() : "Unknown")
                .rating(review.getRating())
                .comment(review.getComment())
                .imageUrl(review.getImageUrl())
                .markedAsSpam(review.isMarkedAsSpam())
                .createdAt(review.getCreatedAt())
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FavoriteStoreResponse> getCustomerFavoriteStores(
            String userId, int page, int size) {
        log.info("Getting favorite stores for customer: userId={}, page={}, size={}", userId, page, size);

        Pageable pageable = PageRequest.of(page, size);

        Page<FavoriteStore> favoritesPage =
                favoriteStoreRepository.findByCustomerId(userId, pageable);

        return favoritesPage.map(favorite -> {
            StoreResponse storeResponse = StoreResponse.builder()
                    .storeId(favorite.getStore().getStoreId())
                    .storeName(favorite.getStore().getStoreName())
                    .imageUrl(favorite.getStore().getImageUrl())
                    .street(favorite.getStore().getStreet())
                    .ward(favorite.getStore().getWard())
                    .district(favorite.getStore().getDistrict())
                    .province(favorite.getStore().getProvince())
                    .build();

            return FavoriteStoreResponse.builder()
                    .favoriteId(favorite.getFavoriteId())
                    .store(storeResponse)
                    .createdAt(favorite.getCreatedAt())
                    .orderCount(favorite.getOrderCount())
                    .lastOrderDate(favorite.getLastOrderDate())
                    .build();
        });
    }

    @Override
    @Transactional
    public CustomerResponse suspendCustomer(String userId, String reason, Integer durationDays) {
        log.info("Suspending customer: userId={}, reason={}, duration={} days", userId, reason, durationDays);

        Customer customer = customerRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        customer.setStatus(CustomerStatus.SUSPENDED);
        customer.setActive(false);

        // Create disciplinary record
        CustomerDisciplinaryRecord record = new CustomerDisciplinaryRecord();
        record.setCustomer(customer);
        record.setViolationType(ViolationType.POLICY_VIOLATION);
        record.setSeverity(ViolationSeverity.MEDIUM);
        record.setDescription(reason);
        record.setActionTaken(ViolationAction.TEMPORARY_SUSPENSION);
        record.setSuspensionDurationDays(durationDays);
        
        if (durationDays != null) {
            record.setSuspendedUntil(LocalDateTime.now().plusDays(durationDays));
        }
        
        disciplinaryRecordRepository.save(record);
        customer = customerRepository.save(customer);

        log.info("Customer suspended successfully: userId={}", userId);
        return customerMapper.toResponse(customer);
    }

    @Override
    @Transactional
    public CustomerResponse unsuspendCustomer(String userId) {
        log.info("Unsuspending customer: userId={}", userId);

        Customer customer = customerRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        customer.setStatus(CustomerStatus.ACTIVE);
        customer.setActive(true);

        // Mark disciplinary records as resolved
        List<CustomerDisciplinaryRecord> unresolvedRecords =
                disciplinaryRecordRepository.findByCustomerUserIdAndResolvedFalse(userId);
        for (CustomerDisciplinaryRecord record : unresolvedRecords) {
            record.setResolved(true);
            record.setReinstatedAt(LocalDateTime.now());
        }
        disciplinaryRecordRepository.saveAll(unresolvedRecords);

        customer = customerRepository.save(customer);

        log.info("Customer unsuspended successfully: userId={}", userId);
        return customerMapper.toResponse(customer);
    }
}
