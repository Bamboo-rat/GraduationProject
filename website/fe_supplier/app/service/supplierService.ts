import axiosInstance from '../config/axios';
import type { ApiResponse } from './authService';

// ============= SUPPLIER TYPES =============

export interface SupplierProfileUpdateRequest {
  fullName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  businessAddress?: string;
}

export interface SupplierBankUpdateRequest {
  bankAccountNumber: string;
  bankName: string;
  bankBranch: string;
}

/**
 * Wallet information nested in SupplierResponse
 * Matches backend SupplierResponse.WalletInfo
 */
export interface WalletInfo {
  walletId: string;
  availableBalance: number;      // Số dư khả dụng (có thể rút)
  pendingBalance: number;         // Số dư đang giữ (đơn hàng đang xử lý)
  totalEarnings: number;          // Tổng thu nhập từ trước đến nay
  totalWithdrawn: number;         // Tổng đã rút
  totalRefunded: number;          // Tổng hoàn trả
  monthlyEarnings: number;        // Thu nhập tháng hiện tại
  currentMonth: string;           // Tháng hiện tại (YYYY-MM)
  status: string;                 // ACTIVE, SUSPENDED, FROZEN
  lastWithdrawalDate: string | null; // Lần rút tiền cuối
  createdAt: string;
  updatedAt: string;
}

/**
 * Basic store information nested in SupplierResponse
 * Matches backend SupplierResponse.StoreBasicInfo
 */
export interface StoreBasicInfo {
  storeId: string;
  storeName: string;
  address: string;
  phoneNumber: string;
  status: string; // PENDING, ACTIVE, SUSPENDED, REJECTED
}

/**
 * Complete supplier response from backend
 * Matches backend SupplierResponse.java exactly
 */
export interface SupplierResponse {
  // User basic info
  userId: string;
  keycloakId: string;
  username: string;
  email: string;
  phoneNumber: string;
  fullName: string;
  avatarUrl: string;
  active: boolean;

  // Business information
  businessName: string;
  businessLicense: string;
  businessLicenseUrl: string;
  foodSafetyCertificate: string;
  foodSafetyCertificateUrl: string;
  taxCode: string;
  businessAddress: string;
  businessType: string; // SUPERMARKET, CONVENIENCE_STORE, GROCERY_STORE, DISTRIBUTOR, RESTAURANT, BAKERY, COFFEE_SHOP, OTHER

  // Commission
  commissionRate: number | null;

  // Status
  status: string; // PENDING_VERIFICATION, PENDING_DOCUMENTS, PENDING_STORE_INFO, PENDING_APPROVAL, ACTIVE, SUSPENDED, REJECTED

  // Wallet information (nested object)
  wallet: WalletInfo | null;

  // Statistics
  totalProducts: number | null;
  totalStores: number | null;
  stores: StoreBasicInfo[] | null;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// ============= SUPPLIER SERVICE =============

class SupplierService {
  /**
   * Get current supplier profile
   */
  async getCurrentSupplier(): Promise<SupplierResponse> {
    try {
      const response = await axiosInstance.get<ApiResponse<SupplierResponse>>('/suppliers/me');
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get supplier by ID (admin only)
   */
  async getSupplierById(userId: string): Promise<SupplierResponse> {
    try {
      const response = await axiosInstance.get<ApiResponse<SupplierResponse>>(`/suppliers/${userId}`);
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Update supplier profile
   */
  async updateProfile(request: SupplierProfileUpdateRequest): Promise<SupplierResponse> {
    try {
      const response = await axiosInstance.put<ApiResponse<SupplierResponse>>(
        '/suppliers/me',
        request
      );
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Update bank information
   */
  async updateBankInfo(request: SupplierBankUpdateRequest): Promise<SupplierResponse> {
    try {
      const response = await axiosInstance.put<ApiResponse<SupplierResponse>>(
        '/suppliers/me/bank',
        request
      );
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all suppliers (admin only)
   */
  async getAllSuppliers(page: number = 0, size: number = 20, status?: string): Promise<any> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('size', size.toString());
      if (status) params.append('status', status);

      const response = await axiosInstance.get<ApiResponse<any>>(
        `/suppliers?${params.toString()}`
      );
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Approve supplier (admin only)
   */
  async approveSupplier(userId: string): Promise<SupplierResponse> {
    try {
      const response = await axiosInstance.patch<ApiResponse<SupplierResponse>>(
        `/suppliers/${userId}/approve`
      );
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Reject supplier (admin only)
   */
  async rejectSupplier(userId: string, reason?: string): Promise<void> {
    try {
      const params = reason ? `?reason=${encodeURIComponent(reason)}` : '';
      await axiosInstance.patch(
        `/suppliers/${userId}/reject${params}`
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): Error {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    return new Error(error.message || 'An unexpected error occurred');
  }
}

// Export singleton instance
export default new SupplierService();
