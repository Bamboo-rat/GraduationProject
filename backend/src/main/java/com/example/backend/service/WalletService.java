package com.example.backend.service;

import com.example.backend.dto.request.ManualTransactionRequest;
import com.example.backend.dto.response.*;
import com.example.backend.entity.Order;
import com.example.backend.entity.SupplierWallet;
import com.example.backend.entity.Supplier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Service for managing supplier wallets
 */
public interface WalletService {

    /**
     * Create a new wallet for supplier
     * Called automatically when supplier is approved
     */
    SupplierWallet createWallet(Supplier supplier);


    /**
     * Add pending balance when order is completed
     */
    void addPendingBalance(String supplierId, Order order, BigDecimal amount, String description);

    /**
     * Refund money when order is cancelled
     */
    void refundOrder(String supplierId, Order order, BigDecimal amount, boolean isPending);

    /**
     * End of day job: Release pending balance to available
     */
    void endOfDayRelease();

    /**
     * End of month job: Auto-withdraw available balance and reset monthly earnings
     */
    void endOfMonthWithdrawal();

    // ==================== NEW METHODS FOR CONTROLLER ====================

    /**
     * Get current supplier's wallet
     */
    WalletResponse getMyWallet();

    /**
     * Get wallet summary for current supplier
     */
    WalletSummaryResponse getWalletSummary();

    /**
     * Get transactions for current supplier
     */
    Page<TransactionResponse> getMyTransactions(
            String transactionType,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable
    );

    /**
     * Get wallet statistics
     */
    WalletStatsResponse getWalletStats(Integer year, Integer month);

    
    // ==================== ADMIN METHODS ====================

    /**
     * Get wallet by supplier ID (DTO)
     */
    WalletResponse getWalletBySupplierId(String supplierId);

    /**
     * Get all transactions across all suppliers (admin)
     */
    Page<TransactionResponse> getAllTransactions(
            String supplierId,
            String transactionType,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable
    );

    /**
     * Get transactions for specific supplier (admin)
     */
    Page<TransactionResponse> getSupplierTransactions(
            String supplierId,
            String transactionType,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable
    );

    /**
     * Get all wallets (admin)
     */
    Page<WalletResponse> getAllWallets(String status, Pageable pageable);

    /**
     * Get system wallet summary (admin)
     */
    SystemWalletSummaryResponse getSystemWalletSummary();

    /**
     * Get reconciliation report (admin)
     */
    ReconciliationResponse getReconciliationReport(LocalDate startDate, LocalDate endDate);

    /**
     * Update wallet status (admin)
     */
    WalletResponse updateWalletStatus(String walletId, String status);

    /**
     * Create manual transaction (admin)
     */
    TransactionResponse createManualTransaction(ManualTransactionRequest request);

        /**
         * Admin marks a payout as paid for a supplier's wallet (used in periodic settlement model).
         * This debits the supplier's available balance and records an END_OF_MONTH_WITHDRAWAL transaction.
         */
        TransactionResponse markPayoutAsPaid(String walletId, java.math.BigDecimal amount, String externalReference, String adminNote);
}
