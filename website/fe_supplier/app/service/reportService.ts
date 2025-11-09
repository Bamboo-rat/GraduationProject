import axiosInstance from '../config/axios';
import type { ApiResponse } from './types';

// Partner Performance Types
export interface PartnerPerformanceMetrics {
  supplierId: string;
  businessName: string;
  totalStores: number;
  activeStores: number;
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  orderCompletionRate: number;
  orderCancellationRate: number;
  totalRevenue: number;
  averageOrderValue: number;
  lastOrderDate?: string;
  joinDate: string;
}

export interface PartnerPerformanceSummary {
  totalPartners: number;
  activePartners: number;
  totalStores: number;
  activeStores: number;
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  completedOrders: number;
  averageOrderCompletionRate: number;
  totalRevenue: number;
}

// Supplier-specific dashboard stats
export interface SupplierDashboardStats {
  todayRevenue: number;
  todayOrders: number;
  pendingOrders: number;
  lowStockProducts: number;
  totalProducts: number;
  activeProducts: number;
  monthlyRevenue: number;
  monthlyOrders: number;
}

// Revenue time series
export interface RevenueTimePoint {
  date: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
}

// Top products
export interface TopProduct {
  productId: string;
  productName: string;
  categoryName: string;
  totalSold: number;
  totalRevenue: number;
  imageUrl?: string;
}

// Low stock alert
export interface LowStockProduct {
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  sku: string;
  storeId: string;
  storeName: string;
  currentStock: number;
  alertThreshold: number;
  status: string;
  imageUrl?: string;
  expiryDate?: string;
}

class ReportService {
  private handleError(error: any): Error {
    return new Error(error.response?.data?.message || error.message || 'An unexpected error occurred');
  }

  /**
   * Get current supplier's performance metrics
   */
  async getMyPerformance(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<PartnerPerformanceMetrics> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);

      // Get current user info to get supplierId
      const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
      const supplierId = userInfo.userId;

      const endpoint = params?.startDate && params?.endDate
        ? `/partners/performance/${supplierId}/period?${queryParams.toString()}`
        : `/partners/performance/${supplierId}`;

      const { data } = await axiosInstance.get<ApiResponse<PartnerPerformanceMetrics>>(endpoint);
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get supplier dashboard statistics
   */
  async getDashboardStats(): Promise<SupplierDashboardStats> {
    try {
      // This would need a dedicated backend endpoint
      // For now, we'll aggregate from existing endpoints
      const performance = await this.getMyPerformance();
      const walletService = (await import('./walletService')).default;
      const wallet = await walletService.getWalletSummary();

      return {
        todayRevenue: 0, // Would need dedicated endpoint
        todayOrders: 0,
        pendingOrders: 0,
        lowStockProducts: 0,
        totalProducts: performance.totalProducts || 0,
        activeProducts: performance.activeProducts || 0,
        monthlyRevenue: wallet.monthlyEarnings || 0,
        monthlyOrders: wallet.totalOrdersThisMonth || 0,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get revenue over time
   */
  async getRevenueOverTime(params: {
    period: 'day' | 'week' | 'month' | 'year';
    startDate?: string;
    endDate?: string;
  }): Promise<RevenueTimePoint[]> {
    try {
      // This would need a dedicated supplier revenue endpoint
      // For now return mock data structure
      return [];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get top selling products
   */
  async getTopProducts(params?: {
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<TopProduct[]> {
    try {
      // This would need a dedicated endpoint
      return [];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(params?: {
    threshold?: number;
    page?: number;
    size?: number;
  }): Promise<{ content: LowStockProduct[]; totalElements: number; totalPages: number }> {
    try {
      // This would need a dedicated endpoint
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Format currency
   */
  formatVND(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  /**
   * Format number with thousand separator
   */
  formatNumber(num: number): string {
    return new Intl.NumberFormat('vi-VN').format(num);
  }

  /**
   * Format percentage
   */
  formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  /**
   * Format date
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('vi-VN');
  }

  /**
   * Format datetime
   */
  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('vi-VN');
  }
}

export default new ReportService();
