import axiosInstance from '../config/axios';
import type { ApiResponse, Page } from './types';

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

export interface WalletSummaryResponse {
  availableBalance: number;
  pendingBalance: number;
  totalBalance: number;
  
  monthlyEarnings: number;
  monthlyOrders: number;
  totalOrdersThisMonth: number;
  
  totalEarnings: number;
  totalWithdrawn: number;
  totalRefunded: number;
  
  commissionRate: number;
  estimatedCommissionThisMonth: number;
  
  status: string;
  canWithdraw: boolean;
  minimumWithdrawal: number;
}

export interface TransactionResponse {
  id: string;
  transactionId: string;
  walletId: string;
  
  transactionType: string;
  transactionTypeLabel: string;
  amount: number;
  description: string;
  status: string;
  
  balanceAfter: number;
  pendingBalanceAfter: number;
  
  orderId?: string;
  orderCode?: string;
  externalReference?: string;
  
  createdAt: string;
  
  isIncome: boolean;
  displayAmount: string;
}

export interface WalletStatsResponse {
  year: number;
  month?: number;
  period: string;
  
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  
  totalTransactions: number;
  transactionTypeCount: Record<string, number>;
  
  monthlyBreakdown?: MonthlyStats[];
  transactionTypeBreakdown: TransactionTypeStats[];
}

export interface MonthlyStats {
  month: number;
  monthName: string;
  income: number;
  expense: number;
  net: number;
  transactionCount: number;
}

export interface TransactionTypeStats {
  transactionType: string;
  label: string;
  amount: number;
  count: number;
  isIncome: boolean;
}

export interface WithdrawalRequest {
  amount: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  note?: string;
}

export interface WithdrawalResponse {
  transactionId: string;
  amount: number;
  balanceAfter: number;
  status: string;
  message: string;
  requestedAt: string;
  processedAt?: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
}

// Wallet Service for Supplier
class SupplierWalletService {
  private handleError(error: any): Error {
    return new Error(error.response?.data?.message || error.message || 'An unexpected error occurred');
  }

  /**
   * Get current supplier's wallet
   */
  async getMyWallet(): Promise<WalletResponse> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<WalletResponse>>('/wallets/supplier/me');
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get wallet summary
   */
  async getWalletSummary(): Promise<WalletSummaryResponse> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<WalletSummaryResponse>>('/wallets/supplier/me/summary');
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get my transactions
   */
  async getMyTransactions(params?: {
    transactionType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  }): Promise<Page<TransactionResponse>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.transactionType) queryParams.append('transactionType', params.transactionType);
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      if (params?.page !== undefined) queryParams.append('page', params.page.toString());
      if (params?.size) queryParams.append('size', params.size.toString());
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortDir) queryParams.append('sortDir', params.sortDir);

      const { data } = await axiosInstance.get<ApiResponse<Page<TransactionResponse>>>(
        `/wallets/supplier/me/transactions?${queryParams.toString()}`
      );
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get wallet statistics
   */
  async getWalletStats(params?: {
    year?: number;
    month?: number;
  }): Promise<WalletStatsResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.year) queryParams.append('year', params.year.toString());
      if (params?.month) queryParams.append('month', params.month.toString());

      const { data } = await axiosInstance.get<ApiResponse<WalletStatsResponse>>(
        `/wallets/supplier/me/stats?${queryParams.toString()}`
      );
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Request withdrawal
   */
  async requestWithdrawal(request: WithdrawalRequest): Promise<WithdrawalResponse> {
    try {
      const { data } = await axiosInstance.post<ApiResponse<WithdrawalResponse>>(
        '/wallets/supplier/me/withdraw',
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
   * Get transaction type color
   */
  getTransactionTypeColor(type: string, isIncome: boolean): string {
    if (isIncome) {
      return 'text-green-600';
    }
    return 'text-red-600';
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
      'ORDER_PAYMENT': 'Thanh toán đơn hàng',
      'WITHDRAWAL': 'Rút tiền',
      'COMMISSION': 'Hoa hồng',
      'REFUND': 'Hoàn tiền',
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
export default new SupplierWalletService();
