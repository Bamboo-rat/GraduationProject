package com.example.backend.repository;

import com.example.backend.entity.WalletTransaction;
import com.example.backend.entity.enums.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for WalletTransaction entity
 */
@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, String> {

    /**
     * Find all transactions for a wallet
     */
    @Query("SELECT t FROM WalletTransaction t WHERE t.wallet.walletId = :walletId ORDER BY t.createdAt DESC")
    Page<WalletTransaction> findByWalletId(String walletId, Pageable pageable);

    /**
     * Find transactions by wallet and type
     */
    @Query("SELECT t FROM WalletTransaction t WHERE t.wallet.walletId = :walletId AND t.transactionType = :type ORDER BY t.createdAt DESC")
    Page<WalletTransaction> findByWalletIdAndType(String walletId, TransactionType type, Pageable pageable);

    /**
     * Find transactions by wallet and date range
     */
    @Query("SELECT t FROM WalletTransaction t WHERE t.wallet.walletId = :walletId AND t.createdAt BETWEEN :startDate AND :endDate ORDER BY t.createdAt DESC")
    List<WalletTransaction> findByWalletIdAndDateRange(String walletId, LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Find transactions by order ID
     */
    @Query("SELECT t FROM WalletTransaction t WHERE t.order.orderId = :orderId ORDER BY t.createdAt DESC")
    List<WalletTransaction> findByOrderId(String orderId);

    /**
     * Get total amount by transaction type for a wallet
     */
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM WalletTransaction t WHERE t.wallet.walletId = :walletId AND t.transactionType = :type")
    BigDecimal getTotalAmountByType(String walletId, TransactionType type);

    /**
     * Count transactions by type in date range
     */
    @Query("SELECT COUNT(t) FROM WalletTransaction t WHERE t.transactionType = :type AND t.createdAt BETWEEN :startDate AND :endDate")
    Long countByTypeAndDateRange(TransactionType type, LocalDateTime startDate, LocalDateTime endDate);
}
