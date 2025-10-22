package com.example.backend.service;

import com.example.backend.entity.Order;
import com.example.backend.entity.SupplierWallet;
import com.example.backend.entity.Supplier;

import java.math.BigDecimal;

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
     * Get wallet by supplier ID
     */
    SupplierWallet getWalletBySupplierId(String supplierId);

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
}
