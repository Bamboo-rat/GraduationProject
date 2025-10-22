package com.example.backend.service.impl;

import com.example.backend.entity.Order;
import com.example.backend.entity.Supplier;
import com.example.backend.entity.SupplierWallet;
import com.example.backend.entity.WalletTransaction;
import com.example.backend.entity.enums.TransactionType;
import com.example.backend.entity.enums.WalletStatus;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.repository.SupplierWalletRepository;
import com.example.backend.repository.WalletTransactionRepository;
import com.example.backend.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

/**
 * Service implementation for wallet management
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WalletServiceImpl implements WalletService {

    private final SupplierWalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;

    @Override
    @Transactional
    public SupplierWallet createWallet(Supplier supplier) {
        log.info("Creating wallet for supplier ID: {}", supplier.getUserId());

        // Check if wallet already exists
        if (walletRepository.findBySupplierId(supplier.getUserId()).isPresent()) {
            log.warn("Wallet already exists for supplier ID: {}", supplier.getUserId());
            return walletRepository.findBySupplierId(supplier.getUserId()).get();
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
    @Transactional(readOnly = true)
    public SupplierWallet getWalletBySupplierId(String supplierId) {
        return walletRepository.findBySupplierId(supplierId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.WALLET_NOT_FOUND));
    }

    @Override
    @Transactional
    public void addPendingBalance(String supplierId, Order order, BigDecimal amount, String description) {
        log.info("Adding pending balance for supplier ID: {}, order ID: {}, amount: {}", supplierId, order.getOrderId(), amount);

        SupplierWallet wallet = getWalletBySupplierId(supplierId);
        Supplier supplier = wallet.getSupplier();

        // Calculate commission fee
        BigDecimal commissionRate = supplier.getCommissionRate() != null ?
                                    BigDecimal.valueOf(supplier.getCommissionRate() / 100.0) :
                                    BigDecimal.ZERO;
        BigDecimal commissionAmount = amount.multiply(commissionRate).setScale(2, BigDecimal.ROUND_HALF_UP);
        BigDecimal netAmount = amount.subtract(commissionAmount); // Số tiền nhà cung cấp thực nhận

        log.info("Order amount: {}, Commission rate: {}%, Commission: {}, Net amount: {}",
                 amount, supplier.getCommissionRate(), commissionAmount, netAmount);

        // Add net amount to pending balance (đã trừ phí hoa hồng)
        wallet.addPendingBalance(netAmount);

        // Add net amount to earnings (thu nhập thực tế)
        wallet.addEarnings(netAmount);

        // Save wallet
        wallet = walletRepository.save(wallet);

        // Create transaction record for order income
        WalletTransaction orderTransaction = new WalletTransaction();
        orderTransaction.setWallet(wallet);
        orderTransaction.setTransactionType(TransactionType.ORDER_COMPLETED);
        orderTransaction.setAmount(netAmount);
        orderTransaction.setBalanceAfter(wallet.getAvailableBalance());
        orderTransaction.setPendingBalanceAfter(wallet.getPendingBalance());
        orderTransaction.setOrder(order);
        orderTransaction.setDescription(description != null ? description :
                "Thu nhập từ đơn hàng #" + order.getOrderCode() +
                " (Tổng: " + amount + " VND, Phí: " + commissionAmount + " VND)");

        transactionRepository.save(orderTransaction);

        // Create transaction record for commission fee (if applicable)
        if (commissionAmount.compareTo(BigDecimal.ZERO) > 0) {
            WalletTransaction commissionTransaction = new WalletTransaction();
            commissionTransaction.setWallet(wallet);
            commissionTransaction.setTransactionType(TransactionType.COMMISSION_FEE);
            commissionTransaction.setAmount(commissionAmount.negate()); // Negative for deduction
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

        SupplierWallet wallet = getWalletBySupplierId(supplierId);
        Supplier supplier = wallet.getSupplier();

        // Calculate original commission (to know the net amount that was added)
        BigDecimal commissionRate = supplier.getCommissionRate() != null ?
                                    BigDecimal.valueOf(supplier.getCommissionRate() / 100.0) :
                                    BigDecimal.ZERO;
        BigDecimal commissionAmount = amount.multiply(commissionRate).setScale(2, BigDecimal.ROUND_HALF_UP);
        BigDecimal netAmount = amount.subtract(commissionAmount); // Số tiền đã cộng vào wallet

        log.info("Refunding - Original amount: {}, Commission: {}, Net amount to refund: {}",
                 amount, commissionAmount, netAmount);

        // Refund net amount (trừ từ pending hoặc available)
        wallet.refund(netAmount, isPending);

        // Subtract from earnings (QUAN TRỌNG - tránh earnings bị sai)
        wallet.subtractEarnings(netAmount);

        // Save wallet
        wallet = walletRepository.save(wallet);

        // Create transaction record
        WalletTransaction transaction = new WalletTransaction();
        transaction.setWallet(wallet);
        transaction.setTransactionType(TransactionType.ORDER_REFUND);
        transaction.setAmount(netAmount.negate()); // Negative amount for refund
        transaction.setBalanceAfter(wallet.getAvailableBalance());
        transaction.setPendingBalanceAfter(wallet.getPendingBalance());
        transaction.setOrder(order);
        transaction.setDescription("Hoàn tiền đơn hàng #" + order.getOrderCode() +
                (isPending ? " (hủy trước khi giao)" : " (trả hàng)") +
                " - Tổng: " + amount + " VND, Hoàn: " + netAmount + " VND");

        transactionRepository.save(transaction);

        log.info("Order refunded successfully. Wallet ID: {}, Net refunded: {}", wallet.getWalletId(), netAmount);
    }

    @Override
    @Scheduled(cron = "0 0 0 * * *") // Run at 00:00 every day
    @Transactional
    public void endOfDayRelease() {
        LocalDate today = LocalDate.now();
        log.info("Starting End-of-Day Release for date: {}", today.minusDays(1));

        List<SupplierWallet> wallets = walletRepository.findAllWithPendingBalance();
        int processedCount = 0;

        for (SupplierWallet wallet : wallets) {
            try {
                BigDecimal pendingAmount = wallet.getPendingBalance();

                if (pendingAmount.compareTo(BigDecimal.ZERO) > 0) {
                    // Release pending → available
                    wallet.releasePendingBalance(pendingAmount);
                    wallet = walletRepository.save(wallet);

                    // Create transaction record
                    WalletTransaction transaction = new WalletTransaction();
                    transaction.setWallet(wallet);
                    transaction.setTransactionType(TransactionType.END_OF_DAY_RELEASE);
                    transaction.setAmount(pendingAmount);
                    transaction.setBalanceAfter(wallet.getAvailableBalance());
                    transaction.setPendingBalanceAfter(BigDecimal.ZERO);
                    transaction.setDescription("Chuyển số dư khả dụng cuối ngày " + today.minusDays(1));

                    transactionRepository.save(transaction);

                    processedCount++;
                    log.info("Released {} VND for wallet ID: {}", pendingAmount, wallet.getWalletId());
                }
            } catch (Exception e) {
                log.error("Error processing end-of-day release for wallet ID: {}", wallet.getWalletId(), e);
                // Continue with next wallet
            }
        }

        log.info("End-of-Day Release completed. Total wallets processed: {}", processedCount);
    }

    @Override
    @Scheduled(cron = "0 0 0 1 * *") // Run at 00:00 on the 1st day of every month
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
                    // Auto-withdraw available → withdrawn
                    wallet.autoWithdrawMonthly();

                    // Create transaction record
                    WalletTransaction transaction = new WalletTransaction();
                    transaction.setWallet(wallet);
                    transaction.setTransactionType(TransactionType.END_OF_MONTH_WITHDRAWAL);
                    transaction.setAmount(availableAmount);
                    transaction.setBalanceAfter(BigDecimal.ZERO);
                    transaction.setPendingBalanceAfter(wallet.getPendingBalance());
                    transaction.setDescription("Rút tiền tự động cuối tháng " + lastMonth);

                    transactionRepository.save(transaction);

                    processedCount++;
                    log.info("Withdrew {} VND for wallet ID: {}", availableAmount, wallet.getWalletId());
                }

                // Reset monthly earnings for new month
                wallet.resetMonthlyEarnings();
                wallet.setCurrentMonth(currentMonth.toString());
                walletRepository.save(wallet);

            } catch (Exception e) {
                log.error("Error processing end-of-month withdrawal for wallet ID: {}", wallet.getWalletId(), e);
                // Continue with next wallet
            }
        }

        log.info("End-of-Month Withdrawal completed. Total wallets processed: {}", processedCount);
    }
}
