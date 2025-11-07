package com.example.backend.service.impl;

import com.example.backend.dto.request.ManualTransactionRequest;
import com.example.backend.dto.response.*;
import com.example.backend.entity.*;
import com.example.backend.entity.enums.TransactionType;
import com.example.backend.entity.enums.WalletStatus;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.BadRequestException;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.repository.*;
import com.example.backend.service.WalletService;
import com.example.backend.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service implementation for wallet management - COMPLETE VERSION
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WalletServiceImpl implements WalletService {

    private final SupplierWalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final SupplierRepository supplierRepository;

    private static final BigDecimal MINIMUM_WITHDRAWAL = new BigDecimal("50000");
    private static final NumberFormat VND_FORMAT = NumberFormat.getCurrencyInstance(Locale.of("vi", "VN"));

    // ==================== CORE WALLET METHODS ====================

    @Override
    @Transactional
    public SupplierWallet createWallet(Supplier supplier) {
        log.info("Creating wallet for supplier ID: {}", supplier.getUserId());

        Optional<SupplierWallet> existingWallet = walletRepository.findBySupplierId(supplier.getUserId());
        if (existingWallet.isPresent()) {
            log.warn("Wallet already exists for supplier ID: {}", supplier.getUserId());
            return existingWallet.get();
        }

        SupplierWallet wallet = new SupplierWallet();
        wallet.setSupplier(supplier);
        wallet.setAvailableBalance(BigDecimal.ZERO);
        wallet.setPendingBalance(BigDecimal.ZERO);
        wallet.setTotalEarnings(BigDecimal.ZERO);
        wallet.setTotalWithdrawn(BigDecimal.ZERO);
        wallet.setTotalRefunded(BigDecimal.ZERO);
        wallet.setMonthlyEarnings(BigDecimal.ZERO);
        wallet.setCurrentMonth(YearMonth.now().toString());
        wallet.setStatus(WalletStatus.ACTIVE);

        wallet = walletRepository.save(wallet);
        log.info("Wallet created successfully for supplier ID: {}", supplier.getUserId());

        return wallet;
    }

    @Override
    @Transactional
    public void addPendingBalance(String supplierId, Order order, BigDecimal amount, String description) {
        log.info("Adding pending balance for supplier ID: {}, order ID: {}, amount: {}", 
                supplierId, order.getOrderId(), amount);

        // Use pessimistic lock to prevent race conditions on balance updates
        SupplierWallet wallet = walletRepository.findBySupplierIdForUpdate(supplierId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.WALLET_NOT_FOUND));
        Supplier supplier = wallet.getSupplier();

        BigDecimal commissionRate = supplier.getCommissionRate() != null ?
                                    BigDecimal.valueOf(supplier.getCommissionRate()) :
                                    BigDecimal.ZERO;
        BigDecimal commissionAmount = amount.multiply(commissionRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal netAmount = amount.subtract(commissionAmount);

        log.info("Order amount: {}, Commission rate: {}%, Commission: {}, Net amount: {}",
                 amount, supplier.getCommissionRate(), commissionAmount, netAmount);

        wallet.addPendingBalance(netAmount);
        wallet.addEarnings(netAmount);
        wallet = walletRepository.save(wallet);

        WalletTransaction orderTransaction = new WalletTransaction();
        orderTransaction.setWallet(wallet);
        orderTransaction.setTransactionType(TransactionType.ORDER_COMPLETED);
        orderTransaction.setAmount(netAmount);
        orderTransaction.setBalanceAfter(wallet.getAvailableBalance());
        orderTransaction.setPendingBalanceAfter(wallet.getPendingBalance());
        orderTransaction.setOrder(order);
        orderTransaction.setDescription(description != null ? description :
                "Thu nhập từ đơn hàng #" + order.getOrderCode() +
                " (Tổng: " + formatMoney(amount) + ", Phí: " + formatMoney(commissionAmount) + ")");

        transactionRepository.save(orderTransaction);

        if (commissionAmount.compareTo(BigDecimal.ZERO) > 0) {
            WalletTransaction commissionTransaction = new WalletTransaction();
            commissionTransaction.setWallet(wallet);
            commissionTransaction.setTransactionType(TransactionType.COMMISSION_FEE);
            commissionTransaction.setAmount(commissionAmount.negate());
            commissionTransaction.setBalanceAfter(wallet.getAvailableBalance());
            commissionTransaction.setPendingBalanceAfter(wallet.getPendingBalance());
            commissionTransaction.setOrder(order);
            commissionTransaction.setDescription("Phí hoa hồng " + supplier.getCommissionRate() +
                    "% cho đơn hàng #" + order.getOrderCode());

            transactionRepository.save(commissionTransaction);
        }

        log.info("Pending balance added successfully. Wallet ID: {}, Net pending: {}, Commission: {}",
                 wallet.getWalletId(), wallet.getPendingBalance(), commissionAmount);
    }

    @Override
    @Transactional
    public void refundOrder(String supplierId, Order order, BigDecimal amount, boolean isPending) {
        log.info("Refunding order for supplier ID: {}, order ID: {}, amount: {}, isPending: {}",
                 supplierId, order.getOrderId(), amount, isPending);

        // Use pessimistic lock to prevent race conditions on balance updates
        SupplierWallet wallet = walletRepository.findBySupplierIdForUpdate(supplierId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.WALLET_NOT_FOUND));
        Supplier supplier = wallet.getSupplier();

        BigDecimal commissionRate = supplier.getCommissionRate() != null ?
                                    BigDecimal.valueOf(supplier.getCommissionRate()) :
                                    BigDecimal.ZERO;
        BigDecimal commissionAmount = amount.multiply(commissionRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal netAmount = amount.subtract(commissionAmount);

        // Determine if money is still in pending or already released to available
        // Money is in pending if:
        // 1. Order was never delivered (cancelled during processing), OR
        // 2. Order was delivered but balance not yet released (within 7-day hold period)
        boolean isStillPending = !order.isBalanceReleased();
        
        if (isPending != isStillPending) {
            log.warn("Refund isPending flag ({}) differs from actual balance state ({}). Using actual state.",
                    isPending, isStillPending);
        }

        log.info("Refunding - Original amount: {}, Commission: {}, Net amount to refund: {}, From: {}",
                 amount, commissionAmount, netAmount, isStillPending ? "Pending" : "Available");

        wallet.refund(netAmount, isStillPending);
        wallet.subtractEarnings(netAmount);
        wallet = walletRepository.save(wallet);

        WalletTransaction transaction = new WalletTransaction();
        transaction.setWallet(wallet);
        transaction.setTransactionType(TransactionType.ORDER_REFUND);
        transaction.setAmount(netAmount.negate());
        transaction.setBalanceAfter(wallet.getAvailableBalance());
        transaction.setPendingBalanceAfter(wallet.getPendingBalance());
        transaction.setOrder(order);
        transaction.setDescription("Hoàn tiền đơn hàng #" + order.getOrderCode() +
                (isStillPending ? " (từ số dư chờ xử lý)" : " (từ số dư khả dụng)") +
                " - Tổng: " + formatMoney(amount) + ", Hoàn: " + formatMoney(netAmount));

        transactionRepository.save(transaction);

        log.info("Order refunded successfully. Wallet ID: {}, Net refunded: {}, From: {}", 
                wallet.getWalletId(), netAmount, isStillPending ? "Pending" : "Available");
    }

    @Override
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void endOfDayRelease() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime holdPeriodEnd = now.minusDays(7); // 7-day hold period
        
        log.info("Starting End-of-Day Balance Release. Processing orders delivered before: {}", holdPeriodEnd);

        // Find orders that are eligible for balance release (delivered > 7 days ago)
        List<Order> eligibleOrders = orderRepository.findDeliveredOrdersEligibleForRelease(holdPeriodEnd);
        
        int processedOrderCount = 0;
        BigDecimal totalReleased = BigDecimal.ZERO;

        for (Order order : eligibleOrders) {
            try {
                Supplier supplier = order.getStore().getSupplier();
                // Use pessimistic lock to prevent race conditions on balance updates
                SupplierWallet wallet = walletRepository.findBySupplierIdForUpdate(supplier.getUserId())
                        .orElseThrow(() -> new NotFoundException(ErrorCode.WALLET_NOT_FOUND));

                // Calculate net amount after commission
                BigDecimal commissionRate = supplier.getCommissionRate() != null ?
                                            BigDecimal.valueOf(supplier.getCommissionRate()) :
                                            BigDecimal.ZERO;
                BigDecimal orderAmount = order.getTotalAmount();
                BigDecimal commissionAmount = orderAmount.multiply(commissionRate).setScale(2, RoundingMode.HALF_UP);
                BigDecimal netAmount = orderAmount.subtract(commissionAmount);

                // Release from pending to available
                wallet.releasePendingBalance(netAmount);
                walletRepository.save(wallet);

                // Mark order as balance released
                order.setBalanceReleased(true);
                orderRepository.save(order);

                // Create transaction record
                WalletTransaction transaction = new WalletTransaction();
                transaction.setWallet(wallet);
                transaction.setTransactionType(TransactionType.END_OF_DAY_RELEASE);
                transaction.setAmount(netAmount);
                transaction.setBalanceAfter(wallet.getAvailableBalance());
                transaction.setPendingBalanceAfter(wallet.getPendingBalance());
                transaction.setOrder(order);
                transaction.setDescription(String.format(
                    "Giải phóng số dư đơn hàng #%s (Giao: %s, Giữ 7 ngày hoàn tất)",
                    order.getOrderCode(),
                    order.getDeliveredAt().toLocalDate()
                ));
                transactionRepository.save(transaction);

                processedOrderCount++;
                totalReleased = totalReleased.add(netAmount);
                
                log.info("Released {} for order {} to wallet {}", 
                    formatMoney(netAmount), order.getOrderCode(), wallet.getWalletId());

            } catch (Exception e) {
                log.error("Error releasing balance for order {}", order.getOrderCode(), e);
            }
        }

        log.info("End-of-Day Balance Release completed. Orders processed: {}, Total released: {}", 
            processedOrderCount, formatMoney(totalReleased));
    }

    @Override
    @Scheduled(cron = "0 0 0 1 * *")
    @Transactional
    public void endOfMonthWithdrawal() {
        YearMonth lastMonth = YearMonth.now().minusMonths(1);
        YearMonth currentMonth = YearMonth.now();
        log.info("Starting End-of-Month Withdrawal for month: {}", lastMonth);

        List<SupplierWallet> wallets = walletRepository.findAllWithAvailableBalance();
        int processedCount = 0;

        for (SupplierWallet wallet : wallets) {
            try {
                BigDecimal availableAmount = wallet.getAvailableBalance();

                if (availableAmount.compareTo(BigDecimal.ZERO) > 0) {
                    wallet.autoWithdrawMonthly();

                    WalletTransaction transaction = new WalletTransaction();
                    transaction.setWallet(wallet);
                    transaction.setTransactionType(TransactionType.END_OF_MONTH_WITHDRAWAL);
                    transaction.setAmount(availableAmount);
                    transaction.setBalanceAfter(BigDecimal.ZERO);
                    transaction.setPendingBalanceAfter(wallet.getPendingBalance());
                    transaction.setDescription("Rút tiền tự động cuối tháng " + lastMonth);

                    transactionRepository.save(transaction);

                    processedCount++;
                    log.info("Withdrew {} for wallet ID: {}", formatMoney(availableAmount), wallet.getWalletId());
                }

                wallet.resetMonthlyEarnings();
                wallet.setCurrentMonth(currentMonth.toString());
                walletRepository.save(wallet);

            } catch (Exception e) {
                log.error("Error processing end-of-month withdrawal for wallet ID: {}", 
                        wallet.getWalletId(), e);
            }
        }

        log.info("End-of-Month Withdrawal completed. Total wallets processed: {}", processedCount);
    }

    // ==================== SUPPLIER METHODS ====================

    @Override
    @Transactional(readOnly = true)
    public WalletResponse getMyWallet() {
        Supplier currentSupplier = getCurrentSupplier();
        SupplierWallet wallet = getWalletEntityBySupplierId(currentSupplier.getUserId());
        return mapToWalletResponse(wallet);
    }

    @Override
    @Transactional
    public WalletSummaryResponse getWalletSummary() {
        Supplier supplier = getCurrentSupplier();
        
        // Get or create wallet if not exists
        SupplierWallet wallet = walletRepository.findBySupplierId(supplier.getUserId())
                .orElseGet(() -> {
                    log.info("Wallet not found for supplier {}, creating new wallet", supplier.getUserId());
                    return createWallet(supplier);
                });

        YearMonth currentMonth = YearMonth.now();
        LocalDateTime startOfMonth = currentMonth.atDay(1).atStartOfDay();
        LocalDateTime endOfMonth = currentMonth.atEndOfMonth().atTime(23, 59, 59);

        Long orderCount = orderRepository.countBySupplierIdAndCreatedAtBetween(
                supplier.getUserId(), startOfMonth, endOfMonth
        );

        BigDecimal totalBalance = wallet.getAvailableBalance().add(wallet.getPendingBalance());
        Double commissionRate = supplier.getCommissionRate() != null ? supplier.getCommissionRate() : 0.0;
        BigDecimal estimatedCommission = wallet.getMonthlyEarnings()
                .multiply(BigDecimal.valueOf(commissionRate))
                .setScale(2, RoundingMode.HALF_UP);

        return WalletSummaryResponse.builder()
                .availableBalance(wallet.getAvailableBalance())
                .pendingBalance(wallet.getPendingBalance())
                .totalBalance(totalBalance)
                .monthlyEarnings(wallet.getMonthlyEarnings())
                .monthlyOrders(BigDecimal.valueOf(orderCount))
                .totalOrdersThisMonth(orderCount.intValue())
                .totalEarnings(wallet.getTotalEarnings())
                .totalWithdrawn(wallet.getTotalWithdrawn())
                .totalRefunded(wallet.getTotalRefunded())
                .commissionRate(commissionRate)
                .estimatedCommissionThisMonth(estimatedCommission)
                .status(wallet.getStatus().name())
                .canWithdraw(false)
                .minimumWithdrawal(MINIMUM_WITHDRAWAL)
                .build();
    }

        @Override
        @Transactional
        public TransactionResponse markPayoutAsPaid(String walletId, BigDecimal amount, String externalReference, String adminNote) {
                String adminId = SecurityUtil.getCurrentUserId();
                SupplierWallet wallet = walletRepository.findById(walletId)
                                .orElseThrow(() -> new NotFoundException(ErrorCode.WALLET_NOT_FOUND));

                if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                        throw new BadRequestException(ErrorCode.INVALID_REQUEST, "Số tiền thanh toán phải lớn hơn 0");
                }

                if (wallet.getAvailableBalance().compareTo(amount) < 0) {
                        throw new BadRequestException(ErrorCode.INSUFFICIENT_BALANCE, "Số dư khả dụng không đủ để thanh toán");
                }

                // Debit available balance and record withdrawal
                wallet.setAvailableBalance(wallet.getAvailableBalance().subtract(amount));
                wallet.setTotalWithdrawn(wallet.getTotalWithdrawn().add(amount));
                wallet.setLastWithdrawalDate(java.time.LocalDateTime.now());
                wallet = walletRepository.save(wallet);

                WalletTransaction transaction = new WalletTransaction();
                transaction.setWallet(wallet);
                transaction.setTransactionType(TransactionType.END_OF_MONTH_WITHDRAWAL);
                transaction.setAmount(amount);
                transaction.setBalanceAfter(wallet.getAvailableBalance());
                transaction.setPendingBalanceAfter(wallet.getPendingBalance());
                transaction.setAdminId(adminId);
                transaction.setAdminNote(adminNote);
                transaction.setExternalReference(externalReference);
                transaction.setDescription("Payout marked as PAID by admin");

                transaction = transactionRepository.save(transaction);

                log.info("Admin {} marked payout paid for wallet {} amount {}", adminId, walletId, amount);

                return mapToTransactionResponse(transaction, userRepository.findById(adminId).map(u -> u.getFullName()).orElse(null));
        }

    @Override
    @Transactional(readOnly = true)
    public Page<TransactionResponse> getMyTransactions(
            String transactionType,
            LocalDate startDate,
            LocalDate endDate,
            org.springframework.data.domain.Pageable pageable
    ) {
        Supplier currentSupplier = getCurrentSupplier();
        SupplierWallet wallet = getWalletEntityBySupplierId(currentSupplier.getUserId());

        return getTransactionsByWallet(wallet.getWalletId(), transactionType, startDate, endDate, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public WalletStatsResponse getWalletStats(Integer year, Integer month) {
        Supplier currentSupplier = getCurrentSupplier();
        SupplierWallet wallet = getWalletEntityBySupplierId(currentSupplier.getUserId());

        if (year == null) year = LocalDate.now().getYear();
        
        LocalDateTime startDate;
        LocalDateTime endDate;
        String period;

        if (month != null) {
            YearMonth yearMonth = YearMonth.of(year, month);
            startDate = yearMonth.atDay(1).atStartOfDay();
            endDate = yearMonth.atEndOfMonth().atTime(23, 59, 59);
            period = String.format("%04d-%02d", year, month);
        } else {
            startDate = LocalDate.of(year, 1, 1).atStartOfDay();
            endDate = LocalDate.of(year, 12, 31).atTime(23, 59, 59);
            period = String.valueOf(year);
        }

        List<WalletTransaction> transactions = transactionRepository.findByWalletAndCreatedAtBetween(
                wallet, startDate, endDate
        );

        return buildStatsResponse(transactions, year, month, period);
    }

    private Supplier getCurrentSupplier() {
        String currentKeycloakId = SecurityUtil.getCurrentUserId();
        if (currentKeycloakId == null) {
            throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
        }

        return supplierRepository.findByKeycloakId(currentKeycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));
    }

    // NOTE: Supplier self-withdrawal removed.
    // Using periodic payout/settlement model - admin performs payouts via markPayoutAsPaid().

    // ==================== ADMIN METHODS ====================

    @Override
    @Transactional(readOnly = true)
    public WalletResponse getWalletBySupplierId(String supplierId) {
        SupplierWallet wallet = getWalletEntityBySupplierId(supplierId);
        return mapToWalletResponse(wallet);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TransactionResponse> getSupplierTransactions(
            String supplierId,
            String transactionType,
            LocalDate startDate,
            LocalDate endDate,
            org.springframework.data.domain.Pageable pageable
    ) {
        SupplierWallet wallet = getWalletEntityBySupplierId(supplierId);
        return getTransactionsByWallet(wallet.getWalletId(), transactionType, startDate, endDate, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WalletResponse> getAllWallets(String status, org.springframework.data.domain.Pageable pageable) {
        Page<SupplierWallet> wallets;
        
        if (status != null && !status.equalsIgnoreCase("ALL")) {
            WalletStatus walletStatus = WalletStatus.valueOf(status);
            Specification<SupplierWallet> spec = (root, query, cb) -> 
                    cb.equal(root.get("status"), walletStatus);
            wallets = walletRepository.findAll(spec, pageable);
        } else {
            wallets = walletRepository.findAll(pageable);
        }

        return wallets.map(this::mapToWalletResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public SystemWalletSummaryResponse getSystemWalletSummary() {
        String currentMonth = YearMonth.now().toString();

        BigDecimal totalAvailable = walletRepository.getTotalAvailableBalance();
        BigDecimal totalPending = walletRepository.getTotalPendingBalance();
        BigDecimal monthlyEarnings = walletRepository.getTotalMonthlyEarnings(currentMonth);

        List<SupplierWallet> allWallets = walletRepository.findAll();
        
        long activeCount = allWallets.stream()
                .filter(w -> w.getStatus() == WalletStatus.ACTIVE)
                .count();
        
        long suspendedCount = allWallets.stream()
                .filter(w -> w.getStatus() == WalletStatus.SUSPENDED)
                .count();

        BigDecimal totalEarnings = allWallets.stream()
                .map(SupplierWallet::getTotalEarnings)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalWithdrawn = allWallets.stream()
                .map(SupplierWallet::getTotalWithdrawn)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalRefunded = allWallets.stream()
                .map(SupplierWallet::getTotalRefunded)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCommission = calculateTotalCommission();
        BigDecimal monthlyCommission = calculateMonthlyCommission();

        BigDecimal avgBalance = allWallets.isEmpty() ? BigDecimal.ZERO :
                totalAvailable.add(totalPending).divide(
                        BigDecimal.valueOf(allWallets.size()), 2, RoundingMode.HALF_UP
                );

        BigDecimal avgMonthly = allWallets.isEmpty() ? BigDecimal.ZERO :
                monthlyEarnings.divide(
                        BigDecimal.valueOf(allWallets.size()), 2, RoundingMode.HALF_UP
                );

        return SystemWalletSummaryResponse.builder()
                .totalAvailableBalance(totalAvailable)
                .totalPendingBalance(totalPending)
                .totalBalance(totalAvailable.add(totalPending))
                .totalEarnings(totalEarnings)
                .monthlyEarnings(monthlyEarnings)
                .totalWithdrawn(totalWithdrawn)
                .totalRefunded(totalRefunded)
                .totalCommissionEarned(totalCommission)
                .monthlyCommissionEarned(monthlyCommission)
                .totalActiveWallets((int) activeCount)
                .totalSuspendedWallets((int) suspendedCount)
                .totalWallets(allWallets.size())
                .averageWalletBalance(avgBalance)
                .averageMonthlyEarnings(avgMonthly)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ReconciliationResponse getReconciliationReport(LocalDate startDate, LocalDate endDate) {
        if (startDate == null) startDate = LocalDate.now().withDayOfMonth(1);
        if (endDate == null) endDate = LocalDate.now();

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(23, 59, 59);

        List<Order> orders = orderRepository.findByCreatedAtBetween(start, end);

        BigDecimal totalOrderValue = orders.stream()
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<WalletTransaction> transactions = transactionRepository.findByCreatedAtBetween(start, end);

        BigDecimal totalCommission = transactions.stream()
                .filter(t -> t.getTransactionType() == TransactionType.COMMISSION_FEE)
                .map(WalletTransaction::getAmount)
                .map(BigDecimal::abs)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalSupplierEarnings = transactions.stream()
                .filter(t -> t.getTransactionType() == TransactionType.ORDER_COMPLETED)
                .map(WalletTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalRefunded = transactions.stream()
                .filter(t -> t.getTransactionType() == TransactionType.ORDER_REFUND)
                .map(WalletTransaction::getAmount)
                .map(BigDecimal::abs)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long refundCount = transactions.stream()
                .filter(t -> t.getTransactionType() == TransactionType.ORDER_REFUND)
                .count();

        BigDecimal totalPaid = transactions.stream()
                .filter(t -> t.getTransactionType() == TransactionType.END_OF_MONTH_WITHDRAWAL ||
                            t.getTransactionType() == TransactionType.END_OF_DAY_RELEASE)
                .map(WalletTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal pendingPayments = walletRepository.getTotalPendingBalance()
                .add(walletRepository.getTotalAvailableBalance());

        Map<String, List<WalletTransaction>> groupedBySupplier = transactions.stream()
                .collect(Collectors.groupingBy(t -> t.getWallet().getSupplier().getUserId()));

        List<ReconciliationResponse.SupplierReconciliation> supplierBreakdown = 
                groupedBySupplier.entrySet().stream()
                .map(entry -> buildSupplierReconciliation(entry.getKey(), entry.getValue()))
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(
                        ReconciliationResponse.SupplierReconciliation::getTotalEarnings).reversed())
                .collect(Collectors.toList());

        return ReconciliationResponse.builder()
                .startDate(startDate)
                .endDate(endDate)
                .period(startDate.equals(endDate) ? startDate.toString() : startDate + " → " + endDate)
                .totalOrderValue(totalOrderValue)
                .totalOrders(orders.size())
                .totalCommission(totalCommission)
                .totalSupplierEarnings(totalSupplierEarnings)
                .totalPaidToSuppliers(totalPaid)
                .pendingPayments(pendingPayments)
                .totalRefunded(totalRefunded)
                .refundCount((int) refundCount)
                .platformRevenue(totalCommission)
                .platformExpenses(totalRefunded)
                .netPlatformRevenue(totalCommission.subtract(totalRefunded))
                .supplierBreakdown(supplierBreakdown)
                .build();
    }

    @Override
    @Transactional
    public WalletResponse updateWalletStatus(String walletId, String status) {
        SupplierWallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.WALLET_NOT_FOUND));

        WalletStatus newStatus = WalletStatus.valueOf(status);
        wallet.setStatus(newStatus);
        wallet = walletRepository.save(wallet);

        log.info("Wallet status updated: walletId={}, newStatus={}", walletId, status);
        return mapToWalletResponse(wallet);
    }

    @Override
    @Transactional
    public TransactionResponse createManualTransaction(ManualTransactionRequest request) {
        String adminId = SecurityUtil.getCurrentUserId();
        SupplierWallet wallet = getWalletEntityBySupplierId(request.getSupplierId());

        TransactionType txnType = TransactionType.valueOf(request.getTransactionType());
        BigDecimal amount = request.getAmount();

        switch (txnType) {
            case ADMIN_DEPOSIT:
                // Admin deposit is not earnings from orders, only add to available balance
                wallet.setAvailableBalance(wallet.getAvailableBalance().add(amount));
                break;

            case ADMIN_DEDUCTION:
            case PENALTY_FEE:
                BigDecimal newBalance = wallet.getAvailableBalance().subtract(amount);
                if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
                    throw new BadRequestException(ErrorCode.NEGATIVE_BALANCE_NOT_ALLOWED,
                        "Không thể trừ " + formatMoney(amount) + ". Số dư hiện tại: " +
                        formatMoney(wallet.getAvailableBalance()));
                }
                wallet.setAvailableBalance(newBalance);
                break;

            case ADJUSTMENT:
                wallet.setAvailableBalance(wallet.getAvailableBalance().add(amount));
                break;

            default:
                throw new BadRequestException(ErrorCode.INVALID_MANUAL_TRANSACTION_TYPE, "Invalid transaction type for manual transaction");
        }

        wallet = walletRepository.save(wallet);

        User admin = userRepository.findById(adminId).orElse(null);

        WalletTransaction transaction = new WalletTransaction();
        transaction.setWallet(wallet);
        transaction.setTransactionType(txnType);
        transaction.setAmount(amount);
        transaction.setBalanceAfter(wallet.getAvailableBalance());
        transaction.setPendingBalanceAfter(wallet.getPendingBalance());
        transaction.setDescription(request.getDescription());
        transaction.setAdminId(adminId);
        transaction.setAdminNote(request.getAdminNote());
        transaction.setExternalReference(request.getExternalReference());

        transaction = transactionRepository.save(transaction);

        log.info("Manual transaction created: txnId={}, type={}, amount={}, supplierId={}",
                transaction.getTransactionId(), txnType, amount, request.getSupplierId());

        return mapToTransactionResponse(transaction, admin != null ? admin.getFullName() : null);
    }

    // ==================== HELPER METHODS ====================

    private SupplierWallet getWalletEntityBySupplierId(String supplierId) {
        return walletRepository.findBySupplierId(supplierId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.WALLET_NOT_FOUND));
    }

    private Page<TransactionResponse> getTransactionsByWallet(
            String walletId,
            String transactionType,
            LocalDate startDate,
            LocalDate endDate,
            org.springframework.data.domain.Pageable pageable
    ) {
        LocalDateTime start = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime end = endDate != null ? endDate.atTime(23, 59, 59) : null;

        Specification<WalletTransaction> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("wallet").get("walletId"), walletId));

            if (transactionType != null && !transactionType.equalsIgnoreCase("ALL")) {
                predicates.add(cb.equal(root.get("transactionType"), 
                        TransactionType.valueOf(transactionType)));
            }

            if (start != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), start));
            }

            if (end != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), end));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        Page<WalletTransaction> transactions = transactionRepository.findAll(spec, pageable);
        return transactions.map(t -> mapToTransactionResponse(t, null));
    }

    private WalletResponse mapToWalletResponse(SupplierWallet wallet) {
        Supplier supplier = wallet.getSupplier();
        List<Store> stores = supplier.getStores();
        Store store = stores != null && !stores.isEmpty() ? stores.get(0) : null;

        return WalletResponse.builder()
                .walletId(wallet.getWalletId())
                .supplierId(supplier.getUserId())
                .supplierName(supplier.getFullName())
                .storeName(store != null ? store.getStoreName() : "N/A")
                .availableBalance(wallet.getAvailableBalance())
                .pendingBalance(wallet.getPendingBalance())
                .totalBalance(wallet.getAvailableBalance().add(wallet.getPendingBalance()))
                .totalEarnings(wallet.getTotalEarnings())
                .monthlyEarnings(wallet.getMonthlyEarnings())
                .totalWithdrawn(wallet.getTotalWithdrawn())
                .totalRefunded(wallet.getTotalRefunded())
                .status(wallet.getStatus().name())
                .currentMonth(wallet.getCurrentMonth())
                .lastWithdrawalDate(wallet.getLastWithdrawalDate())
                .createdAt(wallet.getCreatedAt())
                .updatedAt(wallet.getUpdatedAt())
                .commissionRate(supplier.getCommissionRate())
                .build();
    }

    private TransactionResponse mapToTransactionResponse(WalletTransaction txn, String adminName) {
        TransactionType type = txn.getTransactionType();
        boolean isIncome = isIncomeTransaction(type);
        BigDecimal displayAmt = isIncome ? txn.getAmount() : txn.getAmount().abs().negate();

        return TransactionResponse.builder()
                .transactionId(txn.getTransactionId())
                .walletId(txn.getWallet().getWalletId())
                .transactionType(type.name())
                .transactionTypeLabel(getTransactionTypeLabel(type))
                .amount(txn.getAmount())
                .description(txn.getDescription())
                .balanceAfter(txn.getBalanceAfter())
                .pendingBalanceAfter(txn.getPendingBalanceAfter())
                .orderId(txn.getOrder() != null ? txn.getOrder().getOrderId() : null)
                .orderCode(txn.getOrder() != null ? txn.getOrder().getOrderCode() : null)
                .externalReference(txn.getExternalReference())
                .adminId(txn.getAdminId())
                .adminName(adminName)
                .adminNote(txn.getAdminNote())
                .createdAt(txn.getCreatedAt())
                .isIncome(isIncome)
                .displayAmount((isIncome ? "+" : "") + formatMoney(displayAmt.abs()))
                .build();
    }

    private WalletStatsResponse buildStatsResponse(
            List<WalletTransaction> transactions,
            Integer year,
            Integer month,
            String period
    ) {
        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;

        Map<TransactionType, Integer> typeCount = new HashMap<>();
        Map<TransactionType, BigDecimal> typeAmount = new HashMap<>();

        for (WalletTransaction txn : transactions) {
            TransactionType type = txn.getTransactionType();
            BigDecimal amount = txn.getAmount().abs();

            typeCount.merge(type, 1, Integer::sum);
            typeAmount.merge(type, amount, BigDecimal::add);

            if (isIncomeTransaction(type)) {
                totalIncome = totalIncome.add(amount);
            } else {
                totalExpense = totalExpense.add(amount);
            }
        }

        List<WalletStatsResponse.TransactionTypeStats> typeBreakdown = typeAmount.entrySet().stream()
                .map(e -> WalletStatsResponse.TransactionTypeStats.builder()
                        .transactionType(e.getKey().name())
                        .label(getTransactionTypeLabel(e.getKey()))
                        .amount(e.getValue())
                        .count(typeCount.get(e.getKey()))
                        .isIncome(isIncomeTransaction(e.getKey()))
                        .build())
                .sorted(Comparator.comparing(WalletStatsResponse.TransactionTypeStats::getAmount).reversed())
                .collect(Collectors.toList());

        Map<String, Integer> typeCountMap = typeCount.entrySet().stream()
                .collect(Collectors.toMap(
                        e -> e.getKey().name(),
                        Map.Entry::getValue
                ));

        List<WalletStatsResponse.MonthlyStats> monthlyBreakdown = null;
        if (month == null) {
            monthlyBreakdown = buildMonthlyBreakdown(transactions, year);
        }

        return WalletStatsResponse.builder()
                .year(year)
                .month(month)
                .period(period)
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .netAmount(totalIncome.subtract(totalExpense))
                .totalTransactions(transactions.size())
                .transactionTypeCount(typeCountMap)
                .monthlyBreakdown(monthlyBreakdown)
                .transactionTypeBreakdown(typeBreakdown)
                .build();
    }

    private List<WalletStatsResponse.MonthlyStats> buildMonthlyBreakdown(
            List<WalletTransaction> transactions,
            int year
    ) {
        Map<Integer, List<WalletTransaction>> byMonth = transactions.stream()
                .collect(Collectors.groupingBy(t -> t.getCreatedAt().getMonthValue()));

        return java.util.stream.IntStream.rangeClosed(1, 12)
                .mapToObj(m -> {
                    List<WalletTransaction> monthTxns = byMonth.getOrDefault(m, Collections.emptyList());

                    BigDecimal income = monthTxns.stream()
                            .filter(t -> isIncomeTransaction(t.getTransactionType()))
                            .map(t -> t.getAmount().abs())
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal expense = monthTxns.stream()
                            .filter(t -> !isIncomeTransaction(t.getTransactionType()))
                            .map(t -> t.getAmount().abs())
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    return WalletStatsResponse.MonthlyStats.builder()
                            .month(m)
                            .monthName(String.format("Tháng %d", m))
                            .income(income)
                            .expense(expense)
                            .net(income.subtract(expense))
                            .transactionCount(monthTxns.size())
                            .build();
                })
                .collect(Collectors.toList());
    }

    private ReconciliationResponse.SupplierReconciliation buildSupplierReconciliation(
            String supplierId,
            List<WalletTransaction> supplierTxns
    ) {
        Optional<SupplierWallet> walletOpt = walletRepository.findBySupplierId(supplierId);
        if (!walletOpt.isPresent()) return null;

        SupplierWallet wallet = walletOpt.get();

        BigDecimal earnings = supplierTxns.stream()
                .filter(t -> t.getTransactionType() == TransactionType.ORDER_COMPLETED)
                .map(WalletTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal commission = supplierTxns.stream()
                .filter(t -> t.getTransactionType() == TransactionType.COMMISSION_FEE)
                .map(WalletTransaction::getAmount)
                .map(BigDecimal::abs)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal refunded = supplierTxns.stream()
                .filter(t -> t.getTransactionType() == TransactionType.ORDER_REFUND)
                .map(WalletTransaction::getAmount)
                .map(BigDecimal::abs)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int orderCount = (int) supplierTxns.stream()
                .filter(t -> t.getTransactionType() == TransactionType.ORDER_COMPLETED)
                .count();

        Supplier supplier = wallet.getSupplier();
        List<Store> stores = supplier.getStores();
        Store store = stores != null && !stores.isEmpty() ? stores.get(0) : null;

        return ReconciliationResponse.SupplierReconciliation.builder()
                .supplierId(supplierId)
                .supplierName(supplier.getFullName())
                .storeName(store != null ? store.getStoreName() : "N/A")
                .totalEarnings(earnings)
                .commission(commission)
                .netEarnings(earnings.subtract(commission))
                .orderCount(orderCount)
                .refunded(refunded)
                .build();
    }

    private boolean isIncomeTransaction(TransactionType type) {
        return type == TransactionType.ORDER_COMPLETED ||
               type == TransactionType.END_OF_DAY_RELEASE ||
               type == TransactionType.ADMIN_DEPOSIT ||
               type == TransactionType.ADJUSTMENT;
    }

    private String getTransactionTypeLabel(TransactionType type) {
        switch (type) {
            case ORDER_COMPLETED: return "Thu nhập đơn hàng";
            case END_OF_DAY_RELEASE: return "Chuyển số dư khả dụng";
            case END_OF_MONTH_WITHDRAWAL: return "Rút tiền cuối tháng";
            case ADMIN_DEPOSIT: return "Admin nạp tiền";
            case ADMIN_DEDUCTION: return "Admin trừ tiền";
            case ORDER_REFUND: return "Hoàn tiền đơn hàng";
            case COMMISSION_FEE: return "Phí hoa hồng";
            case PENALTY_FEE: return "Phí phạt";
            case ADJUSTMENT: return "Điều chỉnh số dư";
            default: return type.name();
        }
    }

    private String formatMoney(BigDecimal amount) {
        return VND_FORMAT.format(amount);
    }

    private BigDecimal calculateTotalCommission() {
        List<WalletTransaction> commissionTxns = transactionRepository.findByTransactionType(
                TransactionType.COMMISSION_FEE
        );
        return commissionTxns.stream()
                .map(WalletTransaction::getAmount)
                .map(BigDecimal::abs)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calculateMonthlyCommission() {
        YearMonth currentMonth = YearMonth.now();
        LocalDateTime start = currentMonth.atDay(1).atStartOfDay();
        LocalDateTime end = currentMonth.atEndOfMonth().atTime(23, 59, 59);

        List<WalletTransaction> commissionTxns = transactionRepository
                .findByTransactionTypeAndCreatedAtBetween(TransactionType.COMMISSION_FEE, start, end);

        return commissionTxns.stream()
                .map(WalletTransaction::getAmount)
                .map(BigDecimal::abs)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
