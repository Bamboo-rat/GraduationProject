package com.example.backend.entity;

import com.example.backend.entity.enums.WalletStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity quản lý ví tiền của nhà cung cấp
 * Lưu trữ số dư, thu nhập và các giao dịch liên quan đến tiền
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "supplier_wallets", indexes = {
    @Index(name = "idx_wallet_supplier", columnList = "supplier_id", unique = true),
    @Index(name = "idx_wallet_status", columnList = "status"),
    @Index(name = "idx_wallet_balance", columnList = "availableBalance")
})
public class SupplierWallet {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long walletId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false, unique = true)
    private Supplier supplier;

    /**
     * Số dư khả dụng: Tiền có thể rút ra
     * = Tổng thu nhập - Tiền đang giữ - Tiền đã rút
     */
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal availableBalance = BigDecimal.ZERO;

    /**
     * Số dư đang giữ: Tiền từ đơn hàng chưa hoàn thành/đang xử lý
     * Sẽ chuyển sang availableBalance khi đơn hàng hoàn thành
     */
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal pendingBalance = BigDecimal.ZERO;

    /**
     * Tổng thu nhập từ trước đến nay
     */
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal totalEarnings = BigDecimal.ZERO;

    /**
     * Tổng số tiền đã rút
     */
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal totalWithdrawn = BigDecimal.ZERO;

    /**
     * Tổng tiền hoàn trả cho khách hàng (khi hủy đơn)
     */
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal totalRefunded = BigDecimal.ZERO;

    /**
     * Thu nhập trong tháng hiện tại
     */
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal monthlyEarnings = BigDecimal.ZERO;

    /**
     * Tháng/năm của monthlyEarnings (format: YYYY-MM)
     * Để reset monthlyEarnings mỗi tháng
     */
    @Column(length = 7)
    private String currentMonth;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WalletStatus status = WalletStatus.ACTIVE;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Thời điểm rút tiền gần nhất
     */
    private LocalDateTime lastWithdrawalDate;

    @OneToMany(mappedBy = "wallet", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<WalletTransaction> transactions = new ArrayList<>();

    // Helper methods
    
    /**
     * Thêm tiền vào pending balance khi khách đặt hàng
     * Tiền này chưa được tính là thu nhập, chỉ là tạm giữ
     */
    public void addPendingBalance(BigDecimal amount) {
        this.pendingBalance = this.pendingBalance.add(amount);
    }

    /**
     * Thêm thu nhập từ đơn hàng hoàn thành
     * Tiền vẫn nằm trong pending, chưa về availableBalance
     * Chỉ tăng totalEarnings và monthlyEarnings
     */
    public void addEarnings(BigDecimal amount) {
        this.totalEarnings = this.totalEarnings.add(amount);
        this.monthlyEarnings = this.monthlyEarnings.add(amount);
    }

    /**
     * Chuyển pending balance sang available balance (cuối ngày)
     * Tiền mới được phép rút sau khi chạy job cuối ngày
     */
    public void releasePendingBalance(BigDecimal amount) {
        this.pendingBalance = this.pendingBalance.subtract(amount);
        this.availableBalance = this.availableBalance.add(amount);
    }

    /**
     * Tự động rút tiền cuối tháng (chuyển available sang withdrawn)
     * Giả lập việc chuyển tiền về ngân hàng, không cần mock data thật
     */
    public void autoWithdrawMonthly() {
        if (this.availableBalance.compareTo(BigDecimal.ZERO) > 0) {
            this.totalWithdrawn = this.totalWithdrawn.add(this.availableBalance);
            this.availableBalance = BigDecimal.ZERO;
            this.lastWithdrawalDate = LocalDateTime.now();
        }
    }

    /**
     * Hoàn tiền cho khách hàng khi hủy đơn
     * - Nếu đơn chưa hoàn thành: Trừ từ pendingBalance
     * - Nếu đơn đã hoàn thành nhưng bị hủy: Trừ từ availableBalance
     */
    public void refund(BigDecimal amount, boolean isPending) {
        if (isPending) {
            this.pendingBalance = this.pendingBalance.subtract(amount);
        } else {
            this.availableBalance = this.availableBalance.subtract(amount);
        }
        this.totalRefunded = this.totalRefunded.add(amount);
    }

    /**
     * Trừ thu nhập khi hoàn tiền
     * Phải gọi method này khi refund để giữ totalEarnings chính xác
     */
    public void subtractEarnings(BigDecimal amount) {
        this.totalEarnings = this.totalEarnings.subtract(amount);
        this.monthlyEarnings = this.monthlyEarnings.subtract(amount);
    }

    /**
     * Trừ phí hoa hồng từ pending balance
     * Gọi sau khi addPendingBalance để khấu trừ phí cho admin
     */
    public void deductCommission(BigDecimal commissionAmount) {
        this.pendingBalance = this.pendingBalance.subtract(commissionAmount);
    }

    /**
     * Reset thu nhập tháng về 0 khi sang tháng mới
     */
    public void resetMonthlyEarnings() {
        this.monthlyEarnings = BigDecimal.ZERO;
    }
}
