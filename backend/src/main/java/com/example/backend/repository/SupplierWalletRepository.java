package com.example.backend.repository;

import com.example.backend.entity.SupplierWallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Repository for SupplierWallet entity
 */
@Repository
public interface SupplierWalletRepository extends JpaRepository<SupplierWallet, String> {

    /**
     * Find wallet by supplier ID
     */
    @Query("SELECT w FROM SupplierWallet w WHERE w.supplier.userId = :supplierId")
    Optional<SupplierWallet> findBySupplierId(String supplierId);

    /**
     * Find all wallets with pending balance > 0
     * Used by end-of-day job to release pending balances
     */
    @Query("SELECT w FROM SupplierWallet w WHERE w.pendingBalance > 0 AND w.status = 'ACTIVE'")
    List<SupplierWallet> findAllWithPendingBalance();

    /**
     * Find all wallets with available balance > 0
     * Used by end-of-month job to auto-withdraw
     */
    @Query("SELECT w FROM SupplierWallet w WHERE w.availableBalance > 0 AND w.status = 'ACTIVE'")
    List<SupplierWallet> findAllWithAvailableBalance();

    /**
     * Find all wallets by status
     */
    @Query("SELECT w FROM SupplierWallet w WHERE w.status = :status")
    List<SupplierWallet> findAllByStatus(com.example.backend.entity.enums.WalletStatus status);

    /**
     * Get total available balance across all suppliers
     */
    @Query("SELECT COALESCE(SUM(w.availableBalance), 0) FROM SupplierWallet w WHERE w.status = 'ACTIVE'")
    BigDecimal getTotalAvailableBalance();

    /**
     * Get total pending balance across all suppliers
     */
    @Query("SELECT COALESCE(SUM(w.pendingBalance), 0) FROM SupplierWallet w WHERE w.status = 'ACTIVE'")
    BigDecimal getTotalPendingBalance();

    /**
     * Get total earnings for current month across all suppliers
     */
    @Query("SELECT COALESCE(SUM(w.monthlyEarnings), 0) FROM SupplierWallet w WHERE w.status = 'ACTIVE' AND w.currentMonth = :currentMonth")
    BigDecimal getTotalMonthlyEarnings(String currentMonth);
}
