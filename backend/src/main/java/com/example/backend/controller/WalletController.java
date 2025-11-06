package com.example.backend.controller;

import com.example.backend.dto.request.ManualTransactionRequest;
import com.example.backend.dto.response.*;
import com.example.backend.service.WalletService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * Controller for managing supplier wallets
 */
@Slf4j
@RestController
@RequestMapping("/api/wallets")
@RequiredArgsConstructor
@Tag(name = "Wallet Management", description = "APIs for managing supplier wallets and transactions")
public class WalletController {

    private final WalletService walletService;

    // ==================== SUPPLIER ENDPOINTS ====================

    @GetMapping("/supplier/me")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get current supplier's wallet", description = "Supplier gets their own wallet information")
    public ResponseEntity<ApiResponse<WalletResponse>> getMyWallet() {
        log.info("Fetching wallet for current supplier");
        WalletResponse wallet = walletService.getMyWallet();
        return ResponseEntity.ok(ApiResponse.success(wallet));
    }

    @GetMapping("/supplier/me/summary")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get wallet summary", description = "Get summary of wallet balance and earnings")
    public ResponseEntity<ApiResponse<WalletSummaryResponse>> getWalletSummary() {
        log.info("Fetching wallet summary for current supplier");
        WalletSummaryResponse summary = walletService.getWalletSummary();
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @GetMapping("/supplier/me/transactions")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get supplier's transactions", description = "Get paginated list of wallet transactions")
    public ResponseEntity<ApiResponse<Page<TransactionResponse>>> getMyTransactions(
            @Parameter(description = "Transaction type filter")
            @RequestParam(required = false) String transactionType,
            
            @Parameter(description = "Start date (YYYY-MM-DD)")
            @RequestParam(required = false) LocalDate startDate,
            
            @Parameter(description = "End date (YYYY-MM-DD)")
            @RequestParam(required = false) LocalDate endDate,
            
            @Parameter(description = "Page number (0-indexed)")
            @RequestParam(defaultValue = "0") int page,
            
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "20") int size,
            
            @Parameter(description = "Sort field")
            @RequestParam(defaultValue = "createdAt") String sortBy,
            
            @Parameter(description = "Sort direction")
            @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        log.info("Fetching transactions for current supplier: type={}, page={}, size={}", transactionType, page, size);
        
        Sort.Direction direction = sortDir.equalsIgnoreCase("ASC") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        Page<TransactionResponse> transactions = walletService.getMyTransactions(
                transactionType, startDate, endDate, pageable
        );
        
        return ResponseEntity.ok(ApiResponse.success(transactions));
    }

