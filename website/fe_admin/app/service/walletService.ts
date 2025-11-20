import axiosInstance from '../config/axios';
import type { ApiResponse, PageResponse } from './types';

// Types
export interface WalletResponse {
  walletId: string;
  supplierId: string;
  supplierName: string;
  storeName: string;
  
  availableBalance: number;
  pendingBalance: number;
  totalBalance: number;
  
  totalEarnings: number;
  monthlyEarnings: number;
  totalWithdrawn: number;
  totalRefunded: number;
  
  status: string;
  currentMonth: string;
  
  lastWithdrawalDate?: string;
  createdAt: string;
  updatedAt: string;
  
  commissionRate?: number;
}

export interface SystemWalletSummaryResponse {
  totalAvailableBalance: number;
  totalPendingBalance: number;
  totalBalance: number;
  
  totalEarnings: number;
  monthlyEarnings: number;
  totalWithdrawn: number;
  totalRefunded: number;
  
  totalCommissionEarned: number;
  monthlyCommissionEarned: number;
  
  totalActiveWallets: number;
  totalSuspendedWallets: number;
  totalWallets: number;
  
  averageWalletBalance: number;
  averageMonthlyEarnings: number;
}

export interface TransactionResponse {
  id: string;
  transactionId: string;
  walletId: string;
  
  supplierId?: string;
  supplierName?: string;
  
  transactionType: string;
  transactionTypeLabel: string;
  amount: number;
  description: string;
  
  balanceAfter: number;
  pendingBalanceAfter: number;
  
  orderId?: string;
  orderCode?: string;
  externalReference?: string;
  
  adminId?: string;
  adminName?: string;
  adminNote?: string;
  
  createdAt: string;
  
  isIncome: boolean;
  displayAmount: string;
  status?: string;
}

export interface ReconciliationResponse {
  startDate: string;
  endDate: string;
  period: string;
  
  totalOrderValue: number;
  totalOrders: number;
  totalCommission: number;
  
  totalSupplierEarnings: number;
  totalPaidToSuppliers: number;
  pendingPayments: number;  // ONLY pending balance (chờ 7 ngày)
  totalSupplierBalance: number;  // Total balance = available + pending (tổng nợ NCC)
  
  totalRefunded: number;
  refundCount: number;
  
  platformRevenue: number;
  platformExpenses: number;
  netPlatformRevenue: number;
  
  supplierBreakdown: SupplierReconciliation[];
}

export interface SupplierReconciliation {
  supplierId: string;
  supplierName: string;
  storeName: string;
  totalEarnings: number;
  commission: number;
  netEarnings: number;
  orderCount: number;
  refunded: number;
}

export interface ManualTransactionRequest {
  supplierId: string;
  amount: number;
  transactionType: 'ADMIN_DEPOSIT' | 'ADMIN_DEDUCTION' | 'ADJUSTMENT' | 'PENALTY_FEE';
  description: string;
  adminNote?: string;
  externalReference?: string;
}

// Wallet Service for Admin
class AdminWalletService {
  private handleError(error: any): Error {
    return new Error(error.response?.data?.message || error.message || 'An unexpected error occurred');
  }

  /**
   * Get supplier wallet by ID
   */
  async getSupplierWallet(supplierId: string): Promise<WalletResponse> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<WalletResponse>>(
        `/wallets/admin/supplier/${supplierId}`
      );
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all transactions (admin) - all suppliers
   */
  async getAllTransactions(params?: {
    supplierId?: string;
    transactionType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  }): Promise<PageResponse<TransactionResponse>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.supplierId) queryParams.append('supplierId', params.supplierId);
      if (params?.transactionType) queryParams.append('transactionType', params.transactionType);
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      if (params?.page !== undefined) queryParams.append('page', params.page.toString());
      if (params?.size) queryParams.append('size', params.size.toString());
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortDir) queryParams.append('sortDir', params.sortDir);

      const { data } = await axiosInstance.get<ApiResponse<PageResponse<TransactionResponse>>>(
        `/wallets/admin/transactions?${queryParams.toString()}`
      );
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get supplier transactions (specific supplier)
   */
  async getSupplierTransactions(
    supplierId: string,
    params?: {
      transactionType?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      size?: number;
      sortBy?: string;
      sortDir?: string;
    }
  ): Promise<PageResponse<TransactionResponse>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.transactionType) queryParams.append('transactionType', params.transactionType);
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      if (params?.page !== undefined) queryParams.append('page', params.page.toString());
      if (params?.size) queryParams.append('size', params.size.toString());
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortDir) queryParams.append('sortDir', params.sortDir);

      const { data } = await axiosInstance.get<ApiResponse<PageResponse<TransactionResponse>>>(
        `/wallets/admin/supplier/${supplierId}/transactions?${queryParams.toString()}`
      );
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all wallets with pagination
   */
  async getAllWallets(params?: {
    status?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  }): Promise<PageResponse<WalletResponse>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.page !== undefined) queryParams.append('page', params.page.toString());
      if (params?.size) queryParams.append('size', params.size.toString());
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortDir) queryParams.append('sortDir', params.sortDir);

      const { data } = await axiosInstance.get<ApiResponse<PageResponse<WalletResponse>>>(
        `/wallets/admin/all?${queryParams.toString()}`
      );
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get system wallet summary
   */
  async getSystemSummary(): Promise<SystemWalletSummaryResponse> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<SystemWalletSummaryResponse>>(
        '/wallets/admin/summary'
      );
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get reconciliation report
   */
  async getReconciliation(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ReconciliationResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);

      const { data } = await axiosInstance.get<ApiResponse<ReconciliationResponse>>(
        `/wallets/admin/reconciliation?${queryParams.toString()}`
      );
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update wallet status
   */
  async updateWalletStatus(walletId: string, status: string): Promise<WalletResponse> {
    try {
      const { data } = await axiosInstance.patch<ApiResponse<WalletResponse>>(
        `/wallets/admin/${walletId}/status?status=${status}`
      );
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create manual transaction
   */
  async createManualTransaction(request: ManualTransactionRequest): Promise<TransactionResponse> {
    try {
      const { data } = await axiosInstance.post<ApiResponse<TransactionResponse>>(
        '/wallets/admin/manual-transaction',
        request
      );
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Format currency to VND
   */
  formatVND(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  /**
   * Format date
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('vi-VN');
  }

  /**
   * Get status badge color
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Get transaction type label
   */
  getTransactionTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'ORDER_COMPLETED': '✅ Đơn hàng hoàn thành',
      'ORDER_PAYMENT': 'Thanh toán đơn hàng',
      'WITHDRAWAL': 'Rút tiền',
      'COMMISSION_FEE': '💳 Phí hoa hồng Platform',
      'COMMISSION_REFUND': '↩️ Hoàn hoa hồng (đơn hủy)',
      'COMMISSION': 'Hoa hồng',
      'REFUND': 'Hoàn tiền',
      'ORDER_REFUND': '❌ Hoàn tiền đơn hủy',
      'BALANCE_RELEASE': 'Giải ngân',
      'ADJUSTMENT': 'Điều chỉnh',
      'PENALTY': 'Phạt',
      'BONUS': 'Thưởng',
    };
    return labels[type] || type;
  }

  /**
   * Get transaction status color
   */
  getTransactionStatusColor(status: string): string {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Get transaction status label
   */
  getTransactionStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'COMPLETED': 'Hoàn thành',
      'PENDING': 'Đang xử lý',
      'FAILED': 'Thất bại',
    };
    return labels[status] || status;
  }
}

// Export singleton instance
export default new AdminWalletService();
