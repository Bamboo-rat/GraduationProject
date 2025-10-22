package com.example.backend.entity;

import com.example.backend.entity.enums.WithdrawalStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity quản lý yêu cầu rút tiền của nhà cung cấp
 * Nhà cung cấp tạo yêu cầu -> Admin xét duyệt -> Chuyển khoản
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "withdrawal_requests", indexes = {
    @Index(name = "idx_withdrawal_wallet", columnList = "wallet_id"),
    @Index(name = "idx_withdrawal_status", columnList = "status"),
    @Index(name = "idx_withdrawal_created", columnList = "createdAt"),
    @Index(name = "idx_withdrawal_status_created", columnList = "status, createdAt")
})
public class WithdrawalRequest {
    
    @Id
    @UuidGenerator
    private String requestId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wallet_id", nullable = false)
    private SupplierWallet wallet;

    /**
     * Số tiền yêu cầu rút
     */
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    /**
     * Số tiền thực nhận (sau khi trừ phí)
     */
    @Column(precision = 15, scale = 2)
    private BigDecimal netAmount;

    /**
     * Phí rút tiền (nếu có)
     */
    @Column(precision = 15, scale = 2)
    private BigDecimal fee = BigDecimal.ZERO;

    /**
     * Thông tin tài khoản ngân hàng nhận tiền
     */
    @Column(nullable = false, length = 50)
    private String bankAccountNumber;

    @Column(nullable = false, length = 100)
    private String bankAccountName;

    @Column(nullable = false, length = 100)
    private String bankName;

    @Column(length = 100)
    private String bankBranch;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WithdrawalStatus status = WithdrawalStatus.PENDING;

    /**
     * Ghi chú của nhà cung cấp
     */
    @Column(length = 500)
    private String supplierNote;

    /**
     * Ghi chú của admin
     */
    @Column(length = 500)
    private String adminNote;

    /**
     * ID của admin xử lý
     */
    private String processedBy;

    /**
     * Thời điểm xử lý
     */
    private LocalDateTime processedAt;

    /**
     * Thời điểm hoàn thành
     */
    private LocalDateTime completedAt;

    /**
     * Mã giao dịch ngân hàng (reference)
     */
    @Column(length = 100)
    private String bankTransactionCode;

    /**
     * Lý do từ chối/thất bại
     */
    @Column(length = 500)
    private String rejectionReason;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Giao dịch ví liên quan
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id")
    private WalletTransaction transaction;
}