    @GetMapping("/supplier/me/stats")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get wallet statistics", description = "Get monthly/yearly wallet statistics")
    public ResponseEntity<ApiResponse<WalletStatsResponse>> getWalletStats(
            @Parameter(description = "Year (YYYY)")
            @RequestParam(required = false) Integer year,
            
            @Parameter(description = "Month (1-12)")
            @RequestParam(required = false) Integer month
    ) {
        log.info("Fetching wallet statistics for current supplier: year={}, month={}", year, month);
        WalletStatsResponse stats = walletService.getWalletStats(year, month);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    // NOTE: Supplier self-withdrawal removed - using periodic payout/settlement model instead.
    // Suppliers view their availableBalance but cannot withdraw.
    // Admin performs payouts via POST /api/wallets/admin/{walletId}/payout

    // ==================== ADMIN ENDPOINTS ====================

    @GetMapping("/admin/supplier/{supplierId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Get supplier wallet by ID", description = "Admin gets wallet information of a specific supplier")
    public ResponseEntity<ApiResponse<WalletResponse>> getSupplierWallet(
            @PathVariable String supplierId
    ) {
        log.info("Admin fetching wallet for supplier ID: {}", supplierId);
        WalletResponse wallet = walletService.getWalletBySupplierId(supplierId);
        return ResponseEntity.ok(ApiResponse.success(wallet));
    }

    @GetMapping("/admin/supplier/{supplierId}/transactions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Get supplier transactions", description = "Admin gets transaction history of a supplier")
    public ResponseEntity<ApiResponse<Page<TransactionResponse>>> getSupplierTransactions(
            @PathVariable String supplierId,
            @RequestParam(required = false) String transactionType,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        log.info("Admin fetching transactions for supplier ID: {}", supplierId);
        
        Sort.Direction direction = sortDir.equalsIgnoreCase("ASC") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        Page<TransactionResponse> transactions = walletService.getSupplierTransactions(
                supplierId, transactionType, startDate, endDate, pageable
        );
        
        return ResponseEntity.ok(ApiResponse.success(transactions));
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    @Operation(summary = "Get all supplier wallets", description = "Admin gets paginated list of all supplier wallets")
    public ResponseEntity<ApiResponse<Page<WalletResponse>>> getAllWallets(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        log.info("Admin fetching all wallets: page={}, size={}", page, size);
        
        Sort.Direction direction = sortDir.equalsIgnoreCase("ASC") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        Page<WalletResponse> wallets = walletService.getAllWallets(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(wallets));
    }

    @GetMapping("/admin/summary")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    @Operation(summary = "Get system wallet summary", description = "Admin gets overall wallet system statistics")
    public ResponseEntity<ApiResponse<SystemWalletSummaryResponse>> getSystemSummary() {
        log.info("Admin fetching system wallet summary");
        SystemWalletSummaryResponse summary = walletService.getSystemWalletSummary();
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @GetMapping("/admin/reconciliation")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    @Operation(summary = "Get reconciliation report", description = "Admin gets financial reconciliation report")
    public ResponseEntity<ApiResponse<ReconciliationResponse>> getReconciliation(
            @Parameter(description = "Start date (YYYY-MM-DD)")
            @RequestParam(required = false) LocalDate startDate,
            
            @Parameter(description = "End date (YYYY-MM-DD)")
            @RequestParam(required = false) LocalDate endDate
    ) {
        log.info("Admin fetching reconciliation report: {} to {}", startDate, endDate);
        ReconciliationResponse report = walletService.getReconciliationReport(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @PatchMapping("/admin/{walletId}/status")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Update wallet status", description = "Admin updates wallet status (ACTIVE/SUSPENDED)")
    public ResponseEntity<ApiResponse<WalletResponse>> updateWalletStatus(
            @PathVariable String walletId,
            @RequestParam String status
    ) {
        log.info("Admin updating wallet status: walletId={}, status={}", walletId, status);
        WalletResponse wallet = walletService.updateWalletStatus(walletId, status);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái ví thành công", wallet));
    }

    @PostMapping("/admin/manual-transaction")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Create manual transaction", description = "Admin creates manual adjustment transaction")
    public ResponseEntity<ApiResponse<TransactionResponse>> createManualTransaction(
            @RequestBody ManualTransactionRequest request
    ) {
        log.info("Admin creating manual transaction for supplier: {}", request.getSupplierId());
        TransactionResponse transaction = walletService.createManualTransaction(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo giao dịch thủ công thành công", transaction));
    }

    @PostMapping("/admin/{walletId}/payout")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','MODERATOR')")
    @Operation(summary = "Mark payout as PAID", description = "Admin marks that payout has been paid to supplier (used in periodic settlement model)")
    public ResponseEntity<ApiResponse<TransactionResponse>> markPayoutAsPaid(
            @PathVariable String walletId,
            @RequestBody com.example.backend.dto.request.PayoutRequest request
    ) {
        log.info("Admin marking payout as paid: walletId={}, amount={}", walletId, request.getAmount());
        TransactionResponse txn = walletService.markPayoutAsPaid(walletId, request.getAmount(), request.getExternalReference(), request.getAdminNote());
        return ResponseEntity.ok(ApiResponse.success("Đã ghi nhận thanh toán (payout) cho nhà cung cấp", txn));
    }
}
