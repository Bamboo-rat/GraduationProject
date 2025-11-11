package com.example.backend.entity;

import com.example.backend.entity.enums.TransactionType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity lưu trữ lịch sử giao dịch trong ví tiền
 * Mỗi thay đổi số dư đều được ghi lại để truy vết
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "wallet_transactions", indexes = {
    @Index(name = "idx_transaction_wallet", columnList = "wallet_id"),
    @Index(name = "idx_transaction_type", columnList = "transactionType"),
    @Index(name = "idx_transaction_order", columnList = "order_id"),
    @Index(name = "idx_transaction_created", columnList = "createdAt"),
    @Index(name = "idx_transaction_wallet_type", columnList = "wallet_id, transactionType"),
    @Index(name = "idx_transaction_wallet_created", columnList = "wallet_id, createdAt")
})
public class WalletTransaction {
    
    @Id
    @UuidGenerator
    private String transactionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wallet_id", nullable = false)
    private SupplierWallet wallet;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType transactionType;

    /**
     * Số tiền giao dịch (luôn là số dương)
     * Dấu +/- phụ thuộc vào transactionType
     */
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    /**
     * Số dư available sau giao dịch
     */
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal balanceAfter;

    /**
     * Số dư pending sau giao dịch
     */
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal pendingBalanceAfter;

    /**
     * Liên kết đến đơn hàng (nếu giao dịch liên quan đến đơn hàng)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    /**
     * Mô tả chi tiết giao dịch
     */
    @Column(length = 500)
    private String description;

    /**
     * Tham chiếu bên ngoài (mã giao dịch ngân hàng, mã rút tiền...)
     */
    @Column(length = 100)
    private String externalReference;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Ghi chú nội bộ của admin
     */
    @Column(length = 1000)
    private String adminNote;
}
